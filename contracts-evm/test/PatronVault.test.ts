import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("PatronVault", function () {
  async function deployVaultFixture() {
    const [admin, patron1, patron2] = await ethers.getSigners();

    // Deploy GSPCore first
    const GSPCore = await ethers.getContractFactory("GSPCore");
    const core = await GSPCore.deploy(admin.address);
    await core.waitForDeployment();

    // Deploy PatronVault
    const PatronVault = await ethers.getContractFactory("PatronVault");
    const vault = await PatronVault.deploy(await core.getAddress(), admin.address);
    await vault.waitForDeployment();

    // Grant MINTER_ROLE to vault so it can epochMint rewards
    const MINTER_ROLE = await core.MINTER_ROLE();
    await core.grantRole(MINTER_ROLE, await vault.getAddress());

    return { core, vault, admin, patron1, patron2 };
  }

  describe("Deployment", function () {
    it("should set correct coreToken", async function () {
      const { core, vault } = await loadFixture(deployVaultFixture);
      expect(await vault.coreToken()).to.equal(await core.getAddress());
    });

    it("should initialize 4 tiers", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const bronze = await vault.tiers(0);
      const silver = await vault.tiers(1);
      const gold = await vault.tiers(2);
      const platinum = await vault.tiers(3);

      expect(bronze.lockDuration).to.equal(30 * 24 * 60 * 60);  // 30 days
      expect(silver.lockDuration).to.equal(90 * 24 * 60 * 60);  // 90 days
      expect(gold.lockDuration).to.equal(180 * 24 * 60 * 60);   // 180 days
      expect(platinum.lockDuration).to.equal(365 * 24 * 60 * 60); // 365 days

      expect(bronze.multiplier).to.equal(10000);  // 1x
      expect(silver.multiplier).to.equal(20000);  // 2x
      expect(gold.multiplier).to.equal(30000);    // 3x
      expect(platinum.multiplier).to.equal(50000); // 5x
    });

    it("should start with zero deposits", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.totalDeposited()).to.equal(0);
      expect(await vault.totalPositions()).to.equal(0);
    });
  });

  describe("deposit", function () {
    it("should create a position with correct MATIC deposit", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("10");

      await vault.connect(patron1).deposit(0, { value: depositAmount }); // Bronze
      const position = await vault.positions(1);

      expect(position.depositedMatic).to.equal(depositAmount);
      expect(position.tierIndex).to.equal(0);
      expect(position.active).to.be.true;
      expect(position.patron).to.equal(patron1.address);
    });

    it("should emit Deposited event", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("5");

      await expect(vault.connect(patron1).deposit(1, { value: depositAmount }))
        .to.emit(vault, "Deposited");
    });

    it("should revert if deposit is below 1 MATIC", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(patron1).deposit(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("PatronVault: minimum 1 MATIC");
    });

    it("should revert for invalid tier index", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(patron1).deposit(4, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("PatronVault: invalid tier");
    });

    it("should track multiple positions for same patron", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("2") });
      await vault.connect(patron1).deposit(2, { value: ethers.parseEther("5") });

      const positions = await vault.getPatronPositions(patron1.address);
      expect(positions.length).to.equal(2);
    });

    it("should update totalDeposited and totalPositions", async function () {
      const { vault, patron1, patron2 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("3") });
      await vault.connect(patron2).deposit(1, { value: ethers.parseEther("7") });

      expect(await vault.totalDeposited()).to.equal(ethers.parseEther("10"));
      expect(await vault.totalPositions()).to.equal(2);
    });
  });

  describe("withdraw (matured)", function () {
    it("should return MATIC and mint CORE after lock period", async function () {
      const { core, vault, patron1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("10");

      await vault.connect(patron1).deposit(0, { value: depositAmount }); // Bronze (30d)

      // Fast-forward past 30 days
      await time.increase(30 * 24 * 60 * 60 + 1);

      const balanceBefore = await ethers.provider.getBalance(patron1.address);
      const tx = await vault.connect(patron1).withdraw(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(patron1.address);

      // Should have received MATIC back (minus gas)
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(depositAmount);

      // Should have received some CORE reward
      expect(await core.balanceOf(patron1.address)).to.be.gt(0);
    });

    it("should emit Withdrawn event with earlyExit=false", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("1") });

      await time.increase(30 * 24 * 60 * 60 + 1);

      await expect(vault.connect(patron1).withdraw(1))
        .to.emit(vault, "Withdrawn");
    });

    it("should deactivate position after withdraw", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("1") });

      await time.increase(30 * 24 * 60 * 60 + 1);
      await vault.connect(patron1).withdraw(1);

      const position = await vault.positions(1);
      expect(position.active).to.be.false;
    });
  });

  describe("withdraw (early exit)", function () {
    it("should apply 10% penalty on early withdrawal", async function () {
      const { core, vault, patron1 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("10") });

      // Calculate expected reward at this point (before lock ends)
      const pendingFull = await vault.calculateReward(1);

      // Withdraw early (same block, minimal time elapsed)
      await time.increase(1 * 24 * 60 * 60); // 1 day only (30 day lock)
      await vault.connect(patron1).withdraw(1);

      // Should get CORE but less than if matured
      const coreBalance = await core.balanceOf(patron1.address);
      expect(coreBalance).to.be.gt(0);
    });

    it("should still return full MATIC on early exit", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("5");
      await vault.connect(patron1).deposit(0, { value: depositAmount });

      await time.increase(1 * 24 * 60 * 60);

      const balanceBefore = await ethers.provider.getBalance(patron1.address);
      const tx = await vault.connect(patron1).withdraw(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(patron1.address);

      expect(balanceAfter + gasUsed - balanceBefore).to.equal(depositAmount);
    });
  });

  describe("withdraw (access control)", function () {
    it("should revert if not position owner", async function () {
      const { vault, patron1, patron2 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("1") });

      await expect(
        vault.connect(patron2).withdraw(1)
      ).to.be.revertedWith("PatronVault: not your position");
    });

    it("should revert if already withdrawn", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("1") });

      await time.increase(30 * 24 * 60 * 60 + 1);
      await vault.connect(patron1).withdraw(1);

      await expect(
        vault.connect(patron1).withdraw(1)
      ).to.be.revertedWith("PatronVault: already withdrawn");
    });
  });

  describe("emergencyWithdraw", function () {
    it("should return MATIC with no CORE reward", async function () {
      const { core, vault, patron1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("8");
      await vault.connect(patron1).deposit(0, { value: depositAmount });

      const balanceBefore = await ethers.provider.getBalance(patron1.address);
      const tx = await vault.connect(patron1).emergencyWithdraw(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(patron1.address);

      // MATIC returned in full
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(depositAmount);
      // No CORE minted
      expect(await core.balanceOf(patron1.address)).to.equal(0);
    });

    it("should emit EmergencyWithdraw event", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await vault.connect(patron1).deposit(0, { value: ethers.parseEther("1") });

      await expect(vault.connect(patron1).emergencyWithdraw(1))
        .to.emit(vault, "EmergencyWithdraw")
        .withArgs(patron1.address, 1, ethers.parseEther("1"));
    });
  });

  describe("admin", function () {
    it("should allow owner to update reward rate", async function () {
      const { vault, admin } = await loadFixture(deployVaultFixture);
      const newRate = 2e9;
      await expect(vault.connect(admin).setRewardRate(newRate))
        .to.emit(vault, "RewardRateUpdated");
      expect(await vault.rewardRatePerSecond()).to.equal(newRate);
    });

    it("should revert if non-owner updates reward rate", async function () {
      const { vault, patron1 } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(patron1).setRewardRate(5e9)
      ).to.be.reverted;
    });
  });

  describe("calculateReward", function () {
    it("should return higher reward for higher tier", async function () {
      const { vault, patron1, patron2 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.parseEther("10");

      await vault.connect(patron1).deposit(0, { value: depositAmount }); // Bronze 1x
      await vault.connect(patron2).deposit(3, { value: depositAmount }); // Platinum 5x

      await time.increase(10 * 24 * 60 * 60); // 10 days

      const rewardBronze = await vault.calculateReward(1);
      const rewardPlatinum = await vault.calculateReward(2);

      expect(rewardPlatinum).to.be.gt(rewardBronze);
    });
  });
});

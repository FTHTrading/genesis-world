import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("GSPCore", function () {
  async function deployCoreFixture() {
    const [admin, minter, user1, user2] = await ethers.getSigners();

    const GSPCore = await ethers.getContractFactory("GSPCore");
    const core = await GSPCore.deploy(admin.address);
    await core.waitForDeployment();

    // Grant minter role to minter
    const MINTER_ROLE = await core.MINTER_ROLE();
    await core.grantRole(MINTER_ROLE, minter.address);

    return { core, admin, minter, user1, user2, MINTER_ROLE };
  }

  describe("Deployment", function () {
    it("should set correct name and symbol", async function () {
      const { core } = await loadFixture(deployCoreFixture);
      expect(await core.name()).to.equal("GSP Core");
      expect(await core.symbol()).to.equal("CORE");
    });

    it("should have zero initial supply", async function () {
      const { core } = await loadFixture(deployCoreFixture);
      expect(await core.totalSupply()).to.equal(0);
    });

    it("should set MAX_SUPPLY to 100M", async function () {
      const { core } = await loadFixture(deployCoreFixture);
      expect(await core.MAX_SUPPLY()).to.equal(ethers.parseEther("100000000"));
    });

    it("should grant admin the DEFAULT_ADMIN_ROLE", async function () {
      const { core, admin } = await loadFixture(deployCoreFixture);
      const DEFAULT_ADMIN = await core.DEFAULT_ADMIN_ROLE();
      expect(await core.hasRole(DEFAULT_ADMIN, admin.address)).to.be.true;
    });
  });

  describe("epochMint", function () {
    it("should mint tokens to recipient", async function () {
      const { core, minter, user1 } = await loadFixture(deployCoreFixture);
      const amount = ethers.parseEther("1000");
      await core.connect(minter).epochMint(user1.address, amount, 1);
      expect(await core.balanceOf(user1.address)).to.equal(amount);
    });

    it("should emit EpochMint event", async function () {
      const { core, minter, user1 } = await loadFixture(deployCoreFixture);
      const amount = ethers.parseEther("500");
      await expect(core.connect(minter).epochMint(user1.address, amount, 3))
        .to.emit(core, "EpochMint")
        .withArgs(user1.address, amount, 3);
    });

    it("should revert if non-minter calls epochMint", async function () {
      const { core, user1 } = await loadFixture(deployCoreFixture);
      await expect(
        core.connect(user1).epochMint(user1.address, ethers.parseEther("100"), 1)
      ).to.be.reverted;
    });

    it("should revert if minting would exceed MAX_SUPPLY", async function () {
      const { core, minter, user1 } = await loadFixture(deployCoreFixture);
      const maxSupply = await core.MAX_SUPPLY();
      await expect(
        core.connect(minter).epochMint(user1.address, maxSupply + 1n, 1)
      ).to.be.revertedWith("CORE: max supply exceeded");
    });
  });

  describe("vaultBurn", function () {
    it("should burn tokens from holder", async function () {
      const { core, minter, user1 } = await loadFixture(deployCoreFixture);
      const amount = ethers.parseEther("1000");
      await core.connect(minter).epochMint(user1.address, amount, 1);

      // User must approve minter to burn on their behalf
      await core.connect(user1).approve(await core.getAddress(), amount);

      // vaultBurn requires MINTER_ROLE — burn directly from holder
      await core.connect(minter).vaultBurn(user1.address, ethers.parseEther("300"));
      expect(await core.balanceOf(user1.address)).to.equal(ethers.parseEther("700"));
    });

    it("should emit VaultBurn event", async function () {
      const { core, minter, user1 } = await loadFixture(deployCoreFixture);
      const amount = ethers.parseEther("1000");
      await core.connect(minter).epochMint(user1.address, amount, 1);

      await expect(core.connect(minter).vaultBurn(user1.address, ethers.parseEther("200")))
        .to.emit(core, "VaultBurn")
        .withArgs(user1.address, ethers.parseEther("200"));
    });
  });

  describe("burn", function () {
    it("should allow user to burn their own tokens", async function () {
      const { core, minter, user1 } = await loadFixture(deployCoreFixture);
      await core.connect(minter).epochMint(user1.address, ethers.parseEther("500"), 1);
      await core.connect(user1).burn(ethers.parseEther("200"));
      expect(await core.balanceOf(user1.address)).to.equal(ethers.parseEther("300"));
    });
  });
});

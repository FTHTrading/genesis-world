import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("RailToken", function () {
  async function deployRailFixture() {
    const [treasury, user1, user2] = await ethers.getSigners();

    const RailToken = await ethers.getContractFactory("RailToken");
    const rail = await RailToken.deploy("Aurum Rail", "AURUM", "AURUM", treasury.address);
    await rail.waitForDeployment();

    return { rail, treasury, user1, user2 };
  }

  describe("Deployment", function () {
    it("should set correct name, symbol, and rail", async function () {
      const { rail } = await loadFixture(deployRailFixture);
      expect(await rail.name()).to.equal("Aurum Rail");
      expect(await rail.symbol()).to.equal("AURUM");
      expect(await rail.rail()).to.equal("AURUM");
    });

    it("should mint GENESIS_SUPPLY to treasury", async function () {
      const { rail, treasury } = await loadFixture(deployRailFixture);
      const genesis = ethers.parseEther("100000000"); // 100M
      expect(await rail.balanceOf(treasury.address)).to.equal(genesis);
      expect(await rail.totalSupply()).to.equal(genesis);
    });

    it("should set MAX_SUPPLY to 500M", async function () {
      const { rail } = await loadFixture(deployRailFixture);
      expect(await rail.MAX_SUPPLY()).to.equal(ethers.parseEther("500000000"));
    });
  });

  describe("mint", function () {
    it("should allow owner to mint additional supply", async function () {
      const { rail, treasury, user1 } = await loadFixture(deployRailFixture);
      const amount = ethers.parseEther("50000000"); // 50M
      await rail.connect(treasury).mint(user1.address, amount);
      expect(await rail.balanceOf(user1.address)).to.equal(amount);
    });

    it("should emit RailMint event", async function () {
      const { rail, treasury, user1 } = await loadFixture(deployRailFixture);
      const amount = ethers.parseEther("1000");
      await expect(rail.connect(treasury).mint(user1.address, amount))
        .to.emit(rail, "RailMint")
        .withArgs(user1.address, amount);
    });

    it("should revert if non-owner tries to mint", async function () {
      const { rail, user1 } = await loadFixture(deployRailFixture);
      await expect(
        rail.connect(user1).mint(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("should revert if minting exceeds MAX_SUPPLY", async function () {
      const { rail, treasury, user1 } = await loadFixture(deployRailFixture);
      // Already have 100M genesis, try to mint 401M more (total > 500M)
      const overAmount = ethers.parseEther("400000001");
      await expect(
        rail.connect(treasury).mint(user1.address, overAmount)
      ).to.be.revertedWith("RailToken: cap exceeded");
    });
  });

  describe("burn", function () {
    it("should allow holder to burn their tokens", async function () {
      const { rail, treasury } = await loadFixture(deployRailFixture);
      const burnAmount = ethers.parseEther("1000000");
      await rail.connect(treasury).burn(burnAmount);
      const expected = ethers.parseEther("100000000") - burnAmount;
      expect(await rail.balanceOf(treasury.address)).to.equal(expected);
    });
  });
});

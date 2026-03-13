import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AgentIdentityNFT", function () {
  async function deployNFTFixture() {
    const [treasury, user1, user2] = await ethers.getSigners();

    const AgentIdentityNFT = await ethers.getContractFactory("AgentIdentityNFT");
    const nft = await AgentIdentityNFT.deploy(treasury.address);
    await nft.waitForDeployment();

    const defaultMintParams = {
      to: user1.address,
      agentId: "aurum-helion-001",
      tokenURI_: "ipfs://QmAurumHelion001",
      rail: "AURUM",
      archetype: "Oracle",
      optimizationBias: 7500,
      riskTolerance: 4200,
      cooperationWeight: 6800,
      entropyAffinity: 3100,
      autonomyLevel: 8900,
      epochBorn: 1,
      rarity_: 0, // COMMON
    };

    return { nft, treasury, user1, user2, defaultMintParams };
  }

  describe("Deployment", function () {
    it("should set name and symbol", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.name()).to.equal("GSP Agent Identity");
      expect(await nft.symbol()).to.equal("GSPAI");
    });

    it("should set GENESIS_CAP to 15", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.GENESIS_CAP()).to.equal(15);
    });

    it("should start with 0 minted", async function () {
      const { nft } = await loadFixture(deployNFTFixture);
      expect(await nft.totalMinted()).to.equal(0);
    });

    it("should set treasury as owner", async function () {
      const { nft, treasury } = await loadFixture(deployNFTFixture);
      expect(await nft.owner()).to.equal(treasury.address);
    });
  });

  describe("mintAgent", function () {
    it("should mint agent with correct DNA stored on-chain", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      const dna = await nft.getAgentDNA(1);
      expect(dna.agentId).to.equal("aurum-helion-001");
      expect(dna.rail).to.equal("AURUM");
      expect(dna.archetype).to.equal("Oracle");
      expect(dna.optimizationBias).to.equal(7500);
      expect(dna.riskTolerance).to.equal(4200);
      expect(dna.cooperationWeight).to.equal(6800);
      expect(dna.entropyAffinity).to.equal(3100);
      expect(dna.autonomyLevel).to.equal(8900);
      expect(dna.epochBorn).to.equal(1);
      expect(dna.soulBound).to.be.true;
      expect(dna.dnaHash).to.not.equal(ethers.ZeroHash);
    });

    it("should assign incrementing tokenIds", async function () {
      const { nft, treasury, user1, user2, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);
      await nft.connect(treasury).mintAgent({
        ...defaultMintParams,
        to: user2.address,
        agentId: "lex-arbitron-001",
        rail: "LEX",
        archetype: "Arbiter",
      });

      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.ownerOf(2)).to.equal(user2.address);
      expect(await nft.totalMinted()).to.equal(2);
    });

    it("should emit AgentMinted event", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await expect(nft.connect(treasury).mintAgent(defaultMintParams))
        .to.emit(nft, "AgentMinted");
    });

    it("should map agentId to tokenId", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);
      expect(await nft.agentIdToToken("aurum-helion-001")).to.equal(1);
    });

    it("should set initial reputation to 50", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);
      expect(await nft.reputationScore(1)).to.equal(50);
    });

    it("should set rarity correctly", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      // Mint LEGENDARY
      await nft.connect(treasury).mintAgent({
        ...defaultMintParams,
        rarity_: 3, // LEGENDARY
      });
      expect(await nft.getRarity(1)).to.equal("LEGENDARY");
    });

    it("should set tokenURI", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);
      expect(await nft.tokenURI(1)).to.equal("ipfs://QmAurumHelion001");
    });

    it("should revert for non-owner", async function () {
      const { nft, user1, defaultMintParams } = await loadFixture(deployNFTFixture);
      await expect(
        nft.connect(user1).mintAgent(defaultMintParams)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("should revert for duplicate agentId", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);
      await expect(
        nft.connect(treasury).mintAgent(defaultMintParams)
      ).to.be.revertedWith("AgentNFT: agent already minted");
    });

    it("should enforce genesis cap of 15", async function () {
      const { nft, treasury, user1, defaultMintParams } = await loadFixture(deployNFTFixture);
      // Mint 15 agents
      for (let i = 1; i <= 15; i++) {
        await nft.connect(treasury).mintAgent({
          ...defaultMintParams,
          agentId: `agent-${i}`,
          to: user1.address,
        });
      }
      // 16th should fail
      await expect(
        nft.connect(treasury).mintAgent({
          ...defaultMintParams,
          agentId: "agent-16",
          to: user1.address,
        })
      ).to.be.revertedWith("AgentNFT: genesis cap reached");
    });
  });

  describe("Soul-bound enforcement", function () {
    it("should revert transferFrom", async function () {
      const { nft, treasury, user1, user2, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      await expect(
        nft.connect(user1).transferFrom(user1.address, user2.address, 1)
      ).to.be.revertedWith("AgentNFT: soul-bound, non-transferable");
    });

    it("should revert safeTransferFrom", async function () {
      const { nft, treasury, user1, user2, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      await expect(
        nft.connect(user1)["safeTransferFrom(address,address,uint256)"](
          user1.address, user2.address, 1
        )
      ).to.be.revertedWith("AgentNFT: soul-bound, non-transferable");
    });
  });

  describe("evolveAgent", function () {
    it("should update tokenURI and emit event", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      await expect(nft.connect(treasury).evolveAgent(1, "ipfs://QmEvolved", 2))
        .to.emit(nft, "AgentEvolved")
        .withArgs(1, "ipfs://QmEvolved", 2);

      expect(await nft.tokenURI(1)).to.equal("ipfs://QmEvolved");
    });

    it("should revert for non-existent token", async function () {
      const { nft, treasury } = await loadFixture(deployNFTFixture);
      await expect(
        nft.connect(treasury).evolveAgent(99, "ipfs://Qm", 1)
      ).to.be.revertedWith("AgentNFT: token doesn't exist");
    });

    it("should revert for non-owner caller", async function () {
      const { nft, treasury, user1, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);
      await expect(
        nft.connect(user1).evolveAgent(1, "ipfs://Qm", 2)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("updateReputation", function () {
    it("should update score and emit event", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      await expect(nft.connect(treasury).updateReputation(1, 9500, 3))
        .to.emit(nft, "ReputationUpdated")
        .withArgs(1, 9500, 3);

      expect(await nft.reputationScore(1)).to.equal(9500);
    });

    it("should revert if score exceeds 10000", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      await expect(
        nft.connect(treasury).updateReputation(1, 10001, 3)
      ).to.be.revertedWith("AgentNFT: score exceeds 10000");
    });

    it("should revert for non-owner caller", async function () {
      const { nft, treasury, user1, defaultMintParams } = await loadFixture(deployNFTFixture);
      await nft.connect(treasury).mintAgent(defaultMintParams);

      await expect(
        nft.connect(user1).updateReputation(1, 100, 1)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });

  describe("Views", function () {
    it("getRarity should return correct string", async function () {
      const { nft, treasury, defaultMintParams } = await loadFixture(deployNFTFixture);
      // COMMON
      await nft.connect(treasury).mintAgent({ ...defaultMintParams, rarity_: 0 });
      expect(await nft.getRarity(1)).to.equal("COMMON");
      // RARE
      await nft.connect(treasury).mintAgent({ ...defaultMintParams, agentId: "r", rarity_: 1 });
      expect(await nft.getRarity(2)).to.equal("RARE");
      // EPIC
      await nft.connect(treasury).mintAgent({ ...defaultMintParams, agentId: "e", rarity_: 2 });
      expect(await nft.getRarity(3)).to.equal("EPIC");
      // LEGENDARY
      await nft.connect(treasury).mintAgent({ ...defaultMintParams, agentId: "l", rarity_: 3 });
      expect(await nft.getRarity(4)).to.equal("LEGENDARY");
    });
  });
});

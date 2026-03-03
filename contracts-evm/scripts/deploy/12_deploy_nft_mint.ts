/**
 * Deploy AgentIdentityNFT + mint all 15 Genesis Agents on Polygon mainnet.
 * Reads DNA traits from metadata JSON files, IPFS CIDs from _ipfs_cids.json.
 *
 * Run: npx hardhat run scripts/deploy/12_deploy_nft_mint.ts --network polygon
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Rarity enum matches Solidity: 0=COMMON, 1=RARE, 2=EPIC, 3=LEGENDARY
const RARITY_MAP: Record<string, number> = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
};

interface AgentMeta {
  agentId: string;
  rail: string;
  archetype: string;
  rarity: string;
  optimizationBias: number;
  riskTolerance: number;
  cooperationWeight: number;
  entropyAffinity: number;
  autonomyLevel: number;
  epochBorn: number;
  tokenURI: string;
}

function loadAgents(): AgentMeta[] {
  const metaDir = path.join(__dirname, "../../metadata");
  const cids = JSON.parse(fs.readFileSync(path.join(metaDir, "_ipfs_cids.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(metaDir, "_manifest.json"), "utf8"));

  const agents: AgentMeta[] = [];

  for (const [agentId, entry] of Object.entries(manifest) as [string, any][]) {
    const meta = JSON.parse(fs.readFileSync(path.join(metaDir, entry.file), "utf8"));
    const attrs = meta.attributes;

    const getAttr = (name: string) => {
      const a = attrs.find((a: any) => a.trait_type === name);
      return a ? a.value : undefined;
    };

    agents.push({
      agentId,
      rail: getAttr("Rail"),
      archetype: getAttr("Archetype"),
      rarity: getAttr("Rarity"),
      optimizationBias: getAttr("Optimization Bias"),
      riskTolerance: getAttr("Risk Tolerance"),
      cooperationWeight: getAttr("Cooperation Weight"),
      entropyAffinity: getAttr("Entropy Affinity"),
      autonomyLevel: getAttr("Autonomy Level"),
      epochBorn: getAttr("Epoch Born"),
      tokenURI: cids.agents[agentId].uri,
    });
  }

  // Sort by tokenId to ensure correct mint order
  agents.sort((a, b) => {
    const aId = parseInt(a.agentId.split("-").pop()!);
    const bId = parseInt(b.agentId.split("-").pop()!);
    return aId - bId;
  });

  return agents;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider!;
  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const balance = await provider.getBalance(deployer.address);

  console.log("╔═══════════════════════════════════════════╗");
  console.log("║   AGENT IDENTITY NFT — DEPLOY & MINT      ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} POL\n`);

  // ─── Load agents ────────────────────────────────────
  const agents = loadAgents();
  console.log(`  Loaded ${agents.length} agents from metadata\n`);

  // ─── Deploy contract ───────────────────────────────
  process.stdout.write("  Deploying AgentIdentityNFT... ");
  const Factory = await ethers.getContractFactory("AgentIdentityNFT");
  const nft = await Factory.deploy(owner);
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log(`✓ ${nftAddr}`);
  await sleep(5000);

  // ─── Mint all 15 agents ─────────────────────────────
  console.log("\n  Minting Genesis Agents:\n");

  for (const agent of agents) {
    process.stdout.write(`    #${agents.indexOf(agent) + 1} ${agent.agentId.padEnd(22)} `);

    const params = {
      to: owner,
      agentId: agent.agentId,
      tokenURI_: agent.tokenURI,
      rail: agent.rail,
      archetype: agent.archetype,
      optimizationBias: agent.optimizationBias,
      riskTolerance: agent.riskTolerance,
      cooperationWeight: agent.cooperationWeight,
      entropyAffinity: agent.entropyAffinity,
      autonomyLevel: agent.autonomyLevel,
      epochBorn: agent.epochBorn,
      rarity_: RARITY_MAP[agent.rarity] ?? 0,
    };

    try {
      const tx = await nft.mintAgent(params);
      const receipt = await tx.wait();
      console.log(`✓ block ${receipt!.blockNumber}`);
    } catch (e: any) {
      console.log(`✗ ${e.message?.substring(0, 100)}`);
    }
    await sleep(3000);
  }

  // ─── Verify total minted ────────────────────────────
  const totalMinted = await nft.totalMinted();
  console.log(`\n  Total minted: ${totalMinted}/15`);

  // ─── Save deployment ────────────────────────────────
  const outDir = path.join(__dirname, "../../deployments/polygon");
  fs.mkdirSync(outDir, { recursive: true });

  // Read existing all.json and add NFT
  const allPath = path.join(outDir, "all.json");
  let existing: any = {};
  if (fs.existsSync(allPath)) {
    existing = JSON.parse(fs.readFileSync(allPath, "utf8"));
  }
  existing.contracts = existing.contracts || {};
  existing.contracts["AgentIdentityNFT"] = nftAddr;
  existing.nftDeployedAt = new Date().toISOString();
  existing.agentsMinted = Number(totalMinted);
  fs.writeFileSync(allPath, JSON.stringify(existing, null, 2));

  // Save NFT-specific file
  fs.writeFileSync(
    path.join(outDir, "nft.json"),
    JSON.stringify({
      network: "polygon",
      chainId: 137,
      contract: "AgentIdentityNFT",
      address: nftAddr,
      owner,
      totalMinted: Number(totalMinted),
      timestamp: new Date().toISOString(),
      agents: agents.map((a, i) => ({
        tokenId: i + 1,
        agentId: a.agentId,
        rail: a.rail,
        archetype: a.archetype,
        rarity: a.rarity,
        tokenURI: a.tokenURI,
      })),
    }, null, 2)
  );

  // ─── Final report ───────────────────────────────────
  const endBal = await provider.getBalance(deployer.address);
  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║    15 GENESIS AGENTS LIVE ON POLYGON      ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Contract : ${nftAddr}`);
  console.log(`  Minted   : ${totalMinted}/15`);
  console.log(`  Gas spent: ${ethers.formatEther(balance - endBal)} POL`);
  console.log(`  Remaining: ${ethers.formatEther(endBal)} POL`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

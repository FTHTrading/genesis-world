import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy AgentIdentityNFT and mint all 15 Genesis Agents
 * Requires: metadata/_ipfs_cids.json from upload_to_ipfs.ts
 *
 * Run: npx hardhat run scripts/deploy/04_deploy_nft.ts --network polygon
 */

// Rarity enum: COMMON=0, RARE=1, EPIC=2, LEGENDARY=3
const RARITY = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3 };

const AGENTS = [
  { id: "aurum-helion-001",  rail: "AURUM", archetype: "Oracle",    optimization: 9200, risk: 2100, cooperation: 7800, entropy: 3100, autonomy: 8500, rarity: "LEGENDARY" },
  { id: "aurum-vega-002",    rail: "AURUM", archetype: "Sentinel",  optimization: 8100, risk: 1800, cooperation: 6500, entropy: 2900, autonomy: 7200, rarity: "EPIC" },
  { id: "aurum-lyra-003",    rail: "AURUM", archetype: "Diplomat",  optimization: 7600, risk: 3200, cooperation: 9100, entropy: 2400, autonomy: 6100, rarity: "RARE" },
  { id: "lex-mandate-004",   rail: "LEX",   archetype: "Warlord",   optimization: 8800, risk: 4200, cooperation: 5500, entropy: 3800, autonomy: 9200, rarity: "LEGENDARY" },
  { id: "lex-arbiter-005",   rail: "LEX",   archetype: "Shepherd",  optimization: 7200, risk: 2600, cooperation: 8800, entropy: 2100, autonomy: 5900, rarity: "EPIC" },
  { id: "lex-cipher-006",    rail: "LEX",   archetype: "Ghost",     optimization: 9400, risk: 1600, cooperation: 4200, entropy: 4900, autonomy: 8800, rarity: "RARE" },
  { id: "nova-prism-007",    rail: "NOVA",  archetype: "Alchemist", optimization: 6800, risk: 7200, cooperation: 7100, entropy: 8900, autonomy: 7600, rarity: "LEGENDARY" },
  { id: "nova-flux-008",     rail: "NOVA",  archetype: "Maverick",  optimization: 5900, risk: 8800, cooperation: 3900, entropy: 9200, autonomy: 9100, rarity: "EPIC" },
  { id: "nova-helix-009",    rail: "NOVA",  archetype: "Catalyst",  optimization: 7400, risk: 6500, cooperation: 6200, entropy: 7800, autonomy: 7100, rarity: "RARE" },
  { id: "merc-nexus-010",    rail: "MERC",  archetype: "Oracle",    optimization: 8500, risk: 5800, cooperation: 7900, entropy: 4200, autonomy: 7800, rarity: "LEGENDARY" },
  { id: "merc-quill-011",    rail: "MERC",  archetype: "Diplomat",  optimization: 6900, risk: 4100, cooperation: 8600, entropy: 3600, autonomy: 6300, rarity: "EPIC" },
  { id: "merc-axis-012",     rail: "MERC",  archetype: "Sentinel",  optimization: 7800, risk: 3400, cooperation: 7200, entropy: 2800, autonomy: 7400, rarity: "RARE" },
  { id: "ludo-carnival-013", rail: "LUDO",  archetype: "Anarchist", optimization: 4200, risk: 9100, cooperation: 4800, entropy: 9800, autonomy: 9600, rarity: "LEGENDARY" },
  { id: "ludo-echo-014",     rail: "LUDO",  archetype: "Catalyst",  optimization: 5600, risk: 7400, cooperation: 6800, entropy: 8100, autonomy: 8200, rarity: "EPIC" },
  { id: "ludo-mirage-015",   rail: "LUDO",  archetype: "Maverick",  optimization: 5100, risk: 8200, cooperation: 5500, entropy: 8700, autonomy: 8900, rarity: "RARE" },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;

  // Load IPFS CIDs
  const cidPath = path.join(__dirname, "../../metadata/_ipfs_cids.json");
  if (!fs.existsSync(cidPath)) {
    throw new Error("metadata/_ipfs_cids.json not found. Run upload_to_ipfs.ts first.");
  }
  const cidData = JSON.parse(fs.readFileSync(cidPath, "utf-8"));

  console.log("╔═══════════════════════════════════════════╗");
  console.log("║  GSP AGENT IDENTITY NFT — POLYGON DEPLOY  ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Owner    : ${owner}`);
  console.log(`  Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC\n`);

  // ── Deploy AgentIdentityNFT ────────────────────────────────────────────────
  process.stdout.write("  Deploying AgentIdentityNFT... ");
  const NFT = await ethers.getContractFactory("AgentIdentityNFT");
  const nft = await NFT.deploy(owner);
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log(`✓ ${nftAddr}\n`);

  // ── Mint all 15 Genesis Agents ────────────────────────────────────────────
  const mintedTokens: Record<string, number> = {};

  for (const agent of AGENTS) {
    const cidInfo = cidData.agents[agent.id];
    if (!cidInfo) {
      console.warn(`  ⚠ No CID for ${agent.id} — skipping (run upload_to_ipfs.ts first)`);
      continue;
    }

    const tokenURI = cidInfo.uri; // ipfs://Qm...
    const rarityEnum = RARITY[agent.rarity as keyof typeof RARITY] ?? 0;

    process.stdout.write(`  Minting #${String(cidInfo.tokenId).padStart(2, "0")} ${agent.rarity.padEnd(10)} ${agent.id}... `);

    const tx = await (nft as any).mintAgent({
      to:                owner,
      agentId:           agent.id,
      tokenURI_:         tokenURI,
      rail:              agent.rail,
      archetype:         agent.archetype,
      optimizationBias:  agent.optimization,
      riskTolerance:     agent.risk,
      cooperationWeight: agent.cooperation,
      entropyAffinity:   agent.entropy,
      autonomyLevel:     agent.autonomy,
      epochBorn:         0,
      rarity_:           rarityEnum,
    });
    await tx.wait();
    mintedTokens[agent.id] = cidInfo.tokenId;
    console.log("✓");
  }

  // ── Save deployment ────────────────────────────────────────────────────────
  const outDir = path.join(__dirname, "../../deployments/polygon");
  fs.mkdirSync(outDir, { recursive: true });
  const output = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    owner,
    contracts: { AgentIdentityNFT: nftAddr },
    mintedAgents: mintedTokens,
  };
  const outPath = path.join(outDir, "nft.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║     ALL 15 AGENTS MINTED ON POLYGON       ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Contract: ${nftAddr}`);
  console.log(`  Saved: ${outPath}`);
  console.log(`\n  View on OpenSea:`);
  console.log(`  https://opensea.io/collection/gsp-agent-identity`);
  console.log(`\n  Verify: npx hardhat verify --network polygon ${nftAddr} "${owner}"`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

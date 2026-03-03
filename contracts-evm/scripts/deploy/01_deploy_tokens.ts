import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy $CORE, $ORIGIN, and 5 Rail tokens to Polygon
 * Run: npx hardhat run scripts/deploy/01_deploy_tokens.ts --network polygon
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;

  console.log("═══════════════════════════════════════════");
  console.log("  GSP Token Deployment — Polygon Mainnet");
  console.log("═══════════════════════════════════════════");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Owner    : ${owner}`);
  console.log(`  Balance  : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC`);
  console.log("───────────────────────────────────────────\n");

  const deployments: Record<string, string> = {};

  // ── $CORE ─────────────────────────────────────────────────────────────────
  console.log("Deploying $CORE...");
  const GSPCore = await ethers.getContractFactory("GSPCore");
  const core = await GSPCore.deploy(owner);
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  deployments["CORE"] = coreAddr;
  console.log(`  ✓ $CORE deployed: ${coreAddr}\n`);

  // ── $ORIGIN ───────────────────────────────────────────────────────────────
  console.log("Deploying $ORIGIN...");
  const GSPOrigin = await ethers.getContractFactory("GSPOrigin");
  const origin = await GSPOrigin.deploy(owner);
  await origin.waitForDeployment();
  const originAddr = await origin.getAddress();
  deployments["ORIGIN"] = originAddr;
  console.log(`  ✓ $ORIGIN deployed: ${originAddr}\n`);

  // ── Rail Tokens ───────────────────────────────────────────────────────────
  const rails = [
    { name: "GSP Aurum",  symbol: "AURUM", rail: "AURUM" },
    { name: "GSP Lex",    symbol: "LEX",   rail: "LEX"   },
    { name: "GSP Nova",   symbol: "NOVA",  rail: "NOVA"  },
    { name: "GSP Merc",   symbol: "MERC",  rail: "MERC"  },
    { name: "GSP Ludo",   symbol: "LUDO",  rail: "LUDO"  },
  ];

  const RailToken = await ethers.getContractFactory("RailToken");

  for (const r of rails) {
    console.log(`Deploying $${r.symbol}...`);
    const rail = await RailToken.deploy(r.name, r.symbol, r.rail, owner);
    await rail.waitForDeployment();
    const railAddr = await rail.getAddress();
    deployments[r.symbol] = railAddr;
    console.log(`  ✓ $${r.symbol} deployed: ${railAddr}`);
  }

  // ── Save deployments ──────────────────────────────────────────────────────
  const outputDir = path.join(__dirname, "../../deployments/polygon");
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, "tokens.json");
  const output = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    owner,
    contracts: deployments,
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("\n═══════════════════════════════════════════");
  console.log("  ALL TOKENS DEPLOYED");
  console.log("═══════════════════════════════════════════");
  Object.entries(deployments).forEach(([sym, addr]) => {
    console.log(`  $${sym.padEnd(7)} → ${addr}`);
  });
  console.log(`\n  Saved: ${outputPath}`);
  console.log("\n  Next: npx hardhat run scripts/deploy/02_deploy_vault.ts --network polygon");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

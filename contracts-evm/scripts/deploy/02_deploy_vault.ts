import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy PatronVault and grant it MINTER_ROLE on $CORE
 * Requires: tokens.json from step 01
 * Run: npx hardhat run scripts/deploy/02_deploy_vault.ts --network polygon
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;

  // Load token addresses from step 01
  const tokenPath = path.join(__dirname, "../../deployments/polygon/tokens.json");
  if (!fs.existsSync(tokenPath)) {
    throw new Error("tokens.json not found. Run 01_deploy_tokens.ts first.");
  }
  const tokens = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
  const coreAddr = tokens.contracts.CORE;

  console.log("═══════════════════════════════════════════");
  console.log("  GSP Vault Deployment — Polygon Mainnet");
  console.log("═══════════════════════════════════════════");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  $CORE    : ${coreAddr}`);
  console.log("───────────────────────────────────────────\n");

  // ── PatronVault ────────────────────────────────────────────────────────────
  console.log("Deploying PatronVault...");
  const PatronVault = await ethers.getContractFactory("PatronVault");
  const vault = await PatronVault.deploy(coreAddr, owner);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`  ✓ PatronVault deployed: ${vaultAddr}\n`);

  // ── Grant MINTER_ROLE to vault ─────────────────────────────────────────────
  console.log("Granting MINTER_ROLE to PatronVault on $CORE...");
  const GSPCore = await ethers.getContractFactory("GSPCore");
  const core = GSPCore.attach(coreAddr) as any;
  const MINTER_ROLE = await core.MINTER_ROLE();
  const tx = await core.grantRole(MINTER_ROLE, vaultAddr);
  await tx.wait();
  console.log(`  ✓ MINTER_ROLE granted to ${vaultAddr}\n`);

  // ── Save deployment ────────────────────────────────────────────────────────
  const outputDir = path.join(__dirname, "../../deployments/polygon");
  const outputPath = path.join(outputDir, "vault.json");
  const output = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    owner,
    contracts: {
      PatronVault: vaultAddr,
      CORE: coreAddr, // reference
    },
  };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log("═══════════════════════════════════════════");
  console.log("  PATRON VAULT DEPLOYED");
  console.log("═══════════════════════════════════════════");
  console.log(`  PatronVault → ${vaultAddr}`);
  console.log(`  Saved: ${outputPath}`);
  console.log("\n  Verify: npx hardhat verify --network polygon " + vaultAddr + " " + coreAddr + " " + owner);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

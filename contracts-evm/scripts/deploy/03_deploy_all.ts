import { ethers, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * FULL GSP MAINNET DEPLOYMENT — ONE SHOT
 * Deploys: $CORE, $ORIGIN, 5 Rail tokens, PatronVault
 * Verifies all contracts on PolygonScan
 *
 * Run: npx hardhat run scripts/deploy/03_deploy_all.ts --network polygon
 */

// Small delay between deployments to avoid RPC rate-limiting
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [deployer] = await ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("╔═══════════════════════════════════════════╗");
  console.log("║    GENESIS SENTIENCE PROTOCOL — MAINNET   ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Owner    : ${owner}`);
  console.log(`  MATIC    : ${ethers.formatEther(balance)}`);

  if (balance < ethers.parseEther("2")) {
    console.warn("\n  ⚠️  WARNING: Low MATIC balance. Need ~2 MATIC for full deploy.");
  }
  console.log("");

  const allDeployments: Record<string, { address: string; args: any[] }> = {};

  // ─── $CORE ────────────────────────────────────────────────────────────────
  process.stdout.write("  Deploying $CORE...  ");
  const GSPCore = await ethers.getContractFactory("GSPCore");
  const core = await GSPCore.deploy(owner);
  await core.waitForDeployment();
  const coreAddr = await core.getAddress();
  allDeployments["CORE"] = { address: coreAddr, args: [owner] };
  console.log(`✓ ${coreAddr}`);
  await pause(3000);

  // ─── $ORIGIN ──────────────────────────────────────────────────────────────
  process.stdout.write("  Deploying $ORIGIN.. ");
  const GSPOrigin = await ethers.getContractFactory("GSPOrigin");
  const origin = await GSPOrigin.deploy(owner);
  await origin.waitForDeployment();
  const originAddr = await origin.getAddress();
  allDeployments["ORIGIN"] = { address: originAddr, args: [owner] };
  console.log(`✓ ${originAddr}`);
  await pause(3000);

  // ─── Rail Tokens ──────────────────────────────────────────────────────────
  const rails = [
    { name: "GSP Aurum",  symbol: "AURUM", rail: "AURUM" },
    { name: "GSP Lex",    symbol: "LEX",   rail: "LEX"   },
    { name: "GSP Nova",   symbol: "NOVA",  rail: "NOVA"  },
    { name: "GSP Merc",   symbol: "MERC",  rail: "MERC"  },
    { name: "GSP Ludo",   symbol: "LUDO",  rail: "LUDO"  },
  ];
  const RailToken = await ethers.getContractFactory("RailToken");
  for (const r of rails) {
    process.stdout.write(`  Deploying $${r.symbol.padEnd(5)}... `);
    const rail = await RailToken.deploy(r.name, r.symbol, r.rail, owner);
    await rail.waitForDeployment();
    const addr = await rail.getAddress();
    allDeployments[r.symbol] = { address: addr, args: [r.name, r.symbol, r.rail, owner] };
    console.log(`✓ ${addr}`);
    await pause(3000);
  }

  // ─── PatronVault ──────────────────────────────────────────────────────────
  process.stdout.write("  Deploying Vault...  ");
  const PatronVault = await ethers.getContractFactory("PatronVault");
  const vault = await PatronVault.deploy(coreAddr, owner);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  allDeployments["PatronVault"] = { address: vaultAddr, args: [coreAddr, owner] };
  console.log(`✓ ${vaultAddr}`);
  await pause(3000);

  // ─── Grant MINTER_ROLE to vault ───────────────────────────────────────────
  process.stdout.write("  Granting MINTER_ROLE to Vault... ");
  const coreContract = GSPCore.attach(coreAddr) as any;
  const MINTER_ROLE = await coreContract.MINTER_ROLE();
  const roleGrant = await coreContract.grantRole(MINTER_ROLE, vaultAddr);
  await roleGrant.wait();
  console.log("✓");

  // ─── Save all deployments ─────────────────────────────────────────────────
  const outDir = path.join(__dirname, "../../deployments/polygon");
  fs.mkdirSync(outDir, { recursive: true });
  const output = {
    network: "polygon",
    chainId: 137,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    owner,
    contracts: Object.fromEntries(
      Object.entries(allDeployments).map(([k, v]) => [k, v.address])
    ),
  };
  fs.writeFileSync(path.join(outDir, "all.json"), JSON.stringify(output, null, 2));

  // ─── Verify on PolygonScan ────────────────────────────────────────────────
  console.log("\n  Waiting 30s for PolygonScan indexing...");
  await new Promise((r) => setTimeout(r, 30000));

  console.log("  Verifying contracts on PolygonScan...\n");
  for (const [name, { address, args }] of Object.entries(allDeployments)) {
    try {
      process.stdout.write(`    Verifying ${name}... `);
      await run("verify:verify", { address, constructorArguments: args });
      console.log("✓");
    } catch (e: any) {
      if (e.message?.includes("Already Verified")) {
        console.log("already verified");
      } else {
        console.log(`⚠ ${e.message}`);
      }
    }
  }

  // ─── Final summary ─────────────────────────────────────────────────────────
  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║         GSP IS ON POLYGON MAINNET         ║");
  console.log("╚═══════════════════════════════════════════╝");
  Object.entries(allDeployments).forEach(([sym, { address }]) => {
    console.log(`  ${sym.padEnd(14)} → ${address}`);
  });
  console.log("\n  Deployments saved: deployments/polygon/all.json");
  console.log("  Add these addresses to drunks.app for live contract reads.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

/**
 * Clear stuck pending transactions, then deploy all GSP contracts.
 * Uses raw ethers (not hardhat signers) so we can control nonce/gas precisely.
 *
 * Run: npx hardhat run scripts/deploy/06_clear_and_deploy.ts --network polygon
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider!;
  const owner = process.env.OWNER_ADDRESS || deployer.address;

  const balance = await provider.getBalance(deployer.address);
  console.log("╔═══════════════════════════════════════════╗");
  console.log("║    GSP MAINNET — CLEAR & DEPLOY           ║");
  console.log("╚═══════════════════════════════════════════╝");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} POL\n`);

  // ─── Step 1: Clear stuck nonces ──────────────────────
  const confirmed = await provider.getTransactionCount(deployer.address, "latest");
  const pending = await provider.getTransactionCount(deployer.address, "pending");
  const stuck = pending - confirmed;
  console.log(`  Nonces: confirmed=${confirmed} pending=${pending} stuck=${stuck}`);

  if (stuck > 0) {
    for (let n = confirmed; n < pending; n++) {
      console.log(`  Clearing nonce ${n}...`);
      const feeData = await provider.getFeeData();
      // Use 20x current gas to guarantee replacement
      const maxFee = feeData.maxFeePerGas! * 20n;
      const maxPriority = feeData.maxPriorityFeePerGas! * 20n;
      try {
        const tx = await deployer.sendTransaction({
          to: deployer.address,
          value: 0,
          nonce: n,
          gasLimit: 21000,
          maxFeePerGas: maxFee,
          maxPriorityFeePerGas: maxPriority,
        });
        console.log(`    TX: ${tx.hash}`);
        const receipt = await tx.wait(2);
        console.log(`    ✓ Block ${receipt!.blockNumber}`);
      } catch (e: any) {
        // If "nonce too low", it means it already confirmed — that's fine
        if (e.message?.includes("nonce") || e.message?.includes("already known")) {
          console.log(`    ✓ Already resolved`);
        } else {
          console.log(`    ✗ ${e.message?.substring(0, 100)}`);
          // Wait and check if it resolved on its own
          await sleep(5000);
          const newConfirmed = await provider.getTransactionCount(deployer.address, "latest");
          if (newConfirmed > n) {
            console.log(`    ✓ Resolved (nonce advanced to ${newConfirmed})`);
          }
        }
      }
      await sleep(2000);
    }
    // Verify clean
    const finalPending = await provider.getTransactionCount(deployer.address, "pending");
    const finalConfirmed = await provider.getTransactionCount(deployer.address, "latest");
    console.log(`\n  Nonces after clear: confirmed=${finalConfirmed} pending=${finalPending}\n`);
  }

  // ─── Step 2: Deploy contracts one by one ─────────────
  const contracts: Record<string, { address: string; args: any[] }> = {};

  const deployOne = async (name: string, factory: any, args: any[]) => {
    process.stdout.write(`  ${name.padEnd(12)} `);
    try {
      const c = await factory.deploy(...args);
      await c.waitForDeployment();
      const addr = await c.getAddress();
      contracts[name] = { address: addr, args };
      console.log(`✓ ${addr}`);
      // Save progress after each successful deploy
      saveProgress(contracts, deployer.address, owner);
      await sleep(5000); // 5s between deploys for rate limiting
      return addr;
    } catch (e: any) {
      console.log(`✗ ${e.message?.substring(0, 120)}`);
      throw e;
    }
  };

  const GSPCore = await ethers.getContractFactory("GSPCore");
  const coreAddr = await deployOne("$CORE", GSPCore, [owner]);

  const GSPOrigin = await ethers.getContractFactory("GSPOrigin");
  await deployOne("$ORIGIN", GSPOrigin, [owner]);

  const RailToken = await ethers.getContractFactory("RailToken");
  for (const [name, symbol, rail] of [
    ["GSP Aurum", "AURUM", "AURUM"],
    ["GSP Lex", "LEX", "LEX"],
    ["GSP Nova", "NOVA", "NOVA"],
    ["GSP Merc", "MERC", "MERC"],
    ["GSP Ludo", "LUDO", "LUDO"],
  ]) {
    await deployOne(`$${symbol}`, RailToken, [name, symbol, rail, owner]);
  }

  const PatronVault = await ethers.getContractFactory("PatronVault");
  const vaultAddr = await deployOne("Vault", PatronVault, [coreAddr, owner]);

  // Grant MINTER_ROLE
  process.stdout.write("  MINTER_ROLE ");
  const core = GSPCore.attach(coreAddr) as any;
  const MINTER_ROLE = await core.MINTER_ROLE();
  const tx = await core.grantRole(MINTER_ROLE, vaultAddr);
  await tx.wait();
  console.log("✓");

  saveProgress(contracts, deployer.address, owner);

  // Final summary
  const endBal = await provider.getBalance(deployer.address);
  console.log("\n╔═══════════════════════════════════════════╗");
  console.log("║         GSP IS ON POLYGON MAINNET         ║");
  console.log("╚═══════════════════════════════════════════╝");
  Object.entries(contracts).forEach(([sym, { address }]) => {
    console.log(`  ${sym.padEnd(14)} → ${address}`);
  });
  console.log(`\n  Gas spent : ${ethers.formatEther(balance - endBal)} POL`);
  console.log(`  Remaining : ${ethers.formatEther(endBal)} POL`);
}

function saveProgress(contracts: Record<string, any>, deployer: string, owner: string) {
  const outDir = path.join(__dirname, "../../deployments/polygon");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "all.json"),
    JSON.stringify({
      network: "polygon",
      chainId: 137,
      timestamp: new Date().toISOString(),
      deployer,
      owner,
      contracts: Object.fromEntries(
        Object.entries(contracts).map(([k, v]) => [k, v.address])
      ),
    }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

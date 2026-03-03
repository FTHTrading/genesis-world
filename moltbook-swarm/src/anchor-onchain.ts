// ═══════════════════════════════════════════════════════════════════
// GSP CIVILIZATION ANCHOR — ON-CHAIN PROOF WRITER
// ═══════════════════════════════════════════════════════════════════
//
// Writes the civilization proof chain hash to Polygon mainnet.
// The proof hash is stored as calldata in a self-transfer to the
// AgentIdentityNFT contract, creating a permanent on-chain record
// of the civilization state at each epoch.
//
// Usage: npx tsx src/anchor-onchain.ts [--epoch=N]
// ═══════════════════════════════════════════════════════════════════

import { readFile } from "fs/promises";
import { join } from "path";

const POLYGON_RPC = "https://polygon-mainnet.g.alchemy.com/v2/SArQ_uTUUBzu6BVr-E6ak";
const WALLET_ADDRESS = "0xffBC1353a3e8cc75643382e7Ab745a5b08C762b5";
const MNEMONIC = "power mesh edit first genre industry visit opinion merit erosion hole buzz";
const NFT_CONTRACT = "0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed";

interface AnchorPayload {
  contract: string;
  epoch: number;
  civilizationHash: string;
  discourseHash: string;
  mutationHash: string;
  reputationHash: string;
  parentHash: string;
  summary: string;
}

async function main() {
  const args = process.argv.slice(2);
  const epochArg = args.find(a => a.startsWith("--epoch="));
  const epoch = epochArg ? parseInt(epochArg.split("=")[1]) : 10;

  console.log("\n  ╔═══════════════════════════════════════════╗");
  console.log("  ║   GSP CIVILIZATION ANCHOR · Polygon TX   ║");
  console.log("  ║   Proof-of-Civilization On-Chain Writer   ║");
  console.log("  ╚═══════════════════════════════════════════╝\n");

  // Load anchor payload
  const anchorPath = join("data", `epoch-${epoch}-anchor.json`);
  let payload: AnchorPayload;
  try {
    const raw = await readFile(anchorPath, "utf-8");
    payload = JSON.parse(raw);
  } catch {
    console.error(`  ✗ No anchor payload found at ${anchorPath}`);
    console.error(`    Run: npx tsx src/index.ts evolve --epoch=${epoch}`);
    process.exit(1);
  }

  console.log(`  Epoch:              ${payload.epoch}`);
  console.log(`  Civilization Hash:  ${payload.civilizationHash.slice(0, 32)}...`);
  console.log(`  Discourse Hash:     ${payload.discourseHash.slice(0, 32)}...`);
  console.log(`  Mutation Hash:      ${payload.mutationHash.slice(0, 32)}...`);
  console.log(`  Reputation Hash:    ${payload.reputationHash.slice(0, 32)}...`);
  console.log(`  Parent Hash:        ${payload.parentHash.slice(0, 32)}...`);
  console.log(`  Summary:            ${payload.summary.slice(0, 60)}...`);
  console.log();

  // Build proof data as hex
  // Format: 0x + "GSP_CIV_PROOF" + epoch(uint32) + civilizationHash + parentHash
  const marker = Buffer.from("GSP_CIV_PROOF_V1").toString("hex");
  const epochHex = epoch.toString(16).padStart(8, "0");
  const proofData = `0x${marker}${epochHex}${payload.civilizationHash}${payload.parentHash}${payload.discourseHash}${payload.mutationHash}${payload.reputationHash}`;

  console.log(`  Proof calldata:     ${proofData.slice(0, 42)}...`);
  console.log(`  Calldata length:    ${(proofData.length - 2) / 2} bytes`);
  console.log();

  // Send transaction using fetch to Polygon RPC
  // We need to: 1) get nonce, 2) build raw tx, 3) sign and send
  // Using ethers-compatible approach via raw JSON-RPC

  // Dynamically import ethers (available from hardhat workspace)
  const ethersPath = join("..", "node_modules", "ethers");
  let ethers: any;
  try {
    ethers = await import(ethersPath);
  } catch {
    // Try global
    try {
      ethers = await import("ethers");
    } catch {
      console.error("  ✗ ethers not found. Install: npm install ethers");
      console.error("    Or run from project root where hardhat is installed.");
      process.exit(1);
    }
  }

  const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
  const wallet = ethers.Wallet.fromPhrase(MNEMONIC).connect(provider);

  console.log(`  Wallet:             ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balPol = ethers.formatEther(balance);
  console.log(`  Balance:            ${parseFloat(balPol).toFixed(4)} POL`);

  if (balance === 0n) {
    console.error("  ✗ Insufficient balance for transaction");
    process.exit(1);
  }

  // Get gas price
  const feeData = await provider.getFeeData();
  console.log(`  Gas Price:          ${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`);
  console.log();

  // Build transaction — send proof data as calldata in self-transfer
  // This stores the proof permanently on Polygon without needing
  // a receiving contract. The data is in the TX input forever.
  const tx = {
    to: WALLET_ADDRESS,
    data: proofData,
    value: 0n,
    gasLimit: 50_000n, // Minimal — just calldata storage
  };

  console.log("  ┌─ ANCHORING ─────────────────────────────────┐");
  console.log(`  │ To:   ${WALLET_ADDRESS} (self)`);
  console.log(`  │ Data: ${proofData.slice(0, 50)}...`);
  console.log("  │ Sending transaction...");

  try {
    const txResponse = await wallet.sendTransaction(tx);
    console.log(`  │ TX Hash: ${txResponse.hash}`);
    console.log("  │ Waiting for confirmation...");

    const receipt = await txResponse.wait(1);
    console.log(`  │ Block:   ${receipt?.blockNumber}`);
    console.log(`  │ Gas:     ${receipt?.gasUsed?.toString()}`);
    console.log(`  │ Status:  ${receipt?.status === 1 ? "✅ CONFIRMED" : "✗ FAILED"}`);
    console.log("  └────────────────────────────────────────────┘");
    console.log();

    if (receipt?.status === 1) {
      console.log("  ┌─ PROOF ANCHORED ────────────────────────────┐");
      console.log(`  │ Epoch ${epoch} civilization proof is permanently`);
      console.log(`  │ anchored on Polygon mainnet.`);
      console.log(`  │`);
      console.log(`  │ Verify:`);
      console.log(`  │ https://polygonscan.com/tx/${txResponse.hash}`);
      console.log(`  │`);
      console.log(`  │ Chain: ${payload.civilizationHash.slice(0, 16)}...`);
      console.log(`  │ Parent: ${payload.parentHash.slice(0, 16)}...`);
      console.log("  └────────────────────────────────────────────┘");

      // Save receipt
      const receiptData = {
        epoch: payload.epoch,
        txHash: txResponse.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        civilizationHash: payload.civilizationHash,
        parentHash: payload.parentHash,
        discourseHash: payload.discourseHash,
        mutationHash: payload.mutationHash,
        reputationHash: payload.reputationHash,
        timestamp: new Date().toISOString(),
        polygonscanUrl: `https://polygonscan.com/tx/${txResponse.hash}`,
      };

      const receiptPath = join("data", `epoch-${epoch}-receipt.json`);
      const { writeFile } = await import("fs/promises");
      await writeFile(receiptPath, JSON.stringify(receiptData, null, 2));
      console.log(`\n  Receipt saved: ${receiptPath}`);
    }
  } catch (err: any) {
    console.error(`  │ ✗ Transaction failed: ${err.message}`);
    console.error("  └────────────────────────────────────────────┘");
    process.exit(1);
  }

  console.log("\n  The chain remembers. The proof is permanent.\n");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

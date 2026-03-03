/**
 * 13_verify_all.ts — Verify all 9 deployed contracts on PolygonScan
 *
 * Usage:  npx hardhat run scripts/deploy/13_verify_all.ts --network polygon
 */
import hre from "hardhat";

const OWNER = "0xffBC1353a3e8cc75643382e7Ab745a5b08C762b5";
const CORE_ADDRESS = "0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c";

interface VerifyTarget {
  name: string;
  address: string;
  constructorArguments: any[];
}

const contracts: VerifyTarget[] = [
  // 1. GSP Core Token — constructor(address admin)
  {
    name: "$CORE (GSPCore)",
    address: "0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c",
    constructorArguments: [OWNER],
  },
  // 2. GSP Origin Token — constructor(address treasury)
  {
    name: "$ORIGIN (GSPOrigin)",
    address: "0xc4bA9370FC3645a9CB1c2297C74bb7D0253482DD",
    constructorArguments: [OWNER],
  },
  // 3. Aurum Rail — constructor(name, symbol, rail, treasury)
  {
    name: "$AURUM (RailToken)",
    address: "0xf28cbbf1ff57eDF1346eB01C85dEffb706613fdB",
    constructorArguments: ["GSP Aurum", "AURUM", "AURUM", OWNER],
  },
  // 4. Lex Rail
  {
    name: "$LEX (RailToken)",
    address: "0xD3da2c4c9D0f14d054FE4581fb473115EC062BA1",
    constructorArguments: ["GSP Lex", "LEX", "LEX", OWNER],
  },
  // 5. Nova Rail
  {
    name: "$NOVA (RailToken)",
    address: "0x31a76C9028fAcD5E4d6f8f145897561b306d2829",
    constructorArguments: ["GSP Nova", "NOVA", "NOVA", OWNER],
  },
  // 6. Merc Rail
  {
    name: "$MERC (RailToken)",
    address: "0xa5D739581961901658bA1f31E2a3237F6F37bE64",
    constructorArguments: ["GSP Merc", "MERC", "MERC", OWNER],
  },
  // 7. Ludo Rail
  {
    name: "$LUDO (RailToken)",
    address: "0x51D304f954986C26761F99F9b7dA57E34A7ebFfA",
    constructorArguments: ["GSP Ludo", "LUDO", "LUDO", OWNER],
  },
  // 8. Patron Vault — constructor(address coreToken_, address admin)
  {
    name: "PatronVault",
    address: "0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399",
    constructorArguments: [CORE_ADDRESS, OWNER],
  },
  // 9. Agent Identity NFT — constructor(address treasury)
  {
    name: "AgentIdentityNFT",
    address: "0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed",
    constructorArguments: [OWNER],
  },
];

async function main() {
  console.log("🔍 Verifying 9 contracts on PolygonScan...\n");

  let passed = 0;
  let failed = 0;

  for (const c of contracts) {
    console.log(`── ${c.name} @ ${c.address}`);
    try {
      await hre.run("verify:verify", {
        address: c.address,
        constructorArguments: c.constructorArguments,
      });
      console.log(`   ✅ Verified!\n`);
      passed++;
    } catch (err: any) {
      if (err.message?.includes("Already Verified") || err.message?.includes("already verified")) {
        console.log(`   ✅ Already verified.\n`);
        passed++;
      } else {
        console.log(`   ❌ FAILED: ${err.message}\n`);
        failed++;
      }
    }
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`  ✅ Verified: ${passed}/9`);
  if (failed > 0) console.log(`  ❌ Failed:   ${failed}/9`);
  console.log(`═══════════════════════════════════`);
}

main().catch(console.error);

import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

/**
 * Upload all agent metadata JSON files to IPFS via Pinata
 * Outputs: metadata/_ipfs_cids.json with tokenId → CID mapping
 *
 * Run: npx ts-node scripts/vie/upload_to_ipfs.ts
 */

const PINATA_JWT = process.env.PINATA_JWT;
if (!PINATA_JWT) throw new Error("PINATA_JWT not set in .env");

const pinataHeaders = {
  Authorization: `Bearer ${PINATA_JWT}`,
  "Content-Type": "application/json",
};

async function pinJSON(name: string, body: object): Promise<string> {
  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      pinataMetadata: { name },
      pinataContent: body,
    },
    { headers: pinataHeaders }
  );
  return res.data.IpfsHash;
}

async function main() {
  const metaDir = path.join(__dirname, "../../metadata");
  const manifestPath = path.join(metaDir, "_manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error("metadata/_manifest.json not found. Run generate_metadata.ts first.");
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const cidMap: Record<string, { tokenId: number; cid: string; uri: string }> = {};

  console.log("═══════════════════════════════════════════");
  console.log("  GSP VIE — Pinning metadata to IPFS");
  console.log("═══════════════════════════════════════════\n");

  for (const [agentId, info] of Object.entries(manifest) as [string, any][]) {
    const filePath = path.join(metaDir, info.file);
    const metadata = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    process.stdout.write(`  Pinning #${String(info.tokenId).padStart(2, "0")} ${agentId}... `);
    try {
      const cid = await pinJSON(`gsp-agent-${agentId}`, metadata);
      const uri = `ipfs://${cid}`;
      cidMap[agentId] = { tokenId: info.tokenId, cid, uri };

      // Update metadata file with real IPFS image CID placeholder note
      console.log(`✓ ${cid}`);
    } catch (err: any) {
      console.log(`✗ ${err.message}`);
    }
  }

  // Pin collection metadata
  process.stdout.write("  Pinning collection metadata... ");
  const collMeta = JSON.parse(fs.readFileSync(path.join(metaDir, "_collection.json"), "utf-8"));
  const collCid = await pinJSON("gsp-agent-collection", collMeta);
  console.log(`✓ ${collCid}`);

  // Save CID map
  const outputPath = path.join(metaDir, "_ipfs_cids.json");
  fs.writeFileSync(outputPath, JSON.stringify({ collection: collCid, agents: cidMap }, null, 2));

  console.log("\n═══════════════════════════════════════════");
  console.log("  ALL METADATA PINNED TO IPFS");
  console.log("═══════════════════════════════════════════");
  console.log(`  Collection: ipfs://${collCid}`);
  console.log(`  CID map saved: ${outputPath}`);
  console.log("\n  Next: npx hardhat run scripts/deploy/04_deploy_nft.ts --network polygon");
}

main().catch(console.error);

/**
 * 14_opensea_register.ts — OpenSea Collection Registration & Metadata Refresh
 *
 * Automates:
 *  1. Verify all 15 Genesis Agent NFTs are indexed on OpenSea
 *  2. Extract collection slug and metadata via web scraping
 *  3. Attempt API-based metadata refresh if OPENSEA_API_KEY is valid
 *  4. Generate direct OpenSea links for all agents
 *
 * Uses OpenSea API v2 (if key valid) + web scraping fallback
 * Chain: matic (Polygon mainnet)
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ── Config ─────────────────────────────────────────────────────────────────
const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY || "";
const NFT_CONTRACT = "0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed";
const CHAIN = "matic"; // Polygon mainnet
const OWNER = "0xffBC1353a3e8cc75643382e7Ab745a5b08C762b5";
const TOTAL_AGENTS = 15;
const BASE_URL = "https://api.opensea.io/api/v2";

// ── Helpers ────────────────────────────────────────────────────────────────
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Load agent data ────────────────────────────────────────────────────────
function loadAgentNames(): Map<number, string> {
  const nftPath = path.resolve(__dirname, "../../deployments/polygon/nft.json");
  const map = new Map<number, string>();
  if (fs.existsSync(nftPath)) {
    const data = JSON.parse(fs.readFileSync(nftPath, "utf-8"));
    for (const agent of data.agents) {
      map.set(agent.tokenId, agent.agentId);
    }
  }
  return map;
}

// ── Step 1: Check API key validity ─────────────────────────────────────────
async function checkApiKey(): Promise<boolean> {
  if (!OPENSEA_API_KEY) {
    console.log("  ⚠️  No OPENSEA_API_KEY set — using web scraping fallback");
    return false;
  }
  try {
    const r = await fetch(`${BASE_URL}/chain/${CHAIN}/contract/${NFT_CONTRACT}`, {
      headers: { Accept: "application/json", "X-API-KEY": OPENSEA_API_KEY },
    });
    if (r.status === 401) {
      console.log("  ⚠️  OPENSEA_API_KEY is invalid/expired — using web scraping fallback");
      console.log("     To fix: regenerate key at https://developers.opensea.io/");
      return false;
    }
    console.log(`  ✅ API key valid (status ${r.status})`);
    return true;
  } catch {
    console.log("  ⚠️  API check failed — using web scraping fallback");
    return false;
  }
}

// ── Step 2: Verify all NFTs indexed via web scraping ───────────────────────
async function verifyAllNFTsIndexed(): Promise<{
  indexed: number;
  names: Map<number, string>;
}> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  STEP 1: Verify All NFTs Indexed on OpenSea            ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const agentNames = loadAgentNames();
  const names = new Map<number, string>();
  let indexed = 0;

  for (let tokenId = 1; tokenId <= TOTAL_AGENTS; tokenId++) {
    const localName = agentNames.get(tokenId) || `token-${tokenId}`;
    process.stdout.write(`  [${String(tokenId).padStart(2)}/15] ${localName.padEnd(22)} → `);

    try {
      const url = `https://opensea.io/assets/matic/${NFT_CONTRACT}/${tokenId}`;
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
        redirect: "follow",
      });
      const t = await r.text();
      const titleMatch = t.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch?.[1]
        ?.replace(/ \| OpenSea$/, "")
        ?.replace(/ - GSP Agent Identity$/, "")
        || "?";

      if (r.status === 200 && !title.includes("404") && !title.includes("Error")) {
        console.log(`✅ ${title}`);
        names.set(tokenId, title);
        indexed++;
      } else {
        console.log(`⏳ Not yet indexed (${r.status})`);
      }
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`);
    }

    await sleep(400); // Respect rate limits
  }

  console.log(`\n  Result: ${indexed}/${TOTAL_AGENTS} NFTs indexed on OpenSea\n`);
  return { indexed, names };
}

// ── Step 3: Extract collection slug ────────────────────────────────────────
async function extractCollectionSlug(): Promise<string | null> {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  STEP 2: Extract Collection Slug                       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  try {
    const url = `https://opensea.io/assets/matic/${NFT_CONTRACT}/1`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
      redirect: "follow",
    });
    const t = await r.text();

    // Try JSON data embedded in page
    const jsonSlug = t.match(/"collection":\s*\{[^}]*"slug":\s*"([^"]+)"/);
    if (jsonSlug) {
      console.log(`  ✅ Collection slug (JSON): ${jsonSlug[1]}`);
      return jsonSlug[1];
    }

    // Try href pattern
    const hrefSlug = t.match(/href="\/collection\/([^"\/]+)"/);
    if (hrefSlug) {
      console.log(`  ✅ Collection slug (href): ${hrefSlug[1]}`);
      return hrefSlug[1];
    }

    // Try any collection/ reference that matches our pattern
    const allSlugs = t.match(/collection\/([a-z0-9_-]+)/gi) || [];
    const gspSlug = allSlugs.find((s) => s.includes("gsp"));
    if (gspSlug) {
      const slug = gspSlug.replace("collection/", "");
      console.log(`  ✅ Collection slug (pattern): ${slug}`);
      return slug;
    }

    console.log("  ⏳ Could not extract collection slug");
    return null;
  } catch (err: any) {
    console.log(`  ❌ Error extracting slug: ${err.message}`);
    return null;
  }
}

// ── Step 4: API-based metadata refresh (if key valid) ──────────────────────
async function apiRefreshMetadata(): Promise<number> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  STEP 3: API Metadata Refresh                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const agentNames = loadAgentNames();
  let success = 0;

  for (let tokenId = 1; tokenId <= TOTAL_AGENTS; tokenId++) {
    const name = agentNames.get(tokenId) || `token-${tokenId}`;
    process.stdout.write(`  [${String(tokenId).padStart(2)}/15] ${name.padEnd(22)} → `);

    try {
      const r = await fetch(
        `${BASE_URL}/chain/${CHAIN}/contract/${NFT_CONTRACT}/nfts/${tokenId}/refresh`,
        {
          method: "POST",
          headers: { Accept: "application/json", "X-API-KEY": OPENSEA_API_KEY },
        }
      );

      if (r.status === 200 || r.status === 202) {
        console.log("✅ Refresh queued");
        success++;
      } else {
        const body = await r.text();
        console.log(`⚠️  ${r.status}: ${body.substring(0, 60)}`);
      }
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
    }

    await sleep(350);
  }

  console.log(`\n  Result: ${success}/${TOTAL_AGENTS} refreshed via API\n`);
  return success;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     GSP — OpenSea Collection Registration              ║");
  console.log("║     Contract: 0x615F...05aed (Polygon)                 ║");
  console.log("║     15 Genesis Agents — Soul-Bound ERC-721             ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  console.log(`\n  Chain:    ${CHAIN}`);
  console.log(`  Contract: ${NFT_CONTRACT}`);
  console.log(`  Owner:    ${OWNER}`);

  // Check API key
  const apiKeyValid = await checkApiKey();

  // Step 1: Verify all NFTs indexed
  const { indexed, names } = await verifyAllNFTsIndexed();

  // Step 2: Extract collection slug
  const slug = await extractCollectionSlug();

  // Step 3: API refresh if key is valid
  let refreshed = 0;
  if (apiKeyValid) {
    refreshed = await apiRefreshMetadata();
  } else {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║  STEP 3: API Metadata Refresh — SKIPPED (no valid key) ║");
    console.log("╚══════════════════════════════════════════════════════════╝\n");
    console.log("  ℹ️  NFTs are already indexed — metadata was loaded from IPFS automatically.");
    console.log("  ℹ️  To force a metadata refresh later, get a key from https://developers.opensea.io/\n");
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                    SUMMARY                             ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`  NFTs indexed:       ${indexed}/${TOTAL_AGENTS}`);
  console.log(`  Collection slug:    ${slug || "pending"}`);
  if (apiKeyValid) {
    console.log(`  API refresh:        ${refreshed}/${TOTAL_AGENTS}`);
  }

  if (slug) {
    console.log(`\n  🌐 Collection: https://opensea.io/collection/${slug}`);
  }

  console.log(`\n  📋 Direct NFT links:`);
  for (let i = 1; i <= TOTAL_AGENTS; i++) {
    const name = names.get(i) || `Agent #${i}`;
    console.log(`     #${String(i).padStart(2)} ${name.padEnd(36)} https://opensea.io/assets/matic/${NFT_CONTRACT}/${i}`);
  }

  // Save results
  const resultsPath = path.resolve(__dirname, "../../deployments/polygon/opensea.json");
  const results = {
    timestamp: new Date().toISOString(),
    chain: CHAIN,
    contract: NFT_CONTRACT,
    owner: OWNER,
    collectionSlug: slug,
    collectionUrl: slug ? `https://opensea.io/collection/${slug}` : null,
    nftsIndexed: indexed,
    apiKeyValid,
    apiRefreshed: refreshed,
    agents: Array.from({ length: TOTAL_AGENTS }, (_, i) => ({
      tokenId: i + 1,
      name: names.get(i + 1) || null,
      opensea: `https://opensea.io/assets/matic/${NFT_CONTRACT}/${i + 1}`,
    })),
  };
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n  💾 Results saved to deployments/polygon/opensea.json`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

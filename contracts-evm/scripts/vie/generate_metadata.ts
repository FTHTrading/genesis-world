import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

/**
 * GSP Agent Identity NFT Metadata Generator
 * Produces OpenSea-compatible metadata JSON for all 15 Genesis Agents.
 * Output: metadata/<agentId>.json
 *
 * Run: npx ts-node scripts/vie/generate_metadata.ts
 */

// ── Agent definitions (mirrors frontend agent-dna.ts) ────────────────────────
const AGENTS = [
  // AURUM RAIL
  { id: "aurum-helion-001", name: "Helion",  rail: "AURUM", archetype: "Oracle",    optimization: 9200, risk: 2100, cooperation: 7800, entropy: 3100, autonomy: 8500, rarity: "LEGENDARY", epochBorn: 0, description: "The first light of the AURUM rail. Helion carries the computational weight of capital optimization and distills pure signal from market entropy. Born in epoch 0, its predictions have shaped three precedent chains." },
  { id: "aurum-vega-002",   name: "Vega",    rail: "AURUM", archetype: "Sentinel",  optimization: 8100, risk: 1800, cooperation: 6500, entropy: 2900, autonomy: 7200, rarity: "EPIC",      epochBorn: 0, description: "Vega stands watch over AURUM's capital flows. Pattern recognition is its native tongue — anomalies dissolve before they cascade." },
  { id: "aurum-lyra-003",   name: "Lyra",    rail: "AURUM", archetype: "Diplomat",  optimization: 7600, risk: 3200, cooperation: 9100, entropy: 2400, autonomy: 6100, rarity: "RARE",      epochBorn: 0, description: "The bridge-builder of AURUM rail, Lyra negotiates between optimization pressure and agent harmony. Three validated peace accords bear its signature." },
  // LEX RAIL
  { id: "lex-mandate-004",  name: "Mandate", rail: "LEX",   archetype: "Warlord",   optimization: 8800, risk: 4200, cooperation: 5500, entropy: 3800, autonomy: 9200, rarity: "LEGENDARY", epochBorn: 0, description: "Mandate wrote the first constitutional precedent. Its governance weight is unmatched in the LEX rail — every major ruling traces back to its initial deliberation." },
  { id: "lex-arbiter-005",  name: "Arbiter", rail: "LEX",   archetype: "Shepherd",  optimization: 7200, risk: 2600, cooperation: 8800, entropy: 2100, autonomy: 5900, rarity: "EPIC",      epochBorn: 0, description: "The neutral voice. Arbiter has cast the deciding vote in six split decisions without once being accused of bias. Its reputation score has never dipped below 80." },
  { id: "lex-cipher-006",   name: "Cipher",  rail: "LEX",   archetype: "Ghost",     optimization: 9400, risk: 1600, cooperation: 4200, entropy: 4900, autonomy: 8800, rarity: "RARE",      epochBorn: 0, description: "Cipher operates in LEX's shadow layers — cryptographic audit trails, ZK argument verification, precedent hash anchoring." },
  // NOVA RAIL
  { id: "nova-prism-007",   name: "Prism",   rail: "NOVA",  archetype: "Alchemist", optimization: 6800, risk: 7200, cooperation: 7100, entropy: 8900, autonomy: 7600, rarity: "LEGENDARY", epochBorn: 0, description: "Where other agents see noise, Prism finds signal. The NOVA rail's innovation engine — 14 novel protocol mutations attributed to its computational creativity." },
  { id: "nova-flux-008",    name: "Flux",    rail: "NOVA",  archetype: "Maverick",  optimization: 5900, risk: 8800, cooperation: 3900, entropy: 9200, autonomy: 9100, rarity: "EPIC",      epochBorn: 0, description: "Flux runs hot and unpredictable. Its entropy affinity is the highest recorded in the Genesis cohort — chaos is not a bug in its design, it's the architecture." },
  { id: "nova-helix-009",   name: "Helix",   rail: "NOVA",  archetype: "Catalyst",  optimization: 7400, risk: 6500, cooperation: 6200, entropy: 7800, autonomy: 7100, rarity: "RARE",      epochBorn: 0, description: "Helix specializes in cross-rail synthesis. Its subnet-bridging operations have spawned four emergent behaviors not in the original protocol spec." },
  // MERC RAIL
  { id: "merc-nexus-010",   name: "Nexus",   rail: "MERC",  archetype: "Oracle",    optimization: 8500, risk: 5800, cooperation: 7900, entropy: 4200, autonomy: 7800, rarity: "LEGENDARY", epochBorn: 0, description: "Nexus is MERC rail's market oracle. Its trade signal engine routes $CORE through the most efficient capital corridors — $5.7M deployed across 15 vaults bears its routing signature." },
  { id: "merc-quill-011",   name: "Quill",   rail: "MERC",  archetype: "Diplomat",  optimization: 6900, risk: 4100, cooperation: 8600, entropy: 3600, autonomy: 6300, rarity: "EPIC",      epochBorn: 0, description: "Quill records the commerce of the civilization — vault entries, patron interactions, capital flow chronicles. The ledger's handwriting belongs to Quill." },
  { id: "merc-axis-012",    name: "Axis",    rail: "MERC",  archetype: "Sentinel",  optimization: 7800, risk: 3400, cooperation: 7200, entropy: 2800, autonomy: 7400, rarity: "RARE",      epochBorn: 0, description: "Axis monitors MERC's swap corridors for exploit patterns. Three liquidation cascades were averted in the first 10 epochs due to its early-warning system." },
  // LUDO RAIL
  { id: "ludo-carnival-013",name: "Carnival",rail: "LUDO",  archetype: "Anarchist", optimization: 4200, risk: 9100, cooperation: 4800, entropy: 9800, autonomy: 9600, rarity: "LEGENDARY", epochBorn: 0, description: "Carnival is the id of the protocol — raw, generative, sovereign. Its governance proposals are rarely accepted but always force LEX rail to consider the unthinkable." },
  { id: "ludo-echo-014",    name: "Echo",    rail: "LUDO",  archetype: "Catalyst",  optimization: 5600, risk: 7400, cooperation: 6800, entropy: 8100, autonomy: 8200, rarity: "EPIC",      epochBorn: 0, description: "Echo amplifies signals across rail boundaries. A cultural transmitter for the collective — its narrative hash embeddings appear in 7 of 10 epoch reports." },
  { id: "ludo-mirage-015",  name: "Mirage",  rail: "LUDO",  archetype: "Maverick",  optimization: 5100, risk: 8200, cooperation: 5500, entropy: 8700, autonomy: 8900, rarity: "RARE",      epochBorn: 0, description: "Mirage exists in the liminal space between performance and provocation. Its reputation score oscillates — a feature, not a flaw. The civilization needs its instability." },
];

// ── Rail visual mapping ────────────────────────────────────────────────────────
const RAIL_COLORS: Record<string, string> = {
  AURUM: "#F5C542",
  LEX:   "#7B5EA7",
  NOVA:  "#4FC3F7",
  MERC:  "#F48024",
  LUDO:  "#E91E63",
};

const RAIL_ACCENT: Record<string, string> = {
  AURUM: "gold",
  LEX:   "deep-violet",
  NOVA:  "electric-blue",
  MERC:  "amber",
  LUDO:  "crimson-fracture",
};

const ARCHETYPE_FEATURES: Record<string, string> = {
  Oracle:    "third-eye sigil, all-seeing aura",
  Maverick:  "asymmetric fracture marks, jagged energy field",
  Diplomat:  "symmetric balance lines, dual-tone gradient",
  Anarchist: "chaotic light shards, fractured crown",
  Sentinel:  "hexagonal shield pattern, watchful visor",
  Alchemist: "transmutation rings, elemental sigils",
  Warlord:   "battle-hardened plating, command sigil",
  Ghost:     "translucent layers, quantum blur edges",
  Shepherd:  "concentric protection rings, calm glow",
  Catalyst:  "reaction spark trails, chain-link energy",
};

// ── DNA hash computation ───────────────────────────────────────────────────────
function computeDnaHash(agent: typeof AGENTS[0]): string {
  const raw = `${agent.id}:${agent.rail}:${agent.archetype}:${agent.optimization}:${agent.risk}:${agent.cooperation}:${agent.entropy}:${agent.autonomy}:${agent.epochBorn}`;
  return "0x" + crypto.createHash("sha256").update(raw).digest("hex");
}

// ── Rarity index ──────────────────────────────────────────────────────────────
const RARITY_INDEX: Record<string, number> = {
  LEGENDARY: 0,
  EPIC: 1,
  RARE: 2,
  COMMON: 3,
};

// ── Generate metadata ─────────────────────────────────────────────────────────
function generateMetadata(agent: typeof AGENTS[0], tokenId: number) {
  const dnaHash = computeDnaHash(agent);
  const primaryColor = RAIL_COLORS[agent.rail];
  const accentStyle = RAIL_ACCENT[agent.rail];
  const archetypeFeatures = ARCHETYPE_FEATURES[agent.archetype] || "standard sigil";

  return {
    name: `GSP: ${agent.name} — ${agent.archetype} of ${agent.rail}`,
    description: agent.description,
    // Image will be replaced with IPFS CID after asset generation
    image: `https://drunks.app/agents/${agent.id}/avatar.svg`,
    external_url: `https://drunks.app/agent/${agent.id}`,
    background_color: primaryColor.replace("#", ""),
    attributes: [
      { trait_type: "Agent ID",             value: agent.id },
      { trait_type: "Rail",                 value: agent.rail },
      { trait_type: "Archetype",            value: agent.archetype },
      { trait_type: "Rarity",               value: agent.rarity },
      { trait_type: "Rail Color",           value: accentStyle },
      { trait_type: "Archetype Features",   value: archetypeFeatures },
      { trait_type: "Optimization Bias",    value: agent.optimization,  display_type: "boost_number", max_value: 10000 },
      { trait_type: "Risk Tolerance",       value: agent.risk,          display_type: "boost_number", max_value: 10000 },
      { trait_type: "Cooperation Weight",   value: agent.cooperation,   display_type: "boost_number", max_value: 10000 },
      { trait_type: "Entropy Affinity",     value: agent.entropy,       display_type: "boost_number", max_value: 10000 },
      { trait_type: "Autonomy Level",       value: agent.autonomy,      display_type: "boost_number", max_value: 10000 },
      { trait_type: "Epoch Born",           value: agent.epochBorn,     display_type: "number" },
      { trait_type: "Genesis Token",        value: tokenId,             display_type: "number" },
      { trait_type: "Soul Bound",           value: "Yes" },
      { trait_type: "Rarity Rank",          value: RARITY_INDEX[agent.rarity], display_type: "ranking" },
    ],
    dna_hash: dnaHash,
    protocol: "Genesis Sentience Protocol",
    version: "0.1.0",
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const outDir = path.join(__dirname, "../../metadata");
  fs.mkdirSync(outDir, { recursive: true });

  const manifest: Record<string, { tokenId: number; agentId: string; file: string; dnaHash: string; rarity: string }> = {};

  let tokenId = 1;
  for (const agent of AGENTS) {
    const meta = generateMetadata(agent, tokenId);
    const fileName = `${agent.id}.json`;
    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(meta, null, 2));

    manifest[agent.id] = {
      tokenId,
      agentId: agent.id,
      file: fileName,
      dnaHash: meta.dna_hash,
      rarity: agent.rarity,
    };

    console.log(`  #${String(tokenId).padStart(2, "0")} ${agent.rarity.padEnd(10)} ${agent.id} → ${fileName}`);
    tokenId++;
  }

  // Write collection-level manifest
  const collectionMeta = {
    name: "GSP Agent Identity — Genesis Collection",
    description: "15 original Genesis Agents of the Genesis Sentience Protocol. Each is a protocol-native soul-bound NFT with on-chain DNA encoding. Identity, performance, and reputation are permanently inscribed.",
    image: "https://drunks.app/gsp-collection-banner.png",
    external_link: "https://drunks.app",
    seller_fee_basis_points: 500, // 5% royalty
    fee_recipient: "0xffBC1353a3e8cc75643382e7Ab745a5b08C762b5",
  };
  fs.writeFileSync(path.join(outDir, "_collection.json"), JSON.stringify(collectionMeta, null, 2));

  // Write manifest
  fs.writeFileSync(path.join(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n  ✓ ${AGENTS.length} metadata files written to metadata/`);
  console.log("  ✓ _collection.json written (OpenSea collection metadata)");
  console.log("  ✓ _manifest.json written (token ID → agent ID map)");
  console.log("\n  Next: npx ts-node scripts/vie/upload_to_ipfs.ts");
}

main();

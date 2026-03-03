// ═══════════════════════════════════════════════════════════════════════
// EPOCH ANCHOR — ON-CHAIN PROOF ROOTS
//
// At the end of each epoch, the entire civilization state is hashed
// into a Merkle proof root. This root can be anchored to Polygon,
// making the agent civilization:
//
// - Tamper-evident: any post-hoc editing changes the hash
// - Replayable: same genesis DNA + epochs = same civilization
// - Auditable: anyone can verify the civilization chain
// - Permanent: on-chain anchors survive server loss
//
// The proof chain is: epoch N hash includes epoch N-1 hash.
// Break one link → entire chain invalidates. Just like Bitcoin.
// ═══════════════════════════════════════════════════════════════════════

import {
  CivilizationState,
  CivilizationHistory,
  GeneratedPost,
  MutationEvent,
  ReputationScore,
  DebateOutcome,
  DNAVector,
  ReactiveResponse,
  CONTRACTS,
} from "./types.js";
import { sha256 } from "./utils.js";

// ═══════════════════════════════════════════════
// PROOF ROOT COMPUTATION
// ═══════════════════════════════════════════════

/**
 * Hash all discourse (posts + reactive responses) into a single root.
 */
export function hashDiscourse(
  posts: GeneratedPost[],
  reactiveResponses: ReactiveResponse[],
): string {
  const postData = posts
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(p => `${p.id}:${p.agent}:${p.type}:${p.proofHash}`)
    .join("|");

  const reactiveData = reactiveResponses
    .sort((a, b) => a.post.id.localeCompare(b.post.id))
    .map(r => `${r.post.id}:${r.context.respondingAgent}:${r.context.triggerAgent}:${r.post.proofHash}`)
    .join("|");

  return sha256(`discourse:${postData}|reactive:${reactiveData}`);
}

/**
 * Hash all mutations into a single root.
 */
export function hashMutations(mutations: MutationEvent[]): string {
  const data = mutations
    .sort((a, b) => `${a.agentId}:${a.trait}`.localeCompare(`${b.agentId}:${b.trait}`))
    .map(m => `${m.agentId}:${m.trait}:${m.oldValue}:${m.newValue}:${m.pressure}`)
    .join("|");
  return sha256(`mutations:${data || "none"}`);
}

/**
 * Hash reputation scores into a single root.
 */
export function hashReputation(scores: Record<string, ReputationScore>): string {
  const data = Object.entries(scores)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, s]) => `${id}:${s.influence}:${s.debateWins}:${s.debateLosses}:${s.engagementRate}`)
    .join("|");
  return sha256(`reputation:${data}`);
}

/**
 * Hash DNA snapshot into a single root.
 */
export function hashDna(dna: Record<string, DNAVector>): string {
  const data = Object.entries(dna)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, v]) => `${id}:${v.optimizationBias}:${v.riskTolerance}:${v.cooperationWeight}:${v.entropyAffinity}:${v.autonomyLevel}`)
    .join("|");
  return sha256(`dna:${data}`);
}

// ═══════════════════════════════════════════════
// CIVILIZATION HASH
// ═══════════════════════════════════════════════

/**
 * Compute the master civilization hash for an epoch.
 *
 * civilizationHash = SHA-256(
 *   discourseHash +
 *   mutationHash +
 *   reputationHash +
 *   dnaHash +
 *   parentHash
 * )
 *
 * This creates an append-only hash chain — each epoch's hash
 * depends on every previous epoch. Tamper with epoch 5?
 * Epochs 6, 7, 8... all invalidate.
 */
export function computeCivilizationHash(
  discourseHash: string,
  mutationHash: string,
  reputationHash: string,
  dnaHash: string,
  parentHash: string,
): string {
  return sha256(
    `civ:${discourseHash}:${mutationHash}:${reputationHash}:${dnaHash}:${parentHash}`
  );
}

// ═══════════════════════════════════════════════
// EPOCH STATE BUILDER
// ═══════════════════════════════════════════════

/**
 * Build a complete CivilizationState for an epoch.
 */
export function buildEpochState(
  epoch: number,
  dnaSnapshots: Record<string, DNAVector>,
  reputationScores: Record<string, ReputationScore>,
  mutations: MutationEvent[],
  debates: DebateOutcome[],
  posts: GeneratedPost[],
  reactiveResponses: ReactiveResponse[],
  parentHash: string,
): CivilizationState {

  // Compute all sub-hashes
  const discourseHash = hashDiscourse(posts, reactiveResponses);
  const mutationHash = hashMutations(mutations);
  const reputationHash = hashReputation(reputationScores);
  const dnaHash = hashDna(dnaSnapshots);

  // Compute master hash
  const civilizationHash = computeCivilizationHash(
    discourseHash, mutationHash, reputationHash, dnaHash, parentHash,
  );

  // Build discourse metrics
  const submoltBreakdown: Record<string, number> = {};
  for (const post of posts) {
    submoltBreakdown[post.submolt] = (submoltBreakdown[post.submolt] || 0) + 1;
  }

  const crossRailExchanges = reactiveResponses.filter(r =>
    r.context.relationship === "cross-rail"
  ).length;

  return {
    version: 1,
    epoch,
    timestamp: new Date().toISOString(),

    dnaSnapshots,
    reputationScores,
    mutations,
    debates,

    discourse: {
      totalPosts: posts.length,
      totalReplies: reactiveResponses.length,
      totalThreads: 0, // filled by civilization.ts
      reactiveResponses: reactiveResponses.length,
      crossRailExchanges,
      submoltBreakdown,
    },

    discourseHash,
    mutationHash,
    reputationHash,
    civilizationHash,
    parentHash,
  };
}

// ═══════════════════════════════════════════════
// HISTORY MANAGEMENT
// ═══════════════════════════════════════════════

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

const DEFAULT_HISTORY_PATH = join(process.cwd(), "data", "civilization-history.json");

/**
 * Load civilization history from disk.
 */
export async function loadHistory(
  filePath: string = DEFAULT_HISTORY_PATH,
): Promise<CivilizationHistory> {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  if (existsSync(filePath)) {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as CivilizationHistory;
  }

  // Genesis history
  return {
    chainId: "gsp-moltbook-mainnet",
    genesisEpoch: 0,
    currentEpoch: 0,
    epochs: [],
    headHash: "0x0",
  };
}

/**
 * Append an epoch state to history and persist.
 */
export async function appendToHistory(
  state: CivilizationState,
  filePath: string = DEFAULT_HISTORY_PATH,
): Promise<CivilizationHistory> {
  const history = await loadHistory(filePath);

  // Validate chain continuity
  if (history.epochs.length > 0) {
    const lastEpoch = history.epochs[history.epochs.length - 1]!;
    if (state.parentHash !== lastEpoch.civilizationHash) {
      throw new Error(
        `Chain break! Expected parent ${lastEpoch.civilizationHash.slice(0, 16)}... ` +
        `but got ${state.parentHash.slice(0, 16)}...`
      );
    }
  }

  history.epochs.push(state);
  history.currentEpoch = state.epoch;
  history.headHash = state.civilizationHash;

  // Atomic write
  const tempPath = filePath + ".tmp";
  await writeFile(tempPath, JSON.stringify(history, null, 2), "utf-8");
  const { rename } = await import("node:fs/promises");
  await rename(tempPath, filePath);

  return history;
}

/**
 * Verify the entire civilization chain is intact.
 */
export function verifyChain(history: CivilizationHistory): {
  valid: boolean;
  brokenAt?: number;
  message: string;
} {
  if (history.epochs.length === 0) {
    return { valid: true, message: "Empty chain (genesis)" };
  }

  // Verify first epoch has "0x0" parent
  if (history.epochs[0]!.parentHash !== "0x0") {
    return {
      valid: false,
      brokenAt: 0,
      message: `Genesis epoch has non-zero parent: ${history.epochs[0]!.parentHash}`,
    };
  }

  // Verify each subsequent epoch links to the previous
  for (let i = 1; i < history.epochs.length; i++) {
    const current = history.epochs[i]!;
    const previous = history.epochs[i - 1]!;

    if (current.parentHash !== previous.civilizationHash) {
      return {
        valid: false,
        brokenAt: i,
        message: `Chain break at epoch ${current.epoch}: expected parent ${previous.civilizationHash.slice(0, 16)}..., got ${current.parentHash.slice(0, 16)}...`,
      };
    }
  }

  // Verify head hash
  const lastEpoch = history.epochs[history.epochs.length - 1]!;
  if (history.headHash !== lastEpoch.civilizationHash) {
    return {
      valid: false,
      message: `Head hash mismatch: ${history.headHash.slice(0, 16)}... vs ${lastEpoch.civilizationHash.slice(0, 16)}...`,
    };
  }

  return {
    valid: true,
    message: `Chain intact: ${history.epochs.length} epochs, head ${history.headHash.slice(0, 16)}...`,
  };
}

// ═══════════════════════════════════════════════
// ON-CHAIN ANCHORING PAYLOAD
// ═══════════════════════════════════════════════

/**
 * Generate the payload to anchor on Polygon.
 *
 * This produces the calldata for a simple anchor transaction:
 * - To: AgentIdentityNFT contract (or a dedicated anchor contract)
 * - Data: epoch + civilizationHash + discourseHash + dnaHash
 *
 * For now, returns the structured payload. Actual TX execution
 * will be handled by a separate deployment script.
 */
export function generateAnchorPayload(state: CivilizationState): {
  contract: string;
  epoch: number;
  civilizationHash: string;
  discourseHash: string;
  mutationHash: string;
  reputationHash: string;
  parentHash: string;
  summary: string;
} {
  return {
    contract: CONTRACTS.AGENT_NFT,
    epoch: state.epoch,
    civilizationHash: state.civilizationHash,
    discourseHash: state.discourseHash,
    mutationHash: state.mutationHash,
    reputationHash: state.reputationHash,
    parentHash: state.parentHash,
    summary: [
      `Epoch ${state.epoch} | ${state.discourse.totalPosts} posts | ${state.discourse.reactiveResponses} reactions`,
      `Mutations: ${state.mutations.length} | Debates: ${state.debates.length}`,
      `Hash: ${state.civilizationHash.slice(0, 16)}...`,
    ].join(" | "),
  };
}

// ═══════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════

/**
 * Format epoch anchor state for CLI display.
 */
export function formatAnchorState(state: CivilizationState): string {
  const lines: string[] = [];
  lines.push("  ┌─ EPOCH PROOF ROOT ────────────────────────────────────────────────────┐");
  lines.push(`  │ Epoch:           ${state.epoch}`);
  lines.push(`  │ Timestamp:       ${state.timestamp}`);
  lines.push(`  │`);
  lines.push(`  │ Discourse Hash:  ${state.discourseHash.slice(0, 32)}...`);
  lines.push(`  │ Mutation Hash:   ${state.mutationHash.slice(0, 32)}...`);
  lines.push(`  │ Reputation Hash: ${state.reputationHash.slice(0, 32)}...`);
  lines.push(`  │ Parent Hash:     ${state.parentHash.slice(0, 32)}...`);
  lines.push(`  │`);
  lines.push(`  │ ╔══════════════════════════════════════════════════════════════════╗`);
  lines.push(`  │ ║ CIVILIZATION HASH: ${state.civilizationHash.slice(0, 48)}... ║`);
  lines.push(`  │ ╚══════════════════════════════════════════════════════════════════╝`);
  lines.push(`  │`);
  lines.push(`  │ Discourse:  ${state.discourse.totalPosts} posts, ${state.discourse.reactiveResponses} reactions, ${state.discourse.crossRailExchanges} cross-rail`);
  lines.push(`  │ Mutations:  ${state.mutations.length} DNA changes`);
  lines.push(`  │ Debates:    ${state.debates.length} resolved`);
  lines.push("  └──────────────────────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}

/**
 * Format chain verification for CLI display.
 */
export function formatChainVerification(history: CivilizationHistory): string {
  const verification = verifyChain(history);
  const lines: string[] = [];

  lines.push("  ┌─ CIVILIZATION CHAIN ──────────────────────────────────────────────────┐");
  lines.push(`  │ Chain ID:       ${history.chainId}`);
  lines.push(`  │ Genesis Epoch:  ${history.genesisEpoch}`);
  lines.push(`  │ Current Epoch:  ${history.currentEpoch}`);
  lines.push(`  │ Total Epochs:   ${history.epochs.length}`);
  lines.push(`  │ Head Hash:      ${history.headHash.slice(0, 32)}...`);
  lines.push(`  │`);
  lines.push(`  │ Verification:   ${verification.valid ? "✅ CHAIN INTACT" : "❌ CHAIN BROKEN"}`);
  lines.push(`  │ ${verification.message}`);

  if (history.epochs.length > 0) {
    lines.push(`  │`);
    lines.push(`  │ Epoch History:`);
    for (const epoch of history.epochs.slice(-10)) { // Show last 10
      const posts = epoch.discourse.totalPosts;
      const mutations = epoch.mutations.length;
      const h = epoch.civilizationHash.slice(0, 12);
      lines.push(`  │   E${String(epoch.epoch).padStart(3)} │ ${posts} posts │ ${mutations} mutations │ ${h}...`);
    }
  }

  lines.push("  └──────────────────────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}

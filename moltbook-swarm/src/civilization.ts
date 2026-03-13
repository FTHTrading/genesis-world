// ═══════════════════════════════════════════════════════════════════════
// CIVILIZATION ENGINE — MASTER STATE MACHINE
//
// This is the orchestrator. One command: `evolve`.
//
// Input:  An epoch number.
// Output: A complete civilization state with:
//         - All agent discourse (scripted + reactive)
//         - Agent cognitive cycles (tool-augmented reasoning)
//         - Reputation scores for every agent
//         - Debate outcomes
//         - DNA mutations applied
//         - Proof root hash
//         - Chain-linked to previous epoch
//
// The pipeline:
//   1. Load previous civilization state (or genesis)
//   2. Generate epoch content (existing system)
//   3. Plan and execute dialogue threads (existing system)
//   4. Run reactive swarm scan (new — emergent responses)
//  4½. Run swarm cognition — agents use tools (Tool Brain)
//   5. Score reputation for all agents (new)
//   6. Resolve debates (new)
//   7. Apply DNA mutations based on reputation + debates (new)
//   8. Build epoch state with proof hashes (new)
//   9. Append to civilization history chain (new)
//  10. Save all outputs
//
// Same inputs → same outputs. Fully deterministic.
// ═══════════════════════════════════════════════════════════════════════

import {
  CivilizationState,
  CognitiveAction,
  DNAVector,
  GeneratedPost,
  DialogueThread,
  ReactiveResponse,
  MutationEvent,
  DebateOutcome,
} from "./types.js";
import { AGENTS } from "./agents.js";
import { generateEpochContent } from "./content.js";
import { planEpochThreads, executeThread } from "./dialogue.js";
import { scanAndReact, analyzeDiscourse, formatReactiveResponses, formatDiscourseAnalysis } from "./reactive.js";
import { computeEpochReputation, formatReputationTable, formatDebateOutcomes } from "./reputation.js";
import { evolveEpoch, getGenesisDna, formatMutations, formatDrift, hashDnaSnapshot } from "./evolution.js";
import {
  buildEpochState, loadHistory, appendToHistory,
  formatAnchorState, formatChainVerification,
  generateAnchorPayload, verifyChain,
} from "./epoch-anchor.js";
import { Ledger } from "./ledger.js";
import { runSwarmCognition, formatSwarmCognition } from "./cognitive.js";
import { ToolRouter, ToolRegistry, globalRegistry } from "./tools.js";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// ═══════════════════════════════════════════════
// EVOLUTION PIPELINE
// ═══════════════════════════════════════════════

export interface EvolveOptions {
  epoch: number;
  verbose?: boolean;
  saveOutputs?: boolean;
  maxReactivePerAgent?: number;
  enableCognition?: boolean;
  hfApiToken?: string;
}

export interface EvolveResult {
  state: CivilizationState;
  posts: GeneratedPost[];
  threads: DialogueThread[];
  reactiveResponses: ReactiveResponse[];
  cognitiveActions: CognitiveAction[];
  summary: string;
}

/**
 * Run a complete evolution cycle for one epoch.
 *
 * This is the civilization's heartbeat.
 */
export async function evolve(options: EvolveOptions): Promise<EvolveResult> {
  const { epoch, verbose = false, saveOutputs = true, maxReactivePerAgent = 3, enableCognition = true, hfApiToken } = options;
  const log = verbose ? console.log : () => {};

  log(`\n  ═══ CIVILIZATION EVOLUTION — EPOCH ${epoch} ═══\n`);

  // ─── 1. Load previous state ───
  log("  [1/9] Loading civilization history...");
  const history = await loadHistory();
  const lastEpoch = history.epochs.length > 0
    ? history.epochs[history.epochs.length - 1]!
    : null;

  const parentHash = lastEpoch?.civilizationHash || "0x0";
  const previousDna = lastEpoch?.dnaSnapshots || getGenesisDna();
  const previousReputation = lastEpoch?.reputationScores || null;

  log(`    Parent: ${parentHash.slice(0, 16)}...`);
  log(`    Previous epoch: ${lastEpoch?.epoch ?? "GENESIS"}`);

  // ─── 2. Generate epoch content ───
  log("  [2/9] Generating epoch content...");
  const posts = generateEpochContent(epoch);
  log(`    Generated ${posts.length} posts`);

  // ─── 3. Plan and execute dialogue threads ───
  log("  [3/9] Planning dialogue threads...");
  const threadPlans = planEpochThreads(epoch);
  const threads: DialogueThread[] = [];
  const threadPosts: GeneratedPost[] = [];

  for (const plan of threadPlans) {
    const thread = executeThread(plan, epoch);
    threads.push(thread);
    // Thread posts are already included in the content engine output
  }
  log(`    Planned ${threads.length} threads`);

  // ─── 4. Reactive swarm scan ───
  log("  [4/9] Running reactive swarm scan...");
  const reactiveResponses = scanAndReact(
    posts,
    epoch,
    maxReactivePerAgent,
    previousDna,
  );
  log(`    Generated ${reactiveResponses.length} reactive responses`);

  if (verbose && reactiveResponses.length > 0) {
    log(formatReactiveResponses(reactiveResponses));
  }

  // Combine all posts for reputation scoring
  const allPosts = [...posts, ...reactiveResponses.map(r => r.post)];

  // ─── 4½. Swarm Cognition (Tool Brain) ───
  let cognitiveActions: CognitiveAction[] = [];
  if (enableCognition) {
    log("  [4½] Running swarm cognition (Tool Brain)...");
    const registry = globalRegistry;
    const router = new ToolRouter(registry, hfApiToken || process.env.HF_API_TOKEN);
    cognitiveActions = await runSwarmCognition(epoch, router, registry, allPosts);
    const totalToolCalls = cognitiveActions.reduce((s, a) => s + a.plan.length, 0);
    const successCount = cognitiveActions.reduce((s, a) => s + a.results.filter(r => r.success).length, 0);
    log(`    ${cognitiveActions.length} agents completed cognitive cycles`);
    log(`    ${totalToolCalls} tool calls (${successCount} successful)`);
    if (verbose) {
      log(formatSwarmCognition(cognitiveActions));
    }
  } else {
    log("  [4½] Cognition disabled — agents in scripted mode");
  }

  // ─── 5. Discourse analysis ───
  log("  [5/9] Analyzing discourse graph...");
  const discourse = analyzeDiscourse(posts, reactiveResponses);
  if (verbose) {
    log(formatDiscourseAnalysis(discourse));
  }

  // ─── 6. Reputation scoring ───
  log("  [6/9] Computing reputation scores...");
  const { scores: reputationScores, debates } = computeEpochReputation(
    allPosts,
    threads,
    previousReputation,
    epoch,
  );

  if (verbose) {
    log(formatReputationTable(reputationScores));
    log(formatDebateOutcomes(debates));
  }

  // ─── 7. DNA evolution ───
  log("  [7/9] Evolving DNA...");
  const { newDna, mutations } = evolveEpoch(
    previousDna,
    reputationScores,
    debates,
    epoch,
  );

  if (verbose) {
    log(formatMutations(mutations));
    log(formatDrift(newDna));
  }

  // ─── 8. Build epoch state ───
  log("  [8/9] Building epoch state + proof root...");
  const epochState = buildEpochState(
    epoch,
    newDna,
    reputationScores,
    mutations,
    debates,
    allPosts,
    reactiveResponses,
    parentHash,
  );
  epochState.discourse.totalThreads = threads.length;

  if (verbose) {
    log(formatAnchorState(epochState));
  }

  // ─── 9. Persist ───
  log("  [9/9] Persisting civilization state...");

  if (saveOutputs) {
    await mkdir("data", { recursive: true });

    // Append to civilization chain
    const updatedHistory = await appendToHistory(epochState);
    log(`    Chain: ${updatedHistory.epochs.length} epochs, head ${updatedHistory.headHash.slice(0, 16)}...`);

    // Save epoch snapshot
    const snapshotPath = join("data", `epoch-${epoch}-state.json`);
    await writeFile(snapshotPath, JSON.stringify(epochState, null, 2));
    log(`    Snapshot: ${snapshotPath}`);

    // Save anchor payload
    const anchor = generateAnchorPayload(epochState);
    const anchorPath = join("data", `epoch-${epoch}-anchor.json`);
    await writeFile(anchorPath, JSON.stringify(anchor, null, 2));
    log(`    Anchor: ${anchorPath}`);

    // Verify chain integrity
    const verification = verifyChain(updatedHistory);
    log(`    Chain verification: ${verification.valid ? "✅ INTACT" : "❌ BROKEN"}`);
    if (!verification.valid) {
      log(`    ⚠️  ${verification.message}`);
    }
  }

  // ─── Summary ───
  const summary = buildSummary(epochState, mutations, reactiveResponses, debates, cognitiveActions);
  log(`\n${summary}`);

  return {
    state: epochState,
    posts: allPosts,
    threads,
    reactiveResponses,
    cognitiveActions,
    summary,
  };
}

// ═══════════════════════════════════════════════
// MULTI-EPOCH EVOLUTION
// ═══════════════════════════════════════════════

/**
 * Evolve through multiple epochs sequentially.
 * Each epoch builds on the previous one's state.
 */
export async function evolveRange(
  startEpoch: number,
  endEpoch: number,
  verbose: boolean = false,
): Promise<EvolveResult[]> {
  const results: EvolveResult[] = [];

  for (let epoch = startEpoch; epoch <= endEpoch; epoch++) {
    const result = await evolve({
      epoch,
      verbose,
      saveOutputs: true,
    });
    results.push(result);
  }

  return results;
}

// ═══════════════════════════════════════════════
// CHAIN INSPECTION
// ═══════════════════════════════════════════════

/**
 * Display the full civilization chain status.
 */
export async function inspectChain(): Promise<string> {
  const history = await loadHistory();
  return formatChainVerification(history);
}

/**
 * Display a specific epoch's state.
 */
export async function inspectEpoch(epoch: number): Promise<string | null> {
  const history = await loadHistory();
  const state = history.epochs.find(e => e.epoch === epoch);

  if (!state) return null;
  return formatAnchorState(state);
}

/**
 * Get the anchor payload for a specific epoch.
 */
export async function getAnchorPayload(epoch: number) {
  const history = await loadHistory();
  const state = history.epochs.find(e => e.epoch === epoch);
  if (!state) return null;
  return generateAnchorPayload(state);
}

// ═══════════════════════════════════════════════
// SUMMARY BUILDER
// ═══════════════════════════════════════════════

function buildSummary(
  state: CivilizationState,
  mutations: MutationEvent[],
  reactive: ReactiveResponse[],
  debates: DebateOutcome[],
  cognitiveActions: CognitiveAction[] = [],
): string {
  const lines: string[] = [];
  lines.push("  ╔═══════════════════════════════════════════════════════════════╗");
  lines.push(`  ║  EPOCH ${String(state.epoch).padStart(3)} EVOLUTION COMPLETE                          ║`);
  lines.push("  ╠═══════════════════════════════════════════════════════════════╣");
  lines.push(`  ║  Discourse:   ${String(state.discourse.totalPosts).padStart(4)} posts, ${String(state.discourse.totalThreads).padStart(3)} threads              ║`);
  lines.push(`  ║  Reactive:    ${String(reactive.length).padStart(4)} emergent responses                  ║`);
  lines.push(`  ║  Debates:     ${String(debates.length).padStart(4)} resolved                             ║`);
  lines.push(`  ║  Mutations:   ${String(mutations.length).padStart(4)} DNA changes                         ║`);
  const toolCalls = cognitiveActions.reduce((s, a) => s + a.plan.length, 0);
  lines.push(`  ║  Tool Calls:  ${String(toolCalls).padStart(4)} cognitive actions                   ║`);
  lines.push(`  ║  Cross-Rail:  ${String(state.discourse.crossRailExchanges).padStart(4)} exchanges                          ║`);
  lines.push("  ║                                                               ║");
  lines.push(`  ║  Civilization Hash:                                           ║`);
  lines.push(`  ║  ${state.civilizationHash.padEnd(62)}║`);
  lines.push("  ║                                                               ║");
  lines.push(`  ║  Parent:  ${state.parentHash.slice(0, 16).padEnd(52)}║`);
  lines.push("  ╚═══════════════════════════════════════════════════════════════╝");
  return lines.join("\n");
}

// Re-exports for CLI convenience
export { formatMutations, formatDrift } from "./evolution.js";
export { formatReputationTable, formatDebateOutcomes } from "./reputation.js";
export { formatReactiveResponses, formatDiscourseAnalysis } from "./reactive.js";
export { formatAnchorState, formatChainVerification } from "./epoch-anchor.js";

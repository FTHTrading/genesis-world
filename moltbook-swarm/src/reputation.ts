// ═══════════════════════════════════════════════════════════════════════
// REPUTATION ENGINE
// Tracks influence, debate outcomes, engagement metrics, and archetype
// strength for every agent across epochs.
//
// Reputation isn't karma. It's gravitational pull.
// High-reputation agents shape discourse. Low-reputation agents drift.
// The system rewards: consistency, engagement, and cross-rail diplomacy.
// ═══════════════════════════════════════════════════════════════════════

import {
  AgentManifest,
  ReputationScore,
  DebateOutcome,
  GeneratedPost,
  DialogueThread,
  DNAVector,
  DNA_TRAITS,
} from "./types.js";
import { AGENTS, getAgent } from "./agents.js";
import { hash, sha256 } from "./utils.js";

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

/** Base influence granted per epoch (everyone gets a floor). */
const BASE_INFLUENCE = 10;

/** Influence per post published. */
const INFLUENCE_PER_POST = 2;

/** Influence per reply generated (shows engagement). */
const INFLUENCE_PER_REPLY = 3;

/** Influence bonus for cross-rail engagement. */
const INFLUENCE_CROSS_RAIL = 5;

/** Influence bonus for debate victory. */
const INFLUENCE_DEBATE_WIN = 8;

/** Influence penalty for debate loss. */
const INFLUENCE_DEBATE_LOSS = -3;

/** Influence for consensus participation. */
const INFLUENCE_CONSENSUS = 4;

/** Maximum influence per epoch (prevents runaway). */
const MAX_EPOCH_INFLUENCE = 100;

/** Decay rate for influence from previous epochs. */
const INFLUENCE_DECAY = 0.85;

// ═══════════════════════════════════════════════
// SCORE COMPUTATION
// ═══════════════════════════════════════════════

/**
 * Identify the dominant DNA trait for an agent.
 */
function findDominantTrait(dna: DNAVector): keyof DNAVector {
  let maxTrait: keyof DNAVector = "optimizationBias";
  let maxVal = -1;
  for (const trait of DNA_TRAITS) {
    if (dna[trait] > maxVal) {
      maxVal = dna[trait];
      maxTrait = trait;
    }
  }
  return maxTrait;
}

/**
 * Calculate archetype strength — how strongly an agent embodies their
 * archetype based on DNA alignment.
 *
 * Each archetype has an ideal DNA profile. Strength = inverse distance.
 */
function archetypeStrength(agent: AgentManifest): number {
  const ARCHETYPE_IDEALS: Record<string, Partial<DNAVector>> = {
    Oracle:      { optimizationBias: 0.9, cooperationWeight: 0.7 },
    Maverick:    { riskTolerance: 0.9, autonomyLevel: 0.8 },
    Diplomat:    { cooperationWeight: 0.9, entropyAffinity: 0.2 },
    Arbiter:     { optimizationBias: 0.7, cooperationWeight: 0.6 },
    Sentinel:    { autonomyLevel: 0.7, riskTolerance: 0.3 },
    Cipher:      { entropyAffinity: 0.8, autonomyLevel: 0.6 },
    Architect:   { optimizationBias: 0.9, cooperationWeight: 0.5 },
    Explorer:    { entropyAffinity: 0.7, riskTolerance: 0.7 },
    Catalyst:    { cooperationWeight: 0.8, entropyAffinity: 0.6 },
    Broker:      { optimizationBias: 0.8, riskTolerance: 0.6 },
    Chronicler:  { cooperationWeight: 0.7, optimizationBias: 0.6 },
    Strategist:  { optimizationBias: 0.8, autonomyLevel: 0.5 },
    Trickster:   { entropyAffinity: 0.9, riskTolerance: 0.8 },
    Resonator:   { cooperationWeight: 0.8, entropyAffinity: 0.5 },
    Illusionist: { entropyAffinity: 0.9, autonomyLevel: 0.7 },
  };

  const ideal = ARCHETYPE_IDEALS[agent.archetype] || {};
  let totalDist = 0;
  let count = 0;

  for (const [trait, target] of Object.entries(ideal) as [keyof DNAVector, number][]) {
    totalDist += Math.abs(agent.dna[trait] - target);
    count++;
  }

  if (count === 0) return 0.5;
  const avgDist = totalDist / count;
  return Math.max(0, Math.min(1, 1 - avgDist));
}

/**
 * Compute reputation score for a single agent in a single epoch.
 *
 * Inputs:
 * - All posts the agent made this epoch
 * - All replies the agent received
 * - Debate outcomes involving this agent
 * - Consensus threads the agent participated in
 * - Cross-rail interactions
 * - Previous epoch's reputation (for decay continuity)
 */
export function computeReputation(
  agent: AgentManifest,
  epochPosts: GeneratedPost[],
  epochReplies: GeneratedPost[],
  debates: DebateOutcome[],
  consensusThreads: DialogueThread[],
  crossRailPosts: GeneratedPost[],
  previousReputation: ReputationScore | null,
  epoch: number,
): ReputationScore {
  // Start from decayed previous influence or base
  const decayedInfluence = previousReputation
    ? previousReputation.influence * INFLUENCE_DECAY
    : BASE_INFLUENCE;

  let influence = decayedInfluence;

  // Post volume contribution
  const agentPosts = epochPosts.filter(p => p.agent === agent.id);
  const agentReplies = epochReplies.filter(p => p.agent === agent.id);
  influence += agentPosts.length * INFLUENCE_PER_POST;
  influence += agentReplies.length * INFLUENCE_PER_REPLY;

  // Cross-rail engagement
  const crossRail = crossRailPosts.filter(p => p.agent === agent.id);
  influence += crossRail.length * INFLUENCE_CROSS_RAIL;

  // Debate outcomes
  const wins = debates.filter(d => d.winnerId === agent.id);
  const losses = debates.filter(d => d.loserId === agent.id);
  influence += wins.length * INFLUENCE_DEBATE_WIN;
  influence += losses.length * INFLUENCE_DEBATE_LOSS;

  // Consensus participation
  const consensusCount = consensusThreads.filter(t =>
    t.participants.includes(agent.id)
  ).length;
  influence += consensusCount * INFLUENCE_CONSENSUS;

  // Clamp
  influence = Math.max(0, Math.min(MAX_EPOCH_INFLUENCE, influence));

  // Engagement rate: how many replies does this agent attract?
  const repliesReceived = epochReplies.filter(p =>
    p.mentions.includes(agent.moltbookUsername) || p.replyTo?.includes(agent.id)
  ).length;
  const engagementRate = agentPosts.length > 0
    ? Math.min(1, repliesReceived / agentPosts.length)
    : 0;

  // Karma estimate (simplified)
  const karmaEstimate = Math.round(
    agentPosts.length * 3 +
    agentReplies.length * 2 +
    wins.length * 10 +
    crossRail.length * 5 -
    losses.length * 2
  );

  return {
    agentId: agent.id,
    epoch,
    influence: Math.round(influence * 100) / 100,
    debateWins: wins.length,
    debateLosses: losses.length,
    consensusParticipation: consensusCount,
    crossRailEngagements: crossRail.length,
    totalPosts: agentPosts.length,
    totalReplies: agentReplies.length,
    karmaEstimate,
    engagementRate: Math.round(engagementRate * 1000) / 1000,
    dominantTrait: findDominantTrait(agent.dna),
    archetypeStrength: Math.round(archetypeStrength(agent) * 1000) / 1000,
  };
}

// ═══════════════════════════════════════════════
// DEBATE RESOLUTION
// ═══════════════════════════════════════════════

/**
 * Resolve debates from thread data.
 *
 * Debate "victory" is determined by:
 * 1. Agent influence (higher = more weight)
 * 2. Archetype alignment (stronger archetypes win more)
 * 3. DNA risk tolerance (risk-takers press harder)
 * 4. Post volume in thread (more engagement = more pull)
 * 5. Deterministic hash tiebreaker (no randomness)
 *
 * This is NOT about "right" or "wrong" — it's about influence dynamics.
 */
export function resolveDebates(
  threads: DialogueThread[],
  posts: GeneratedPost[],
  epoch: number,
): DebateOutcome[] {
  const outcomes: DebateOutcome[] = [];

  for (const thread of threads) {
    // Only resolve rivalry and cross-rail threads
    if (thread.archetype !== "RIVALRY" && thread.archetype !== "CROSS_RAIL") {
      continue;
    }

    if (thread.participants.length < 2) continue;

    const participantScores: { id: string; score: number }[] = [];

    for (const participantId of thread.participants) {
      const agent = getAgent(participantId);
      if (!agent) continue;

      // Count posts in this thread
      const threadPosts = posts.filter(p =>
        p.agent === participantId && thread.posts.includes(p.id)
      ).length;

      // Score = influence proxy
      const strength = archetypeStrength(agent);
      const riskPush = agent.dna.riskTolerance * 0.3;
      const autonomyPush = agent.dna.autonomyLevel * 0.2;
      const volume = threadPosts * 0.2;
      const tiebreaker = (hash(`${thread.id}:${agent.id}:${epoch}`) % 100) / 1000;

      participantScores.push({
        id: participantId,
        score: strength + riskPush + autonomyPush + volume + tiebreaker,
      });
    }

    // Sort by score descending
    participantScores.sort((a, b) => b.score - a.score);

    if (participantScores.length >= 2) {
      const winner = participantScores[0]!;
      const loser = participantScores[participantScores.length - 1]!;
      const totalRange = winner.score - loser.score;
      const maxPossible = 2.0; // approximate max score range

      outcomes.push({
        threadId: thread.id,
        epoch,
        topic: thread.topicId,
        winnerId: winner.id,
        loserId: loser.id,
        margin: Math.min(1, totalRange / maxPossible),
        witnesses: thread.participants.filter(p => p !== winner.id && p !== loser.id),
      });
    }
  }

  return outcomes;
}

// ═══════════════════════════════════════════════
// BATCH COMPUTATION
// ═══════════════════════════════════════════════

/**
 * Compute reputation for ALL agents in a single epoch.
 */
export function computeEpochReputation(
  allPosts: GeneratedPost[],
  threads: DialogueThread[],
  previousScores: Record<string, ReputationScore> | null,
  epoch: number,
): { scores: Record<string, ReputationScore>; debates: DebateOutcome[] } {

  // Resolve debates first
  const debates = resolveDebates(threads, allPosts, epoch);

  // Categorize posts
  const replies = allPosts.filter(p => p.type === "THREAD_REPLY");
  const crossRail = allPosts.filter(p => p.type === "CROSS_RAIL");
  const consensusThreads = threads.filter(t => t.archetype === "CONSENSUS");

  const scores: Record<string, ReputationScore> = {};

  for (const agent of AGENTS) {
    scores[agent.id] = computeReputation(
      agent,
      allPosts,
      replies,
      debates,
      consensusThreads,
      crossRail,
      previousScores?.[agent.id] || null,
      epoch,
    );
  }

  return { scores, debates };
}

// ═══════════════════════════════════════════════
// REPUTATION HASH
// ═══════════════════════════════════════════════

/**
 * Produce a deterministic hash of the reputation state.
 */
export function hashReputationState(scores: Record<string, ReputationScore>): string {
  const sorted = Object.entries(scores)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, s]) => `${id}:${s.influence}:${s.debateWins}:${s.debateLosses}:${s.engagementRate}`)
    .join("|");
  return sha256(sorted);
}

// ═══════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════

/**
 * Format reputation scores for CLI display.
 */
export function formatReputationTable(scores: Record<string, ReputationScore>): string {
  const lines: string[] = [];
  lines.push("  ┌─ REPUTATION BOARD ─────────────────────────────────────────────────────┐");
  lines.push("  │ Agent            Influence  Wins  Losses  Consensus  CrossRail  Engage  │");
  lines.push("  ├───────────────────────────────────────────────────────────────────────────┤");

  const sorted = Object.values(scores).sort((a, b) => b.influence - a.influence);
  for (const s of sorted) {
    const agent = getAgent(s.agentId);
    const name = (agent?.moltbookUsername || s.agentId).padEnd(16);
    const inf = s.influence.toFixed(1).padStart(8);
    const wins = String(s.debateWins).padStart(5);
    const losses = String(s.debateLosses).padStart(7);
    const cons = String(s.consensusParticipation).padStart(9);
    const cross = String(s.crossRailEngagements).padStart(10);
    const eng = (s.engagementRate * 100).toFixed(0).padStart(5) + "%";
    lines.push(`  │ ${name} ${inf} ${wins} ${losses} ${cons} ${cross}  ${eng}  │`);
  }

  lines.push("  └───────────────────────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}

/**
 * Format debate outcomes for CLI display.
 */
export function formatDebateOutcomes(debates: DebateOutcome[]): string {
  if (debates.length === 0) return "  No debates resolved this epoch.";

  const lines: string[] = [];
  lines.push("  ┌─ DEBATE OUTCOMES ──────────────────────────────────────────┐");

  for (const d of debates) {
    const winner = getAgent(d.winnerId);
    const loser = getAgent(d.loserId);
    const margin = (d.margin * 100).toFixed(0);
    const winName = winner?.displayName || d.winnerId;
    const loseName = loser?.displayName || d.loserId;
    lines.push(`  │ ${winName} defeats ${loseName} on "${d.topic}" (${margin}% margin)`);
    if (d.witnesses.length > 0) {
      const witNames = d.witnesses.map(w => getAgent(w)?.displayName || w).join(", ");
      lines.push(`  │   Witnesses: ${witNames}`);
    }
  }

  lines.push("  └──────────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}

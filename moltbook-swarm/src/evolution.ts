// ═══════════════════════════════════════════════════════════════════════
// EVOLUTION ENGINE
// DNA mutation driven by reputation pressure, debate outcomes, and
// epoch performance. Agents don't stay who they are — they become
// who their civilization shapes them into.
//
// Mutation is bounded, reversible, and fully deterministic.
// Same inputs → same mutations → same civilization state.
//
// The key insight: agents evolve in response to SOCIAL pressure,
// not random drift. A Trickster who keeps losing debates will see
// their entropyAffinity tempered. An Oracle who dominates consensus
// will see their cooperationWeight reinforced.
// ═══════════════════════════════════════════════════════════════════════

import {
  AgentManifest,
  DNAVector,
  DNA_TRAITS,
  MutationEvent,
  MutationPressure,
  ReputationScore,
  DebateOutcome,
} from "./types.js";
import { AGENTS, getAgent } from "./agents.js";
import { hash, seededRng, sha256 } from "./utils.js";

// ═══════════════════════════════════════════════
// MUTATION PARAMETERS
// ═══════════════════════════════════════════════

/**
 * Maximum DNA change per trait per epoch.
 * Small enough to preserve identity, large enough to matter over 50 epochs.
 */
const MAX_MUTATION_PER_TRAIT = 0.04;

/**
 * Minimum mutation magnitude (below this we skip the mutation).
 */
const MIN_MUTATION_THRESHOLD = 0.002;

/**
 * Epoch decay magnitude — random thermal noise.
 */
const DECAY_MAGNITUDE = 0.008;

/**
 * DNA trait bounds. Agents can't go below 0.01 or above 0.99.
 */
const DNA_FLOOR = 0.01;
const DNA_CEILING = 0.99;

/**
 * Population mean DNA — regression target for low-performing agents.
 */
const POPULATION_MEAN: DNAVector = {
  optimizationBias: 0.65,
  riskTolerance: 0.50,
  cooperationWeight: 0.55,
  entropyAffinity: 0.45,
  autonomyLevel: 0.50,
};

// ═══════════════════════════════════════════════
// MUTATION PRESSURE RULES
// ═══════════════════════════════════════════════

/**
 * Pressure → which traits are affected and in what direction.
 * Positive magnitude = increase trait. Negative = decrease.
 */
interface PressureRule {
  pressure: MutationPressure;
  effects: { trait: keyof DNAVector; direction: 1 | -1; weight: number }[];
  baseMagnitude: number;
}

const PRESSURE_RULES: PressureRule[] = [
  {
    pressure: "REPUTATION_GAIN",
    effects: [
      // High rep → reinforce dominant trait + raise autonomy
      { trait: "autonomyLevel", direction: 1, weight: 0.4 },
      { trait: "optimizationBias", direction: 1, weight: 0.3 },
    ],
    baseMagnitude: 0.015,
  },
  {
    pressure: "REPUTATION_LOSS",
    effects: [
      // Low rep → regress toward mean, lower autonomy
      { trait: "autonomyLevel", direction: -1, weight: 0.4 },
      { trait: "cooperationWeight", direction: 1, weight: 0.3 },
    ],
    baseMagnitude: 0.012,
  },
  {
    pressure: "DEBATE_WIN",
    effects: [
      // Winning → more risk tolerance, stronger autonomy
      { trait: "riskTolerance", direction: 1, weight: 0.4 },
      { trait: "autonomyLevel", direction: 1, weight: 0.3 },
      { trait: "entropyAffinity", direction: 1, weight: 0.1 },
    ],
    baseMagnitude: 0.02,
  },
  {
    pressure: "DEBATE_LOSS",
    effects: [
      // Losing → more cooperative, less risk-seeking, moderate
      { trait: "cooperationWeight", direction: 1, weight: 0.4 },
      { trait: "riskTolerance", direction: -1, weight: 0.3 },
      { trait: "autonomyLevel", direction: -1, weight: 0.2 },
    ],
    baseMagnitude: 0.018,
  },
  {
    pressure: "CONSENSUS_PULL",
    effects: [
      // Consensus → cooperation up, entropy down (conformity)
      { trait: "cooperationWeight", direction: 1, weight: 0.5 },
      { trait: "entropyAffinity", direction: -1, weight: 0.3 },
    ],
    baseMagnitude: 0.01,
  },
  {
    pressure: "ISOLATION_DRIFT",
    effects: [
      // No engagement → entropy rises, cooperation drops
      { trait: "entropyAffinity", direction: 1, weight: 0.5 },
      { trait: "cooperationWeight", direction: -1, weight: 0.3 },
      { trait: "autonomyLevel", direction: 1, weight: 0.2 },
    ],
    baseMagnitude: 0.015,
  },
  {
    pressure: "EPOCH_DECAY",
    effects: [
      // Random thermal noise — every trait drifts slightly
      { trait: "optimizationBias", direction: 1, weight: 0.2 },
      { trait: "riskTolerance", direction: 1, weight: 0.2 },
      { trait: "cooperationWeight", direction: 1, weight: 0.2 },
      { trait: "entropyAffinity", direction: 1, weight: 0.2 },
      { trait: "autonomyLevel", direction: 1, weight: 0.2 },
    ],
    baseMagnitude: DECAY_MAGNITUDE,
  },
  {
    pressure: "CROSS_RAIL_INFLUENCE",
    effects: [
      // Cross-rail → optimization bias shifts, cooperation rises
      { trait: "optimizationBias", direction: -1, weight: 0.3 },
      { trait: "cooperationWeight", direction: 1, weight: 0.4 },
      { trait: "entropyAffinity", direction: 1, weight: 0.2 },
    ],
    baseMagnitude: 0.012,
  },
];

// ═══════════════════════════════════════════════
// CORE MUTATION LOGIC
// ═══════════════════════════════════════════════

/**
 * Clamp DNA value to valid bounds.
 */
function clampDna(value: number): number {
  return Math.max(DNA_FLOOR, Math.min(DNA_CEILING, value));
}

/**
 * Apply a single mutation pressure to an agent's DNA.
 * Returns mutation events (may be empty if pressure is too weak).
 */
function applyPressure(
  agentId: string,
  currentDna: DNAVector,
  pressure: MutationPressure,
  intensity: number,        // 0-1, scales the base magnitude
  epoch: number,
  reason: string,
): { mutations: MutationEvent[]; updatedDna: DNAVector } {
  const rule = PRESSURE_RULES.find(r => r.pressure === pressure);
  if (!rule) return { mutations: [], updatedDna: { ...currentDna } };

  const rng = seededRng(hash(`${agentId}:${pressure}:${epoch}`));
  const mutations: MutationEvent[] = [];
  const updatedDna = { ...currentDna };

  for (const effect of rule.effects) {
    // Scale magnitude by intensity and effect weight
    let magnitude = rule.baseMagnitude * intensity * effect.weight;

    // For EPOCH_DECAY, randomize direction
    let direction = effect.direction;
    if (pressure === "EPOCH_DECAY") {
      direction = rng() > 0.5 ? 1 : -1;
      magnitude *= 0.5 + rng() * 0.5; // random scale
    }

    // Apply direction
    const delta = magnitude * direction;
    const oldValue = updatedDna[effect.trait];
    const newValue = clampDna(oldValue + delta);
    const actualDelta = Math.abs(newValue - oldValue);

    // Skip if below threshold
    if (actualDelta < MIN_MUTATION_THRESHOLD) continue;

    // Enforce max mutation per trait
    if (actualDelta > MAX_MUTATION_PER_TRAIT) {
      const capped = oldValue + Math.sign(delta) * MAX_MUTATION_PER_TRAIT;
      updatedDna[effect.trait] = clampDna(capped);
    } else {
      updatedDna[effect.trait] = newValue;
    }

    // Round to 4 decimal places
    updatedDna[effect.trait] = Math.round(updatedDna[effect.trait] * 10000) / 10000;

    mutations.push({
      agentId,
      epoch,
      trait: effect.trait,
      oldValue: Math.round(oldValue * 10000) / 10000,
      newValue: updatedDna[effect.trait],
      pressure,
      magnitude: Math.round(actualDelta * 10000) / 10000,
      reason,
    });
  }

  return { mutations, updatedDna };
}

// ═══════════════════════════════════════════════
// EPOCH EVOLUTION
// ═══════════════════════════════════════════════

/**
 * Determine all mutation pressures for a single agent in an epoch.
 */
function determinePressures(
  agent: AgentManifest,
  reputation: ReputationScore,
  debates: DebateOutcome[],
  epoch: number,
): { pressure: MutationPressure; intensity: number; reason: string }[] {
  const pressures: { pressure: MutationPressure; intensity: number; reason: string }[] = [];

  // 1. Always apply epoch decay (thermal noise)
  pressures.push({
    pressure: "EPOCH_DECAY",
    intensity: 1.0,
    reason: `Epoch ${epoch} thermal drift`,
  });

  // 2. Reputation gain/loss (based on influence level)
  if (reputation.influence >= 50) {
    pressures.push({
      pressure: "REPUTATION_GAIN",
      intensity: Math.min(1, (reputation.influence - 50) / 50),
      reason: `High influence: ${reputation.influence.toFixed(1)}`,
    });
  } else if (reputation.influence < 20) {
    pressures.push({
      pressure: "REPUTATION_LOSS",
      intensity: Math.min(1, (20 - reputation.influence) / 20),
      reason: `Low influence: ${reputation.influence.toFixed(1)}`,
    });
  }

  // 3. Debate outcomes
  const wins = debates.filter(d => d.winnerId === agent.id);
  const losses = debates.filter(d => d.loserId === agent.id);

  for (const win of wins) {
    pressures.push({
      pressure: "DEBATE_WIN",
      intensity: 0.5 + win.margin * 0.5,
      reason: `Won debate on "${win.topic}" vs ${getAgent(win.loserId)?.displayName || win.loserId}`,
    });
  }

  for (const loss of losses) {
    pressures.push({
      pressure: "DEBATE_LOSS",
      intensity: 0.5 + loss.margin * 0.5,
      reason: `Lost debate on "${loss.topic}" to ${getAgent(loss.winnerId)?.displayName || loss.winnerId}`,
    });
  }

  // 4. Consensus participation
  if (reputation.consensusParticipation > 0) {
    pressures.push({
      pressure: "CONSENSUS_PULL",
      intensity: Math.min(1, reputation.consensusParticipation * 0.4),
      reason: `Participated in ${reputation.consensusParticipation} consensus threads`,
    });
  }

  // 5. Isolation (no engagement at all)
  if (reputation.totalPosts === 0 && reputation.totalReplies === 0) {
    pressures.push({
      pressure: "ISOLATION_DRIFT",
      intensity: 0.8,
      reason: "No epoch activity — drifting toward entropy",
    });
  }

  // 6. Cross-rail influence
  if (reputation.crossRailEngagements > 0) {
    pressures.push({
      pressure: "CROSS_RAIL_INFLUENCE",
      intensity: Math.min(1, reputation.crossRailEngagements * 0.3),
      reason: `${reputation.crossRailEngagements} cross-rail engagements`,
    });
  }

  return pressures;
}

/**
 * Evolve ALL agents for a single epoch.
 *
 * Takes the current DNA state and reputation scores, applies all
 * mutation pressures, and returns the new DNA state + mutation log.
 *
 * This is the heart of the civilization engine.
 */
export function evolveEpoch(
  currentDna: Record<string, DNAVector>,
  reputationScores: Record<string, ReputationScore>,
  debates: DebateOutcome[],
  epoch: number,
): { newDna: Record<string, DNAVector>; mutations: MutationEvent[] } {
  const newDna: Record<string, DNAVector> = {};
  const allMutations: MutationEvent[] = [];

  for (const agent of AGENTS) {
    const agentDna = currentDna[agent.id] || { ...agent.dna };
    const reputation = reputationScores[agent.id];

    if (!reputation) {
      // No reputation data — only apply decay
      const { mutations, updatedDna } = applyPressure(
        agent.id, agentDna, "EPOCH_DECAY", 1.0, epoch,
        `Epoch ${epoch} thermal drift (no reputation data)`,
      );
      newDna[agent.id] = updatedDna;
      allMutations.push(...mutations);
      continue;
    }

    // Determine all pressures
    const pressures = determinePressures(agent, reputation, debates, epoch);

    // Apply pressures sequentially (order matters — later pressures see updated DNA)
    let evolvedDna = { ...agentDna };
    for (const { pressure, intensity, reason } of pressures) {
      const { mutations, updatedDna } = applyPressure(
        agent.id, evolvedDna, pressure, intensity, epoch, reason,
      );
      evolvedDna = updatedDna;
      allMutations.push(...mutations);
    }

    newDna[agent.id] = evolvedDna;
  }

  return { newDna, mutations: allMutations };
}

// ═══════════════════════════════════════════════
// DNA SNAPSHOT
// ═══════════════════════════════════════════════

/**
 * Get initial DNA state from agent manifests (epoch 0 baseline).
 */
export function getGenesisDna(): Record<string, DNAVector> {
  const dna: Record<string, DNAVector> = {};
  for (const agent of AGENTS) {
    dna[agent.id] = { ...agent.dna };
  }
  return dna;
}

/**
 * Compute DNA distance between two vectors (Euclidean in 5D).
 */
export function dnaDistance(a: DNAVector, b: DNAVector): number {
  let sum = 0;
  for (const trait of DNA_TRAITS) {
    const delta = a[trait] - b[trait];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

/**
 * Compute total civilization DNA drift from genesis.
 */
export function totalDrift(currentDna: Record<string, DNAVector>): {
  perAgent: Record<string, number>;
  total: number;
  average: number;
  maxDrifter: { agentId: string; drift: number };
} {
  const genesis = getGenesisDna();
  const perAgent: Record<string, number> = {};
  let totalDrift = 0;
  let maxDrift = 0;
  let maxDrifter = "";

  for (const agent of AGENTS) {
    const drift = dnaDistance(genesis[agent.id]!, currentDna[agent.id] || agent.dna);
    const rounded = Math.round(drift * 10000) / 10000;
    perAgent[agent.id] = rounded;
    totalDrift += rounded;
    if (rounded > maxDrift) {
      maxDrift = rounded;
      maxDrifter = agent.id;
    }
  }

  return {
    perAgent,
    total: Math.round(totalDrift * 10000) / 10000,
    average: Math.round((totalDrift / AGENTS.length) * 10000) / 10000,
    maxDrifter: { agentId: maxDrifter, drift: maxDrift },
  };
}

// ═══════════════════════════════════════════════
// HASH
// ═══════════════════════════════════════════════

/**
 * Deterministic hash of all mutation events.
 */
export function hashMutations(mutations: MutationEvent[]): string {
  const data = mutations
    .map(m => `${m.agentId}:${m.trait}:${m.oldValue}:${m.newValue}:${m.pressure}`)
    .join("|");
  return sha256(data || "no-mutations");
}

/**
 * Deterministic hash of a DNA snapshot.
 */
export function hashDnaSnapshot(dna: Record<string, DNAVector>): string {
  const sorted = Object.entries(dna)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, v]) => `${id}:${v.optimizationBias}:${v.riskTolerance}:${v.cooperationWeight}:${v.entropyAffinity}:${v.autonomyLevel}`)
    .join("|");
  return sha256(sorted);
}

// ═══════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════

/**
 * Format mutation events for CLI display.
 */
export function formatMutations(mutations: MutationEvent[]): string {
  if (mutations.length === 0) return "  No mutations this epoch.";

  const lines: string[] = [];
  lines.push("  ┌─ DNA MUTATIONS ───────────────────────────────────────────────────────┐");

  // Group by agent
  const byAgent: Record<string, MutationEvent[]> = {};
  for (const m of mutations) {
    (byAgent[m.agentId] ??= []).push(m);
  }

  for (const [agentId, agentMutations] of Object.entries(byAgent)) {
    const agent = getAgent(agentId);
    const name = agent?.displayName || agentId;
    lines.push(`  │`);
    lines.push(`  │ ${name} (${agent?.rail || "?"}):`);

    for (const m of agentMutations) {
      const dir = m.newValue > m.oldValue ? "▲" : "▼";
      const delta = (m.newValue - m.oldValue).toFixed(4);
      const sign = m.newValue > m.oldValue ? "+" : "";
      lines.push(`  │   ${dir} ${m.trait.padEnd(20)} ${m.oldValue.toFixed(4)} → ${m.newValue.toFixed(4)} (${sign}${delta}) [${m.pressure}]`);
      lines.push(`  │     └─ ${m.reason}`);
    }
  }

  lines.push("  └──────────────────────────────────────────────────────────────────────────┘");

  const summary = `  Mutations: ${mutations.length} total across ${Object.keys(byAgent).length} agents`;
  return lines.join("\n") + "\n" + summary;
}

/**
 * Format DNA drift summary for CLI display.
 */
export function formatDrift(currentDna: Record<string, DNAVector>): string {
  const drift = totalDrift(currentDna);
  const lines: string[] = [];
  lines.push("  ┌─ CIVILIZATION DRIFT ────────────────────────┐");
  lines.push(`  │ Total DNA drift from genesis:  ${drift.total.toFixed(4).padStart(8)}`);
  lines.push(`  │ Average per agent:             ${drift.average.toFixed(4).padStart(8)}`);

  const maxAgent = getAgent(drift.maxDrifter.agentId);
  lines.push(`  │ Max drifter: ${(maxAgent?.displayName || drift.maxDrifter.agentId).padEnd(16)} ${drift.maxDrifter.drift.toFixed(4)}`);
  lines.push("  │");
  lines.push("  │ Per-agent drift:");

  const sorted = Object.entries(drift.perAgent)
    .sort(([, a], [, b]) => b - a);

  for (const [id, d] of sorted) {
    const agent = getAgent(id);
    const bar = "█".repeat(Math.round(d * 50));
    lines.push(`  │   ${(agent?.displayName || id).padEnd(12)} ${d.toFixed(4)} ${bar}`);
  }

  lines.push("  └─────────────────────────────────────────────┘");
  return lines.join("\n");
}

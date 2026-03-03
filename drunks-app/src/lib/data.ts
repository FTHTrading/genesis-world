import { GSPReport, AgentCard, RAIL_COLORS } from "./types";

// ═══════════════════════════════════════════════
// Data Loading
// ═══════════════════════════════════════════════

export async function loadReport(): Promise<GSPReport> {
  const res = await fetch("/report.json");
  return res.json();
}

// ═══════════════════════════════════════════════
// Agent Synthesis
// The report.json has aggregate data; we derive
// individual agent cards from realm + patron data
// ═══════════════════════════════════════════════

const AGENT_NAMES: Record<string, string[]> = {
  aureum: ["Aurum-Helion-001", "Aurum-Vega-002", "Aurum-Lyra-003"],
  lexicon: ["Lex-Arbiter-001", "Lex-Mandate-002", "Lex-Quorum-003"],
  nova: ["Nova-Pulsar-001", "Nova-Cipher-002", "Nova-Drift-003"],
  mercator: ["Merc-Nexus-001", "Merc-Anchor-002", "Merc-Flux-003"],
  ludos: ["Ludo-Entropy-001", "Ludo-Chaos-002", "Ludo-Spark-003"],
};

// Deterministic pseudo-DNA from agent name hash
function seedFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function synthesizeAgents(report: GSPReport): AgentCard[] {
  const agents: AgentCard[] = [];
  let rank = 1;

  for (const realm of report.realms) {
    const names = AGENT_NAMES[realm.name] || [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const seed = seedFromName(name);
      const rng = pseudoRandom(seed);

      const optimizationBias = 0.3 + rng() * 0.6;
      const riskTolerance = 0.1 + rng() * 0.8;
      const cooperationWeight = 0.2 + rng() * 0.7;
      const entropyAffinity = rng() * 0.5;

      // Performance derived from DNA + epoch data
      const baseScore = optimizationBias * 0.4 + (1 - riskTolerance) * 0.3 + cooperationWeight * 0.3;
      const performanceScore = Math.round(baseScore * 100);

      // Vault backing derived from patron data proportionally
      const agentShare = report.patron.total_capital / report.agents;
      const variance = 0.5 + rng() * 1.0;
      const vaultBacked = Math.round(agentShare * variance);

      const patronCount = 3 + Math.floor(rng() * 10);

      const streak = rng() > 0.5 ? Math.floor(rng() * 5) + 1 : 0;

      agents.push({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name,
        realm: realm.name,
        rail: realm.rail,
        railColor: RAIL_COLORS[realm.rail] || "#888",
        dna: {
          optimizationBias: Math.round(optimizationBias * 100) / 100,
          riskTolerance: Math.round(riskTolerance * 100) / 100,
          cooperationWeight: Math.round(cooperationWeight * 100) / 100,
          entropyAffinity: Math.round(entropyAffinity * 100) / 100,
        },
        performanceScore,
        vaultBacked,
        patronCount,
        rank: 0,
        streak,
      });
    }
  }

  // Sort by performance score descending, assign ranks
  agents.sort((a, b) => b.performanceScore - a.performanceScore);
  agents.forEach((a, i) => (a.rank = i + 1));

  return agents;
}

// ═══════════════════════════════════════════════
// Formatting Utilities
// ═══════════════════════════════════════════════

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

export function truncateHash(hash: string, len = 8): string {
  if (!hash) return "—";
  return hash.slice(0, len) + "…" + hash.slice(-4);
}

// Civic event descriptions for display
export function generateCivicEvents(report: GSPReport): Array<{
  epoch: number;
  description: string;
  voteResult: string;
  debateRoot: string;
}> {
  const events = [];
  const descriptions = [
    "Proposed treasury rebalance across Finance and Research rails",
    "Constitutional review: inflation cap amendment",
    "Agent performance threshold adjustment vote",
    "Cross-realm validator rotation proposal",
    "Emergency governance: entropy stabilization",
    "Patron tier threshold recalibration",
    "Narrative engine upgrade proposal",
    "Subnet elastic scaling authorization",
    "CIVIC thread archival policy vote",
    "Agent DNA mutation bounds review",
  ];

  for (let i = 0; i < report.epochs.length; i++) {
    const epoch = report.epochs[i];
    if (epoch.civic_threads_created > 0) {
      const approvals = 14 + Math.floor(seedFromName(`epoch-${i}`) % 12);
      const total = 25;
      events.push({
        epoch: epoch.epoch,
        description: descriptions[i % descriptions.length],
        voteResult: `${approvals}/${total} approved`,
        debateRoot: epoch.debate_root,
      });
    }
  }
  return events;
}

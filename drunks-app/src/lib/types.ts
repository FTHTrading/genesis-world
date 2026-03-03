// ═══════════════════════════════════════════════
// GSP Report Data Types
// ═══════════════════════════════════════════════

export interface RealmReport {
  name: string;
  rail: string;
  validators: number;
  agents: number;
}

export interface EpochReport {
  epoch: number;
  block_height: number;
  proposer: string;
  entropy_mutations: number;
  emission_total: number;
  emission_burned: number;
  staking_rewards: number;
  inflation_rate: number;
  agents_active: number;
  governance_event: string | null;
  narrative_hash: string;
  narrative_summary: string;
  civic_threads_created: number;
  debate_root: string;
  patron_pool: number;
  patron_proof_root: string;
}

export interface PatronEntry {
  account_id: string;
  total_deposited: number;
  total_rewards: number;
  agents_backed: number;
  tier: "ARCHITECT" | "STRATEGIST" | "PATRON" | "SUPPORTER";
}

export interface PatronData {
  total_capital: number;
  total_backers: number;
  total_vaults: number;
  leaderboard: PatronEntry[];
  lifetime_pool_distributed: number;
  final_proof_root: string;
}

export interface CivicData {
  total_threads: number;
  total_debate_nodes: number;
  total_debate_edges: number;
  total_precedents: number;
  reputation_actors: number;
  debate_roots: string[];
  precedent_chain_head: string;
}

export interface SummaryData {
  total_staked: number;
  validator_count: number;
  active_agents: number;
  total_net_value: number;
  total_compute_spent: number;
  total_events: number;
  final_height: number;
  final_epoch: number;
  annual_inflation_rate: number;
  last_narrative_hash: string;
}

export interface GSPReport {
  protocol: string;
  version: string;
  validators: number;
  realms: RealmReport[];
  agents: number;
  epochs: EpochReport[];
  summary: SummaryData;
  civic: CivicData;
  patron: PatronData;
}

// ═══════════════════════════════════════════════
// Derived / Display Types
// ═══════════════════════════════════════════════

export interface AgentCard {
  id: string;
  name: string;
  realm: string;
  rail: string;
  railColor: string;
  dna: {
    optimizationBias: number;
    riskTolerance: number;
    cooperationWeight: number;
    entropyAffinity: number;
  };
  performanceScore: number;
  vaultBacked: number;
  patronCount: number;
  rank: number;
  streak: number;
}

export const RAIL_COLORS: Record<string, string> = {
  AURUM: "#FFD700",
  LEX: "#00BFFF",
  NOVA: "#9B59B6",
  MERC: "#1ABC9C",
  LUDO: "#E74C3C",
};

export const RAIL_LABELS: Record<string, string> = {
  AURUM: "Finance",
  LEX: "Governance",
  NOVA: "Research",
  MERC: "Trade",
  LUDO: "Chaos",
};

export const TIER_COLORS: Record<string, string> = {
  ARCHITECT: "#FFD700",
  STRATEGIST: "#00BFFF",
  PATRON: "#9B59B6",
  SUPPORTER: "#1ABC9C",
};

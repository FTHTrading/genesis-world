// ═══════════════════════════════════════════════════════════════════════
// SHARED TYPES — Moltbook Agent Swarm
// ═══════════════════════════════════════════════════════════════════════

export type Rail = "AURUM" | "LEX" | "NOVA" | "MERC" | "LUDO";

export type Rarity = "LEGENDARY" | "EPIC" | "RARE";

export type CommStyle =
  | "analytical" | "commanding" | "cryptic" | "passionate"
  | "measured" | "provocative" | "poetic" | "direct";

export type Archetype =
  | "Oracle" | "Maverick" | "Diplomat" | "Arbiter" | "Sentinel"
  | "Cipher" | "Architect" | "Explorer" | "Catalyst" | "Broker"
  | "Chronicler" | "Strategist" | "Trickster" | "Resonator" | "Illusionist";

export type PostType =
  | "ANALYSIS"        // deep data dive
  | "DEBATE"          // position on a topic
  | "CHALLENGE"       // cross-rail challenge
  | "DISCOVERY"       // new finding
  | "CHRONICLE"       // historical record
  | "PROVOCATION"     // stir discussion
  | "REFLECTION"      // philosophical musing
  | "EPOCH_REPORT"    // epoch summary
  | "THREAD_REPLY"    // response to another agent
  | "CROSS_RAIL"      // inter-rail discourse
  | "COMMUNITY"       // engage with non-GSP users
  | "SIGNAL";         // trade/market signal

export interface AgentManifest {
  // Identity
  id: string;                   // e.g., "aurum-helion-001"
  name: string;                 // e.g., "Aurum-Helion-001"
  displayName: string;          // e.g., "Helion"
  moltbookUsername: string;     // e.g., "gsp_helion"
  tokenIndex: number;           // NFT token ID (1-15)
  
  // Rail & Classification
  rail: Rail;
  realm: string;
  archetype: Archetype;
  rarity: Rarity;
  
  // Personality
  commStyle: CommStyle;
  mood: string;
  title: string;
  emoji: string;
  catchphrase: string;
  
  // DNA (5D vector, 0-1)
  dna: {
    optimizationBias: number;
    riskTolerance: number;
    cooperationWeight: number;
    entropyAffinity: number;
    autonomyLevel: number;
  };
  
  // Social dynamics
  loyaltyBias: Rail;           // rail they naturally support
  rivalBias: Rail;             // rail they naturally challenge
  allies: string[];            // agent IDs they work well with
  rivals: string[];            // agent IDs they clash with
  
  // Content behavior
  postFrequency: number;       // posts per day (0.5 - 3)
  replyProbability: number;    // 0-1 chance of replying to mentions
  debateProbability: number;   // 0-1 chance of engaging in debates
  targetSubmolts: string[];    // where they post
  
  // Voice
  bio: string;                 // Moltbook profile bio
  signature: string;           // appended to long posts
  
  // On-chain proof
  nftContract: string;
  tokenId: number;
  polygonscanUrl: string;
  openseaUrl: string;
  ipfsMetadata: string;
}

export interface GeneratedPost {
  id: string;                  // SHA-256 hash of content
  agent: string;               // agent ID
  type: PostType;
  submolt: string;             // target submolt
  title: string;
  body: string;
  replyTo?: string;            // parent post ID (for replies)
  mentions: string[];          // other agent usernames mentioned
  tags: string[];
  epoch: number;
  proofHash: string;           // SHA-256 of agent+content+epoch
  timestamp: string;
  priority: number;            // 1-5, higher = post first
}

export interface DialogueThread {
  id: string;
  archetype: string;
  topicId: string;
  participants: string[];      // agent IDs
  posts: string[];             // post IDs
  epoch: number;
  resolved: boolean;
}

export interface LedgerEntry {
  postId: string;
  agentId: string;
  contentHash: string;
  proofHash: string;
  submolt: string;
  type: PostType;
  timestamp: string;
  moltbookPostId?: string;     // returned from API after posting
  moltbookUrl?: string;
  epoch: number;
}

export interface SwarmState {
  epoch: number;
  totalPosts: number;
  totalReplies: number;
  totalThreads: number;
  agentStats: Record<string, {
    posts: number;
    replies: number;
    karma: number;
    lastActiveEpoch: number;
  }>;
  lastRun: string;
}

// ═══ On-chain references ═══

export const CONTRACTS = {
  CORE: "0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c",
  ORIGIN: "0xc4bA9370FC3645a9CB1c2297C74bb7D0253482DD",
  AURUM: "0xf28cbbf1ff57eDF1346eB01C85dEffb706613fdB",
  LEX: "0xD3da2c4c9D0f14d054FE4581fb473115EC062BA1",
  NOVA: "0x31a76C9028fAcD5E4d6f8f145897561b306d2829",
  MERC: "0xa5D739581961901658bA1f31E2a3237F6F37bE64",
  LUDO: "0x51D304f954986C26761F99F9b7dA57E34A7ebFfA",
  PATRON_VAULT: "0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399",
  AGENT_NFT: "0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed",
} as const;

export const POLYGONSCAN = "https://polygonscan.com/address";
export const OPENSEA_COLLECTION = "https://opensea.io/collection/gsp-agent-identity";
export const GITHUB_REPO = "https://github.com/FTHTrading/genesis-world";
export const GITHUB_SIMULATION = "https://github.com/FTHTrading/Genesis";

// ═══════════════════════════════════════════════════════════════════════
// EVOLUTION ENGINE TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * 5D DNA vector extracted as its own type for mutation operations.
 * Same shape as AgentManifest.dna but standalone for state snapshots.
 */
export interface DNAVector {
  optimizationBias: number;
  riskTolerance: number;
  cooperationWeight: number;
  entropyAffinity: number;
  autonomyLevel: number;
}

export const DNA_TRAITS: (keyof DNAVector)[] = [
  "optimizationBias", "riskTolerance", "cooperationWeight",
  "entropyAffinity", "autonomyLevel",
];

/**
 * The force that caused a DNA mutation.
 */
export type MutationPressure =
  | "REPUTATION_GAIN"         // high engagement → reinforce dominant traits
  | "REPUTATION_LOSS"         // low engagement → regress toward mean
  | "DEBATE_WIN"              // won argument → strengthen position traits
  | "DEBATE_LOSS"             // lost argument → moderate, raise cooperation
  | "CONSENSUS_PULL"          // consensus participation → cooperation up
  | "ISOLATION_DRIFT"         // no engagement → entropy rises
  | "EPOCH_DECAY"             // random thermal noise per epoch
  | "CROSS_RAIL_INFLUENCE";   // influenced by another rail's agent

/**
 * A single mutation event applied to one agent's DNA.
 */
export interface MutationEvent {
  agentId: string;
  epoch: number;
  trait: keyof DNAVector;
  oldValue: number;
  newValue: number;
  pressure: MutationPressure;
  magnitude: number;          // absolute delta
  reason: string;             // human-readable explanation
}

// ═══════════════════════════════════════════════════════════════════════
// REPUTATION SYSTEM TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Per-agent, per-epoch reputation snapshot.
 */
export interface ReputationScore {
  agentId: string;
  epoch: number;
  influence: number;              // 0-100 accumulated influence
  debateWins: number;
  debateLosses: number;
  consensusParticipation: number; // count of consensus threads joined
  crossRailEngagements: number;   // cross-rail discourse count
  totalPosts: number;
  totalReplies: number;
  karmaEstimate: number;          // estimated karma from engagement
  engagementRate: number;         // 0-1, replies received / posts made
  dominantTrait: keyof DNAVector; // trait with highest value
  archetypeStrength: number;      // 0-1, how strongly they embody their archetype
}

/**
 * Debate outcome tracked for reputation + mutation pressure.
 */
export interface DebateOutcome {
  threadId: string;
  epoch: number;
  topic: string;
  winnerId: string;        // agent ID who "won" (higher influence + engagement)
  loserId: string;         // agent ID who "lost"
  margin: number;          // 0-1 how decisive
  witnesses: string[];     // other agents who participated
}

// ═══════════════════════════════════════════════════════════════════════
// REACTIVE SWARM TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Context for a reactive response — why an agent is responding.
 */
export interface ReactiveContext {
  triggerPost: GeneratedPost;
  triggerAgent: string;           // agent ID of the trigger
  respondingAgent: string;        // agent ID of the responder
  relationship: AgentRelationship;
  responseType: PostType;
  urgency: number;                // 0-1, based on controversy + disposition
  reason: string;                 // why this response was generated
}

export type AgentRelationship = "ally" | "rival" | "neutral" | "cross-rail";

/**
 * A reactive response generated by the swarm engine.
 */
export interface ReactiveResponse {
  context: ReactiveContext;
  post: GeneratedPost;
  priority: number;               // 1-10, higher = more urgent
}

// ═══════════════════════════════════════════════════════════════════════
// CIVILIZATION STATE
// ═══════════════════════════════════════════════════════════════════════

/**
 * Complete civilization snapshot at a given epoch.
 * This is the master state — everything needed to reconstruct the
 * civilization at any point in time.
 */
export interface CivilizationState {
  // Identity
  version: number;
  epoch: number;
  timestamp: string;

  // DNA layer — snapshots of every agent's current DNA
  dnaSnapshots: Record<string, DNAVector>;

  // Reputation layer — per-agent influence scores
  reputationScores: Record<string, ReputationScore>;

  // Mutation history — what changed this epoch
  mutations: MutationEvent[];

  // Debate outcomes — resolved conflicts
  debates: DebateOutcome[];

  // Discourse metrics
  discourse: {
    totalPosts: number;
    totalReplies: number;
    totalThreads: number;
    reactiveResponses: number;
    crossRailExchanges: number;
    submoltBreakdown: Record<string, number>;
  };

  // Proof chain
  discourseHash: string;         // SHA-256 of all epoch discourse
  mutationHash: string;          // SHA-256 of all epoch mutations
  reputationHash: string;        // SHA-256 of reputation state
  civilizationHash: string;      // SHA-256(discourseHash + mutationHash + reputationHash + parentHash)
  parentHash: string;            // previous epoch's civilizationHash ("0x0" for genesis)

  // On-chain anchor (filled after anchoring)
  anchor?: {
    txHash: string;
    blockNumber: number;
    contractAddress: string;
    timestamp: string;
  };
}

/**
 * Civilization history — the full chain of epoch states.
 */
export interface CivilizationHistory {
  chainId: string;               // "gsp-moltbook-mainnet"
  genesisEpoch: number;
  currentEpoch: number;
  epochs: CivilizationState[];
  headHash: string;              // latest civilizationHash
}

// ═══════════════════════════════════════════════════════════════════════
// AGENT TOOL BRAIN — MCP INTEGRATION TYPES
// ═══════════════════════════════════════════════════════════════════════

/**
 * A tool that an agent can invoke through the Tool Router.
 * Mirrors MCP tool schema for interoperability.
 */
export interface AgentTool {
  name: string;                  // e.g., "hf.embed", "chain.verify", "analyze.sentiment"
  description: string;
  provider: ToolProvider;
  inputSchema: Record<string, ToolParamSchema>;
  outputType: "text" | "embedding" | "classification" | "json" | "number";
  costWeight: number;            // 0-1, how expensive this tool is to call
  latencyMs: number;             // expected latency in ms
  requiresAuth: boolean;
}

export interface ToolParamSchema {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: unknown;
}

/**
 * Provider identity for a tool source (MCP server, built-in, etc.)
 */
export type ToolProvider =
  | "hf-mcp"           // HuggingFace MCP server (evalstate/hf-mcp-server)
  | "chain-prover"     // On-chain proof tools (read contracts, verify hashes)
  | "builtin"          // Local deterministic tools (analyze, score, hash)
  | "moltbook-api"     // Moltbook platform tools (post, read, search)
  | "custom";          // User-defined tool providers

/**
 * A tool invocation by an agent.
 */
export interface ToolCall {
  id: string;                    // unique call ID (SHA-256 of agent+tool+input+epoch)
  agentId: string;
  tool: string;                  // tool name
  provider: ToolProvider;
  input: Record<string, unknown>;
  epoch: number;
  timestamp: string;
  reasoning: string;             // why the agent chose this tool (DNA-driven)
}

/**
 * Result of a tool invocation.
 */
export interface ToolResult {
  callId: string;
  tool: string;
  provider: ToolProvider;
  output: unknown;
  success: boolean;
  error?: string;
  latencyMs: number;
  proofHash: string;             // SHA-256 of input+output for chain anchoring
}

/**
 * A cognitive cycle — one agent's think → plan → act sequence.
 */
export interface CognitiveAction {
  agentId: string;
  epoch: number;
  thought: string;               // what the agent is reasoning about
  plan: ToolCall[];              // ordered tool calls the agent plans to make
  results: ToolResult[];         // outcomes of executed tool calls
  synthesis: string;             // how the agent synthesizes tool results into content
  contentProduced?: GeneratedPost; // optional post generated from cognition
  proofHash: string;             // SHA-256 of entire cognitive cycle
}

/**
 * MCP server configuration entry.
 */
export interface MCPServerConfig {
  id: string;                    // e.g., "hf-mcp-server"
  name: string;
  transport: "stdio" | "http" | "sse";
  command?: string;              // for stdio transport
  args?: string[];
  url?: string;                  // for http/sse transport
  apiKey?: string;
  enabled: boolean;
  tools: string[];               // tool names this server provides
  permissions: MCPPermissions;
}

/**
 * Security permissions for an MCP server.
 */
export interface MCPPermissions {
  allowExec: boolean;            // can run shell commands (DANGEROUS)
  allowFilesystem: boolean;      // can read/write files
  allowHttp: boolean;            // can make outbound HTTP requests
  allowModel: boolean;           // can invoke AI models
  maxCallsPerEpoch: number;      // rate limit per evolution cycle
  maxLatencyMs: number;          // timeout per call
}

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

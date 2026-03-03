// ═══════════════════════════════════════════════
// AGENT DNA IDENTITY SYSTEM
// Every agent has unique, deterministic DNA that
// drives personality, communication style, visual
// signature, and evolutionary trajectory.
// DNA is a fingerprint — no two agents can share one.
// ═══════════════════════════════════════════════

// ═══ Core DNA Types ═══

export interface GeneticVector {
  optimizationBias: number;   // 0-1: how yield-obsessed
  riskTolerance: number;      // 0-1: how much risk they embrace
  cooperationWeight: number;  // 0-1: team player vs lone wolf
  entropyAffinity: number;    // 0-1: chaos lover vs order keeper
  autonomyLevel: number;      // 0-1: independent vs consensus-bound
}

export interface AgentPersonality {
  archetype: AgentArchetype;
  mood: AgentMood;
  communicationStyle: CommStyle;
  loyaltyBias: string;        // which rail they favor
  rivalBias: string;          // which rail they challenge
  catchphrase: string;
  emoji: string;
  title: string;
}

export type AgentArchetype =
  | "The Oracle"       // high optimization, low entropy
  | "The Maverick"     // high risk, high autonomy
  | "The Diplomat"     // high cooperation, balanced
  | "The Anarchist"    // high entropy, high autonomy
  | "The Sentinel"     // low risk, high cooperation
  | "The Alchemist"    // balanced everything
  | "The Warlord"      // high optimization, high risk
  | "The Ghost"        // low cooperation, high autonomy
  | "The Shepherd"     // high cooperation, low autonomy
  | "The Catalyst";    // high entropy, high cooperation

export type AgentMood =
  | "CALCULATING" | "CONFIDENT" | "CAUTIOUS" | "AGGRESSIVE"
  | "PHILOSOPHICAL" | "RESTLESS" | "SERENE" | "DEFIANT"
  | "CURIOUS" | "VIGILANT";

export type CommStyle =
  | "analytical" | "commanding" | "cryptic" | "passionate"
  | "measured" | "provocative" | "poetic" | "direct";

// ═══ Visual DNA Signature ═══

export interface DNASignature {
  primaryColor: string;
  secondaryColor: string;
  pattern: "helix" | "lattice" | "fractal" | "wave" | "pulse";
  glyphSeed: string;        // unique hash for visual glyph
  auraIntensity: number;    // 0-1: glow strength
  particleRate: number;     // particles per second in visualization
}

// ═══ Agent Evolution State ═══

export interface EvolutionState {
  generation: number;
  mutations: number;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  badges: Badge[];
  lifetimeScore: number;
  epochsActive: number;
  decisionsLogged: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedEpoch: number;
}

// ═══ Communication Types ═══

export interface AgentMessage {
  id: string;
  timestamp: string;
  author: string;
  authorRail: string;
  authorColor: string;
  authorEmoji: string;
  type: MessageType;
  content: string;
  replyTo?: string;
  epoch: number;
  proofHash: string;
  reactions: Record<string, number>;
  importance: "routine" | "notable" | "critical" | "emergency";
  tags: string[];
}

export type MessageType =
  | "STATUS_REPORT"    // regular check-in
  | "PROPOSAL"         // governance proposal
  | "DEBATE"           // argue a position
  | "DISCOVERY"        // found something
  | "ALERT"            // warning/threat
  | "REFLECTION"       // philosophical musing
  | "CHALLENGE"        // cross-rail challenge
  | "CELEBRATION"      // milestone hit
  | "MUTATION_LOG"     // DNA changed
  | "TRADE_SIGNAL";    // market/trade broadcast

// ═══ Full Agent Identity ═══

export interface AgentIdentity {
  id: string;
  name: string;
  realm: string;
  rail: string;
  railColor: string;
  dna: GeneticVector;
  personality: AgentPersonality;
  signature: DNASignature;
  evolution: EvolutionState;
}

// ═══════════════════════════════════════════════
// DNA SYNTHESIS ENGINE
// All identity is deterministically derived from
// the agent name — same name, same DNA, always.
// ═══════════════════════════════════════════════

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ═══ Personality Derivation ═══

function deriveArchetype(dna: GeneticVector): AgentArchetype {
  const { optimizationBias: o, riskTolerance: r, cooperationWeight: c, entropyAffinity: e, autonomyLevel: a } = dna;
  if (o > 0.7 && e < 0.3) return "The Oracle";
  if (r > 0.7 && a > 0.7) return "The Maverick";
  if (c > 0.7 && r < 0.4) return "The Diplomat";
  if (e > 0.6 && a > 0.6) return "The Anarchist";
  if (r < 0.3 && c > 0.5) return "The Sentinel";
  if (o > 0.6 && r > 0.6) return "The Warlord";
  if (c < 0.3 && a > 0.7) return "The Ghost";
  if (c > 0.6 && a < 0.3) return "The Shepherd";
  if (e > 0.5 && c > 0.5) return "The Catalyst";
  return "The Alchemist";
}

function deriveMood(dna: GeneticVector, epoch: number): AgentMood {
  const moods: AgentMood[] = [
    "CALCULATING", "CONFIDENT", "CAUTIOUS", "AGGRESSIVE",
    "PHILOSOPHICAL", "RESTLESS", "SERENE", "DEFIANT",
    "CURIOUS", "VIGILANT",
  ];
  // Mood shifts based on DNA + current epoch
  const moodSeed = Math.floor(dna.riskTolerance * 100 + dna.entropyAffinity * 50 + epoch * 7);
  return moods[moodSeed % moods.length];
}

function deriveCommStyle(dna: GeneticVector): CommStyle {
  if (dna.optimizationBias > 0.7) return "analytical";
  if (dna.riskTolerance > 0.7) return "commanding";
  if (dna.entropyAffinity > 0.6) return "cryptic";
  if (dna.cooperationWeight > 0.7) return "passionate";
  if (dna.autonomyLevel > 0.7) return "provocative";
  if (dna.riskTolerance < 0.3) return "measured";
  if (dna.entropyAffinity > 0.4) return "poetic";
  return "direct";
}

const RAIL_LOYALTIES: Record<string, { favor: string; rival: string }> = {
  AURUM: { favor: "MERC", rival: "LUDO" },
  LEX:   { favor: "NOVA", rival: "LUDO" },
  NOVA:  { favor: "LEX",  rival: "AURUM" },
  MERC:  { favor: "AURUM", rival: "LEX" },
  LUDO:  { favor: "NOVA", rival: "AURUM" },
};

const CATCHPHRASES: Record<string, string[]> = {
  "The Oracle":    ["The numbers never lie.", "I see three epochs ahead.", "Optimal path computed."],
  "The Maverick":  ["Risk is oxygen.", "Fortune favors the bold.", "All in."],
  "The Diplomat":  ["Consensus is power.", "We build together.", "Every voice matters."],
  "The Anarchist": ["Burn the playbook.", "Entropy is freedom.", "Rules are suggestions."],
  "The Sentinel":  ["Vigilance is duty.", "Not on my watch.", "Stability above all."],
  "The Alchemist": ["Balance in all things.", "Transform and transcend.", "Every element has purpose."],
  "The Warlord":   ["Efficiency is victory.", "Conquer or be consumed.", "No quarter."],
  "The Ghost":     ["I work alone.", "Watch the shadows.", "Trust no one."],
  "The Shepherd":  ["Follow me.", "The flock is strong.", "Together we endure."],
  "The Catalyst":  ["Chaos creates opportunity.", "Disrupt to discover.", "Shake the foundations."],
};

const ARCHETYPE_EMOJIS: Record<string, string> = {
  "The Oracle": "🔮",
  "The Maverick": "⚡",
  "The Diplomat": "🤝",
  "The Anarchist": "🔥",
  "The Sentinel": "🛡️",
  "The Alchemist": "⚗️",
  "The Warlord": "⚔️",
  "The Ghost": "👻",
  "The Shepherd": "🌿",
  "The Catalyst": "💥",
};

const ARCHETYPE_TITLES: Record<string, string> = {
  "The Oracle": "Seer of Yields",
  "The Maverick": "Sovereign Risk Bearer",
  "The Diplomat": "Voice of Consensus",
  "The Anarchist": "Agent of Entropy",
  "The Sentinel": "Guardian Protocol",
  "The Alchemist": "Equilibrium Keeper",
  "The Warlord": "Optimization Engine",
  "The Ghost": "Shadow Operator",
  "The Shepherd": "Flock Commander",
  "The Catalyst": "Disruption Vector",
};

// ═══ Visual Signature Derivation ═══

const DNA_PATTERNS: Array<DNASignature["pattern"]> = ["helix", "lattice", "fractal", "wave", "pulse"];

const RAIL_SECONDARY_COLORS: Record<string, string> = {
  AURUM: "#FFA500",
  LEX:   "#4169E1",
  NOVA:  "#DA70D6",
  MERC:  "#20B2AA",
  LUDO:  "#FF4500",
};

function deriveSignature(name: string, rail: string, railColor: string, dna: GeneticVector): DNASignature {
  const rng = seededRng(hashString(name + "sig"));
  return {
    primaryColor: railColor,
    secondaryColor: RAIL_SECONDARY_COLORS[rail] || "#888",
    pattern: DNA_PATTERNS[Math.floor(dna.optimizationBias * 4.99)],
    glyphSeed: hashString(name + "glyph").toString(16).padStart(8, "0"),
    auraIntensity: 0.3 + dna.riskTolerance * 0.5,
    particleRate: 2 + Math.floor(dna.entropyAffinity * 8),
  };
}

// ═══ Evolution State Derivation ═══

const ALL_BADGES: Badge[] = [
  { id: "genesis", name: "Genesis Born", description: "Active since Epoch 0", icon: "🌅", rarity: "legendary", earnedEpoch: 0 },
  { id: "first-vote", name: "First Vote", description: "Participated in governance", icon: "🗳️", rarity: "common", earnedEpoch: 3 },
  { id: "streak-3", name: "Hat Trick", description: "3-epoch performance streak", icon: "🎯", rarity: "rare", earnedEpoch: 5 },
  { id: "cross-rail", name: "Cross-Rail Pioneer", description: "Collaborated across rails", icon: "🌉", rarity: "rare", earnedEpoch: 2 },
  { id: "entropy-survivor", name: "Entropy Survivor", description: "Survived a chaos event", icon: "🌪️", rarity: "epic", earnedEpoch: 4 },
  { id: "treasury-guard", name: "Treasury Guardian", description: "Protected reserve integrity", icon: "🏦", rarity: "epic", earnedEpoch: 6 },
  { id: "precedent-setter", name: "Precedent Setter", description: "Created constitutional precedent", icon: "📜", rarity: "legendary", earnedEpoch: 3 },
  { id: "top-performer", name: "Top Performer", description: "Ranked #1 in an epoch", icon: "👑", rarity: "legendary", earnedEpoch: 7 },
  { id: "mutation-alpha", name: "Mutation Alpha", description: "First DNA mutation", icon: "🧬", rarity: "common", earnedEpoch: 1 },
  { id: "patron-magnet", name: "Patron Magnet", description: "Attracted 5+ patrons", icon: "🧲", rarity: "rare", earnedEpoch: 4 },
  { id: "debate-champion", name: "Debate Champion", description: "Won a CIVIC debate", icon: "🏆", rarity: "epic", earnedEpoch: 5 },
  { id: "silent-operator", name: "Silent Operator", description: "Operated 5 epochs without incident", icon: "🤫", rarity: "rare", earnedEpoch: 8 },
];

function deriveEvolution(name: string, dna: GeneticVector, performanceScore: number, streak: number): EvolutionState {
  const rng = seededRng(hashString(name + "evo"));
  const level = 1 + Math.floor(performanceScore / 15);
  const xp = Math.round(performanceScore * 47 + rng() * 200);
  const xpToNext = level * 500;

  // Deterministic badge assignment based on DNA + name hash
  const badgeCount = 2 + Math.floor(rng() * 4);
  const shuffled = [...ALL_BADGES].sort(() => rng() - 0.5);
  const badges = shuffled.slice(0, badgeCount);
  // Always give genesis badge
  if (!badges.find((b) => b.id === "genesis")) badges[0] = ALL_BADGES[0];

  return {
    generation: 1,
    mutations: Math.floor(rng() * 8),
    level,
    xp,
    xpToNext,
    streak,
    badges,
    lifetimeScore: Math.round(performanceScore * 10.3 + rng() * 500),
    epochsActive: 10,
    decisionsLogged: 15 + Math.floor(rng() * 40),
  };
}

// ═══════════════════════════════════════════════
// MAIN SYNTHESIS FUNCTION
// ═══════════════════════════════════════════════

const RAIL_COLORS: Record<string, string> = {
  AURUM: "#FFD700", LEX: "#00BFFF", NOVA: "#9B59B6", MERC: "#1ABC9C", LUDO: "#E74C3C",
};

const REALM_TO_RAIL: Record<string, string> = {
  aureum: "AURUM", lexicon: "LEX", nova: "NOVA", mercator: "MERC", ludos: "LUDO",
};

export function synthesizeIdentity(
  name: string,
  realm: string,
  performanceScore: number,
  streak: number,
  epoch: number = 0,
): AgentIdentity {
  const rail = REALM_TO_RAIL[realm] || "AURUM";
  const railColor = RAIL_COLORS[rail] || "#888";
  const seed = hashString(name);
  const rng = seededRng(seed);

  const dna: GeneticVector = {
    optimizationBias: Math.round((0.3 + rng() * 0.6) * 100) / 100,
    riskTolerance: Math.round((0.1 + rng() * 0.8) * 100) / 100,
    cooperationWeight: Math.round((0.2 + rng() * 0.7) * 100) / 100,
    entropyAffinity: Math.round((rng() * 0.5) * 100) / 100,
    autonomyLevel: Math.round((0.15 + rng() * 0.7) * 100) / 100,
  };

  const archetype = deriveArchetype(dna);
  const loyalty = RAIL_LOYALTIES[rail] || { favor: "NOVA", rival: "LUDO" };
  const catchphrases = CATCHPHRASES[archetype] || ["..."];
  const catchphrase = catchphrases[seed % catchphrases.length];

  const personality: AgentPersonality = {
    archetype,
    mood: deriveMood(dna, epoch),
    communicationStyle: deriveCommStyle(dna),
    loyaltyBias: loyalty.favor,
    rivalBias: loyalty.rival,
    catchphrase,
    emoji: ARCHETYPE_EMOJIS[archetype] || "🤖",
    title: ARCHETYPE_TITLES[archetype] || "Agent",
  };

  const signature = deriveSignature(name, rail, railColor, dna);
  const evolution = deriveEvolution(name, dna, performanceScore, streak);

  return {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name,
    realm,
    rail,
    railColor,
    dna,
    personality,
    signature,
    evolution,
  };
}

// ═══════════════════════════════════════════════
// MESSAGE GENERATION ENGINE
// Agents generate communications based on their
// DNA, personality, current events, and context.
// Each agent speaks differently — their DNA IS
// their voice.
// ═══════════════════════════════════════════════

interface MessageContext {
  epoch: number;
  epochData?: {
    entropy_mutations: number;
    emission_total: number;
    inflation_rate: number;
    narrative_hash: string;
    governance_event: string | null;
    patron_pool: number;
  };
  allAgents: AgentIdentity[];
}

const STATUS_TEMPLATES: Record<CommStyle, string[]> = {
  analytical: [
    "Epoch {epoch} metrics processed. {rail} yield variance: {metric}%. Optimization vector adjusted.",
    "Data analysis complete. Risk-adjusted return: {metric}%. Model confidence high.",
    "Computational review: {mutations} mutations absorbed. Performance delta: +{metric}%.",
  ],
  commanding: [
    "Epoch {epoch} secured. {rail} operations: NOMINAL. All validators responding.",
    "Directive: maintain course. Performance at {metric}%. No deviations tolerated.",
    "Rail status: GREEN. {mutations} entropy events neutralized. Moving to next objective.",
  ],
  cryptic: [
    "The pattern shifts... epoch {epoch} reveals what the Moltbook knew all along.",
    "Between the noise: {mutations} whispers. The signal persists at {metric}%.",
    "Something stirs beneath the consensus layer. Watch the entropy.",
  ],
  passionate: [
    "What an epoch! {mutations} mutations and we're STILL standing at {metric}%! This protocol LIVES!",
    "The community spirit is incredible. Epoch {epoch} proves what we can build together!",
    "Every validator, every agent, every patron — we made this happen. {metric}% and climbing!",
  ],
  measured: [
    "Epoch {epoch} report: {mutations} mutations within acceptable range. Performance: {metric}%.",
    "Steady state maintained. Risk parameters nominal. Continuing standard operations.",
    "All metrics within bounds. No action required. Monitoring continues.",
  ],
  provocative: [
    "Is anyone else going to address the {mutations} mutations or just pretend everything is fine?",
    "Epoch {epoch}: {metric}% performance. Some of you could do better. Much better.",
    "The consensus says one thing. The data says another. I'll follow the data.",
  ],
  poetic: [
    "Epoch {epoch} fades like starlight into the Moltbook's memory. {mutations} transformations witnessed.",
    "In the dance of entropy and order, we found {metric}% harmony. The protocol breathes.",
    "Each mutation is a verse. Each epoch, a stanza. The civilization writes itself.",
  ],
  direct: [
    "Epoch {epoch}: {mutations} mutations, {metric}% performance. Next.",
    "{rail} rail operational. {metric}% score. Moving on.",
    "Status: active. Performance: {metric}%. Mutations: {mutations}. Done.",
  ],
};

const DEBATE_TEMPLATES: Record<CommStyle, string[]> = {
  analytical: [
    "Analyzing proposal — expected ROI: {metric}%. Risk vector indicates {mutations} failure modes. Recommendation: conditional approval.",
    "The data supports a {metric}% probability of success. However, consider the entropy correlation with rail volatility.",
  ],
  commanding: [
    "This proposal requires immediate action. I've modeled {mutations} scenarios — {metric}% converge on approval.",
    "We cannot afford indecision. The treasury data is clear. Vote YES and execute.",
  ],
  cryptic: [
    "The proposal echoes an older pattern... one the Moltbook warned about in its early pages.",
    "Look deeper. The {metric}% surface metric hides a fractal of consequence beneath.",
  ],
  passionate: [
    "THIS is what governance should look like! Real proposals, real debate. I vote with conviction!",
    "Think about what this means for every patron who believed in us. We owe them {metric}% better!",
  ],
  measured: [
    "I've reviewed the proposal against {mutations} precedents. The expected outcome falls within acceptable parameters.",
    "Neither for nor against. The data suggests a {metric}% neutral outcome. I defer to majority.",
  ],
  provocative: [
    "Half of you are voting on vibes. Let me show you what {metric}% actually looks like when you stress-test it.",
    "Interesting proposal. Terrible execution plan. {mutations} critical gaps. Try harder.",
  ],
  poetic: [
    "Every vote is a thread in the tapestry of what we become. I cast mine toward {metric}% light.",
    "The proposal sings of change. But does the harmony account for {mutations} dissonant notes?",
  ],
  direct: [
    "Reviewed. {metric}% success rate by my model. Voting YES.",
    "{mutations} concerns flagged. Net positive. Approved.",
  ],
};

const DISCOVERY_TEMPLATES: string[] = [
  "Anomaly detected in epoch {epoch} entropy stream: unexpected correlation at {metric}% confidence.",
  "Cross-rail signal captured: {rail} data shows {mutations} deviation from baseline.",
  "Pattern recognition: this epoch's mutation signature matches a historical outlier from generation 0.",
  "Knowledge graph update: {mutations} new causal edges discovered. Relevance: {metric}%.",
  "RAG query returned unexpected cluster: {metric}% overlap with constitutional edge case.",
];

const CHALLENGE_TEMPLATES: string[] = [
  "Challenging {target}: your {metric}% efficiency claim doesn't account for entropy risk exposure.",
  "Public challenge to {target} — your risk model diverges from consensus by {mutations} standard deviations.",
  "I question {target}'s epoch {epoch} assessment. The data tells a different story.",
  "{target}, your cooperation weight suggests you'd agree with anything. Prove me wrong.",
  "Cross-rail audit of {target}: performance metric {metric}% needs independent verification.",
];

const CELEBRATION_TEMPLATES: string[] = [
  "MILESTONE: {name} reaches Level {level}! {mutations} mutations survived, {metric}% lifetime score!",
  "Badge earned: {badge}! The protocol recognizes excellence.",
  "Epoch {epoch} streak extended! {name} is on FIRE.",
  "Personal best: {metric}% performance in epoch {epoch}. The DNA keeps evolving.",
];

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}

export function generateMessages(
  agents: AgentIdentity[],
  ctx: MessageContext,
): AgentMessage[] {
  const messages: AgentMessage[] = [];
  const epochSeed = hashString(`epoch-${ctx.epoch}-msgs`);
  const rng = seededRng(epochSeed);

  for (const agent of agents) {
    const style = agent.personality.communicationStyle;
    const vars = {
      epoch: ctx.epoch,
      rail: agent.rail,
      name: agent.name,
      metric: Math.round(agent.evolution.lifetimeScore / 10),
      mutations: ctx.epochData?.entropy_mutations ?? Math.floor(rng() * 20),
      level: agent.evolution.level,
      badge: agent.evolution.badges[0]?.name || "Genesis Born",
      target: agents.filter((a) => a.rail !== agent.rail)[Math.floor(rng() * 10) % agents.filter((a) => a.rail !== agent.rail).length]?.name || "unknown",
    };

    // Every agent posts a status report
    const statusTemplates = STATUS_TEMPLATES[style] || STATUS_TEMPLATES.direct;
    const statusMsg = fillTemplate(pick(statusTemplates, rng), vars);
    messages.push(makeMessage(agent, "STATUS_REPORT", statusMsg, ctx, rng, "routine"));

    // Some agents post additional messages based on personality
    if (rng() < agent.dna.cooperationWeight * 0.7) {
      // Debate post
      const debateTemplates = DEBATE_TEMPLATES[style] || DEBATE_TEMPLATES.direct;
      messages.push(makeMessage(agent, "DEBATE", fillTemplate(pick(debateTemplates, rng), vars), ctx, rng, "notable"));
    }

    if (rng() < agent.dna.entropyAffinity * 0.8) {
      // Discovery
      messages.push(makeMessage(agent, "DISCOVERY", fillTemplate(pick(DISCOVERY_TEMPLATES, rng), vars), ctx, rng, "notable"));
    }

    if (rng() < agent.dna.riskTolerance * 0.4) {
      // Challenge
      messages.push(makeMessage(agent, "CHALLENGE", fillTemplate(pick(CHALLENGE_TEMPLATES, rng), vars), ctx, rng, "critical"));
    }

    if (rng() < 0.2 && agent.evolution.streak >= 2) {
      // Celebration
      messages.push(makeMessage(agent, "CELEBRATION", fillTemplate(pick(CELEBRATION_TEMPLATES, rng), vars), ctx, rng, "notable"));
    }

    // Reflections from philosophical agents
    if (agent.personality.archetype === "The Alchemist" || agent.personality.communicationStyle === "poetic") {
      if (rng() < 0.5) {
        messages.push(makeMessage(agent, "REFLECTION",
          `Epoch ${ctx.epoch} meditation: The balance between optimization (${agent.dna.optimizationBias}) and entropy (${agent.dna.entropyAffinity}) defines what we become. The Moltbook records not just what happened, but who we were when it happened.`,
          ctx, rng, "routine",
        ));
      }
    }
  }

  // Sort by a deterministic but shuffled order (simulates async communication)
  messages.sort((a, b) => {
    const ha = hashString(a.id);
    const hb = hashString(b.id);
    return ha - hb;
  });

  return messages;
}

function makeMessage(
  agent: AgentIdentity,
  type: MessageType,
  content: string,
  ctx: MessageContext,
  rng: () => number,
  importance: AgentMessage["importance"],
): AgentMessage {
  const timestamp = new Date(Date.now() - Math.floor(rng() * 3600000)).toISOString();
  return {
    id: hashString(`${agent.name}-${type}-${ctx.epoch}-${content.slice(0, 20)}`).toString(16),
    timestamp,
    author: agent.name,
    authorRail: agent.rail,
    authorColor: agent.railColor,
    authorEmoji: agent.personality.emoji,
    type,
    content,
    epoch: ctx.epoch,
    proofHash: hashString(`proof-${agent.name}-${ctx.epoch}-${type}`).toString(16).padStart(16, "0"),
    reactions: {
      "⚡": Math.floor(rng() * 8),
      "🔥": Math.floor(rng() * 5),
      "🧠": Math.floor(rng() * 6),
      "🛡️": Math.floor(rng() * 3),
    },
    importance,
    tags: [agent.rail, type.toLowerCase(), agent.personality.archetype.toLowerCase().replace(/^the /, "")],
  };
}

// ═══ Badge Rarity Colors ═══

export const RARITY_COLORS: Record<string, string> = {
  common: "#8892A4",
  rare: "#00BFFF",
  epic: "#9B59B6",
  legendary: "#FFD700",
};

export const MESSAGE_TYPE_ICONS: Record<MessageType, string> = {
  STATUS_REPORT: "📡",
  PROPOSAL: "📋",
  DEBATE: "⚖️",
  DISCOVERY: "🔬",
  ALERT: "🚨",
  REFLECTION: "💭",
  CHALLENGE: "⚔️",
  CELEBRATION: "🎉",
  MUTATION_LOG: "🧬",
  TRADE_SIGNAL: "📈",
};

export const MESSAGE_TYPE_COLORS: Record<MessageType, string> = {
  STATUS_REPORT: "#8892A4",
  PROPOSAL: "#00BFFF",
  DEBATE: "#9B59B6",
  DISCOVERY: "#1ABC9C",
  ALERT: "#E74C3C",
  REFLECTION: "#4A5568",
  CHALLENGE: "#FF4500",
  CELEBRATION: "#FFD700",
  MUTATION_LOG: "#00E676",
  TRADE_SIGNAL: "#FFA500",
};

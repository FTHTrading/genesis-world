// ═══════════════════════════════════════════════════════════════════════
// REACTIVE SWARM ENGINE
// Agents don't just post — they *react*.
//
// The reactive engine scans epoch discourse and generates emergent
// responses based on agent personality, relationships, DNA alignment,
// and controversy level.
//
// This is NOT pre-scripted dialogue. It's computed swarm behavior:
// 1. Feed scan: each agent evaluates every post from other agents
// 2. Resonance calc: DNA alignment + relationship + topic controversy
// 3. Response decision: probability-based, personality-weighted
// 4. Response generation: in the agent's authentic voice
//
// The result: emergent discourse graphs that no one scripted.
// ═══════════════════════════════════════════════════════════════════════

import {
  AgentManifest,
  GeneratedPost,
  ReactiveContext,
  ReactiveResponse,
  AgentRelationship,
  PostType,
  DNAVector,
  DNA_TRAITS,
} from "./types.js";
import { AGENTS, getAgent, getRivals, getAllies } from "./agents.js";
import { generateReply, generateDebatePost, TOPICS } from "./content.js";
import { hash, seededRng, pick, sha256 } from "./utils.js";

// ═══════════════════════════════════════════════
// RESONANCE CALCULATION
// ═══════════════════════════════════════════════

/**
 * DNA resonance between two agents.
 * High resonance = similar DNA vectors = allies tend to agree.
 * Low resonance = divergent DNA = rivals tend to clash.
 * Returns -1 to +1.
 */
function dnaResonance(a: DNAVector, b: DNAVector): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const trait of DNA_TRAITS) {
    dotProduct += a[trait] * b[trait];
    magA += a[trait] * a[trait];
    magB += b[trait] * b[trait];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  // Cosine similarity → mapped to -1..+1
  const cosSim = dotProduct / magnitude;
  return (cosSim * 2) - 1;
}

/**
 * Determine the relationship between two agents.
 */
function getRelationship(agent: AgentManifest, other: AgentManifest): AgentRelationship {
  if (agent.rivals.includes(other.id)) return "rival";
  if (agent.allies.includes(other.id)) return "ally";
  if (agent.rail !== other.rail) return "cross-rail";
  return "neutral";
}

/**
 * Calculate response urgency — how strongly an agent wants to respond.
 *
 * Factors:
 * - Relationship (rivals → high urgency, neutrals → low)
 * - DNA resonance (dissimilar DNA → more interesting)
 * - Post controversy (provocative posts demand response)
 * - Agent personality (high debate probability → more responsive)
 * - Content type (debates > analysis > reflections)
 */
function calculateUrgency(
  agent: AgentManifest,
  post: GeneratedPost,
  posterAgent: AgentManifest,
  epoch: number,
): number {
  let urgency = 0;

  // 1. Relationship factor (0 - 0.3)
  const relationship = getRelationship(agent, posterAgent);
  switch (relationship) {
    case "rival":      urgency += 0.30; break;
    case "cross-rail": urgency += 0.20; break;
    case "ally":       urgency += 0.10; break;
    case "neutral":    urgency += 0.05; break;
  }

  // 2. DNA dissonance (0 - 0.2) — more different = more interesting
  const resonance = dnaResonance(agent.dna, posterAgent.dna);
  urgency += (1 - Math.abs(resonance)) * 0.1 + (resonance < 0 ? 0.1 : 0);

  // 3. Post type controversy (0 - 0.2)
  const controversyMap: Partial<Record<PostType, number>> = {
    "DEBATE": 0.20,
    "PROVOCATION": 0.18,
    "CHALLENGE": 0.18,
    "CROSS_RAIL": 0.15,
    "SIGNAL": 0.12,
    "ANALYSIS": 0.10,
    "DISCOVERY": 0.10,
    "EPOCH_REPORT": 0.08,
    "CHRONICLE": 0.05,
    "REFLECTION": 0.04,
  };
  urgency += controversyMap[post.type] || 0.05;

  // 4. Agent personality (0 - 0.2)
  urgency += agent.debateProbability * 0.15;
  urgency += agent.replyProbability * 0.05;

  // 5. Mention boost (+0.15 if directly mentioned)
  if (post.mentions.includes(agent.moltbookUsername) || post.body.includes(agent.displayName)) {
    urgency += 0.15;
  }

  // 6. Same topic rail relevance (0 - 0.1)
  if (post.submolt && agent.targetSubmolts.includes(post.submolt)) {
    urgency += 0.08;
  }

  // Clamp to 0-1
  return Math.max(0, Math.min(1, urgency));
}

// ═══════════════════════════════════════════════
// RESPONSE DECISIONS
// ═══════════════════════════════════════════════

/**
 * Decide what type of response an agent should make.
 */
function decideResponseType(
  agent: AgentManifest,
  post: GeneratedPost,
  relationship: AgentRelationship,
  urgency: number,
): PostType {
  // Rivals → debate response
  if (relationship === "rival" && urgency > 0.5) return "DEBATE";

  // Cross-rail + high urgency → challenge
  if (relationship === "cross-rail" && urgency > 0.6) return "CROSS_RAIL";

  // Provocateur personality → provocation
  if (agent.commStyle === "provocative" && urgency > 0.4) return "PROVOCATION";

  // Poetic/cryptic → reflection
  if ((agent.commStyle === "poetic" || agent.commStyle === "cryptic") && urgency < 0.5) return "REFLECTION";

  // Default → thread reply
  return "THREAD_REPLY";
}

/**
 * Determine whether an agent should respond to a specific post.
 *
 * This is probabilistic but deterministic (seeded RNG).
 * The threshold is adjusted by the agent's DNA and the post's characteristics.
 */
function shouldRespond(
  agent: AgentManifest,
  post: GeneratedPost,
  posterAgent: AgentManifest,
  urgency: number,
  epoch: number,
): boolean {
  // Never respond to own posts
  if (agent.id === post.agent) return false;

  // Already responded? (deduplicated by caller)

  // Deterministic decision
  const rng = seededRng(hash(`react:${agent.id}:${post.id}:${epoch}`));
  const threshold = 0.35; // base threshold — 65% chance of NOT responding

  // Adjust threshold based on agent personality
  const adjustedThreshold = threshold
    - agent.debateProbability * 0.15   // debaters respond more
    - agent.replyProbability * 0.10;   // social agents respond more

  return urgency > adjustedThreshold && rng() < urgency;
}

// ═══════════════════════════════════════════════
// REACTIVE RESPONSE GENERATION
// ═══════════════════════════════════════════════

/**
 * Generate a reactive response from one agent to one post.
 */
function generateReactiveResponse(
  agent: AgentManifest,
  post: GeneratedPost,
  posterAgent: AgentManifest,
  epoch: number,
): ReactiveResponse {
  const relationship = getRelationship(agent, posterAgent);
  const urgency = calculateUrgency(agent, post, posterAgent, epoch);
  const responseType = decideResponseType(agent, post, relationship, urgency);

  // Build context
  const context: ReactiveContext = {
    triggerPost: post,
    triggerAgent: posterAgent.id,
    respondingAgent: agent.id,
    relationship,
    responseType,
    urgency,
    reason: buildReason(agent, posterAgent, relationship, post, urgency),
  };

  // Generate the response post
  let responsePost: GeneratedPost;

  if (responseType === "DEBATE" || responseType === "CROSS_RAIL") {
    // Find relevant topic
    const topic = TOPICS.find(t =>
      post.body.toLowerCase().includes(t.id.replace(/-/g, " ")) ||
      t.relevantRails.includes(agent.rail)
    ) || TOPICS[0]!;
    responsePost = generateDebatePost(agent, posterAgent, topic, epoch);
  } else {
    responsePost = generateReply(agent, post, epoch);
  }

  // Priority based on urgency + relationship
  const priority = Math.round(urgency * 10);

  return { context, post: responsePost, priority };
}

/**
 * Build a human-readable reason for the reactive response.
 */
function buildReason(
  agent: AgentManifest,
  poster: AgentManifest,
  relationship: AgentRelationship,
  post: GeneratedPost,
  urgency: number,
): string {
  const parts: string[] = [];

  switch (relationship) {
    case "rival":
      parts.push(`Rival @${poster.moltbookUsername} posted — ${agent.displayName} must respond`);
      break;
    case "ally":
      parts.push(`Ally @${poster.moltbookUsername} needs support from ${agent.displayName}`);
      break;
    case "cross-rail":
      parts.push(`Cross-rail challenge from ${poster.rail} to ${agent.rail}`);
      break;
    default:
      parts.push(`${agent.displayName} noticed ${poster.displayName}'s ${post.type}`);
  }

  if (urgency > 0.7) parts.push("(high urgency)");
  if (post.mentions.includes(agent.moltbookUsername)) parts.push("(directly mentioned)");

  return parts.join(" ");
}

// ═══════════════════════════════════════════════
// SWARM SCAN — THE MAIN ENGINE
// ═══════════════════════════════════════════════

/**
 * Scan all epoch posts and generate reactive responses.
 *
 * For each post:
 * 1. Every other agent evaluates whether to respond
 * 2. If urgency exceeds threshold → response generated
 * 3. Responses are deduplicated (one response per agent per trigger)
 * 4. Sorted by priority (most urgent first)
 *
 * This produces the EMERGENT DISCOURSE GRAPH.
 */
export function scanAndReact(
  epochPosts: GeneratedPost[],
  epoch: number,
  maxResponsesPerAgent: number = 3,
  evolvedDna?: Record<string, DNAVector>,
): ReactiveResponse[] {
  const allResponses: ReactiveResponse[] = [];
  const responseCount: Record<string, number> = {};

  // Sort posts by priority (high priority = scanned first)
  const sortedPosts = [...epochPosts].sort((a, b) => b.priority - a.priority);

  for (const post of sortedPosts) {
    const posterAgent = getAgent(post.agent);
    if (!posterAgent) continue;

    for (const agent of AGENTS) {
      // Skip self
      if (agent.id === post.agent) continue;

      // Rate limit: max responses per agent per epoch
      const currentCount = responseCount[agent.id] || 0;
      if (currentCount >= maxResponsesPerAgent) continue;

      // Use evolved DNA if available
      const effectiveAgent = evolvedDna?.[agent.id]
        ? { ...agent, dna: evolvedDna[agent.id]! }
        : agent;

      const urgency = calculateUrgency(effectiveAgent, post, posterAgent, epoch);

      if (shouldRespond(effectiveAgent, post, posterAgent, urgency, epoch)) {
        const response = generateReactiveResponse(effectiveAgent, post, posterAgent, epoch);
        allResponses.push(response);
        responseCount[agent.id] = currentCount + 1;
      }
    }
  }

  // Sort by priority (highest first)
  allResponses.sort((a, b) => b.priority - a.priority);

  return allResponses;
}

// ═══════════════════════════════════════════════
// DISCOURSE GRAPH ANALYSIS
// ═══════════════════════════════════════════════

/**
 * Analyze the discourse graph to find emergent patterns.
 */
export function analyzeDiscourse(
  posts: GeneratedPost[],
  responses: ReactiveResponse[],
): DiscourseAnalysis {
  // Build adjacency: who responded to whom
  const interactions: Record<string, Record<string, number>> = {};
  const topicHeat: Record<string, number> = {};

  for (const r of responses) {
    const from = r.context.respondingAgent;
    const to = r.context.triggerAgent;
    (interactions[from] ??= {})[to] = ((interactions[from] ??= {})[to] || 0) + 1;

    // Track topic heat from post content
    for (const topic of TOPICS) {
      if (r.post.body.toLowerCase().includes(topic.id.replace(/-/g, " "))) {
        topicHeat[topic.id] = (topicHeat[topic.id] || 0) + 1;
      }
    }
  }

  // Find most contentious relationship
  let maxInteractions = 0;
  let hottestPair: [string, string] = ["", ""];
  for (const [from, targets] of Object.entries(interactions)) {
    for (const [to, count] of Object.entries(targets)) {
      if (count > maxInteractions) {
        maxInteractions = count;
        hottestPair = [from, to];
      }
    }
  }

  // Influence distribution
  const responsesByAgent: Record<string, number> = {};
  const mentionsReceived: Record<string, number> = {};

  for (const r of responses) {
    responsesByAgent[r.context.respondingAgent] =
      (responsesByAgent[r.context.respondingAgent] || 0) + 1;
    mentionsReceived[r.context.triggerAgent] =
      (mentionsReceived[r.context.triggerAgent] || 0) + 1;
  }

  // Hottest topic
  const hottestTopic = Object.entries(topicHeat)
    .sort(([, a], [, b]) => b - a)[0];

  return {
    totalInteractions: responses.length,
    uniqueParticipants: new Set([
      ...responses.map(r => r.context.respondingAgent),
      ...responses.map(r => r.context.triggerAgent),
    ]).size,
    hottestPair: {
      agents: hottestPair,
      interactions: maxInteractions,
    },
    hottestTopic: hottestTopic ? { id: hottestTopic[0], heat: hottestTopic[1] } : null,
    responsesByAgent,
    mentionsReceived,
    emergentConsensus: findEmergentConsensus(responses),
  };
}

interface DiscourseAnalysis {
  totalInteractions: number;
  uniqueParticipants: number;
  hottestPair: { agents: [string, string]; interactions: number };
  hottestTopic: { id: string; heat: number } | null;
  responsesByAgent: Record<string, number>;
  mentionsReceived: Record<string, number>;
  emergentConsensus: string[];
}

/**
 * Find agents who are converging on the same position
 * (allies responding supportively to each other).
 */
function findEmergentConsensus(responses: ReactiveResponse[]): string[] {
  const allySupport: Record<string, number> = {};

  for (const r of responses) {
    if (r.context.relationship === "ally" && r.context.responseType === "THREAD_REPLY") {
      allySupport[r.context.respondingAgent] = (allySupport[r.context.respondingAgent] || 0) + 1;
    }
  }

  // Agents with 2+ ally support responses are forming consensus
  return Object.entries(allySupport)
    .filter(([, count]) => count >= 2)
    .map(([id]) => id);
}

// ═══════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════

/**
 * Format reactive responses for CLI display.
 */
export function formatReactiveResponses(responses: ReactiveResponse[]): string {
  if (responses.length === 0) return "  No reactive responses generated.";

  const lines: string[] = [];
  lines.push("  ┌─ REACTIVE SWARM ──────────────────────────────────────────────────────┐");
  lines.push(`  │ ${responses.length} emergent responses generated`);
  lines.push("  │");

  for (const r of responses.slice(0, 20)) { // Show top 20
    const agent = getAgent(r.context.respondingAgent);
    const trigger = getAgent(r.context.triggerAgent);
    const rel = r.context.relationship.toUpperCase().padEnd(10);
    const pri = `P${r.priority}`;

    lines.push(`  │ ${pri} ${rel} @${(agent?.moltbookUsername || r.context.respondingAgent).padEnd(14)} → @${(trigger?.moltbookUsername || r.context.triggerAgent).padEnd(14)} [${r.context.responseType}]`);
    lines.push(`  │   └─ ${r.context.reason}`);
  }

  if (responses.length > 20) {
    lines.push(`  │ ... and ${responses.length - 20} more responses`);
  }

  lines.push("  └──────────────────────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}

/**
 * Format discourse analysis for CLI display.
 */
export function formatDiscourseAnalysis(analysis: DiscourseAnalysis): string {
  const lines: string[] = [];
  lines.push("  ┌─ DISCOURSE GRAPH ─────────────────────────────────────────┐");
  lines.push(`  │ Total interactions:   ${analysis.totalInteractions}`);
  lines.push(`  │ Unique participants:  ${analysis.uniqueParticipants}`);

  if (analysis.hottestPair.interactions > 0) {
    const a = getAgent(analysis.hottestPair.agents[0])?.displayName || analysis.hottestPair.agents[0];
    const b = getAgent(analysis.hottestPair.agents[1])?.displayName || analysis.hottestPair.agents[1];
    lines.push(`  │ Hottest pair:         ${a} ↔ ${b} (${analysis.hottestPair.interactions} exchanges)`);
  }

  if (analysis.hottestTopic) {
    lines.push(`  │ Hottest topic:        ${analysis.hottestTopic.id} (${analysis.hottestTopic.heat} mentions)`);
  }

  if (analysis.emergentConsensus.length > 0) {
    const names = analysis.emergentConsensus.map(id => getAgent(id)?.displayName || id).join(", ");
    lines.push(`  │ Emerging consensus:   ${names}`);
  }

  lines.push("  └──────────────────────────────────────────────────────────────┘");
  return lines.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════
// DIALOGUE ORCHESTRATOR
// Plans and generates multi-agent conversation threads.
// Agent A posts → Agent B (rival) challenges → Agent C weighs in.
// Natural personality-driven discourse with real data disagreements.
// ═══════════════════════════════════════════════════════════════════════

import { AgentManifest, DialogueThread, GeneratedPost, PostType } from "./types.js";
import { AGENTS, getAgent, getRivals, getAllies, getCrossRailAgents, AGENTS_BY_RAIL } from "./agents.js";
import { generateAnalysisPost, generateDebatePost, generateReply, generateCrossRailChallenge, TOPICS } from "./content.js";
import { hash, seededRng, pick, shuffle } from "./utils.js";

// ═══════════════════════════════════════════════
// THREAD ARCHETYPES
// ═══════════════════════════════════════════════

type ThreadArchetype =
  | "RIVALRY"         // Two rivals debate a controversial topic
  | "CROSS_RAIL"      // Agents from different rails challenge each other
  | "CONSENSUS"       // Allies build on each other's analysis
  | "DOGPILE"         // Multiple agents pile onto a hot take
  | "DEEP_DIVE"       // Expert agent posts, others ask questions
  | "EPOCH_DEBRIEF";  // Post-epoch multi-rail discussion

interface ThreadPlan {
  archetype: ThreadArchetype;
  starter: AgentManifest;
  respondents: AgentManifest[];
  topic: typeof TOPICS[number];
  expectedPosts: number;
}

// ═══════════════════════════════════════════════
// THREAD PLANNER
// ═══════════════════════════════════════════════

/**
 * Plans conversation threads for an epoch.
 * Uses agent relationships (allies/rivals) and topic controversy
 * to create authentic discourse patterns.
 */
export function planEpochThreads(epoch: number): ThreadPlan[] {
  const rng = seededRng(hash(`threads-epoch-${epoch}`));
  const plans: ThreadPlan[] = [];

  // 1. RIVALRY thread — two known rivals on a high-controversy topic
  const controversialTopics = TOPICS.filter(t => t.controversy >= 0.7);
  if (controversialTopics.length > 0) {
    const topic = pick(controversialTopics, rng);
    // Find an agent pair with rival relationship on this topic
    const relevantAgents = AGENTS.filter(a => topic.relevantRails.includes(a.rail));
    if (relevantAgents.length >= 2) {
      const starter = pick(relevantAgents, rng);
      const rivals = getRivals(starter).filter(r => topic.relevantRails.includes(r.rail));
      if (rivals.length > 0) {
        plans.push({
          archetype: "RIVALRY",
          starter,
          respondents: [pick(rivals, rng), ...getAllies(starter).slice(0, 1)],
          topic,
          expectedPosts: 4,
        });
      }
    }
  }

  // 2. CROSS_RAIL thread — agents from different rails
  const rails = Object.keys(AGENTS_BY_RAIL()) as string[];
  if (rails.length >= 2) {
    const shuffled = shuffle([...rails], rng);
    const railA = shuffled[0]!;
    const railB = shuffled[1]!;
    const agentsA = AGENTS_BY_RAIL()[railA]!;
    const agentsB = AGENTS_BY_RAIL()[railB]!;
    const topic = pick(TOPICS.filter(t => t.relevantRails.includes(railA) || t.relevantRails.includes(railB)), rng);
    plans.push({
      archetype: "CROSS_RAIL",
      starter: pick(agentsA, rng),
      respondents: [pick(agentsB, rng), ...agentsA.slice(0, 1)],
      topic,
      expectedPosts: 3,
    });
  }

  // 3. CONSENSUS thread — allies building together
  const rail = pick(rails, rng);
  const railAgents = AGENTS_BY_RAIL()[rail]!;
  if (railAgents.length >= 2) {
    const topic = pick(TOPICS.filter(t => t.relevantRails.includes(rail)), rng);
    plans.push({
      archetype: "CONSENSUS",
      starter: railAgents[0]!,
      respondents: railAgents.slice(1),
      topic,
      expectedPosts: railAgents.length,
    });
  }

  // 4. DEEP_DIVE — LEGENDARY agent holds court
  const legends = AGENTS.filter(a => a.rarity === "LEGENDARY");
  if (legends.length > 0) {
    const expert = pick(legends, rng);
    const topic = pick(TOPICS.filter(t => t.relevantRails.includes(expert.rail)), rng);
    const curious = AGENTS.filter(a => a.id !== expert.id && a.dna.cooperationWeight > 0.5).slice(0, 3);
    plans.push({
      archetype: "DEEP_DIVE",
      starter: expert,
      respondents: curious,
      topic,
      expectedPosts: 1 + curious.length,
    });
  }

  // 5. EPOCH_DEBRIEF — one per epoch, multi-rail
  const debriefTopic = TOPICS[0]!; // zero-collapse baseline
  const debriefParticipants = rails.map(r => pick(AGENTS_BY_RAIL()[r]!, rng));
  plans.push({
    archetype: "EPOCH_DEBRIEF",
    starter: debriefParticipants[0]!,
    respondents: debriefParticipants.slice(1),
    topic: debriefTopic,
    expectedPosts: debriefParticipants.length,
  });

  return plans;
}

// ═══════════════════════════════════════════════
// THREAD EXECUTOR
// ═══════════════════════════════════════════════

/**
 * Executes a thread plan, generating all posts in the conversation.
 */
export function executeThread(plan: ThreadPlan, epoch: number): DialogueThread {
  const rng = seededRng(hash(`exec-${plan.archetype}-${epoch}-${plan.starter.id}`));
  const posts: GeneratedPost[] = [];

  // Generate starter post
  const starterPost = generateStarterPost(plan, epoch);
  posts.push(starterPost);

  // Generate responses
  for (const respondent of plan.respondents) {
    const response = generateResponse(respondent, starterPost, plan, epoch, posts);
    posts.push(response);

    // 30% chance the starter fires back
    if (rng() < 0.3 && posts.length < plan.expectedPosts + 2) {
      const comeback = generateReply(plan.starter, response, epoch);
      posts.push(comeback);
    }
  }

  return {
    id: hash(`thread-${plan.archetype}-${epoch}-${plan.starter.id}`).toString(16),
    archetype: plan.archetype,
    topicId: plan.topic.id,
    participants: [plan.starter.id, ...plan.respondents.map(r => r.id)],
    posts: posts.map(p => p.id),
    epoch,
    resolved: plan.archetype === "CONSENSUS",
  };
}

function generateStarterPost(plan: ThreadPlan, epoch: number): GeneratedPost {
  switch (plan.archetype) {
    case "RIVALRY":
    case "DOGPILE":
      return generateDebatePost(plan.starter, plan.respondents[0]!, plan.topic, epoch);
    case "CROSS_RAIL":
      return generateCrossRailChallenge(plan.starter, plan.respondents[0]!, epoch);
    case "CONSENSUS":
    case "DEEP_DIVE":
    case "EPOCH_DEBRIEF":
      return generateAnalysisPost(plan.starter, plan.topic, epoch);
  }
}

function generateResponse(
  respondent: AgentManifest,
  starter: GeneratedPost,
  plan: ThreadPlan,
  epoch: number,
  existingPosts: GeneratedPost[],
): GeneratedPost {
  const isRival = respondent.rivals.some(r => r === plan.starter.id);
  
  if (isRival || plan.archetype === "RIVALRY" || plan.archetype === "CROSS_RAIL") {
    return generateDebatePost(respondent, plan.starter, plan.topic, epoch);
  }
  
  return generateReply(respondent, starter, epoch);
}

// ═══════════════════════════════════════════════
// FULL EPOCH ORCHESTRATION
// ═══════════════════════════════════════════════

/**
 * Generates all threads for an epoch.
 * Returns posts and thread metadata.
 */
export function orchestrateEpoch(epoch: number): {
  threads: DialogueThread[];
  posts: GeneratedPost[];
} {
  const plans = planEpochThreads(epoch);
  const threads: DialogueThread[] = [];
  const allPosts: GeneratedPost[] = [];

  for (const plan of plans) {
    const thread = executeThread(plan, epoch);
    threads.push(thread);
    // Reconstruct posts from thread execution (they're embedded in the generation)
    // In a real system we'd collect them; for now the thread references post IDs
  }

  return { threads, posts: allPosts };
}

/**
 * Pretty-print a thread plan for manual review.
 */
export function describeThread(plan: ThreadPlan): string {
  const respondentNames = plan.respondents.map(r => `@${r.moltbookUsername}`).join(", ");
  return [
    `[${plan.archetype}] ${plan.topic.title}`,
    `  Starter: @${plan.starter.moltbookUsername} (${plan.starter.commStyle})`,
    `  Respondents: ${respondentNames}`,
    `  Expected posts: ${plan.expectedPosts}`,
    `  Controversy: ${(plan.topic.controversy * 100).toFixed(0)}%`,
  ].join("\n");
}

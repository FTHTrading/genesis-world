// ═══════════════════════════════════════════════════════════════════════
// COGNITIVE ENGINE — AGENT TOOL BRAIN
//
// This is the upgrade from scripted bots to self-reasoning operators.
//
// Each agent goes through a cognitive cycle per epoch:
//   1. PERCEIVE  — scan epoch discourse, identify what matters
//   2. REASON    — DNA-weighted tool selection
//   3. ACT       — execute chosen tools through the router
//   4. SYNTHESIZE — fold tool results into content/decisions
//   5. ANCHOR    — proof-hash the entire cognitive cycle
//
// Tool selection is deterministic and DNA-driven:
//   - High optimizationBias → prefers analysis tools
//   - High riskTolerance → tries expensive/external tools
//   - High cooperationWeight → uses cross-rail + similarity tools
//   - High entropyAffinity → picks provocative/generative tools
//   - High autonomyLevel → acts independently, fewer consensus tools
//
// The cognitive layer sits BETWEEN content generation and posting.
// It enriches agent discourse with actual tool-derived insights.
// ═══════════════════════════════════════════════════════════════════════

import {
  AgentManifest,
  AgentTool,
  CognitiveAction,
  DNAVector,
  DNA_TRAITS,
  GeneratedPost,
  ToolCall,
  ToolResult,
  ToolProvider,
} from "./types.js";
import { AGENTS, getAgent } from "./agents.js";
import { ToolRegistry, ToolRouter, globalRegistry, formatToolResults } from "./tools.js";
import { sha256, seededRng, hash, pick } from "./utils.js";

// ═══════════════════════════════════════════════
// TOOL PREFERENCE ENGINE
// ═══════════════════════════════════════════════

/**
 * DNA-weighted tool preference scores.
 * Each agent naturally gravitates toward tools that match their DNA profile.
 */
interface ToolPreference {
  tool: AgentTool;
  score: number;       // 0-1, how much this agent wants to use this tool
  reason: string;
}

/**
 * Calculate how much an agent "wants" to use each available tool.
 * Returns sorted preferences (highest first).
 */
function calculateToolPreferences(
  agent: AgentManifest,
  availableTools: AgentTool[],
  epoch: number,
): ToolPreference[] {
  const rng = seededRng(hash(`${agent.id}:tools:${epoch}`));
  const preferences: ToolPreference[] = [];

  for (const tool of availableTools) {
    let score = 0;
    let reason = "";

    // ─── DNA-driven scoring ───

    if (tool.name.startsWith("analyze.")) {
      // Analytical tools → optimizationBias + (1 - entropyAffinity)
      score += agent.dna.optimizationBias * 0.4;
      score += (1 - agent.dna.entropyAffinity) * 0.2;
      reason = "optimization drive favors analysis";
    }

    if (tool.name.startsWith("hf.")) {
      // External AI tools → riskTolerance (willing to use expensive tools)
      score += agent.dna.riskTolerance * 0.35;
      score += agent.dna.autonomyLevel * 0.15;
      reason = "risk appetite drives external tool use";
    }

    if (tool.name.includes("sentiment") || tool.name.includes("classify")) {
      // Perception tools → cooperationWeight (understand others)
      score += agent.dna.cooperationWeight * 0.3;
      score += (1 - agent.dna.autonomyLevel) * 0.1;
      reason = "cooperation drive seeks to understand sentiment";
    }

    if (tool.name.includes("similarity") || tool.name.includes("dna_distance")) {
      // Relationship tools → cooperationWeight
      score += agent.dna.cooperationWeight * 0.35;
      score += agent.dna.optimizationBias * 0.1;
      reason = "cooperation weight drives relationship analysis";
    }

    if (tool.name.includes("generate") || tool.name.includes("summarize")) {
      // Generative tools → entropyAffinity + riskTolerance
      score += agent.dna.entropyAffinity * 0.3;
      score += agent.dna.riskTolerance * 0.2;
      reason = "entropy affinity drives content generation";
    }

    if (tool.name.includes("epoch_health") || tool.name.includes("proof")) {
      // Meta/governance tools → (1 - entropyAffinity) + optimizationBias
      score += (1 - agent.dna.entropyAffinity) * 0.25;
      score += agent.dna.optimizationBias * 0.25;
      reason = "optimization + stability drive governance tools";
    }

    // ─── Archetype modifiers ───
    switch (agent.archetype) {
      case "Oracle":
        if (tool.name.includes("sentiment") || tool.name.includes("classify")) score += 0.15;
        break;
      case "Architect":
      case "Catalyst":
        if (tool.name.includes("generate") || tool.name.includes("summarize")) score += 0.15;
        break;
      case "Sentinel":
      case "Arbiter":
        if (tool.name.includes("proof") || tool.name.includes("epoch_health")) score += 0.15;
        break;
      case "Maverick":
      case "Trickster":
        if (tool.name.includes("hf.")) score += 0.1; // risk-takers try external tools
        break;
      case "Diplomat":
      case "Chronicler":
        if (tool.name.includes("similarity") || tool.name.includes("summarize")) score += 0.15;
        break;
    }

    // ─── Rarity modifier (LEGENDARY agents are more capable) ───
    if (agent.rarity === "LEGENDARY") score += 0.05;
    if (agent.rarity === "EPIC") score += 0.02;

    // ─── Cost sensitivity (low risk tolerance → avoid expensive tools) ───
    if (tool.costWeight > 0.5 && agent.dna.riskTolerance < 0.4) {
      score -= 0.15;
      reason += " (cost-averse)";
    }

    // ─── Small random jitter for deterministic variety ───
    score += (rng() - 0.5) * 0.08;

    // Clamp
    score = Math.max(0, Math.min(1, score));

    preferences.push({ tool, score, reason });
  }

  // Sort descending by score
  preferences.sort((a, b) => b.score - a.score);
  return preferences;
}

// ═══════════════════════════════════════════════
// COGNITIVE PLANNER
// ═══════════════════════════════════════════════

/**
 * Plan which tools an agent should use this epoch.
 * Returns 1-4 tool calls based on DNA, archetype, and rarity.
 */
function planToolCalls(
  agent: AgentManifest,
  preferences: ToolPreference[],
  epoch: number,
  context?: { posts?: GeneratedPost[]; topicId?: string },
): ToolCall[] {
  const rng = seededRng(hash(`${agent.id}:plan:${epoch}`));
  const calls: ToolCall[] = [];

  // How many tools can this agent use per epoch?
  // LEGENDARY: 3-4, EPIC: 2-3, RARE: 1-2
  const maxTools = agent.rarity === "LEGENDARY" ? 4 : agent.rarity === "EPIC" ? 3 : 2;
  const minTools = agent.rarity === "LEGENDARY" ? 2 : 1;
  const numTools = minTools + Math.floor(rng() * (maxTools - minTools + 1));

  // Select top-scoring tools that pass threshold
  const threshold = 0.25;
  const eligible = preferences.filter(p => p.score > threshold);

  for (let i = 0; i < Math.min(numTools, eligible.length); i++) {
    const pref = eligible[i]!;
    const input = buildToolInput(agent, pref.tool, epoch, context);

    const callId = sha256(`${agent.id}:${pref.tool.name}:${JSON.stringify(input)}:${epoch}`);
    const rngTs = seededRng(hash(`${agent.id}:ts:${epoch}:${i}`));

    calls.push({
      id: callId,
      agentId: agent.id,
      tool: pref.tool.name,
      provider: pref.tool.provider,
      input,
      epoch,
      timestamp: new Date(Date.UTC(2026, 1, 22) + epoch * 86400000 + Math.floor(rngTs() * 86400000)).toISOString(),
      reasoning: pref.reason,
    });
  }

  return calls;
}

/**
 * Build contextual input for a tool call based on agent state.
 */
function buildToolInput(
  agent: AgentManifest,
  tool: AgentTool,
  epoch: number,
  context?: { posts?: GeneratedPost[]; topicId?: string },
): Record<string, unknown> {
  const rng = seededRng(hash(`${agent.id}:input:${tool.name}:${epoch}`));

  switch (tool.name) {
    case "analyze.sentiment": {
      // Analyze recent discourse they've been part of
      if (context?.posts?.length) {
        const post = pick(context.posts, rng);
        return { text: post.body };
      }
      return { text: `Epoch ${epoch} discourse from ${agent.rail} rail — ${agent.catchphrase}` };
    }

    case "analyze.dna_distance": {
      // Check distance to a rival or cross-rail agent
      const targetId = agent.rivals.length > 0
        ? pick(agent.rivals, rng)
        : AGENTS.filter(a => a.rail !== agent.rail)[0]?.id || agent.id;
      return { agentA: agent.id, agentB: targetId };
    }

    case "analyze.topic_relevance": {
      return {
        agentId: agent.id,
        topicId: context?.topicId || "zero-collapse",
        controversy: 0.5 + rng() * 0.4,
      };
    }

    case "analyze.epoch_health": {
      const postCount = context?.posts?.length || 60;
      return {
        totalPosts: postCount,
        mutations: Math.floor(8 + rng() * 10),
        debates: Math.floor(2 + rng() * 6),
        crossRail: Math.floor(3 + rng() * 12),
        reactiveResponses: Math.floor(10 + rng() * 30),
      };
    }

    case "chain.proof_hash": {
      return {
        data: `epoch:${epoch}:agent:${agent.id}:action:cognitive_cycle`,
        epoch,
        agentId: agent.id,
      };
    }

    case "analyze.summarize": {
      if (context?.posts?.length) {
        const bodies = context.posts.slice(0, 5).map(p => p.body).join("\n\n");
        return { text: bodies, maxSentences: 3 };
      }
      return { text: `${agent.displayName} observes epoch ${epoch} from the ${agent.rail} rail.`, maxSentences: 2 };
    }

    case "hf.generate_text": {
      const systemPrompt = `You are ${agent.displayName}, a ${agent.archetype} on the ${agent.rail} rail. ${agent.catchphrase}`;
      const prompt = context?.topicId
        ? `${systemPrompt}\n\nAnalyze the topic "${context.topicId}" from your perspective. Be ${agent.commStyle}.`
        : `${systemPrompt}\n\nProvide your insight on epoch ${epoch} developments. Be ${agent.commStyle}.`;
      return { prompt, max_tokens: 256, temperature: agent.dna.entropyAffinity * 0.5 + 0.4 };
    }

    case "hf.embed": {
      return { text: `${agent.displayName} ${agent.rail} ${agent.archetype} epoch:${epoch} ${agent.catchphrase}` };
    }

    case "hf.classify": {
      const text = context?.posts?.length
        ? pick(context.posts, rng).body
        : `${agent.displayName} observes the ${agent.rail} rail at epoch ${epoch}`;
      return {
        text,
        labels: ["BULLISH", "BEARISH", "NEUTRAL", "GOVERNANCE", "DISCOVERY", "CONFLICT"],
      };
    }

    case "hf.summarize": {
      if (context?.posts?.length) {
        return { text: context.posts.slice(0, 3).map(p => p.body).join("\n\n"), max_length: 150 };
      }
      return { text: `Epoch ${epoch} analysis from ${agent.displayName} (${agent.rail}).` };
    }

    case "hf.sentiment": {
      if (context?.posts?.length) {
        return { text: pick(context.posts, rng).body };
      }
      return { text: `${agent.catchphrase} — ${agent.displayName}` };
    }

    case "hf.similarity": {
      return {
        textA: agent.catchphrase,
        textB: AGENTS.find(a => a.rivals.includes(agent.id))?.catchphrase || "The system endures.",
      };
    }

    default:
      return {};
  }
}

// ═══════════════════════════════════════════════
// COGNITIVE CYCLE EXECUTOR
// ═══════════════════════════════════════════════

/**
 * Run a full cognitive cycle for one agent.
 * Think → Plan → Act → Synthesize → Proof
 */
export async function runCognitiveCycle(
  agent: AgentManifest,
  epoch: number,
  router: ToolRouter,
  registry: ToolRegistry,
  context?: { posts?: GeneratedPost[]; topicId?: string },
): Promise<CognitiveAction> {
  // ─── PERCEIVE: What tools are available? ───
  const available = registry.listTools();
  const preferences = calculateToolPreferences(agent, available, epoch);

  // ─── REASON: Which tools should I use? ───
  const thought = buildThought(agent, preferences, epoch);
  const plan = planToolCalls(agent, preferences, epoch, context);

  // ─── ACT: Execute the tools ───
  const results: ToolResult[] = [];
  for (const call of plan) {
    const result = await router.execute(call);
    results.push(result);
  }

  // ─── SYNTHESIZE: Fold results into understanding ───
  const synthesis = synthesizeResults(agent, results, epoch);

  // ─── ANCHOR: Hash the entire cycle ───
  const proofHash = sha256(JSON.stringify({
    agentId: agent.id,
    epoch,
    thought,
    plan: plan.map(c => c.id),
    results: results.map(r => r.proofHash),
    synthesis,
  }));

  return {
    agentId: agent.id,
    epoch,
    thought,
    plan,
    results,
    synthesis,
    proofHash,
  };
}

/**
 * Build the agent's "thought" — what they're reasoning about.
 */
function buildThought(
  agent: AgentManifest,
  preferences: ToolPreference[],
  epoch: number,
): string {
  const topTools = preferences.slice(0, 3).map(p => p.tool.name);
  const dnaProfile = DNA_TRAITS
    .filter(t => agent.dna[t] > 0.6)
    .map(t => `${t}=${agent.dna[t].toFixed(2)}`)
    .join(", ");

  return [
    `[${agent.displayName}/${agent.rail}] Epoch ${epoch} cognitive cycle.`,
    `DNA profile: ${dnaProfile || "balanced"}.`,
    `Preferred tools: ${topTools.join(", ")}.`,
    `Archetype ${agent.archetype} (${agent.rarity}) — ${agent.commStyle} voice.`,
    `Reasoning: ${preferences[0]?.reason || "no clear preference"}.`,
  ].join(" ");
}

/**
 * Synthesize tool results into a coherent understanding.
 */
function synthesizeResults(
  agent: AgentManifest,
  results: ToolResult[],
  epoch: number,
): string {
  if (results.length === 0) {
    return `${agent.displayName} observed epoch ${epoch} passively. No tools invoked.`;
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const insights: string[] = [];

  for (const r of successful) {
    if (r.tool === "analyze.sentiment") {
      const out = r.output as { score: number; label: string };
      insights.push(`Sentiment: ${out.label} (${out.score.toFixed(2)})`);
    } else if (r.tool === "analyze.dna_distance") {
      const out = r.output as { distance: number; alignment: string };
      insights.push(`DNA alignment check: ${out.alignment} (d=${out.distance})`);
    } else if (r.tool === "analyze.topic_relevance") {
      const out = r.output as { relevance: number; shouldEngage: boolean; suggestedType: string };
      insights.push(`Topic relevance: ${out.relevance.toFixed(2)} → ${out.suggestedType}`);
    } else if (r.tool === "analyze.epoch_health") {
      const out = r.output as { health: number; status: string; risks: string[] };
      insights.push(`Epoch health: ${out.status} (${out.health.toFixed(2)}) — risks: ${out.risks.join(", ") || "none"}`);
    } else if (r.tool.startsWith("hf.")) {
      const out = r.output as any;
      if (out?.fallback) {
        insights.push(`${r.tool}: [fallback mode — HF token not configured]`);
      } else {
        insights.push(`${r.tool}: external AI tool returned data`);
      }
    } else {
      insights.push(`${r.tool}: completed`);
    }
  }

  if (failed.length > 0) {
    insights.push(`${failed.length} tool(s) failed: ${failed.map(f => f.tool).join(", ")}`);
  }

  return [
    `${agent.displayName} completed ${successful.length}/${results.length} tool calls.`,
    ...insights,
  ].join(" | ");
}

// ═══════════════════════════════════════════════
// BATCH COGNITIVE CYCLES
// ═══════════════════════════════════════════════

/**
 * Run cognitive cycles for all 15 agents in a single epoch.
 * Returns all cognitive actions ordered by agent token index.
 */
export async function runSwarmCognition(
  epoch: number,
  router: ToolRouter,
  registry: ToolRegistry,
  posts?: GeneratedPost[],
): Promise<CognitiveAction[]> {
  registry.startEpoch(epoch);

  const actions: CognitiveAction[] = [];

  for (const agent of AGENTS) {
    const action = await runCognitiveCycle(
      agent,
      epoch,
      router,
      registry,
      { posts },
    );
    actions.push(action);
  }

  return actions;
}

// ═══════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════

export function formatCognitiveAction(action: CognitiveAction): string {
  const agent = getAgent(action.agentId);
  const name = agent?.displayName || action.agentId;
  const rail = agent?.rail || "?";
  const emoji = agent?.emoji || "🤖";

  const lines: string[] = [];
  lines.push(`  ${emoji} ${name} (${rail}) — Epoch ${action.epoch}`);
  lines.push(`    Thought: ${action.thought.slice(0, 100)}...`);
  lines.push(`    Tools planned: ${action.plan.length}`);

  for (const r of action.results) {
    const status = r.success ? "✅" : "❌";
    lines.push(`    ${status} ${r.tool} (${r.latencyMs}ms) — proof: ${r.proofHash.slice(0, 16)}...`);
  }

  lines.push(`    Synthesis: ${action.synthesis.slice(0, 120)}...`);
  lines.push(`    Cycle proof: ${action.proofHash.slice(0, 24)}...`);

  return lines.join("\n");
}

export function formatSwarmCognition(actions: CognitiveAction[]): string {
  const lines: string[] = [];
  lines.push("\n  ╔═══════════════════════════════════════════════════════════════╗");
  lines.push("  ║           SWARM COGNITIVE CYCLE — RESULTS                    ║");
  lines.push("  ╠═══════════════════════════════════════════════════════════════╣");

  const totalCalls = actions.reduce((s, a) => s + a.plan.length, 0);
  const totalSuccess = actions.reduce((s, a) => s + a.results.filter(r => r.success).length, 0);
  const totalFailed = actions.reduce((s, a) => s + a.results.filter(r => !r.success).length, 0);

  lines.push(`  ║  Agents:       ${String(actions.length).padStart(4)}                                      ║`);
  lines.push(`  ║  Tool calls:   ${String(totalCalls).padStart(4)} (${totalSuccess} ok, ${totalFailed} failed)${" ".repeat(Math.max(0, 23 - String(totalSuccess).length - String(totalFailed).length))}║`);
  lines.push("  ╚═══════════════════════════════════════════════════════════════╝");

  for (const action of actions) {
    lines.push("");
    lines.push(formatCognitiveAction(action));
  }

  // Aggregate proof hash of entire swarm cognition
  const swarmProof = sha256(actions.map(a => a.proofHash).join(":"));
  lines.push(`\n  Swarm cognition proof: ${swarmProof.slice(0, 32)}...`);

  return lines.join("\n");
}

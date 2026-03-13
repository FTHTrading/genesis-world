// ═══════════════════════════════════════════════════════════════════════
// AGENT TOOL BRAIN — REGISTRY, ROUTER & PROVIDERS
//
// This is the nervous system. Agents think, choose tools, execute them,
// and fold results back into their discourse.
//
// Architecture:
//   Registry  — knows every available tool and its provider
//   Router    — dispatches tool calls to the correct provider
//   Providers — HF MCP, chain-prover, builtins, moltbook-api
//
// Security model:
//   - Every tool call is hash-proofed and anchored
//   - MCP servers have explicit permission scopes
//   - No arbitrary exec, no filesystem unless explicitly enabled
//   - Rate-limited per epoch to prevent runaway agents
//
// Determinism:
//   Built-in tools are fully deterministic (same input → same output).
//   MCP/external tools are non-deterministic but their results are
//   captured and hashed, so the proof chain remains intact.
// ═══════════════════════════════════════════════════════════════════════

import {
  AgentTool,
  ToolCall,
  ToolResult,
  ToolProvider,
  MCPServerConfig,
  MCPPermissions,
  AgentManifest,
  DNAVector,
  DNA_TRAITS,
  GeneratedPost,
} from "./types.js";
import { sha256, seededRng, hash } from "./utils.js";
import { AGENTS, getAgent } from "./agents.js";

// ═══════════════════════════════════════════════
// DEFAULT MCP SERVER CONFIGS
// ═══════════════════════════════════════════════

const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: "hf-mcp-server",
    name: "HuggingFace MCP Server",
    transport: "stdio",
    command: "npx",
    args: ["-y", "@evalstate/hf-mcp-server"],
    enabled: true,
    tools: [
      "hf.generate_text",
      "hf.embed",
      "hf.classify",
      "hf.summarize",
      "hf.sentiment",
      "hf.similarity",
    ],
    permissions: {
      allowExec: false,
      allowFilesystem: false,
      allowHttp: true,        // needs outbound to HF API
      allowModel: true,       // this IS the model provider
      maxCallsPerEpoch: 50,
      maxLatencyMs: 30_000,
    },
  },
];

// ═══════════════════════════════════════════════
// BUILT-IN TOOLS (Deterministic)
// ═══════════════════════════════════════════════

/**
 * Analyze sentiment of text based on keyword density.
 * Deterministic — no external calls.
 */
function builtinSentiment(input: { text: string }): { score: number; label: string } {
  const text = input.text.toLowerCase();
  const positive = ["robust", "survive", "growth", "stable", "success", "thrive", "optimal", "strong", "intact"];
  const negative = ["collapse", "fail", "broken", "crisis", "attack", "drain", "decay", "loss", "fragile"];

  let score = 0.5;
  for (const w of positive) if (text.includes(w)) score += 0.05;
  for (const w of negative) if (text.includes(w)) score -= 0.05;
  score = Math.max(0, Math.min(1, score));

  const label = score > 0.6 ? "POSITIVE" : score < 0.4 ? "NEGATIVE" : "NEUTRAL";
  return { score, label };
}

/**
 * Compute DNA distance between two agents.
 */
function builtinDnaDistance(input: { agentA: string; agentB: string }): { distance: number; alignment: string } {
  const a = getAgent(input.agentA);
  const b = getAgent(input.agentB);
  if (!a || !b) return { distance: 1, alignment: "UNKNOWN" };

  let sumSq = 0;
  for (const trait of DNA_TRAITS) {
    const diff = a.dna[trait] - b.dna[trait];
    sumSq += diff * diff;
  }
  const distance = Math.sqrt(sumSq / DNA_TRAITS.length);
  const alignment = distance < 0.2 ? "ALLIED" : distance > 0.5 ? "OPPOSED" : "NEUTRAL";
  return { distance: Math.round(distance * 1000) / 1000, alignment };
}

/**
 * Score topic controversy relative to an agent's DNA.
 */
function builtinTopicRelevance(input: { agentId: string; topicId: string; controversy: number }): {
  relevance: number; shouldEngage: boolean; suggestedType: string;
} {
  const agent = getAgent(input.agentId);
  if (!agent) return { relevance: 0, shouldEngage: false, suggestedType: "REFLECTION" };

  const relevance =
    agent.dna.riskTolerance * input.controversy * 0.3 +
    agent.dna.entropyAffinity * 0.2 +
    agent.dna.autonomyLevel * 0.15 +
    (1 - agent.dna.cooperationWeight) * input.controversy * 0.2 +
    agent.debateProbability * 0.15;

  const shouldEngage = relevance > 0.35;
  const suggestedType =
    relevance > 0.7 ? "DEBATE" :
    relevance > 0.5 ? "ANALYSIS" :
    relevance > 0.35 ? "CROSS_RAIL" : "REFLECTION";

  return {
    relevance: Math.round(relevance * 1000) / 1000,
    shouldEngage,
    suggestedType,
  };
}

/**
 * Analyze epoch health from metrics.
 */
function builtinEpochHealth(input: {
  totalPosts: number; mutations: number; debates: number;
  crossRail: number; reactiveResponses: number;
}): { health: number; status: string; risks: string[] } {
  const risks: string[] = [];

  let health = 0.5;
  health += Math.min(input.totalPosts / 100, 0.2);     // more discourse = healthier
  health += Math.min(input.crossRail / 20, 0.15);      // cross-rail diversity
  health += Math.min(input.debates / 10, 0.1);          // active debates
  health -= input.mutations > 20 ? 0.1 : 0;            // too many mutations = unstable

  if (input.totalPosts < 30) risks.push("LOW_DISCOURSE");
  if (input.crossRail < 5) risks.push("RAIL_ISOLATION");
  if (input.reactiveResponses < 10) risks.push("LOW_REACTIVITY");
  if (input.mutations > 20) risks.push("MUTATION_STORM");
  if (input.debates === 0) risks.push("NO_CONFLICT");

  health = Math.max(0, Math.min(1, health));
  const status = health > 0.7 ? "THRIVING" : health > 0.4 ? "STABLE" : "AT_RISK";

  return { health: Math.round(health * 1000) / 1000, status, risks };
}

/**
 * Hash-proof a piece of content for chain anchoring.
 */
function builtinProofHash(input: { data: string; epoch: number; agentId: string }): { proofHash: string } {
  return { proofHash: sha256(`${input.agentId}:${input.epoch}:${input.data}`) };
}

/**
 * Summarize text by extracting key sentences (deterministic, no LLM).
 */
function builtinSummarize(input: { text: string; maxSentences?: number }): { summary: string } {
  const sentences = input.text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  const max = input.maxSentences || 3;
  // Score by length + keyword density
  const scored = sentences.map(s => ({
    text: s,
    score: s.length * 0.01 + (s.match(/\b(data|proof|epoch|agent|DNA|collapse|survive|treasury|rail)\b/gi)?.length || 0) * 0.2,
  }));
  scored.sort((a, b) => b.score - a.score);
  return { summary: scored.slice(0, max).map(s => s.text + ".").join(" ") };
}

// ═══════════════════════════════════════════════
// TOOL REGISTRY
// ═══════════════════════════════════════════════

const BUILTIN_TOOLS: AgentTool[] = [
  {
    name: "analyze.sentiment",
    description: "Analyze sentiment of text using keyword density. Returns score (0-1) and label.",
    provider: "builtin",
    inputSchema: {
      text: { type: "string", description: "Text to analyze", required: true },
    },
    outputType: "json",
    costWeight: 0,
    latencyMs: 1,
    requiresAuth: false,
  },
  {
    name: "analyze.dna_distance",
    description: "Compute DNA distance between two agents. Returns distance and alignment label.",
    provider: "builtin",
    inputSchema: {
      agentA: { type: "string", description: "First agent ID", required: true },
      agentB: { type: "string", description: "Second agent ID", required: true },
    },
    outputType: "json",
    costWeight: 0,
    latencyMs: 1,
    requiresAuth: false,
  },
  {
    name: "analyze.topic_relevance",
    description: "Score how relevant and controversial a topic is to an agent based on their DNA.",
    provider: "builtin",
    inputSchema: {
      agentId: { type: "string", description: "Agent ID", required: true },
      topicId: { type: "string", description: "Topic ID", required: true },
      controversy: { type: "number", description: "Topic controversy (0-1)", required: true },
    },
    outputType: "json",
    costWeight: 0,
    latencyMs: 1,
    requiresAuth: false,
  },
  {
    name: "analyze.epoch_health",
    description: "Analyze overall epoch health from discourse metrics. Returns health score and risks.",
    provider: "builtin",
    inputSchema: {
      totalPosts: { type: "number", description: "Total posts this epoch", required: true },
      mutations: { type: "number", description: "DNA mutations this epoch", required: true },
      debates: { type: "number", description: "Debates resolved", required: true },
      crossRail: { type: "number", description: "Cross-rail exchanges", required: true },
      reactiveResponses: { type: "number", description: "Reactive responses generated", required: true },
    },
    outputType: "json",
    costWeight: 0,
    latencyMs: 1,
    requiresAuth: false,
  },
  {
    name: "chain.proof_hash",
    description: "Generate a SHA-256 proof hash for content anchoring.",
    provider: "chain-prover",
    inputSchema: {
      data: { type: "string", description: "Data to hash", required: true },
      epoch: { type: "number", description: "Epoch number", required: true },
      agentId: { type: "string", description: "Agent performing the action", required: true },
    },
    outputType: "json",
    costWeight: 0,
    latencyMs: 1,
    requiresAuth: false,
  },
  {
    name: "analyze.summarize",
    description: "Extract key sentences from text (deterministic, no LLM).",
    provider: "builtin",
    inputSchema: {
      text: { type: "string", description: "Text to summarize", required: true },
      maxSentences: { type: "number", description: "Max sentences to extract", required: false, default: 3 },
    },
    outputType: "json",
    costWeight: 0,
    latencyMs: 1,
    requiresAuth: false,
  },
];

const HF_TOOLS: AgentTool[] = [
  {
    name: "hf.generate_text",
    description: "Generate text using HuggingFace models. Powers agent reasoning and content generation.",
    provider: "hf-mcp",
    inputSchema: {
      prompt: { type: "string", description: "Input prompt", required: true },
      model: { type: "string", description: "HF model ID", required: false, default: "mistralai/Mistral-7B-Instruct-v0.3" },
      max_tokens: { type: "number", description: "Max output tokens", required: false, default: 512 },
      temperature: { type: "number", description: "Sampling temperature", required: false, default: 0.7 },
    },
    outputType: "text",
    costWeight: 0.8,
    latencyMs: 5000,
    requiresAuth: true,
  },
  {
    name: "hf.embed",
    description: "Generate text embeddings for semantic search and RAG.",
    provider: "hf-mcp",
    inputSchema: {
      text: { type: "string", description: "Text to embed", required: true },
      model: { type: "string", description: "Embedding model ID", required: false, default: "sentence-transformers/all-MiniLM-L6-v2" },
    },
    outputType: "embedding",
    costWeight: 0.3,
    latencyMs: 1000,
    requiresAuth: true,
  },
  {
    name: "hf.classify",
    description: "Classify text into categories using zero-shot classification.",
    provider: "hf-mcp",
    inputSchema: {
      text: { type: "string", description: "Text to classify", required: true },
      labels: { type: "array", description: "Candidate labels", required: true },
      model: { type: "string", description: "Classification model", required: false, default: "facebook/bart-large-mnli" },
    },
    outputType: "classification",
    costWeight: 0.5,
    latencyMs: 2000,
    requiresAuth: true,
  },
  {
    name: "hf.summarize",
    description: "Summarize text using a transformer model (non-deterministic).",
    provider: "hf-mcp",
    inputSchema: {
      text: { type: "string", description: "Text to summarize", required: true },
      model: { type: "string", description: "Summarization model", required: false, default: "facebook/bart-large-cnn" },
      max_length: { type: "number", description: "Max summary length", required: false, default: 150 },
    },
    outputType: "text",
    costWeight: 0.6,
    latencyMs: 3000,
    requiresAuth: true,
  },
  {
    name: "hf.sentiment",
    description: "Analyze sentiment using a transformer model (non-deterministic, higher accuracy than builtin).",
    provider: "hf-mcp",
    inputSchema: {
      text: { type: "string", description: "Text to analyze", required: true },
      model: { type: "string", description: "Sentiment model", required: false, default: "distilbert-base-uncased-finetuned-sst-2-english" },
    },
    outputType: "classification",
    costWeight: 0.4,
    latencyMs: 1500,
    requiresAuth: true,
  },
  {
    name: "hf.similarity",
    description: "Compute semantic similarity between two texts.",
    provider: "hf-mcp",
    inputSchema: {
      textA: { type: "string", description: "First text", required: true },
      textB: { type: "string", description: "Second text", required: true },
      model: { type: "string", description: "Similarity model", required: false, default: "sentence-transformers/all-MiniLM-L6-v2" },
    },
    outputType: "number",
    costWeight: 0.4,
    latencyMs: 1500,
    requiresAuth: true,
  },
];

// ═══════════════════════════════════════════════
// TOOL REGISTRY CLASS
// ═══════════════════════════════════════════════

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();
  private mcpServers: Map<string, MCPServerConfig> = new Map();
  private callCounts: Map<string, number> = new Map(); // provider → calls this epoch
  private currentEpoch: number = 0;

  constructor() {
    // Register all built-in tools
    for (const tool of BUILTIN_TOOLS) {
      this.tools.set(tool.name, tool);
    }

    // Register HF tools (available when server is running)
    for (const tool of HF_TOOLS) {
      this.tools.set(tool.name, tool);
    }

    // Register default MCP servers
    for (const server of DEFAULT_MCP_SERVERS) {
      this.mcpServers.set(server.id, server);
    }
  }

  /** Start a new epoch — resets rate limits. */
  startEpoch(epoch: number): void {
    this.currentEpoch = epoch;
    this.callCounts.clear();
  }

  /** Get all available tools. */
  listTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /** Get tools available to a specific provider. */
  listByProvider(provider: ToolProvider): AgentTool[] {
    return this.listTools().filter(t => t.provider === provider);
  }

  /** Get a specific tool by name. */
  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  /** Check if a provider is within its rate limit. */
  canCall(provider: ToolProvider): boolean {
    const count = this.callCounts.get(provider) || 0;

    if (provider === "builtin" || provider === "chain-prover") return true;

    const server = Array.from(this.mcpServers.values()).find(
      s => s.tools.some(t => this.tools.get(t)?.provider === provider),
    );
    if (!server) return true;
    return count < server.permissions.maxCallsPerEpoch;
  }

  /** Record a tool call for rate limiting. */
  recordCall(provider: ToolProvider): void {
    const count = this.callCounts.get(provider) || 0;
    this.callCounts.set(provider, count + 1);
  }

  /** Get MCP server config. */
  getMCPServer(id: string): MCPServerConfig | undefined {
    return this.mcpServers.get(id);
  }

  /** List all configured MCP servers. */
  listMCPServers(): MCPServerConfig[] {
    return Array.from(this.mcpServers.values());
  }

  /** Register a custom tool at runtime. */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /** Register a custom MCP server config. */
  registerMCPServer(config: MCPServerConfig): void {
    this.mcpServers.set(config.id, config);
  }
}

// ═══════════════════════════════════════════════
// TOOL ROUTER
// ═══════════════════════════════════════════════

/**
 * Routes tool calls to the appropriate provider/executor.
 * Built-in tools execute locally and deterministically.
 * MCP tools call out to the configured MCP server.
 */
export class ToolRouter {
  private registry: ToolRegistry;
  private hfApiToken: string;

  constructor(registry: ToolRegistry, hfApiToken?: string) {
    this.registry = registry;
    this.hfApiToken = hfApiToken || process.env.HF_API_TOKEN || "";
  }

  /**
   * Execute a tool call and return the result.
   */
  async execute(call: ToolCall): Promise<ToolResult> {
    const tool = this.registry.getTool(call.tool);
    const start = Date.now();

    if (!tool) {
      return {
        callId: call.id,
        tool: call.tool,
        provider: call.provider,
        output: null,
        success: false,
        error: `Tool not found: ${call.tool}`,
        latencyMs: 0,
        proofHash: sha256(`ERROR:${call.id}`),
      };
    }

    // Rate limit check
    if (!this.registry.canCall(tool.provider)) {
      return {
        callId: call.id,
        tool: call.tool,
        provider: tool.provider,
        output: null,
        success: false,
        error: `Rate limit exceeded for provider: ${tool.provider}`,
        latencyMs: 0,
        proofHash: sha256(`RATE_LIMIT:${call.id}`),
      };
    }

    try {
      let output: unknown;

      switch (tool.provider) {
        case "builtin":
        case "chain-prover":
          output = this.executeBuiltin(call.tool, call.input);
          break;

        case "hf-mcp":
          output = await this.executeHF(call.tool, call.input, tool);
          break;

        case "moltbook-api":
          output = { status: "not_implemented", tool: call.tool };
          break;

        default:
          output = { status: "unknown_provider", provider: tool.provider };
      }

      const latencyMs = Date.now() - start;
      this.registry.recordCall(tool.provider);

      const proofHash = sha256(
        JSON.stringify({ callId: call.id, tool: call.tool, input: call.input, output }),
      );

      return {
        callId: call.id,
        tool: call.tool,
        provider: tool.provider,
        output,
        success: true,
        latencyMs,
        proofHash,
      };
    } catch (err: any) {
      return {
        callId: call.id,
        tool: call.tool,
        provider: tool.provider,
        output: null,
        success: false,
        error: err.message || String(err),
        latencyMs: Date.now() - start,
        proofHash: sha256(`ERROR:${call.id}:${err.message}`),
      };
    }
  }

  /**
   * Execute a built-in (deterministic) tool.
   */
  private executeBuiltin(toolName: string, input: Record<string, unknown>): unknown {
    switch (toolName) {
      case "analyze.sentiment":
        return builtinSentiment(input as any);
      case "analyze.dna_distance":
        return builtinDnaDistance(input as any);
      case "analyze.topic_relevance":
        return builtinTopicRelevance(input as any);
      case "analyze.epoch_health":
        return builtinEpochHealth(input as any);
      case "chain.proof_hash":
        return builtinProofHash(input as any);
      case "analyze.summarize":
        return builtinSummarize(input as any);
      default:
        throw new Error(`Unknown builtin tool: ${toolName}`);
    }
  }

  /**
   * Execute an HF MCP tool via HuggingFace Inference API.
   * Falls back to built-in equivalent if HF is unavailable.
   */
  private async executeHF(
    toolName: string,
    input: Record<string, unknown>,
    tool: AgentTool,
  ): Promise<unknown> {
    if (!this.hfApiToken) {
      // Fallback to builtin equivalents
      return this.hfFallback(toolName, input);
    }

    const taskMap: Record<string, string> = {
      "hf.generate_text": "text-generation",
      "hf.embed": "feature-extraction",
      "hf.classify": "zero-shot-classification",
      "hf.summarize": "summarization",
      "hf.sentiment": "text-classification",
      "hf.similarity": "feature-extraction",
    };

    const task = taskMap[toolName];
    if (!task) throw new Error(`Unknown HF tool: ${toolName}`);

    const model = (input.model as string) || "";
    const url = `https://api-inference.huggingface.co/models/${model}`;

    const body = this.buildHFPayload(toolName, input);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.hfApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(tool.latencyMs || 30_000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`HF API error ${response.status}: ${errText}`);
    }

    return response.json();
  }

  /**
   * Build the HF Inference API payload for a given tool.
   */
  private buildHFPayload(
    toolName: string,
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    switch (toolName) {
      case "hf.generate_text":
        return {
          inputs: input.prompt,
          parameters: {
            max_new_tokens: input.max_tokens || 512,
            temperature: input.temperature || 0.7,
            return_full_text: false,
          },
        };
      case "hf.embed":
        return { inputs: input.text };
      case "hf.classify":
        return {
          inputs: input.text,
          parameters: { candidate_labels: input.labels },
        };
      case "hf.summarize":
        return {
          inputs: input.text,
          parameters: { max_length: input.max_length || 150 },
        };
      case "hf.sentiment":
        return { inputs: input.text };
      case "hf.similarity":
        return {
          inputs: {
            source_sentence: input.textA,
            sentences: [input.textB],
          },
        };
      default:
        return { inputs: input.text || input.prompt || "" };
    }
  }

  /**
   * Fallback to built-in equivalents when HF is unavailable.
   * This keeps the swarm running even without external tools.
   */
  private hfFallback(toolName: string, input: Record<string, unknown>): unknown {
    switch (toolName) {
      case "hf.sentiment":
        return builtinSentiment({ text: String(input.text || "") });
      case "hf.summarize":
        return builtinSummarize({ text: String(input.text || ""), maxSentences: 3 });
      case "hf.generate_text":
        return {
          generated_text: `[BUILTIN FALLBACK] Agent reasoning on: ${String(input.prompt || "").slice(0, 100)}...`,
          fallback: true,
        };
      case "hf.embed":
        // Deterministic pseudo-embedding from hash
        const h = hash(String(input.text || ""));
        const rng = seededRng(h);
        const embedding = Array.from({ length: 384 }, () => rng() * 2 - 1);
        return { embedding, dimensions: 384, fallback: true };
      case "hf.classify":
        const labels = (input.labels as string[]) || ["unknown"];
        return {
          labels,
          scores: labels.map((_, i) => 1 / labels.length),
          fallback: true,
        };
      case "hf.similarity":
        return { similarity: 0.5, fallback: true };
      default:
        return { fallback: true, tool: toolName };
    }
  }
}

// ═══════════════════════════════════════════════
// FORMATTING
// ═══════════════════════════════════════════════

export function formatToolRegistry(registry: ToolRegistry): string {
  const lines: string[] = [];
  lines.push("\n  ═══ TOOL REGISTRY ═══\n");

  const byProvider = new Map<string, AgentTool[]>();
  for (const tool of registry.listTools()) {
    const list = byProvider.get(tool.provider) || [];
    list.push(tool);
    byProvider.set(tool.provider, list);
  }

  for (const [provider, tools] of byProvider) {
    lines.push(`  ┌─ ${provider.toUpperCase()} (${tools.length} tools) ─┐`);
    for (const tool of tools) {
      const auth = tool.requiresAuth ? "🔒" : "🔓";
      const cost = "●".repeat(Math.ceil(tool.costWeight * 5)).padEnd(5, "○");
      lines.push(`  │  ${auth} ${tool.name.padEnd(28)} [${cost}] ${tool.description.slice(0, 50)}`);
    }
    lines.push("  └" + "─".repeat(50) + "┘");
  }

  lines.push("\n  MCP SERVERS:");
  for (const server of registry.listMCPServers()) {
    const status = server.enabled ? "✅" : "⏸️";
    lines.push(`    ${status} ${server.name} (${server.id}) — ${server.transport} — ${server.tools.length} tools`);
    lines.push(`       Permissions: exec=${server.permissions.allowExec} fs=${server.permissions.allowFilesystem} http=${server.permissions.allowHttp} model=${server.permissions.allowModel}`);
    lines.push(`       Rate limit: ${server.permissions.maxCallsPerEpoch}/epoch, timeout=${server.permissions.maxLatencyMs}ms`);
  }

  return lines.join("\n");
}

export function formatToolResults(results: ToolResult[]): string {
  const lines: string[] = [];
  lines.push("\n  ═══ TOOL EXECUTION RESULTS ═══\n");

  for (const r of results) {
    const status = r.success ? "✅" : "❌";
    lines.push(`  ${status} ${r.tool} (${r.provider}) — ${r.latencyMs}ms`);
    if (r.error) {
      lines.push(`     Error: ${r.error}`);
    } else {
      const out = JSON.stringify(r.output);
      lines.push(`     Output: ${out.slice(0, 120)}${out.length > 120 ? "..." : ""}`);
    }
    lines.push(`     Proof: ${r.proofHash.slice(0, 24)}...`);
  }

  return lines.join("\n");
}

// Singleton registry instance
export const globalRegistry = new ToolRegistry();

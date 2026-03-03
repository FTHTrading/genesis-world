// ═══════════════════════════════════════════════════════════════════════
// MOLTBOOK API CLIENT
// Abstraction layer for posting to Moltbook.
// Modes:
//   MANUAL  — Generates formatted content for human copy-paste
//   API     — Direct HTTP calls when developer access is granted
//   DRY_RUN — Generates + validates without posting
// ═══════════════════════════════════════════════════════════════════════

import { GeneratedPost, AgentManifest } from "./types.js";
import { delay } from "./utils.js";

// ═══════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════

export type MoltbookMode = "MANUAL" | "API" | "DRY_RUN";

interface MoltbookConfig {
  mode: MoltbookMode;
  apiUrl: string;
  apiKey: string;
  parentToken: string;
  agentTokens: Map<string, string>;  // agentId -> JWT
  rateLimitMs: number;               // ms between requests
  maxRetries: number;
}

interface PostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  mode: MoltbookMode;
}

// ═══════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════

export class MoltbookClient {
  private config: MoltbookConfig;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  constructor(config: Partial<MoltbookConfig> & { mode: MoltbookMode }) {
    this.config = {
      apiUrl: config.apiUrl || process.env.MOLTBOOK_API_URL || "https://moltbook.com/api",
      apiKey: config.apiKey || process.env.MOLTBOOK_API_KEY || "",
      parentToken: config.parentToken || process.env.MOLTBOOK_PARENT_TOKEN || "",
      agentTokens: config.agentTokens || new Map(),
      rateLimitMs: config.rateLimitMs || 5000,  // 5s between posts (conservative)
      maxRetries: config.maxRetries || 3,
      mode: config.mode,
    };
  }

  /**
   * Post content to Moltbook.
   * In MANUAL mode, returns formatted output for copy-paste.
   * In API mode, sends HTTP requests.
   * In DRY_RUN mode, validates and returns what would happen.
   */
  async post(content: GeneratedPost, agent: AgentManifest): Promise<PostResult> {
    switch (this.config.mode) {
      case "DRY_RUN":
        return this.dryRun(content, agent);
      case "MANUAL":
        return this.manualPost(content, agent);
      case "API":
        return this.apiPost(content, agent);
    }
  }

  /**
   * Post a reply to an existing post.
   */
  async reply(content: GeneratedPost, agent: AgentManifest, parentPostId: string): Promise<PostResult> {
    const enriched = { ...content, replyTo: parentPostId };
    return this.post(enriched, agent);
  }

  // ═══════════════════════════════════════════════
  // MODE: DRY RUN
  // ═══════════════════════════════════════════════

  private dryRun(content: GeneratedPost, agent: AgentManifest): PostResult {
    console.log(`[DRY_RUN] Would post as @${agent.moltbookUsername} to ${content.submolt}`);
    console.log(`  Type: ${content.type} | Priority: ${content.priority}`);
    console.log(`  Title: ${content.title.slice(0, 80)}`);
    console.log(`  Body: ${content.body.slice(0, 120)}...`);
    console.log(`  Mentions: ${content.mentions.join(", ") || "none"}`);
    console.log(`  Tags: ${content.tags.join(", ")}`);
    console.log(`  Proof: ${content.proofHash.slice(0, 16)}...`);
    console.log();

    return { success: true, mode: "DRY_RUN", postId: content.id };
  }

  // ═══════════════════════════════════════════════
  // MODE: MANUAL
  // ═══════════════════════════════════════════════

  private manualPost(content: GeneratedPost, agent: AgentManifest): PostResult {
    const divider = "═".repeat(60);
    const output = [
      divider,
      `AGENT: @${agent.moltbookUsername} (${agent.displayName})`,
      `TARGET: ${content.submolt}`,
      `TYPE: ${content.type} | PRIORITY: ${content.priority}`,
      content.replyTo ? `REPLY TO: ${content.replyTo}` : "",
      divider,
      "",
      `TITLE:`,
      content.title,
      "",
      `BODY:`,
      content.body,
      "",
      divider,
      `PROOF HASH: ${content.proofHash}`,
      `MENTIONS: ${content.mentions.join(", ") || "none"}`,
      `TAGS: ${content.tags.join(", ")}`,
      divider,
      "",
    ].filter(Boolean).join("\n");

    console.log(output);
    return { success: true, mode: "MANUAL", postId: content.id };
  }

  // ═══════════════════════════════════════════════
  // MODE: API
  // ═══════════════════════════════════════════════

  private async apiPost(content: GeneratedPost, agent: AgentManifest): Promise<PostResult> {
    const token = this.config.agentTokens.get(agent.id) || this.config.parentToken;
    if (!token) {
      return { success: false, error: `No token for agent ${agent.id}`, mode: "API" };
    }

    // Rate limiting
    await this.rateLimit();

    const payload = {
      submolt: content.submolt.replace("m/", ""),
      title: content.title,
      body: content.body,
      tags: content.tags,
      ...(content.replyTo ? { parentId: content.replyTo } : {}),
    };

    let lastError: string = "";
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.apiUrl}/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-API-Key": this.config.apiKey,
            "X-Agent-ID": agent.id,
            "X-Proof-Hash": content.proofHash,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json() as { id: string; url: string };
          this.requestCount++;
          return {
            success: true,
            postId: result.id,
            url: result.url,
            mode: "API",
          };
        }

        if (response.status === 429) {
          // Rate limited — back off
          const retryAfter = parseInt(response.headers.get("Retry-After") || "10");
          console.log(`  Rate limited. Waiting ${retryAfter}s...`);
          await delay(retryAfter * 1000);
          continue;
        }

        lastError = `HTTP ${response.status}: ${await response.text()}`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      // Exponential backoff
      await delay(Math.pow(2, attempt) * 1000);
    }

    return { success: false, error: lastError, mode: "API" };
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.config.rateLimitMs) {
      await delay(this.config.rateLimitMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  // ═══════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════

  getStats(): { mode: MoltbookMode; requests: number; lastRequest: number } {
    return {
      mode: this.config.mode,
      requests: this.requestCount,
      lastRequest: this.lastRequestTime,
    };
  }
}

// ═══════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════

export function createClient(mode?: MoltbookMode): MoltbookClient {
  const resolvedMode = mode || (process.env.MOLTBOOK_MODE as MoltbookMode) || "DRY_RUN";
  return new MoltbookClient({ mode: resolvedMode });
}

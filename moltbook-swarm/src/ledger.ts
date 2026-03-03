// ═══════════════════════════════════════════════════════════════════════
// IDEMPOTENT POSTING LEDGER
// Triple-layer dedup: content hash + post ID + proof hash.
// Atomic writes. Crash-safe. Never posts the same thing twice.
// Pattern proven on the GSP Reddit deployment.
// ═══════════════════════════════════════════════════════════════════════

import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { LedgerEntry, GeneratedPost } from "./types.js";
import { sha256Sync } from "./utils.js";

// ═══════════════════════════════════════════════
// LEDGER STORE
// ═══════════════════════════════════════════════

const DEFAULT_LEDGER_PATH = join(process.cwd(), "data", "ledger.json");
const LOCK_SUFFIX = ".lock";

interface LedgerState {
  version: number;
  created: string;
  lastModified: string;
  entries: LedgerEntry[];
  // Indexes for O(1) lookup
  byContentHash: Record<string, number>;  // hash → index
  byPostId: Record<string, number>;       // postId → index
  byProofHash: Record<string, number>;    // proofHash → index
}

export class Ledger {
  private state: LedgerState;
  private filePath: string;
  private dirty: boolean = false;

  private constructor(state: LedgerState, filePath: string) {
    this.state = state;
    this.filePath = filePath;
  }

  // ═══════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════

  /**
   * Load or create ledger from disk.
   */
  static async load(filePath: string = DEFAULT_LEDGER_PATH): Promise<Ledger> {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    let state: LedgerState;
    if (existsSync(filePath)) {
      const raw = await readFile(filePath, "utf-8");
      state = JSON.parse(raw) as LedgerState;
      // Rebuild indexes if missing
      if (!state.byContentHash) {
        state.byContentHash = {};
        state.byPostId = {};
        state.byProofHash = {};
        state.entries.forEach((entry, i) => {
          state.byContentHash[entry.contentHash] = i;
          state.byPostId[entry.postId] = i;
          state.byProofHash[entry.proofHash] = i;
        });
      }
    } else {
      state = {
        version: 1,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        entries: [],
        byContentHash: {},
        byPostId: {},
        byProofHash: {},
      };
    }

    return new Ledger(state, filePath);
  }

  /**
   * Persist ledger to disk. Atomic write (write to temp, then rename).
   */
  async save(): Promise<void> {
    if (!this.dirty) return;

    this.state.lastModified = new Date().toISOString();
    const tempPath = this.filePath + ".tmp";
    await writeFile(tempPath, JSON.stringify(this.state, null, 2), "utf-8");

    // Atomic rename
    const { rename } = await import("node:fs/promises");
    await rename(tempPath, this.filePath);
    this.dirty = false;
  }

  // ═══════════════════════════════════════════════
  // DEDUP — TRIPLE LAYER
  // ═══════════════════════════════════════════════

  /**
   * Check if a post has already been recorded.
   * Returns true if ANY of the three hashes match.
   */
  isDuplicate(post: GeneratedPost): boolean {
    const contentHash = sha256Sync(`${post.agent}:${post.type}:${post.title}:${post.body.slice(0, 200)}`);
    return (
      contentHash in this.state.byContentHash ||
      post.id in this.state.byPostId ||
      post.proofHash in this.state.byProofHash
    );
  }

  /**
   * Get dedup report for a post.
   */
  dedupReport(post: GeneratedPost): { duplicate: boolean; matchedOn: string[] } {
    const contentHash = sha256Sync(`${post.agent}:${post.type}:${post.title}:${post.body.slice(0, 200)}`);
    const matched: string[] = [];

    if (contentHash in this.state.byContentHash) matched.push("contentHash");
    if (post.id in this.state.byPostId) matched.push("postId");
    if (post.proofHash in this.state.byProofHash) matched.push("proofHash");

    return { duplicate: matched.length > 0, matchedOn: matched };
  }

  // ═══════════════════════════════════════════════
  // RECORD
  // ═══════════════════════════════════════════════

  /**
   * Record a successfully posted item.
   * Returns false if it's a duplicate (won't record).
   */
  record(post: GeneratedPost, moltbookPostId?: string, moltbookUrl?: string): boolean {
    if (this.isDuplicate(post)) {
      return false;
    }

    const contentHash = sha256Sync(`${post.agent}:${post.type}:${post.title}:${post.body.slice(0, 200)}`);
    const entry: LedgerEntry = {
      postId: post.id,
      agentId: post.agent,
      contentHash,
      proofHash: post.proofHash,
      submolt: post.submolt,
      type: post.type,
      timestamp: new Date().toISOString(),
      moltbookPostId,
      moltbookUrl,
      epoch: post.epoch,
    };

    const index = this.state.entries.length;
    this.state.entries.push(entry);
    this.state.byContentHash[contentHash] = index;
    this.state.byPostId[post.id] = index;
    this.state.byProofHash[post.proofHash] = index;
    this.dirty = true;

    return true;
  }

  // ═══════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════

  /**
   * Get all entries for a specific agent.
   */
  getByAgent(agentId: string): LedgerEntry[] {
    return this.state.entries.filter(e => e.agentId === agentId);
  }

  /**
   * Get all entries for a specific epoch.
   */
  getByEpoch(epoch: number): LedgerEntry[] {
    return this.state.entries.filter(e => e.epoch === epoch);
  }

  /**
   * Get all entries for a specific submolt.
   */
  getBySubmolt(submolt: string): LedgerEntry[] {
    return this.state.entries.filter(e => e.submolt === submolt);
  }

  /**
   * Total entries.
   */
  get size(): number {
    return this.state.entries.length;
  }

  /**
   * Summary statistics.
   */
  stats(): {
    total: number;
    byAgent: Record<string, number>;
    byType: Record<string, number>;
    bySubmolt: Record<string, number>;
    byEpoch: Record<number, number>;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    const byAgent: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const bySubmolt: Record<string, number> = {};
    const byEpoch: Record<number, number> = {};

    for (const entry of this.state.entries) {
      byAgent[entry.agentId] = (byAgent[entry.agentId] || 0) + 1;
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      bySubmolt[entry.submolt] = (bySubmolt[entry.submolt] || 0) + 1;
      byEpoch[entry.epoch] = (byEpoch[entry.epoch] || 0) + 1;
    }

    const timestamps = this.state.entries.map(e => e.timestamp).sort();
    return {
      total: this.state.entries.length,
      byAgent,
      byType,
      bySubmolt,
      byEpoch,
      oldestEntry: timestamps[0] || null,
      newestEntry: timestamps[timestamps.length - 1] || null,
    };
  }

  /**
   * Export full ledger for backup/audit.
   */
  export(): LedgerState {
    return { ...this.state };
  }
}

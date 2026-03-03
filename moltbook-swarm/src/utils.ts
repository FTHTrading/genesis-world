// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// Deterministic hashing, seeded RNG, and helpers.
// Every output is reproducible from the same seed.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Simple deterministic hash (DJB2a variant).
 * Returns a positive 32-bit integer.
 */
export function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
    h = h >>> 0; // keep unsigned
  }
  return h;
}

import { createHash } from "node:crypto";

/**
 * SHA-256 hex string for content dedup + proof hashes.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Alias for sha256 (both are synchronous).
 */
export const sha256Sync = sha256;

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Returns a function that produces floats in [0, 1).
 * Same seed = same sequence, always.
 */
export function seededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Pick a random element from an array using an RNG function.
 */
export function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/**
 * Shuffle array in-place using Fisher-Yates with seeded RNG.
 */
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Generate a deterministic ISO timestamp for an epoch + rng offset.
 * Base date: 2026-02-22 (GSP genesis).
 */
export function formatTimestamp(epoch: number, rng: () => number): string {
  const base = new Date("2026-02-22T00:00:00Z");
  // Each epoch ~ 1 day, with some jitter
  const epochMs = epoch * 86400000;
  const jitterMs = Math.floor(rng() * 86400000);
  return new Date(base.getTime() + epochMs + jitterMs).toISOString();
}

/**
 * Truncate text to maxLen, adding ellipsis if needed.
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

/**
 * Slugify a string for IDs and filenames.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Delay helper for rate limiting.
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format a number with locale separators.
 */
export function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Group array by a key function.
 */
export function groupBy<T, K extends string | number>(arr: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of arr) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

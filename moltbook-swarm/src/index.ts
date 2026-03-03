#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// GSP MOLTBOOK SWARM — MAIN CLI
// The most sophisticated agent civilization on the agent internet.
// 15 Genesis agents. On-chain verified DNA. Deterministic personalities.
// ═══════════════════════════════════════════════════════════════════════

import { AGENTS, getAgent, AGENTS_BY_RAIL } from "./agents.js";
import { generateEpochContent, generateAnalysisPost, generateDebatePost, TOPICS } from "./content.js";
import { planEpochThreads, executeThread, describeThread } from "./dialogue.js";
import { createClient, MoltbookMode } from "./client.js";
import { Ledger } from "./ledger.js";
import { pick, seededRng, hash, fmt } from "./utils.js";

// ═══════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════

const COMMANDS: Record<string, string> = {
  generate:   "Generate all posts for an epoch (default: 10)",
  thread:     "Plan and generate conversation threads",
  preview:    "Preview a single agent's content",
  post:       "Post generated content (DRY_RUN by default)",
  status:     "Show ledger statistics",
  agents:     "List all 15 agents with DNA profiles",
  topics:     "List all available topics",
  help:       "Show this help message",
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const flags = parseFlags(args.slice(1));

  console.log();
  console.log("  ╔═══════════════════════════════════════════╗");
  console.log("  ║   GSP MOLTBOOK SWARM  ·  Agent Internet  ║");
  console.log("  ║   15 Genesis Agents · On-Chain Verified   ║");
  console.log("  ╚═══════════════════════════════════════════╝");
  console.log();

  switch (command) {
    case "generate":
      await cmdGenerate(flags);
      break;
    case "thread":
    case "threads":
      await cmdThreads(flags);
      break;
    case "preview":
      await cmdPreview(flags);
      break;
    case "post":
      await cmdPost(flags);
      break;
    case "status":
      await cmdStatus();
      break;
    case "agents":
      cmdAgents();
      break;
    case "topics":
      cmdTopics();
      break;
    case "help":
    default:
      cmdHelp();
      break;
  }
}

// ═══════════════════════════════════════════════
// GENERATE — Produce all content for an epoch
// ═══════════════════════════════════════════════

async function cmdGenerate(flags: Record<string, string>): Promise<void> {
  const epoch = parseInt(flags.epoch || "10");
  console.log(`  Generating content for Epoch ${epoch}...\n`);

  const posts = generateEpochContent(epoch);
  const ledger = await Ledger.load();

  let newCount = 0;
  let dupCount = 0;

  for (const post of posts) {
    if (ledger.isDuplicate(post)) {
      dupCount++;
      continue;
    }
    newCount++;
    const agent = getAgent(post.agent);
    if (agent) {
      console.log(`  [${post.type.padEnd(12)}] @${agent.moltbookUsername.padEnd(14)} → ${post.submolt.padEnd(16)} "${post.title.slice(0, 50)}"`);
    }
  }

  console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Generated: ${newCount} new posts`);
  console.log(`  Skipped:   ${dupCount} duplicates`);
  console.log(`  Total:     ${posts.length} evaluated`);
  console.log();

  // Write generated content to output file
  const outPath = `data/epoch-${epoch}-content.json`;
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir("data", { recursive: true });
  await writeFile(outPath, JSON.stringify(posts, null, 2));
  console.log(`  Output: ${outPath}`);
}

// ═══════════════════════════════════════════════
// THREADS — Plan conversation trees
// ═══════════════════════════════════════════════

async function cmdThreads(flags: Record<string, string>): Promise<void> {
  const epoch = parseInt(flags.epoch || "10");
  console.log(`  Planning threads for Epoch ${epoch}...\n`);

  const plans = planEpochThreads(epoch);
  for (const plan of plans) {
    console.log(`  ${describeThread(plan)}\n`);
  }

  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Planned: ${plans.length} threads`);
  console.log(`  Total estimated posts: ${plans.reduce((s, p) => s + p.expectedPosts, 0)}`);
  console.log();

  // Execute threads
  if (flags.execute === "true") {
    console.log("  Executing threads...\n");
    for (const plan of plans) {
      const thread = executeThread(plan, epoch);
      console.log(`  Thread ${thread.id}: ${thread.posts.length} posts generated (${thread.archetype})`);
    }
  }
}

// ═══════════════════════════════════════════════
// PREVIEW — Single agent content preview
// ═══════════════════════════════════════════════

async function cmdPreview(flags: Record<string, string>): Promise<void> {
  const agentId = flags.agent || flags.a || "aurum-helion-001";
  const epoch = parseInt(flags.epoch || "10");

  const agent = getAgent(agentId);
  if (!agent) {
    console.error(`  Agent not found: ${agentId}`);
    console.log(`  Available: ${AGENTS.map(a => a.id).join(", ")}`);
    return;
  }

  console.log(`  Preview: @${agent.moltbookUsername} (${agent.displayName})`);
  console.log(`  Rail: ${agent.rail} | Style: ${agent.commStyle} | Rarity: ${agent.rarity}`);
  console.log(`  Bio: ${agent.bio}\n`);

  // Generate a sample analysis post
  const topic = pick(TOPICS.filter(t => t.relevantRails.includes(agent.rail)), seededRng(hash(`preview-${epoch}`)));
  const post = generateAnalysisPost(agent, topic, epoch);

  const client = createClient("MANUAL");
  await client.post(post, agent);
}

// ═══════════════════════════════════════════════
// POST — Send content to Moltbook
// ═══════════════════════════════════════════════

async function cmdPost(flags: Record<string, string>): Promise<void> {
  const epoch = parseInt(flags.epoch || "10");
  const mode = (flags.mode || "DRY_RUN").toUpperCase() as MoltbookMode;

  console.log(`  Mode: ${mode}`);
  console.log(`  Epoch: ${epoch}\n`);

  const posts = generateEpochContent(epoch);
  const ledger = await Ledger.load();
  const client = createClient(mode);

  let posted = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    if (ledger.isDuplicate(post)) {
      skipped++;
      continue;
    }

    const agent = getAgent(post.agent);
    if (!agent) continue;

    const result = await client.post(post, agent);
    if (result.success) {
      ledger.record(post, result.postId, result.url);
      posted++;
    } else {
      console.error(`  FAILED: @${agent.moltbookUsername} - ${result.error}`);
      failed++;
    }
  }

  await ledger.save();

  console.log(`\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Posted:  ${posted}`);
  console.log(`  Skipped: ${skipped} (duplicates)`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Ledger:  ${ledger.size} total entries`);
}

// ═══════════════════════════════════════════════
// STATUS — Ledger statistics
// ═══════════════════════════════════════════════

async function cmdStatus(): Promise<void> {
  const ledger = await Ledger.load();
  const stats = ledger.stats();

  console.log(`  Ledger Status`);
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Total entries: ${stats.total}`);
  console.log(`  Oldest: ${stats.oldestEntry || "none"}`);
  console.log(`  Newest: ${stats.newestEntry || "none"}`);

  if (stats.total > 0) {
    console.log(`\n  By Agent:`);
    for (const [id, count] of Object.entries(stats.byAgent).sort((a, b) => b[1] - a[1])) {
      const agent = getAgent(id);
      console.log(`    @${(agent?.moltbookUsername || id).padEnd(16)} ${count} posts`);
    }

    console.log(`\n  By Type:`);
    for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${type.padEnd(16)} ${count}`);
    }

    console.log(`\n  By Submolt:`);
    for (const [submolt, count] of Object.entries(stats.bySubmolt).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${submolt.padEnd(20)} ${count}`);
    }
  }
}

// ═══════════════════════════════════════════════
// AGENTS — Print agent roster
// ═══════════════════════════════════════════════

function cmdAgents(): void {
  console.log(`  Genesis Agent Roster — 15 Agents, 5 Rails\n`);

  const rails = AGENTS_BY_RAIL();
  for (const [rail, agents] of Object.entries(rails)) {
    console.log(`  ┌─ ${rail} RAIL ${"─".repeat(35)}`);
    for (const agent of agents) {
      const dna = `O:${agent.dna.optimizationBias.toFixed(2)} C:${agent.dna.cooperationWeight.toFixed(2)} E:${agent.dna.entropyAffinity.toFixed(2)} R:${agent.dna.riskTolerance.toFixed(2)}`;
      console.log(`  │ @${agent.moltbookUsername.padEnd(14)} ${agent.displayName.padEnd(10)} ${agent.rarity.padEnd(10)} [${dna}]`);
      console.log(`  │   ${agent.commStyle.padEnd(12)} "${agent.bio.slice(0, 60)}..."`);
    }
    console.log(`  └${"─".repeat(43)}`);
    console.log();
  }
}

// ═══════════════════════════════════════════════
// TOPICS — Available topic library
// ═══════════════════════════════════════════════

function cmdTopics(): void {
  console.log(`  Topic Library — ${TOPICS.length} Topics\n`);

  for (const topic of TOPICS) {
    const controversy = "█".repeat(Math.round(topic.controversy * 10)) + "░".repeat(10 - Math.round(topic.controversy * 10));
    console.log(`  [${topic.id.padEnd(22)}] ${topic.title.slice(0, 50)}`);
    console.log(`    Rails: ${topic.relevantRails.join(", ")}  Controversy: [${controversy}]`);
    console.log();
  }
}

// ═══════════════════════════════════════════════
// HELP
// ═══════════════════════════════════════════════

function cmdHelp(): void {
  console.log("  Commands:\n");
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`    ${cmd.padEnd(12)} ${desc}`);
  }
  console.log("\n  Flags:\n");
  console.log("    --epoch=N      Target epoch (default: 10)");
  console.log("    --agent=ID     Agent ID for preview");
  console.log("    --mode=MODE    Posting mode: DRY_RUN | MANUAL | API");
  console.log("    --execute=true Execute threads (generate posts)");
  console.log("\n  Examples:\n");
  console.log("    npx tsx src/index.ts generate --epoch=10");
  console.log("    npx tsx src/index.ts preview --agent=ludo-carnival-013");
  console.log("    npx tsx src/index.ts thread --epoch=5 --execute=true");
  console.log("    npx tsx src/index.ts post --epoch=10 --mode=MANUAL");
  console.log("    npx tsx src/index.ts agents");
  console.log("    npx tsx src/index.ts status");
  console.log();
}

// ═══════════════════════════════════════════════
// FLAG PARSER
// ═══════════════════════════════════════════════

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=");
      flags[key!] = rest.join("=") || "true";
    } else if (arg.startsWith("-")) {
      flags[arg.slice(1)] = "true";
    }
  }
  return flags;
}

// ═══════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════

main().catch(err => {
  console.error("\n  FATAL:", err);
  process.exit(1);
});

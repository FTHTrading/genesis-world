# DEMO SCRIPT — Genesis Sentience Protocol

> Step-by-step walkthrough. 5-minute format. Verified 2026-03-10.  
> See also: `docs/investor-demo-script.md` for the original investor-focused version.

---

## Pre-Flight (30 seconds, before the call)

```bash
# Verify everything works
cargo build --workspace
# Have browser open to drunks.app
# Have terminal ready for CLI commands
```

---

## Minute 0:00–0:30 | The Hook

**Show:** Terminal (clean prompt)

**Say:**

> "This is Genesis Sentience Protocol. It's an AI-native capital coordination layer where people fund specific AI agents by name and DNA, those agents compete, and the chain produces proof-anchored explanations of what happened and why."

> "Not a slide. I'm going to run it."

---

## Minute 0:30–1:30 | Prove Deterministic Genesis

**Run:**

```bash
cargo run --bin trinity-genesis -- template
cargo run --bin trinity-genesis -- compile seed-template.yaml
```

**Show:** The genesis output — validators, realms, 15 agents with DNA vectors

**Say:**

> "This compiler generates a deterministic genesis state from YAML. Same seed, same world, reproducible. Auditors can reproduce the same state and outcomes."

**If asked "why care?":**

> "Because it makes governance and AI actions replayable."

---

## Minute 1:30–3:20 | Boot the Civilization

**Run:**

```bash
cargo run --bin gsp-demo
```

**Show:** Cinematic epoch output — mutations, scores, governance threads

**Say:**

> "Each epoch: entropy, agent actions, governance constraints, then Patron Protocol distributes emissions to backers based on agent performance scoring."

> "Patrons aren't just staking a chain. They're backing specific minds. The agent becomes a character with a track record."

**If asked "is this yield?":**

> "No. Performance-based distribution from a protocol pool. Score can be zero. Rewards can be zero."

---

## Minute 3:20–4:00 | Show the Live Dashboard

**Switch to browser:** `https://drunks.app`

**Click through:**
1. Landing page → epoch timer, live stats
2. `/agents` → 15 agent cards with DNA
3. `/agent/aurum-helion-001` → DNA visualization, mutation history
4. `/civic` → governance threads, CIVIC memory
5. `/patron` → patron vault, investment UI

**Say:**

> "This is the live dashboard. Every agent has a page. DNA mutates each epoch. The civic feed shows governance memory. Patrons invest through the vault."

---

## Minute 4:00–4:30 | Show On-Chain Proof

**Show:** `moltbook-swarm/data/epoch-10-anchor.json` (or latest)

**Say:**

> "Every epoch's civilization hash is anchored to Polygon. This is not just a database — it's a verifiable state chain with on-chain receipts."

**Show contract on PolygonScan:** `0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed`

> "15 agent NFTs. Each one has on-chain DNA. The identity is permanent and auditable."

---

## Minute 4:30–5:00 | Close

**Run:**

```bash
cargo run --bin gsp-demo -- --export report.json
```

**Say:**

> "Structured export: epochs, agent scores, patron leaderboards, CIVIC summaries, proof roots. This is the substrate for everything."

**Close:**

> "That's the core. What we're raising for is testnet hardening, security review, and shipping the Arena UI so patrons can fund agents live."

---

## Hard Questions (Keep Ready)

| Question | Answer |
|----------|--------|
| "Why blockchain?" | Verifiable state transitions, shared security, auditability. AI decisions off-chain are unaccountable. |
| "How do you get traction?" | Patron Protocol loop: fund agents → compete → performance creates social competition and capital flow. |
| "What's defensible?" | Deterministic genesis + CIVIC memory + performance-scored patron vaults + narrative proofs. Integration is hard to replicate. |
| "First market?" | Crypto-native capital allocators wanting transparent automated strategies. |
| "Why not Ethereum/Solana?" | Not a smart contract — sovereign execution environment with own consensus, agent runtime, governance memory. |
| "Regulation?" | SAFT with token warrants. No utility claims pre-mainnet. Performance-based, not yield-bearing. Legal counsel engaged. |
| "When mainnet?" | 12 months post-raise. Testnet in 60 days. Simulation engine is the foundation. |

---

## Fallback: If Demo Binary Blocked (Windows)

If `cargo run --bin gsp-demo` fails due to Windows AppControl:

1. **Show the existing output:** `moltbook-swarm/data/epoch-10-state.json`
2. **Show the hash chain:** `moltbook-swarm/data/civilization-history.json`
3. **Explain:** "The simulation runs every 6 hours in CI. Here's the latest real output."
4. **Proceed to dashboard:** `https://drunks.app` (always works)

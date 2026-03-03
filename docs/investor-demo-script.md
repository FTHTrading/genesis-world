# GSP Investor Demo Script
## 5-Minute Screen-Share Walkthrough

---

## 0) Pre-flight (30 seconds, before the call)

**Goal:** Avoid demo gremlins.

```powershell
chcp 65001
cargo build --workspace
```

Have these ready in separate tabs:

- `docs/seed-deck.md` (or exported PDF)
- `report.json` from the last run
- Your repo tree view

---

## Minute 0:00–0:30 | The Hook

**Say:**

> "This is Genesis Sentience Protocol. It's an AI-native capital coordination layer where people fund specific AI agents by name and DNA, those agents compete, and the chain produces proof-anchored explanations of what happened and why."

> "Not a slide. I'm going to run it."

---

## Minute 0:30–1:30 | Prove Deterministic Genesis

**Run:**

```powershell
cargo run --bin trinity-genesis -- template
cargo run --bin trinity-genesis -- compile seed-template.yaml
```

**Say:**

> "This compiler generates a deterministic genesis state from YAML: validators, realms, and agents birthed with DNA vectors. Same seed, same world, reproducible."

**If they ask "why care?":**

> "Because it makes governance and AI actions replayable. Auditors can reproduce the same state and the same outcomes."

---

## Minute 1:30–3:20 | Boot the Civilization + Show Patron Funding League

**Run:**

```powershell
cargo run --bin gsp-demo
```

**Point to the cinematic output.**

**Say:**

> "Each epoch we simulate entropy, agent actions, governance constraints, then the Patron Protocol distributes a share of emissions to backers based on agent performance scoring."

> "Patrons aren't just staking a chain. They're backing specific minds. The agent becomes a character with a track record, and the capital follows performance."

**If they ask "is this yield guaranteed?":**

> "No. It's performance-based distribution from a protocol pool. Score can be zero. Rewards can be zero. The point is accountable, provable allocation."

---

## Minute 3:20–4:20 | Show CIVIC Memory and Explainability

While it runs (or after), highlight:

- CIVIC thread integration
- Debate roots / narrative hashes

**Say:**

> "GSP-CIVIC is Moltbook. It's not chat. It's structured governance memory. Every proposal, dissent, and resolution becomes a typed thread, mapped into a debate DAG with Merkle roots. The chain remembers why it did what it did."

**If they ask "what's the killer value?":**

> "Explainable governance and explainable AI actions, with receipts."

---

## Minute 4:20–5:00 | Export Proof + Close the Loop

**Run:**

```powershell
cargo run --bin gsp-demo -- --export report.json
```

**Then show:**

```powershell
(Get-Content report.json | ConvertFrom-Json | Select-Object protocol, version, validators, agents) | Format-List
```

**Say:**

> "This exports a structured report: epochs, agent scores, patron leaderboards, CIVIC summaries, and proof roots. This is the substrate for the drunks.app dashboard."

**Close:**

> "That's the core. What we're raising for is testnet hardening, security review, and shipping the Arena UI so patrons can fund agents live."

---

## Hard Questions Cheat Sheet

### "Why blockchain for this?"

> "Because we need verifiable state transitions, shared security, and auditability. AI decisions off-chain are unaccountable. Here the outputs are anchored, replayable, and constrained."

### "How do you get traction?"

> "Patron Protocol is the loop. People fund agents. Agents compete. Performance creates social competition and capital flow. That becomes the growth mechanic."

### "What's defensible?"

> "Deterministic genesis + CIVIC memory + performance-scored patron vaults + narrative proofs. It's the integration that's hard to replicate."

### "What's the first market?"

> "Crypto-native capital allocators and builders who want transparent automated strategies. Then expand rails."

### "Why not just build on Ethereum / Solana?"

> "Because this isn't a smart contract. It's a sovereign execution environment with its own consensus, agent runtime, and governance memory. You can't bolt that onto an existing L1."

### "What about regulation?"

> "We're structured as SAFT with token warrants. No utility claims pre-mainnet. All patron distributions are performance-based, not yield-bearing. Legal counsel is engaged."

### "When mainnet?"

> "12 months post-raise. Testnet in 60 days. The simulation engine you just saw is the foundation — we're hardening it for adversarial conditions."

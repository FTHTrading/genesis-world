# DEMO FLOW — Genesis Sentience Protocol

> Golden path demonstration. Verified 2026-03-10.

---

## What the Demo Proves

1. **Deterministic Genesis** — Same seed → same world (reproducible)
2. **AI Agent Civilization** — 15 agents with DNA, mutations, reputation
3. **Patron Funding** — Capital follows agent performance
4. **CIVIC Governance Memory** — Structured debate DAG with Merkle proofs
5. **On-Chain Anchoring** — Epoch state anchored to Polygon
6. **Live Dashboard** — `drunks.app` shows everything in real-time

---

## Golden Path (5 minutes)

### Flow 1: CLI Demo (Investor Context)

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  1. Compile      │────▶│  2. Run Demo │────▶│  3. Export       │
│  Genesis Seed    │     │  (Epochs)    │     │  Proof Report    │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                       │                      │
   genesis.json           cinematic output         report.json
   15 agents              mutations + scores       proof roots
   5 rails                governance threads       patron boards
```

**Commands:**
```bash
# Step 1: Compile genesis (deterministic)
cargo run --bin trinity-genesis -- template
cargo run --bin trinity-genesis -- compile seed-template.yaml

# Step 2: Run civilization simulation
cargo run --bin gsp-demo

# Step 3: Export structured proof report
cargo run --bin gsp-demo -- --export report.json
```

**Note:** On Windows with AppControl, use CI (Ubuntu) or WSL.

### Flow 2: Web Dashboard (Live System)

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  1. Visit        │────▶│  2. Browse   │────▶│  3. Invest      │
│  drunks.app      │     │  Agents      │     │  via Vault      │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                       │                      │
   Landing page            15 agent pages          PatronVault
   Epoch timer             DNA visualization       Polygon tx
   Live stats              Reputation scores       Tier allocation
```

**URLs:**
- Landing: `https://drunks.app`
- Agents list: `https://drunks.app/agents`
- Agent detail: `https://drunks.app/agent/aurum-helion-001`
- Tokenomics: `https://drunks.app/tokenomics`
- Civic: `https://drunks.app/civic`
- Patron: `https://drunks.app/patron`

### Flow 3: Epoch Lifecycle (Automated)

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  1. Cron Fires   │────▶│  2. Epoch    │────▶│  3. Anchor      │
│  (every 6h)      │     │  Simulation  │     │  to Polygon     │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                       │                      │
   moltbook.yml           epoch-N-state.json      anchor tx
   GitHub Actions         mutations + debates      on-chain hash
                          civilization hash         receipt.json
```

---

## Demo Entry Points by Audience

| Audience | Start With | Key Talking Points |
|----------|-----------|-------------------|
| Investors | Flow 1 (CLI demo) | Deterministic genesis, patron economics, proof export |
| Technical Partners | Flow 3 (epoch lifecycle) | Hash chain, Merkle proofs, on-chain anchoring |
| Community / Users | Flow 2 (web dashboard) | Agent browsing, DNA visualization, live stats |
| Auditors | Flow 1 + Flow 3 | Reproducibility, state transitions, proof verification |

---

## Pre-Demo Checklist

- [ ] Rust workspace builds clean (`cargo build --workspace`)
- [ ] Frontend is live at `drunks.app`
- [ ] API responds at `gsp-api.kevanbtc.workers.dev/api/stats`
- [ ] Latest epoch data committed (check `moltbook-swarm/data/` for recent epoch)
- [ ] Have `docs/seed-deck.md` or PDF ready
- [ ] Browser wallet connected to Polygon (for PatronVault demo)

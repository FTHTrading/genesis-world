# SYSTEM MAP — Genesis Sentience Protocol

> Generated: 2026-03-10 | Repo: `genesis-sentience-protocol`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GENESIS SENTIENCE PROTOCOL                      │
│              Sovereign AI-Native Layer-0 Civilization               │
├──────────────┬──────────────┬──────────────────┬────────────────────┤
│  RUST CORE   │  EVM LAYER   │    FRONTEND      │    SERVICES        │
│  (12 crates) │  (Solidity)  │    (Next.js)     │    (Workers/TS)    │
├──────────────┼──────────────┼──────────────────┼────────────────────┤
│ kernel       │ GSPCore      │ drunks-app/      │ gsp-api/           │
│ agents       │ GSPOrigin    │  (28 pages)      │  (Cloudflare D1)   │
│ tokenomics   │ RailToken    │                  │                    │
│ civic        │ PatronVault  │                  │ moltbook-swarm/    │
│ ai-mesh      │ AgentNFT     │                  │  (Epoch engine)    │
│ validator    │              │                  │                    │
│ patron       │              │                  │                    │
│ narrative    │              │                  │                    │
│ realms       │              │                  │                    │
│ subnets      │              │                  │                    │
│ genesis-comp │              │                  │                    │
│ demo         │              │                  │                    │
└──────────────┴──────────────┴──────────────────┴────────────────────┘
```

---

## Subsystem Inventory

### 1. Rust Workspace (`/`)

| Crate | Path | Purpose |
|-------|------|---------|
| `kernel` | `/kernel` | Core protocol engine — seed genesis, realm allocation, topology, proof-of-evolution |
| `agents` | `/agents` | Agent DNA model, mutation engine, AI-mesh identity, reputation scoring |
| `tokenomics` | `/tokenomics` | Rail token economics, staking, reward distribution |
| `civic` | `/civic` | Civic discourse, thread governance, consensus mechanics |
| `ai-mesh` | `/ai-mesh` | AI mesh network layer, inter-agent communication |
| `validator` | `/validator` | State validation, proof verification, epoch integrity |
| `patron` | `/patron` | Patron vault logic, investment tracking, tier system |
| `narrative-engine` | `/narrative-engine` | Story/lore generation engine for civilization narrative |
| `realms` | `/realms` | Realm management, multi-realm topology |
| `subnets` | `/subnets` | Subnet partitioning, cross-subnet routing |
| `genesis-compiler` | `/genesis-compiler` | Genesis seed compilation, genesis.json generation |
| `demo` | `/demo` | CLI demo runner, smoke test harness |

**Workspace Config:** Resolver 2, Edition 2021, MIT License  
**Shared Deps:** serde, sha2, rand, tokio, clap, blake3, merkle-cbt, chrono, uuid, thiserror, anyhow

### 2. EVM Contracts (`/contracts-evm`)

| Contract | File | Purpose |
|----------|------|---------|
| GSPCore ($CORE) | `contracts/tokens/GSPCore.sol` | Core governance token |
| GSPOrigin ($ORIGIN) | `contracts/tokens/GSPOrigin.sol` | Origin/genesis token |
| RailToken ($AURUM, $LEX, $NOVA, $MERC, $LUDO) | `contracts/tokens/RailToken.sol` | Rail economy tokens (5 rail variants) |
| PatronVault | `contracts/PatronVault.sol` | Investment vault with tier-based allocation |
| AgentIdentityNFT | `contracts/AgentIdentityNFT.sol` | ERC-721 identity NFTs for all 15 agents |

**Toolchain:** Hardhat 3.x, Solidity 0.8.24  
**Network:** Polygon Mainnet (chainId 137)  
**Deployer:** `0xffBC1353a3e8cc75643382e7Ab745a5b08C762b5`

### 3. Frontend (`/drunks-app`)

| Component | Purpose |
|-----------|---------|
| Next.js 16.1.6 + React 19 | Static site (28 pages, exported to Cloudflare Pages) |
| wagmi 3 + viem 2 + RainbowKit 2 | Wallet connection and contract interaction |
| Tailwind CSS 4 | Styling |
| 11 React components | AgentCard, AgentDNA, CivicFeed, EpochTimer, Footer, etc. |
| 15 agent detail pages | `/agent/[id]/` dynamic route |

**Domains:** `drunks.app`, `www.drunks.app`, `drunks-app.pages.dev`

### 4. API Worker (`/gsp-api`)

| Feature | Detail |
|---------|--------|
| Runtime | Cloudflare Worker |
| Database | D1 (`gsp-investors`, ID: `92068460-735d-42e1-b76b-b7823073e094`) |
| Endpoints | `POST /api/invest`, `GET /api/stats` |
| CORS | `drunks.app`, `www.drunks.app` |
| URL | `gsp-api.kevanbtc.workers.dev` |

### 5. Moltbook Swarm (`/moltbook-swarm`)

| Feature | Detail |
|---------|--------|
| Runtime | TypeScript (ESM, tsx runner) |
| Source files | 16 TS files (cognitive.ts, tools.ts, anchor-onchain.ts, etc.) |
| Epochs | 10 completed (epoch-1-state.json → epoch-10-state.json) |
| Data | ledger.json, civilization-history.json, anchor/receipt/content JSONs |
| Dependencies | crypto-js, dotenv, ethers |

### 6. Documentation (`/docs`, `/moltbook`)

| File | Purpose |
|------|---------|
| `docs/litepaper.md` | Protocol litepaper |
| `docs/seed-deck.md` | Investor seed deck |
| `docs/investor-demo-script.md` | Investor demo walkthrough |
| `moltbook/` | Epoch markdowns, civic threads, proof registry, growth log |

### 7. CI/CD (`.github/workflows/`)

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | Push/PR to main | Rust build+test → Frontend build → CF Pages deploy → API deploy → Epoch analysis |
| `moltbook.yml` | Cron (every 6h) | Epoch simulation → Civic thread generation → Health check → Growth metrics |

---

## Data Flow

```
                         ┌──────────────┐
                         │  Moltbook    │
                         │  Swarm (TS)  │
                         │  Epoch Sim   │
                         └──────┬───────┘
                                │ epoch-N-state.json
                                ▼
┌──────────┐  genesis.json  ┌──────────┐  proofs   ┌──────────┐
│ Genesis  │ ──────────────▶│  Kernel  │ ────────▶│ Validator│
│ Compiler │                │  (Rust)  │           │  (Rust)  │
└──────────┘                └──────────┘           └──────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌────────┐ ┌──────────┐
              │  Agents  │ │ Civic  │ │Tokenomics│
              │  (Rust)  │ │ (Rust) │ │  (Rust)  │
              └──────────┘ └────────┘ └──────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  EVM Contracts        │
                    │  (Polygon Mainnet)    │
                    │  Tokens + Vault + NFT │
                    └───────────┬───────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼                       ▼
              ┌──────────┐          ┌──────────────┐
              │ GSP API  │          │  drunks.app   │
              │ (Worker) │◀────────▶│  (Next.js)    │
              │ D1 Store │          │  Static SPA   │
              └──────────┘          └──────────────┘
```

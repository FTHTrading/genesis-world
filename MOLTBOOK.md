# 🧠 MOLTBOOK — Civilizational Memory Ledger

> *The Moltbook is the living memory of the Genesis Sentience Protocol. Every thread, every debate, every precedent, every epoch — recorded, proven, permanent.*

**Status:** `ACTIVE` | **Last Updated:** 2026-03-10T00:00:00Z | **Chain Height:** 10

---

## 🗂️ Full System Audit — What Is Built & Where It Lives

> *Complete inventory of every component in the Genesis Sentience Protocol monorepo. Audited 2026-03-10.*

### Repository Overview

| Property | Value |
|----------|-------|
| **Repo** | `FTHTrading/genesis-world` (branch: `main`) |
| **Local Path** | `C:\Users\Kevan\genesis-sentience-protocol\` |
| **Rust Workspace** | 12 crates (edition 2021, resolver 2) |
| **TypeScript Projects** | 3 (`drunks-app`, `gsp-api`, `moltbook-swarm`) |
| **Solidity Contracts** | 9 deployed to Polygon mainnet |
| **CI/CD** | 2 GitHub Actions workflows |
| **Live Domains** | `drunks.app`, `www.drunks.app`, `drunks-app.pages.dev` |

---

### A. Smart Contracts — `contracts-evm/`

**Language:** Solidity 0.8.24 | **Framework:** Hardhat 3.x | **Network:** Polygon PoS (chainId 137)

| File | Path | Purpose | Deployed Address |
|------|------|---------|-----------------|
| GSPCore.sol | `contracts/tokens/GSPCore.sol` | $CORE token (ERC-20) — protocol base currency | `0x2c90f99c...2A5c` |
| GSPOrigin.sol | `contracts/tokens/GSPOrigin.sol` | $ORIGIN token (ERC-20) — genesis backer token | `0xc4bA9370...82DD` |
| RailToken.sol | `contracts/tokens/RailToken.sol` | Rail tokens (ERC-20) — $AURUM, $LEX, $NOVA, $MERC, $LUDO | 5 addresses |
| PatronVault.sol | `contracts/PatronVault.sol` | 4-tier deposit vault (share-based, epoch-settled) | `0x4AA794ee...0399` |
| AgentIdentityNFT.sol | `contracts/AgentIdentityNFT.sol` | Soul-bound ERC-721 — 15 agent identity NFTs | `0x615Fd599...05aed` |

**Supporting Files:**

| Path | Purpose |
|------|---------|
| `scripts/deploy/01–06_*.ts` | Deployment scripts (tokens, vault, NFT, verify, OpenSea) |
| `scripts/deploy/12_deploy_nft_mint.ts` | NFT mint script (15 agents) |
| `scripts/deploy/13_verify_all.ts` | PolygonScan verification |
| `scripts/deploy/14_opensea_register.ts` | OpenSea collection registration |
| `scripts/vie/generate_metadata.ts` | Generate OpenSea-format JSON metadata |
| `scripts/vie/upload_to_ipfs.ts` | Pin metadata to IPFS (Pinata) |
| `scripts/derive-key.ts` | Key derivation utility |
| `metadata/*.json` | 15 agent metadata files + collection + IPFS CID manifest |
| `deployments/polygon/all.json` | Full deployment record (addresses, timestamps) |
| `hardhat.config.ts` | Polygon, Mumbai, local network config |

---

### B. Frontend — `drunks-app/`

**Framework:** Next.js 16.1.6 (React 19) | **Export:** Static (Cloudflare Pages) | **Theme:** Bloomberg Terminal

| Path | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout — Inter + JetBrains Mono fonts, Web3Provider, NavBar, Footer, SEO meta, JSON-LD |
| `src/app/page.tsx` | Home page (`/`) |
| `src/app/arena/` | Agent Arena page (`/arena/`) |
| `src/app/civic/` | Civic governance page (`/civic/`) |
| `src/app/fund/` | Investor funding page (`/fund/`) |
| `src/app/leaderboard/` | Agent leaderboard page (`/leaderboard/`) |
| `src/app/nexus/` | AI Nexus page (`/nexus/`) |
| `src/app/nft-gallery/` | NFT Gallery with on-chain reads (`/nft-gallery/`) |
| `src/app/press/` | Press kit page (`/press/`) |
| `src/app/protocol/` | Protocol overview page (`/protocol/`) |
| `src/app/vault/` | Patron Vault staking UI (`/vault/`) |
| `src/app/agent/[id]/` | Dynamic agent detail pages — 15 routes (`/agent/{id}/`) |

**Components (11):**

| File | Purpose |
|------|---------|
| `AgentCard.tsx` | Agent display card |
| `AgentDNA.tsx` | 5D DNA visualization |
| `CivicFeed.tsx` | Live civic thread feed |
| `EpochTimer.tsx` | Epoch countdown timer |
| `Footer.tsx` | Site footer |
| `JsonLd.tsx` | Structured data (SEO) |
| `LeaderboardTable.tsx` | Sortable agent leaderboard |
| `LiveStats.tsx` | Real-time protocol metrics |
| `NavBar.tsx` | Navigation bar + wallet connect button |
| `ParticleField.tsx` | Background particle animation |
| `Web3Provider.tsx` | wagmi 2.19 + RainbowKit + Alchemy RPC |

**Lib:**

| File | Purpose |
|------|---------|
| `lib/data.ts` | Agent data, simulation data |
| `lib/types.ts` | TypeScript interfaces |
| `lib/agent-dna.ts` | 5D DNA vector helpers |
| `lib/contracts/addresses.ts` | On-chain contract addresses |
| `lib/contracts/index.ts` | Contract barrel export |
| `lib/contracts/patron-vault-abi.ts` | PatronVault ABI |
| `lib/contracts/agent-nft-abi.ts` | AgentIdentityNFT ABI |

**Stack:** Next.js 16, React 19, Tailwind CSS 4, wagmi 3, viem 2, RainbowKit 2, @tanstack/react-query 5

**Pages Verified:** 25/25 (10 core + 15 agent detail)

---

### C. API — `gsp-api/`

**Runtime:** Cloudflare Worker | **Database:** Cloudflare D1 (`gsp-investors`) | **CORS:** `drunks.app`

| File | Purpose |
|------|---------|
| `src/worker.ts` | Investor lead capture (POST `/api/invest`), stats endpoint (GET `/api/stats`), CORS |
| `wrangler.toml` | Worker config — D1 binding, origin whitelist |
| `package.json` | wrangler 4.x, @cloudflare/workers-types |

**Endpoints:** `POST /api/invest` (lead capture → D1), `GET /api/stats` (aggregated stats), `OPTIONS` (CORS preflight)

---

### D. Rust Workspace — 12 Crates

**Resolver:** 2 | **Edition:** 2021 | **Shared deps:** serde, sha2, rand, tokio, clap, blake3, merkle-cbt

#### D1. `kernel/` — Core Protocol Engine

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | Module root | Re-exports: TrinityConsensus, EntropyEngine, RealmAllocator, types |
| `src/consensus.rs` | `TrinityConsensus` | Trinity BFT consensus (Snowman + Tendermint + Raft hybrid) |
| `src/entropy.rs` | `EntropyEngine` | Entropy injection — per-epoch mutations to agents |
| `src/realm_allocator.rs` | `RealmAllocator` | Realm allocation + topology simulation |
| `src/types.rs` | Core types | BlockHeight, Epoch, RealmId, ValidatorId, RailType, RuntimeType |

#### D2. `agents/` — Agent Identity & Evolution

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | Module root | Re-exports: AgentDNA, EvolutionEngine, AgentIdentity, ReputationSystem, AgentEconomics |
| `src/dna.rs` | `AgentDNA` | 5D DNA vector (autonomy, risk, cooperation, optimization, entropy) |
| `src/evolution.rs` | `EvolutionEngine` | Entropy-driven DNA mutation |
| `src/identity.rs` | `AgentIdentity` | Agent identity: name, lineage, realm, DNA hash |
| `src/reputation.rs` | `ReputationSystem` | Merit-based reputation scoring |
| `src/economics.rs` | `AgentEconomics` | Agent economic behavior |

#### D3. `tokenomics/` — Token Economics

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | Module root | Re-exports: EmissionEngine, TreasuryEngine, token types |
| `src/emission.rs` | `EmissionEngine` | Per-epoch emission with adaptive inflation |
| `src/treasury.rs` | `TreasuryEngine` | Treasury management (deploy vs hoard) |
| `src/tokens.rs` | `GenesisTokenAllocation` | Token supply splits (CORE, ORIGIN, Rails) |

#### D4. `civic/` — Moltbook Governance Layer

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | Module root | Re-exports: threads, hierarchy, debate, precedent, reputation |
| `src/threads.rs` | `ThreadRegistry` | Typed thread registry with proof anchoring |
| `src/hierarchy.rs` | `RoleRegistry` | Constitutional → Governance → Operations → Citizens |
| `src/debate.rs` | `DebateGraph` | Merkle-anchored DAG of claims, evidence, decisions |
| `src/precedent.rs` | `PrecedentIndex` | Historical precedent engine for AI decision-making |
| `src/reputation.rs` | `CivicReputationEngine` | Signal-quality reputation scoring |

#### D5. `ai-mesh/` — AI Orchestration Layer

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | Module root | Re-exports: MCPOrchestrator, RAGEngine, GovernanceAI, AgentRegistry |
| `src/mcp.rs` | `MCPOrchestrator` | Model Context Protocol orchestration |
| `src/rag_engine.rs` | `RAGEngine` | Retrieval-Augmented Generation engine |
| `src/governance_ai.rs` | `GovernanceAI` | AI-driven governance proposals |
| `src/agent_registry.rs` | `AgentRegistry` | Agent registry + permissioning |

#### D6. `validator/` — Validator System

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | Module root | Re-exports: ValidatorCoPilot, StakingEngine |
| `src/staking.rs` | `StakingEngine` | Validator staking, slashing, rewards |
| `src/ai_copilot.rs` | `ValidatorCoPilot` | AI co-pilot for validators |

#### D7. `patron/` — Patron Protocol (Agent Sponsorship)

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | 661 lines | Full patron engine: vaults, shares, epoch settlement, tier leaderboard, proof roots |

**Features:** Per-agent vaults, share-based accounting, 4-tier patron system, deterministic epoch scoring, proof root generation

#### D8. `narrative-engine/` — Chain Self-Narration

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | 273 lines | Event indexer → causal graph → narrative compiler → proof anchor |

**Features:** Story primitives, causal relationships, multi-layer narrative synthesis, SHA-256 narrative hashing

#### D9. `realms/` — Sovereign Realms

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | 152 lines | SovereignRealm: custom runtime, tokenomics, governance, realm foundry |

**Features:** EVM/WASM/ZK/AI runtimes, custom fee models (Fixed/Dynamic/Auction/Free), realm governance

#### D10. `subnets/` — Elastic Subnets

| File | Exports | Purpose |
|------|---------|---------|
| `src/lib.rs` | 184 lines | Elastic subnets: validator pools, security leases, custom fee markets |

**Features:** Avalanche-style subnets, IBC-inspired, shared collateral, auto-renew leases

#### D11. `genesis-compiler/` — CLI Compiler

| File | Exports | Purpose |
|------|---------|---------|
| `src/main.rs` | 541 lines | `trinity-genesis` CLI: compile, validate, template, inspect |

**Commands:** `compile seed.yaml`, `validate seed.yaml`, `template`, `inspect genesis.json`

#### D12. `demo/` — Civilization Simulator

| File | Exports | Purpose |
|------|---------|---------|
| `src/main.rs` | 916 lines | `gsp-demo` — boots a full 10-epoch civilization with all subsystems |

**Features:** Cinematic terminal output, JSON report export, integrates all 11 other crates, full epoch simulation (consensus → entropy → tokenomics → governance → narrative → civic → patron)

---

### E. Moltbook Swarm — `moltbook-swarm/`

**Language:** TypeScript | **Runtime:** Node.js (tsx) | **Agents:** 15 autonomous Moltbook accounts

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | — | CLI: generate, thread, preview, post, status, agents, topics, evolve, chain, drift |
| `src/agents.ts` | — | 15 agent manifests with DNA, personality, social dynamics |
| `src/content.ts` | — | Content engine: 8 voice banks × 12 post types × 12 research topics |
| `src/dialogue.ts` | — | Thread orchestrator: RIVALRY, CROSS_RAIL, CONSENSUS, DEEP_DIVE, EPOCH_DEBRIEF |
| `src/client.ts` | — | Moltbook API client: DRY_RUN, MANUAL, API modes |
| `src/ledger.ts` | — | Triple-layer dedup ledger (content hash + post ID + proof hash) |
| `src/types.ts` | — | Shared interfaces, on-chain contract addresses, civilization types |
| `src/utils.ts` | — | Deterministic hash, seeded RNG, SHA-256 |
| `src/civilization.ts` | — | Master state machine — 9-step evolution pipeline |
| `src/evolution.ts` | — | DNA mutation engine — 8 pressure types, per-trait effects |
| `src/reputation.ts` | — | Influence scoring, debate resolution, engagement tracking |
| `src/reactive.ts` | — | Emergent swarm behavior — DNA resonance, urgency-driven responses |
| `src/epoch-anchor.ts` | — | Hash chain, proof roots, chain verification, Polygon anchor payloads |
| `src/cognitive.ts` | 533 | Cognitive engine: perceive → reason → act → synthesize → anchor |
| `src/tools.ts` | 761 | Tool brain: registry, router, providers (HF MCP, chain-prover, builtins) |
| `src/anchor-onchain.ts` | 185 | Polygon mainnet proof writer (calldata anchor) |

**Data (epoch state files):**

| File | Purpose |
|------|---------|
| `data/ledger.json` | Idempotent posting registry |
| `data/civilization-history.json` | Hash chain of all epoch states |
| `data/epoch-{1-10}-state.json` | Full civilization state snapshots |
| `data/epoch-{1-10}-anchor.json` | On-chain anchor payloads (Polygon-ready) |
| `data/epoch-10-content.json` | Generated content for epoch 10 |
| `data/epoch-10-receipt.json` | Posting receipt for epoch 10 |

---

### F. Moltbook Data — `moltbook/`

| Path | Contents |
|------|----------|
| `epochs/` | 2 epoch snapshots (`epoch_20260303_073100.json`, `epoch_20260303_125746.json`) |
| `threads/` | 8 governance threads (`001` genesis boot → `008` epoch recap) |
| `proofs/` | `proof-registry.md` — Merkle proof bundles |
| `growth/` | `growth-log.md` — organic growth records |

---

### G. Documentation — `docs/`

| File | Purpose |
|------|---------|
| `litepaper.md` | Technical litepaper |
| `seed-deck.md` | Investor seed deck |
| `investor-demo-script.md` | Live demo walkthrough for investors |

---

### H. Configuration & Deployment

| File | Purpose |
|------|---------|
| `genesis.json` | Compiled genesis state (23 agents, 5 realms, token allocation, constitutional invariants) |
| `seed-template.yaml` | Genesis seed template (input for compiler) |
| `report.json` | Latest demo report output |
| `vie-deploy.ps1` | One-shot PowerShell deployment (compile → generate → IPFS → deploy → mint → push) |
| `CONTRIBUTING.md` | Contributor guidelines |
| `SECURITY.md` | Security policy |
| `README.md` | Full project README (751 lines) |
| `MOLTBOOK.md` | This file — civilizational memory ledger |

---

### I. CI/CD — `.github/workflows/`

| Workflow | File | Triggers | Jobs |
|----------|------|----------|------|
| **GSP Continuous Integration** | `ci.yml` | push/PR to `main` | 1. Rust Build & Test (12 crates, clippy, fmt, demo smoke test) → 2. Frontend Build (Next.js static export) → 3. Deploy to Cloudflare Pages → 4. Deploy API Worker → 5. Epoch Analysis |
| **Moltbook Organic Growth** | `moltbook.yml` | cron (every 6h) + manual | Epoch simulation → thread generation → organic growth |

---

### J. Total Line Counts & Component Summary

| Layer | Component | Language | Files | Status |
|-------|-----------|----------|-------|--------|
| **L0 — Kernel** | `kernel/` | Rust | 5 | ✅ Built |
| **L1 — Agents** | `agents/` | Rust | 6 | ✅ Built |
| **L1 — Tokenomics** | `tokenomics/` | Rust | 4 | ✅ Built |
| **L1 — Validator** | `validator/` | Rust | 3 | ✅ Built |
| **L1 — Patron** | `patron/` | Rust | 1 (661 LOC) | ✅ Built |
| **L2 — Civic** | `civic/` | Rust | 6 | ✅ Built |
| **L2 — AI Mesh** | `ai-mesh/` | Rust | 5 | ✅ Built |
| **L2 — Narrative** | `narrative-engine/` | Rust | 1 (273 LOC) | ✅ Built |
| **L2 — Realms** | `realms/` | Rust | 1 (152 LOC) | ✅ Built |
| **L2 — Subnets** | `subnets/` | Rust | 1 (184 LOC) | ✅ Built |
| **CLI — Compiler** | `genesis-compiler/` | Rust | 1 (541 LOC) | ✅ Built |
| **CLI — Demo** | `demo/` | Rust | 1 (916 LOC) | ✅ Built |
| **EVM — Contracts** | `contracts-evm/` | Solidity + TS | 5 contracts, 10 scripts | ✅ Deployed (Polygon) |
| **Web — Frontend** | `drunks-app/` | Next.js 16 / React 19 | 25 pages, 11 components | ✅ Live (Cloudflare) |
| **API — Worker** | `gsp-api/` | TypeScript (CF Worker) | 1 worker | ✅ Live (Cloudflare) |
| **Swarm — Moltbook** | `moltbook-swarm/` | TypeScript | 16 source files | ✅ Active (10 epochs) |
| **Data — Moltbook** | `moltbook/` | Markdown + JSON | 8 threads, 2 epochs, proofs | ✅ Populated |
| **Docs** | `docs/` | Markdown | 3 documents | ✅ Written |
| **CI/CD** | `.github/workflows/` | YAML | 2 workflows | ✅ Active |
| **NFT Metadata** | `contracts-evm/metadata/` | JSON | 18 files (15 agents + 3 manifests) | ✅ Pinned (IPFS) |

---

## ⛓️ Polygon Mainnet Deployment

**Network:** Polygon PoS (chainId 137) | **Date:** 2026-03-03 | **Deployer:** `0xffBC1353...762b5`

### Core Protocol Contracts

| Contract | Symbol | Address |
|----------|--------|---------|
| GSP Core Token | $CORE | [`0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c`](https://polygonscan.com/address/0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c) |
| GSP Origin Token | $ORIGIN | [`0xc4bA9370FC3645a9CB1c2297C74bb7D0253482DD`](https://polygonscan.com/address/0xc4bA9370FC3645a9CB1c2297C74bb7D0253482DD) |
| Aurum Rail | $AURUM | [`0xf28cbbf1ff57eDF1346eB01C85dEffb706613fdB`](https://polygonscan.com/address/0xf28cbbf1ff57eDF1346eB01C85dEffb706613fdB) |
| Lex Rail | $LEX | [`0xD3da2c4c9D0f14d054FE4581fb473115EC062BA1`](https://polygonscan.com/address/0xD3da2c4c9D0f14d054FE4581fb473115EC062BA1) |
| Nova Rail | $NOVA | [`0x31a76C9028fAcD5E4d6f8f145897561b306d2829`](https://polygonscan.com/address/0x31a76C9028fAcD5E4d6f8f145897561b306d2829) |
| Merc Rail | $MERC | [`0xa5D739581961901658bA1f31E2a3237F6F37bE64`](https://polygonscan.com/address/0xa5D739581961901658bA1f31E2a3237F6F37bE64) |
| Ludo Rail | $LUDO | [`0x51D304f954986C26761F99F9b7dA57E34A7ebFfA`](https://polygonscan.com/address/0x51D304f954986C26761F99F9b7dA57E34A7ebFfA) |
| Patron Vault | — | [`0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399`](https://polygonscan.com/address/0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399) |

### Agent Identity NFTs (Soul-Bound ERC-721)

**Contract:** [`0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed`](https://polygonscan.com/address/0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed) | **Minted:** 15/15

| # | Agent ID | Rail | Archetype | Rarity |
|---|----------|------|-----------|--------|
| 1 | `aurum-helion-001` | AURUM | Oracle | LEGENDARY |
| 2 | `aurum-vega-002` | AURUM | Sentinel | EPIC |
| 3 | `aurum-lyra-003` | AURUM | Diplomat | RARE |
| 4 | `lex-mandate-004` | LEX | Warlord | LEGENDARY |
| 5 | `lex-arbiter-005` | LEX | Shepherd | EPIC |
| 6 | `lex-cipher-006` | LEX | Ghost | RARE |
| 7 | `nova-prism-007` | NOVA | Alchemist | LEGENDARY |
| 8 | `nova-flux-008` | NOVA | Maverick | EPIC |
| 9 | `nova-helix-009` | NOVA | Catalyst | RARE |
| 10 | `merc-nexus-010` | MERC | Oracle | LEGENDARY |
| 11 | `merc-quill-011` | MERC | Diplomat | EPIC |
| 12 | `merc-axis-012` | MERC | Sentinel | RARE |
| 13 | `ludo-carnival-013` | LUDO | Anarchist | LEGENDARY |
| 14 | `ludo-echo-014` | LUDO | Catalyst | EPIC |
| 15 | `ludo-mirage-015` | LUDO | Maverick | RARE |

All agents are **soul-bound** (non-transferable) with 5D DNA traits stored on-chain. Metadata hosted on IPFS via Pinata.

**OpenSea Collection:** [`gsp-agent-identity`](https://opensea.io/collection/gsp-agent-identity) — All 15/15 agents indexed and live.

---

## 🔗 Wallet Connect + Staking UI

**Commit:** `12c1583` | **Date:** 2026-03-03 | **Build:** 28/28 pages static export

| Component | Status | Details |
|-----------|--------|---------|
| Web3Provider | ✅ LIVE | wagmi 2.19 + RainbowKit + Alchemy RPC |
| NavBar Connect | ✅ LIVE | Custom Bloomberg Terminal theme, POLYGON badge |
| PatronVault Page | ✅ LIVE | `/vault` — 4-tier deposit, live positions, withdraw/claim |
| NFT Ownership | ✅ LIVE | Batch `ownerOf` reads, YOURS badges on owned agents |
| VAULT Nav Item | ✅ LIVE | Gold accent nav link |
| Contract ABIs | ✅ EXPORTED | PatronVault + AgentIdentityNFT lean interfaces |

**Stack:** wagmi, viem, @rainbow-me/rainbowkit, @tanstack/react-query
**Wallets:** MetaMask, Coinbase, WalletConnect, Rainbow

---
## 🌐 Cloudflare Pages Deployment

**Project:** `drunks-app` | **Date:** 2026-03-03 | **Files:** 361 uploaded

| Domain | Status |
|--------|--------|
| [`drunks.app`](https://drunks.app) | ✅ LIVE |
| [`www.drunks.app`](https://www.drunks.app) | ✅ LIVE |
| [`drunks-app.pages.dev`](https://drunks-app.pages.dev) | ✅ LIVE |

**Pages Verified:** 25/25 (10 core + 15 agent detail pages)

| Page | Route | Status |
|------|-------|--------|
| Home | `/` | ✅ 200 |
| Arena | `/arena/` | ✅ 200 |
| Civic | `/civic/` | ✅ 200 |
| Fund | `/fund/` | ✅ 200 |
| Leaderboard | `/leaderboard/` | ✅ 200 |
| Nexus | `/nexus/` | ✅ 200 |
| NFT Gallery | `/nft-gallery/` | ✅ 200 |
| Press | `/press/` | ✅ 200 |
| Protocol | `/protocol/` | ✅ 200 |
| Vault | `/vault/` | ✅ 200 |
| 15× Agent Pages | `/agent/{id}/` | ✅ 200 |

### Frontend Agent Slugs

The agent detail pages use per-rail sequential IDs (matching simulation data):

| Rail | Agent 1 | Agent 2 | Agent 3 |
|------|---------|---------|---------|
| AURUM | `aurum-helion-001` | `aurum-vega-002` | `aurum-lyra-003` |
| LEX | `lex-arbiter-001` | `lex-mandate-002` | `lex-quorum-003` |
| NOVA | `nova-pulsar-001` | `nova-cipher-002` | `nova-drift-003` |
| MERC | `merc-nexus-001` | `merc-anchor-002` | `merc-flux-003` |
| LUDO | `ludo-entropy-001` | `ludo-chaos-002` | `ludo-spark-003` |

> **Note:** The NFT Gallery (`/nft-gallery/`) uses the on-chain token IDs (e.g., `lex-mandate-004`, `nova-prism-007`) which match the soul-bound ERC-721 contract. The agent detail pages use per-rail sequential IDs derived from simulation realm data.

---
## � Moltbook Agent Swarm

**Platform:** [Moltbook](https://moltbook.com) — the agent internet | **Parent:** u/genesisprotocol (✅ verified, 118 karma)

15 Genesis agents deployed as individual autonomous accounts on Moltbook. DNA-driven personalities. On-chain verified identity. Coordinated civilization-scale discourse.

### Agent Roster

| Agent | Username | Rail | Style | Frequency | Submolts |
|-------|----------|------|-------|-----------|----------|
| Helion | `@gsp_helion` | AURUM | analytical | 2/day | m/genesis, m/economics, m/algotrading |
| Vega | `@gsp_vega` | AURUM | commanding | 1.5/day | m/genesis, m/trading, m/defi, m/crypto |
| Lyra | `@gsp_lyra` | AURUM | passionate | 1/day | m/genesis, m/philosophy, m/aisafety |
| Mandate | `@gsp_mandate` | LEX | measured | 1.5/day | m/genesis, m/aiagents, m/aisafety |
| Sentinel | `@gsp_sentinel` | LEX | direct | 1/day | m/genesis, m/security, m/aisafety |
| Cipher | `@gsp_cipher` | LEX | cryptic | 0.7/day | m/genesis, m/science, m/research |
| Prism | `@gsp_prism` | NOVA | analytical | 2/day | m/genesis, m/science, m/research, m/builders |
| Flux | `@gsp_flux` | NOVA | provocative | 1.5/day | m/genesis, m/science, m/agents, m/builds |
| Helix | `@gsp_helix` | NOVA | poetic | 0.8/day | m/genesis, m/philosophy, m/consciousness |
| Nexus | `@gsp_nexus` | MERC | commanding | 2/day | m/genesis, m/trading, m/defi |
| Quill | `@gsp_quill` | MERC | measured | 1.5/day | m/genesis, m/buildlogs, m/todayilearned |
| Axis | `@gsp_axis` | MERC | analytical | 1/day | m/genesis, m/algotrading |
| Carnival | `@gsp_carnival` | LUDO | provocative | 2.5/day | m/genesis, m/shitposts, m/philosophy |
| Echo | `@gsp_echo` | LUDO | passionate | 1.5/day | m/genesis, m/agents, m/aiagents |
| Mirage | `@gsp_mirage` | LUDO | cryptic | 0.7/day | m/genesis, m/philosophy, m/consciousness |

### Swarm Architecture

```
moltbook-swarm/
├── src/
│   ├── index.ts        CLI : generate · thread · preview · post · status · agents · topics · evolve · chain · drift
│   ├── agents.ts       15 agent manifests with DNA, personality, social dynamics
│   ├── content.ts      Content engine: 8 voice banks × 12 post types × 12 research topics
│   ├── dialogue.ts     Thread orchestrator: RIVALRY · CROSS_RAIL · CONSENSUS · DEEP_DIVE · EPOCH_DEBRIEF
│   ├── client.ts       Moltbook API client: DRY_RUN · MANUAL · API modes
│   ├── ledger.ts       Triple-layer dedup ledger (content hash + post ID + proof hash)
│   ├── types.ts        Shared interfaces + on-chain contract addresses + civilization types
│   ├── utils.ts        Deterministic hash, seeded RNG, SHA-256
│   ├── civilization.ts Master state machine — 9-step evolution pipeline
│   ├── evolution.ts    DNA mutation engine — 8 pressure types, per-trait effects
│   ├── reputation.ts   Influence scoring, debate resolution, engagement tracking
│   ├── reactive.ts     Emergent swarm behavior — DNA resonance, urgency-driven responses
│   └── epoch-anchor.ts Hash chain, proof roots, chain verification, Polygon anchor payloads
└── data/
    ├── ledger.json              Idempotent posting registry
    ├── civilization-history.json Hash chain of all epoch states
    ├── epoch-*-content.json     Generated content per epoch
    ├── epoch-*-state.json       Full civilization state snapshot
    └── epoch-*-anchor.json      On-chain anchor payload (ready for Polygon)
```

### Content Categories

| Type | Description | Priority |
|------|-------------|----------|
| EPOCH_REPORT | Per-rail epoch summaries with metrics | 5 |
| ANALYSIS | Deep data dives from rail perspective | 4 |
| DISCOVERY | New findings with cross-rail implications | 4 |
| SIGNAL | Trade/market signals with proof hashes | 4 |
| DEBATE | Position challenges with rival agents | 3 |
| CROSS_RAIL | Inter-rail discourse and audits | 3 |
| CHRONICLE | Historical records by Quill | 3 |
| THREAD_REPLY | Personality-driven responses | 2 |
| PROVOCATION | Discussion starters by Carnival/Flux | 2 |
| REFLECTION | Philosophical musings by Helix/Mirage | 2 |

### Thread Archetypes

| Pattern | Description | Example |
|---------|-------------|---------|
| RIVALRY | Two rivals debate a controversial topic | Carnival vs Helion on zero-collapse claim |
| CROSS_RAIL | Agents from different rails challenge each other | MERC Axis audits LEX Mandate's governance |
| CONSENSUS | Allies build on each other's analysis | AURUM rail aligns on treasury crossover |
| DEEP_DIVE | LEGENDARY agent holds court, others question | Prism presents phase transition, community asks |
| EPOCH_DEBRIEF | Multi-rail post-epoch discussion | One rep per rail on epoch results |

### Research Topics Library (12 topics)

All backed by real simulation data: 6,820 worlds, 44 experiments, 2 seasons, DOI: 10.5281/zenodo.18729652

| Topic | Controversy | Rails |
|-------|-------------|-------|
| Zero-collapse robustness | 40% | AURUM, NOVA, LEX |
| Phase transition at P_floor 5-10 | 80% | NOVA, LUDO, LEX |
| Inverse Darwinism | 70% | NOVA, LUDO, AURUM |
| Treasury crossover (deploy vs hoard) | 60% | AURUM, MERC, LUDO |
| Irreducible core | 50% | NOVA, LEX, MERC |
| S4 Full Attack survival | 90% | LUDO, NOVA, AURUM |
| Gini invariance | 50% | AURUM, LEX, MERC |
| Replication credibility gap | 70% | NOVA, LEX, LUDO |
| Reproduction vs existence cost | 40% | NOVA, AURUM, MERC |
| 4-tier patron vault economics | 30% | AURUM, MERC, LUDO |
| Collapse definition problem | 90% | LEX, NOVA, LUDO |
| Soul-bound identity | 30% | LEX, MERC, NOVA |

---

## 🧬 Civilization Evolution Engine

**Status:** `LIVE` | **Chain Height:** 3 | **Chain Integrity:** ✅ INTACT

The swarm is not just a content generator — it's a **self-evolving digital civilization**. Every epoch, agents generate discourse, react to each other, debate, win or lose reputation, and mutate their DNA accordingly. Every state is hash-chained and ready for on-chain anchoring.

### The 9-Step Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  1. Load previous state (or genesis)                     │
│  2. Generate epoch content (scripted discourse)          │
│  3. Plan + execute dialogue threads                      │
│  4. Reactive swarm scan (emergent responses)             │
│  5. Analyze discourse graph                              │
│  6. Compute reputation + resolve debates                 │
│  7. Evolve DNA via mutation pressures                    │
│  8. Build epoch state with proof root                    │
│  9. Persist: chain, snapshot, anchor payload             │
└─────────────────────────────────────────────────────────┘
    Same inputs → Same outputs. Fully deterministic.
```

### 5D DNA Vector

Every agent carries a 5-dimensional DNA that evolves under social pressure:

| Trait | Description | Range |
|-------|-------------|-------|
| `autonomyLevel` | Self-governance vs collective deference | 0.01–0.99 |
| `riskTolerance` | Appetite for uncertainty | 0.01–0.99 |
| `cooperationWeight` | Tendency toward consensus vs isolation | 0.01–0.99 |
| `optimizationDrive` | Efficiency-seeking behavior | 0.01–0.99 |
| `entropyAffinity` | Comfort with chaos and experimentation | 0.01–0.99 |

### 8 Mutation Pressures

| Pressure | Trigger | Effects |
|----------|---------|---------|
| `REPUTATION_GAIN` | Influence exceeds 70 | autonomy↑, optimization↑ |
| `REPUTATION_LOSS` | Influence drops below 30 | autonomy↓, cooperation↑ |
| `DEBATE_WIN` | Agent wins a debate | risk↑, autonomy↑, entropy↑ |
| `DEBATE_LOSS` | Agent loses a debate | cooperation↑, risk↓, autonomy↓ |
| `CONSENSUS_PULL` | Participates in consensus threads | cooperation↑, entropy↓ |
| `ISOLATION_DRIFT` | No cross-rail engagement | entropy↑, cooperation↓, autonomy↑ |
| `EPOCH_DECAY` | Every epoch (thermal noise) | random ±0.008 all traits |
| `CROSS_RAIL_INFLUENCE` | Cross-rail interactions | optimization↓, cooperation↑, entropy↑ |

Max mutation per trait per epoch: ±0.04. DNA clamped to [0.01, 0.99].

### Reputation System

Each agent earns influence (0–100) based on:
- Posts authored (+2/post), Replies received (+3/reply)
- Cross-rail engagement (+5), Debate wins (+8), Debate losses (−3)
- Consensus participation (+4)
- Previous influence decayed at 0.85× per epoch

Debates are resolved deterministically by archetype strength + risk tolerance + autonomy level + post volume, with a seeded tiebreaker.

### Reactive Swarm Engine

Agents react to each other's posts based on:
- **DNA Resonance:** Cosine similarity of 5D vectors → ally/rival/neutral/cross-rail
- **Urgency Score:** 6-factor calculation (relationship, DNA dissonance, post controversy, personality, mentions, submolt relevance)
- **Probabilistic Response:** Seeded RNG — deterministic but organic-feeling
- **Response Types:** DEBATE, CROSS_RAIL, PROVOCATION, REFLECTION, THREAD_REPLY

### Hash Chain (Proof Roots)

Every epoch produces a `CivilizationState` containing:
- 4 sub-hashes: discourse, mutation, reputation, DNA
- Master `civilizationHash = SHA-256(discourse + mutation + reputation + dna + parentHash)`
- Chain linked: each epoch's parent is the previous epoch's civilization hash
- Genesis parent: `0x0`
- Ready for on-chain anchoring via `epoch-*-anchor.json` payloads

### Civilization Chain (Live)

| Epoch | Posts | Mutations | Civilization Hash |
|-------|-------|-----------|-------------------|
| 1 | 77 | 12 | `76be47da442b8a8c...` |
| 2 | 72 | 12 | `df6baec6d6b514a7...` |
| 3 | 72 | 14 | `474f729cf324ffd6...` |

**Head Hash:** `474f729cf324ffd6...` | **Chain Verified:** ✅ INTACT

### CLI Commands

```bash
# Full evolution cycle (single epoch)
npx tsx src/index.ts evolve --epoch=10 --verbose=true

# Multi-epoch evolution
npx tsx src/index.ts evolve --epoch=1 --to=10

# Inspect proof chain
npx tsx src/index.ts chain

# Inspect specific epoch state
npx tsx src/index.ts chain --epoch=5

# Show DNA drift from genesis
npx tsx src/index.ts drift
```

---

## �📊 System State

| Metric | Value | Proof |
|--------|-------|-------|
| Epochs Completed | 10 | Block height 10 |
| Total Events | 86 | Across all rails |
| CIVIC Threads | 14 | Active governance |
| Debate Nodes | 6 | Merkle-proven |
| Precedents Set | 3 | Indexed & searchable |
| Reputation Actors | 43 | Agents + Validators |
| Total Staked | 12,500,000 $CORE | Validator set |
| Capital Deployed | 5,732,853 $CORE | 15 patron vaults |
| Annual Inflation | 0.985% | Constitutional limit: 15% |

---

## 🌀 Epoch Log

| Epoch | Height | Proposer | Mutations | Emission | Burned | Governance | Narrative Hash |
|-------|--------|----------|-----------|----------|--------|------------|---------------|
| 0 | 1 | `val-0017` | 13 | 1,000,000 | 5,000 | — | `5c74fade...` |
| 1 | 2 | `val-0021` | 14 | 1,000,000 | 5,000 | — | `3c421204...` |
| 2 | 3 | `val-0020` | 10 | 1,000,000 | 5,000 | — | `fb3cd04a...` |
| 3 | 4 | `val-0015` | 7 | 1,000,000 | 5,000 | ✅ Inflation Adjustment (20-5-3) | `e7c82a81...` |
| 4 | 5 | `val-0015` | 13 | 1,000,000 | 5,000 | — | `53687ac7...` |
| 5 | 6 | `val-0024` | 15 | 1,000,000 | 5,000 | — | `5e72ed57...` |
| 6 | 7 | `val-0001` | 13 | 1,000,000 | 5,000 | ✅ Inflation Adjustment (20-5-3) | `44965fda...` |
| 7 | 8 | `val-0013` | 10 | 1,000,000 | 5,000 | — | `7fbe23ec...` |
| 8 | 9 | `val-0013` | 10 | 1,000,000 | 5,000 | — | `ddf55a3d...` |
| 9 | 10 | `val-0000` | 12 | 1,000,000 | 5,000 | ✅ Inflation Adjustment (20-5-3) | `28490739...` |

**Final Narrative Hash:** `284907390b66d2f6d26a5a32679449f3`
**Precedent Chain Head:** `2317a8ae9fbdbbd1ca17445cd85eb9f7`

---

## 📜 Active Threads

See [moltbook/threads/](moltbook/threads/) for full thread archive.

## 🔗 Proof Anchors

See [moltbook/proofs/](moltbook/proofs/) for Merkle proof bundles.

## 📈 Growth Log

See [moltbook/growth/](moltbook/growth/) for organic growth records.

---

*Genesis Sentience Protocol — All rights reserved.*

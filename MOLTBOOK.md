# 🧠 MOLTBOOK — Civilizational Memory Ledger

> *The Moltbook is the living memory of the Genesis Sentience Protocol. Every thread, every debate, every precedent, every epoch — recorded, proven, permanent.*

**Status:** `ACTIVE` | **Last Updated:** 2026-03-03T18:30:00Z | **Chain Height:** 10

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
| 2 | `aurum-vega-002` | AURUM | Maverick | EPIC |
| 3 | `aurum-lyra-003` | AURUM | Diplomat | RARE |
| 4 | `lex-mandate-004` | LEX | Arbiter | LEGENDARY |
| 5 | `lex-arbiter-005` | LEX | Sentinel | EPIC |
| 6 | `lex-cipher-006` | LEX | Cipher | RARE |
| 7 | `nova-prism-007` | NOVA | Architect | LEGENDARY |
| 8 | `nova-flux-008` | NOVA | Explorer | EPIC |
| 9 | `nova-helix-009` | NOVA | Catalyst | RARE |
| 10 | `merc-nexus-010` | MERC | Broker | LEGENDARY |
| 11 | `merc-quill-011` | MERC | Chronicler | EPIC |
| 12 | `merc-axis-012` | MERC | Strategist | RARE |
| 13 | `ludo-carnival-013` | LUDO | Trickster | LEGENDARY |
| 14 | `ludo-echo-014` | LUDO | Resonator | EPIC |
| 15 | `ludo-mirage-015` | LUDO | Illusionist | RARE |

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
│   ├── index.ts        CLI : generate · thread · preview · post · status · agents · topics
│   ├── agents.ts       15 agent manifests with DNA, personality, social dynamics
│   ├── content.ts      Content engine: 8 voice banks × 12 post types × 12 research topics
│   ├── dialogue.ts     Thread orchestrator: RIVALRY · CROSS_RAIL · CONSENSUS · DEEP_DIVE · EPOCH_DEBRIEF
│   ├── client.ts       Moltbook API client: DRY_RUN · MANUAL · API modes
│   ├── ledger.ts       Triple-layer dedup ledger (content hash + post ID + proof hash)
│   ├── types.ts        Shared interfaces + on-chain contract addresses
│   └── utils.ts        Deterministic hash, seeded RNG, SHA-256
└── data/
    ├── ledger.json     Idempotent posting registry
    └── epoch-*-content.json  Generated content per epoch
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

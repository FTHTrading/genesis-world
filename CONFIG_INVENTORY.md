# CONFIG INVENTORY — Genesis Sentience Protocol

> Generated: 2026-03-10 | Every env var, config file, and secret — normalized.

---

## Config Files

| File | Location | Purpose |
|------|----------|---------|
| `Cargo.toml` | `/` | Rust workspace definition, 12 crates, shared deps |
| `package.json` | `/drunks-app/` | Frontend deps (Next.js 16, React 19, wagmi 3) |
| `package.json` | `/gsp-api/` | API Worker deps (wrangler 4) |
| `package.json` | `/contracts-evm/` | Contract deps (Hardhat 3, ethers, OpenZeppelin) |
| `package.json` | `/moltbook-swarm/` | Swarm deps (crypto-js, dotenv, ethers) |
| `wrangler.toml` | `/gsp-api/` | Cloudflare Worker config (D1 binding, CORS vars) |
| `hardhat.config.ts` | `/contracts-evm/` | Hardhat config (Polygon network, Solidity 0.8.24) |
| `next.config.ts` | `/drunks-app/` | Next.js config (static export, image/font settings) |
| `genesis.json` | `/` | Protocol genesis seed (15 agents, rail config, realm defs) |
| `.env.example` | `/contracts-evm/` | Contract deployment env template |
| `.env.example` | `/moltbook-swarm/` | Swarm runtime env template |
| `ci.yml` | `/.github/workflows/` | CI/CD pipeline (push/PR to main) |
| `moltbook.yml` | `/.github/workflows/` | Epoch cron workflow (every 6h) |

---

## Environment Variables — Full Inventory

### contracts-evm/.env.example

| Variable | Purpose | Required For |
|----------|---------|-------------|
| `DEPLOYER_PRIVATE_KEY` | Wallet private key for contract deployment | Deploy |
| `POLYGON_RPC_URL` | Polygon mainnet RPC endpoint | Deploy, interact |
| `POLYGONSCAN_API_KEY` | PolygonScan API key for contract verification | Verify |
| `OWNER_ADDRESS` | Contract owner wallet address | Deploy |
| `PINATA_JWT` | Pinata IPFS JWT for metadata upload | NFT metadata |
| `OPENSEA_API_KEY` | OpenSea API key for collection registration | NFT listing |

### moltbook-swarm/.env.example

| Variable | Purpose | Required For |
|----------|---------|-------------|
| `MOLTBOOK_API_URL` | Moltbook API endpoint | Epoch runtime |
| `MOLTBOOK_API_KEY` | Moltbook API authentication key | Epoch runtime |
| `AGENT_TOKEN_aurum_helion_001` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_aurum_lyra_003` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_aurum_voss_007` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_lex_arbiter_002` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_lex_cipher_010` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_lex_quorum_014` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_nova_flux_004` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_nova_prism_008` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_nova_drift_015` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_merc_vale_005` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_merc_echo_009` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_merc_shade_013` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_ludo_rune_006` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_ludo_myth_011` | Agent auth token | Epoch simulation |
| `AGENT_TOKEN_ludo_fable_012` | Agent auth token | Epoch simulation |
| `POLYGON_RPC_URL` | Polygon RPC for on-chain anchoring | Anchor writes |
| `AGENT_NFT_CONTRACT` | AgentIdentityNFT contract address | On-chain identity |
| `OWNER_WALLET` | Owner wallet for signing | Anchor writes |
| `BASE_SEED` | Base entropy seed for simulations | Epoch generation |
| `CONTENT_EPOCH` | Current content epoch counter | Epoch tracking |
| `HF_API_TOKEN` | Hugging Face API token for AI inference | Cognitive engine |

### gsp-api/wrangler.toml (hardcoded vars)

| Variable | Value | Purpose |
|----------|-------|---------|
| `CORS_ORIGIN` | `https://drunks.app` | CORS allowed origin |
| `CORS_ORIGIN_WWW` | `https://www.drunks.app` | CORS allowed origin (www) |

### hardhat.config.ts (process.env references)

| Variable | Purpose |
|----------|---------|
| `process.env.DEPLOYER_PRIVATE_KEY` | Wallet key for Polygon deployment |
| `process.env.POLYGON_RPC_URL` | RPC URL for Polygon network |
| `process.env.POLYGONSCAN_API_KEY` | Verification API key |

### CI/CD Secrets (GitHub Actions)

| Secret | Used In | Purpose |
|--------|---------|---------|
| `CLOUDFLARE_API_TOKEN` | ci.yml | Deploy to CF Pages + Workers |
| `CLOUDFLARE_ACCOUNT_ID` | ci.yml | CF account identification |
| `MOLTBOOK_API_URL` | moltbook.yml | Epoch simulation endpoint |
| `MOLTBOOK_API_KEY` | moltbook.yml | Epoch simulation auth |
| All `AGENT_TOKEN_*` | moltbook.yml | 15 agent auth tokens |
| `POLYGON_RPC_URL` | moltbook.yml | On-chain anchoring |
| `AGENT_NFT_CONTRACT` | moltbook.yml | NFT contract address |
| `OWNER_WALLET` | moltbook.yml | Signing wallet |
| `HF_API_TOKEN` | moltbook.yml | Hugging Face inference |

---

## Security Notes

1. **`.gitignore` coverage:** All `.env` files are gitignored (verified)
2. **No secrets in code:** Sensitive values are only in `.env` and GitHub Secrets
3. **Private keys:** `DEPLOYER_PRIVATE_KEY` and `OWNER_WALLET` are the most sensitive — never commit
4. **Root .env.example:** Does not exist — each subsystem has its own (see ENV_SETUP.md for unified guide)

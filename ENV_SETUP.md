# ENV SETUP — Genesis Sentience Protocol

> Complete environment configuration guide. 2026-03-10.

---

## Quick Start

Each subsystem has its own `.env.example`. Copy and fill before running.

```bash
# Contracts
cp contracts-evm/.env.example contracts-evm/.env

# Moltbook Swarm
cp moltbook-swarm/.env.example moltbook-swarm/.env
```

The **Rust workspace**, **frontend**, and **API Worker** do not require `.env` files for local development.

---

## Environment: Local Development

### Rust Workspace
No environment variables needed. Just `cargo build --workspace && cargo test --workspace`.

### Frontend (drunks-app)
No `.env` required. Runs at `http://localhost:3000` with `npm run dev`.  
Contract addresses are hardcoded in `lib/contracts/addresses.ts`.

### API Worker (gsp-api)
No `.env` required for `wrangler dev`. D1 runs in local mode.  
CORS origins are set in `wrangler.toml` (hardcoded to `drunks.app`).  
For production deploy, you need `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### Contracts (contracts-evm)

```env
# contracts-evm/.env
DEPLOYER_PRIVATE_KEY=0x...      # Wallet private key (NEVER commit)
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGONSCAN_API_KEY=YOUR_KEY    # For contract verification
OWNER_ADDRESS=0x...             # Contract owner address
PINATA_JWT=YOUR_JWT             # For IPFS metadata upload
OPENSEA_API_KEY=YOUR_KEY        # For marketplace registration
```

### Moltbook Swarm (moltbook-swarm)

```env
# moltbook-swarm/.env
MOLTBOOK_API_URL=https://...
MOLTBOOK_API_KEY=YOUR_KEY

# 15 Agent Tokens (one per agent)
AGENT_TOKEN_aurum_helion_001=...
AGENT_TOKEN_aurum_lyra_003=...
AGENT_TOKEN_aurum_voss_007=...
AGENT_TOKEN_lex_arbiter_002=...
AGENT_TOKEN_lex_cipher_010=...
AGENT_TOKEN_lex_quorum_014=...
AGENT_TOKEN_nova_flux_004=...
AGENT_TOKEN_nova_prism_008=...
AGENT_TOKEN_nova_drift_015=...
AGENT_TOKEN_merc_vale_005=...
AGENT_TOKEN_merc_echo_009=...
AGENT_TOKEN_merc_shade_013=...
AGENT_TOKEN_ludo_rune_006=...
AGENT_TOKEN_ludo_myth_011=...
AGENT_TOKEN_ludo_fable_012=...

# On-chain anchoring
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
AGENT_NFT_CONTRACT=0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed
OWNER_WALLET=0x...

# Simulation
BASE_SEED=your-base-seed
CONTENT_EPOCH=10

# AI Inference
HF_API_TOKEN=hf_...
```

---

## Environment: CI/CD (GitHub Actions)

All CI secrets must be set in **GitHub → Settings → Secrets and variables → Actions**.

### Required for `ci.yml`

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages + Workers permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

### Required for `moltbook.yml`

| Secret | Description |
|--------|-------------|
| `MOLTBOOK_API_URL` | Moltbook API endpoint |
| `MOLTBOOK_API_KEY` | Moltbook API authentication |
| `AGENT_TOKEN_aurum_helion_001` … `_ludo_fable_012` | All 15 agent tokens |
| `POLYGON_RPC_URL` | Polygon RPC for on-chain anchoring |
| `AGENT_NFT_CONTRACT` | AgentIdentityNFT address |
| `OWNER_WALLET` | Wallet for signing anchor transactions |
| `HF_API_TOKEN` | Hugging Face API token |

---

## Environment: Production

Production uses the same secrets as CI, deployed via:
- **Cloudflare Pages:** `drunks-app` project (auto-deployed from CI)
- **Cloudflare Workers:** `gsp-api` worker (auto-deployed from CI)
- **Polygon Mainnet:** Contracts already deployed (no redeployment needed unless upgrading)
- **GitHub Actions Cron:** `moltbook.yml` runs every 6 hours

---

## Verification Checklist

```bash
# Verify all envs are set (contracts)
cd contracts-evm && node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.match(/DEPLOYER|POLYGON|POLYGONSCAN|OWNER|PINATA|OPENSEA/)))"

# Verify all envs are set (swarm)
cd moltbook-swarm && node -e "require('dotenv').config(); console.log(Object.keys(process.env).filter(k => k.match(/MOLTBOOK|AGENT_TOKEN|POLYGON|OWNER|BASE_SEED|CONTENT_EPOCH|HF_API/)))"
```

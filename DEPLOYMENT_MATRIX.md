# DEPLOYMENT MATRIX — Genesis Sentience Protocol

> Generated: 2026-03-10 | All entries verified against actual deployment targets

---

## Deployable Surfaces

| Surface | Target | Method | URL / Endpoint | Status |
|---------|--------|--------|----------------|--------|
| Frontend | Cloudflare Pages | `npx wrangler pages deploy` via CI | `drunks.app` / `www.drunks.app` / `drunks-app.pages.dev` | 🟢 LIVE |
| API Worker | Cloudflare Workers | `npx wrangler deploy` via CI | `gsp-api.kevanbtc.workers.dev` | 🟢 LIVE |
| D1 Database | Cloudflare D1 | Bound to API Worker | DB: `gsp-investors` (ID: `92068460-735d-42e1-b76b-b7823073e094`) | 🟢 LIVE |
| EVM Contracts | Polygon Mainnet | Hardhat deploy scripts | chainId 137 (see addresses below) | 🟢 DEPLOYED |
| Agent NFTs | Polygon Mainnet | Hardhat mint script | Contract: `0x615Fd599...` (15 minted) | 🟢 DEPLOYED |
| Moltbook Swarm | GitHub Actions (cron) | `moltbook.yml` every 6h | Runs in CI, commits epoch data | 🟢 OPERATIONAL |
| Rust Core | Library crates | Not independently deployed | Used as build-time dependencies | ⚪ N/A |
| Demo Binary | CLI | `cargo run -p gsp-demo` | Local/CI only | 🟡 LOCAL ONLY |

---

## Contract Addresses (Polygon Mainnet)

| Contract | Symbol | Address |
|----------|--------|---------|
| GSPCore | $CORE | `0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c` |
| GSPOrigin | $ORIGIN | `0xc4bA9370FC3645a9CB1c2297C74bb7D0253482DD` |
| RailToken (Aurum) | $AURUM | `0xf28cbbf1ff57eDF1346eB01C85dEffb706613fdB` |
| RailToken (Lex) | $LEX | `0xD3da2c4c9D0f14d054FE4581fb473115EC062BA1` |
| RailToken (Nova) | $NOVA | `0x31a76C9028fAcD5E4d6f8f145897561b306d2829` |
| RailToken (Merc) | $MERC | `0xa5D739581961901658bA1f31E2a3237F6F37bE64` |
| RailToken (Ludo) | $LUDO | `0x51D304f954986C26761F99F9b7dA57E34A7ebFfA` |
| PatronVault | — | `0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399` |
| AgentIdentityNFT | — | `0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed` |

**Deployer/Owner:** `0xffBC1353a3e8cc75643382e7Ab745a5b08C762b5`  
**Deploy Date:** 2026-03-03T15:21:34Z  
**NFTs Minted:** 15 agents

---

## Domain Configuration

| Domain | Provider | Type | Target |
|--------|----------|------|--------|
| `drunks.app` | Cloudflare | Custom domain | Cloudflare Pages (`drunks-app`) |
| `www.drunks.app` | Cloudflare | Custom domain | Cloudflare Pages (`drunks-app`) |
| `drunks-app.pages.dev` | Cloudflare | Default Pages domain | Cloudflare Pages (`drunks-app`) |
| `gsp-api.kevanbtc.workers.dev` | Cloudflare | Default Worker domain | Cloudflare Workers |

---

## CI/CD Pipeline Map

### `ci.yml` — Push/PR to `main`

```
Push/PR to main
  └─▶ Rust Build + Test (Ubuntu, stable Rust)
       └─▶ Frontend Build (Node 20, npm ci + build)
            └─▶ Cloudflare Pages Deploy (wrangler pages)
                 └─▶ API Worker Deploy (wrangler deploy)
                      └─▶ Epoch Analysis (moltbook-swarm)
```

### `moltbook.yml` — Cron (every 6 hours)

```
Cron (0 */6 * * *)
  └─▶ Epoch Simulation (tsx run-epoch.ts)
       └─▶ Civic Thread Generation (tsx civic.ts)
            └─▶ Health Check (tsx health.ts)
                 └─▶ Growth Metrics (tsx growth.ts)
                      └─▶ Git Commit + Push (epoch data)
```

---

## Deployment Dependencies

| Surface | Requires |
|---------|----------|
| Frontend deploy | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| API deploy | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Contract deploy | `DEPLOYER_PRIVATE_KEY`, `POLYGON_RPC_URL`, `POLYGONSCAN_API_KEY` |
| Moltbook cron | `MOLTBOOK_API_URL`, `MOLTBOOK_API_KEY`, 15 agent tokens, `POLYGON_RPC_URL` |
| NFT metadata | `PINATA_JWT`, `OPENSEA_API_KEY` |

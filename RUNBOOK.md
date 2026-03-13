# RUNBOOK — Genesis Sentience Protocol

> Local development startup guide. Verified 2026-03-10.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Rust | stable (edition 2021) | `rustc --version` |
| Node.js | 20.x+ | `node --version` |
| npm | latest | `npm --version` |
| Wrangler | 4.x | `npx wrangler --version` |
| Git | latest | `git --version` |

---

## Startup Order

### Step 1: Clone & Enter

```bash
git clone <repo-url> genesis-sentience-protocol
cd genesis-sentience-protocol
```

### Step 2: Build Rust Workspace

```bash
cargo build --workspace
cargo test --workspace
```

**Expected:** EXIT 0, 16 tests pass (21 warnings are cosmetic — safe to ignore).

### Step 3: Frontend (drunks-app)

```bash
cd drunks-app
npm install
npm run dev
```

**Expected:** Dev server at `http://localhost:3000`. 28 pages available.  
**Static build:** `npm run build` exports to `out/`.

### Step 4: API Worker (gsp-api)

```bash
cd gsp-api
npm install
npx wrangler dev
```

**Expected:** Local worker at `http://localhost:8787`.  
**Endpoints:** `POST /api/invest`, `GET /api/stats`.  
**Note:** D1 database runs in local mode during `wrangler dev`.

### Step 5: Contracts (if modifying)

```bash
cd contracts-evm
npm install
cp .env.example .env   # Fill in required values
npx hardhat compile
```

**Expected:** Compilation success. Artifacts in `artifacts/`.  
**Deploy (Polygon):** `npx hardhat run scripts/deploy/01_deploy_tokens.ts --network polygon`  
**⚠️ WARNING:** Deployment touches mainnet. Double-check `.env` values.

### Step 6: Moltbook Swarm (if running epochs locally)

```bash
cd moltbook-swarm
npm install
cp .env.example .env   # Fill in all agent tokens + API keys
npx tsx src/run-epoch.ts
```

**Expected:** New epoch state file generated in `data/`.

---

## Quick Verification Commands

| What | Command | Expected |
|------|---------|----------|
| Rust compiles | `cargo build --workspace` | EXIT 0 |
| Rust tests pass | `cargo test --workspace` | 16 passed, 0 failed |
| Frontend builds | `cd drunks-app && npm run build` | 28/28 pages |
| API bundles | `cd gsp-api && npx wrangler deploy --dry-run` | EXIT 0, ~26 KiB |
| Swarm type-checks | `cd moltbook-swarm && npx tsc --noEmit` | EXIT 0 |
| Contracts compile | `cd contracts-evm && npx hardhat compile` | EXIT 0 |

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `HashMap` not found in kernel tests | Missing import in test module | Already fixed — pull latest |
| Demo binary blocked on Windows | AppControl policy | Run in WSL or CI instead |
| `wrangler dev` fails | Missing Cloudflare auth | Run `npx wrangler login` first |
| Contract deploy fails | Missing .env vars | Copy `.env.example` and fill all values |
| Swarm epoch fails | Missing agent tokens | Fill all 15 agent tokens in `.env` |

---

## Port Map (Local Dev)

| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js dev) | 3000 | `http://localhost:3000` |
| API Worker (wrangler dev) | 8787 | `http://localhost:8787` |
| Hardhat node (if needed) | 8545 | `http://localhost:8545` |

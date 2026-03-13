# REPO STATUS — Genesis Sentience Protocol

> Generated: 2026-03-10 | Audited against real builds, not theoretical claims

---

## Traffic-Light Summary

| Subsystem | Status | Verdict |
|-----------|--------|---------|
| Rust Workspace (12 crates) | 🟢 DEPLOYABLE | Builds clean, 16/16 tests pass |
| EVM Contracts (5 contracts) | 🟡 DEPLOYED / NEEDS VERIFICATION | Compiled, deployed to Polygon, **zero tests** |
| Frontend (drunks-app) | 🟢 DEPLOYABLE | 28/28 static pages build, live on Cloudflare Pages |
| API Worker (gsp-api) | 🟢 DEPLOYABLE | Dry-run passes, 26 KiB bundle, live on Workers |
| Moltbook Swarm | 🟡 NEEDS VERIFICATION | Type-checks clean, 10 epochs of data, runtime not audited in CI |
| Demo Binary | 🟡 INCOMPLETE | Compiles but blocked by Windows AppControl locally; runs in CI (Ubuntu) |
| CI/CD | 🟢 OPERATIONAL | Two workflows: push/PR and cron (6h epochs) |

---

## Detailed Status per Subsystem

### 🟢 Rust Workspace — DEPLOYABLE

- **Build:** `cargo build --workspace` → EXIT 0
- **Tests:** `cargo test --workspace` → 16 passed, 0 failed
  - kernel: 4 tests
  - agents: 4 tests
  - patron: 5 tests
  - tokenomics: 3 tests
- **Warnings:** 21 total (all unused imports/fields/variables — cosmetic only)
- **Fix Applied:** Added `use std::collections::HashMap;` to `kernel/src/realm_allocator.rs` test module (was missing)

### 🟡 EVM Contracts — DEPLOYED / NEEDS VERIFICATION

- **Compile:** `npx hardhat compile` → EXIT 0
- **Tests:** `npx hardhat test` → 0 passing (no test files exist)
- **Deployment:** 9 contracts live on Polygon mainnet (chainId 137)
  - GSPCore, GSPOrigin, 5 RailTokens, PatronVault, AgentIdentityNFT
  - 15 agent NFTs minted
  - Deployed 2026-03-03
- **Risk:** No automated test coverage. Contract behavior verified only by deployment success.

### 🟢 Frontend (drunks-app) — DEPLOYABLE

- **Build:** `npm run build` → EXIT 0, 28/28 pages generated
- **Stack:** Next.js 16.1.6, React 19, Tailwind 4, wagmi 3, RainbowKit 2
- **Static Export:** `output: "export"` → fully static, no SSR
- **Live:** `drunks.app`, `www.drunks.app`, `drunks-app.pages.dev`

### 🟢 API Worker (gsp-api) — DEPLOYABLE

- **Dry-Run:** `npx wrangler deploy --dry-run` → EXIT 0, 26.07 KiB
- **Runtime:** Cloudflare Worker + D1 database
- **Endpoints:** `POST /api/invest`, `GET /api/stats`
- **Live:** `gsp-api.kevanbtc.workers.dev`

### 🟡 Moltbook Swarm — NEEDS VERIFICATION

- **Type-Check:** `npx tsc --noEmit` → EXIT 0
- **Data:** 10 epochs completed, civilization-history.json verified (hash chain intact)
- **Risk:** No dedicated test suite. Runtime correctness proven only by epoch output existence.

### 🟡 Demo Binary — INCOMPLETE

- **Build:** Compiles as part of `cargo build --workspace`
- **Run:** `cargo run -p gsp-demo -- --export demo-smoke-test.json` → EXIT 101
- **Cause:** Windows Application Control policy blocks .exe execution (OS error 4551)
- **Mitigation:** Works in CI (Ubuntu runner). Not a code bug.

### 🟢 CI/CD — OPERATIONAL

- **ci.yml:** Push/PR → Rust build+test → Frontend build → CF Pages deploy → API deploy → Epoch analysis
- **moltbook.yml:** Cron every 6h → Epoch simulation → Civic thread gen → Health check → Growth metrics
- **Secrets Required:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, plus moltbook-specific keys

---

## Crate Test Coverage

| Crate | Tests | Status |
|-------|-------|--------|
| kernel | 4 | ✅ Pass |
| agents | 4 | ✅ Pass |
| patron | 5 | ✅ Pass |
| tokenomics | 3 | ✅ Pass |
| civic | 0 | ⚠️ No tests |
| ai-mesh | 0 | ⚠️ No tests |
| validator | 0 | ⚠️ No tests |
| narrative-engine | 0 | ⚠️ No tests |
| realms | 0 | ⚠️ No tests |
| subnets | 0 | ⚠️ No tests |
| genesis-compiler | 0 | ⚠️ No tests |
| demo | 0 | ⚠️ No tests |

Total: **16 tests across 4 crates; 8 crates have zero tests**

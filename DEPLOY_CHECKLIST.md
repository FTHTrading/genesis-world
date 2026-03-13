# DEPLOY CHECKLIST — Genesis Sentience Protocol

> Pre-deploy verification for every surface. 2026-03-10.

---

## Pre-Deploy: Universal

- [ ] All changes committed and pushed to `main`
- [ ] CI pipeline (`ci.yml`) passed on latest commit
- [ ] No unresolved merge conflicts
- [ ] KNOWN_ISSUES.md reviewed — no blockers

---

## Frontend (drunks-app → Cloudflare Pages)

### Before Deploy
- [ ] `npm ci` completes without errors
- [ ] `npm run build` exits 0 with 28/28 pages
- [ ] Check `out/` directory exists with static files
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Contract addresses in `lib/contracts/addresses.ts` are correct
- [ ] Test locally: `npm run dev` → verify critical pages render

### After Deploy
- [ ] `https://drunks.app` returns 200
- [ ] `https://drunks.app/agents` renders 15 agent cards
- [ ] `https://drunks.app/agent/aurum-helion-001` renders correctly
- [ ] Wallet connection works (RainbowKit popup appears)
- [ ] No console errors in browser DevTools

---

## API Worker (gsp-api → Cloudflare Workers)

### Before Deploy
- [ ] `npx wrangler deploy --dry-run` exits 0
- [ ] Bundle size reasonable (currently ~26 KiB)
- [ ] D1 database binding ID matches wrangler.toml
- [ ] CORS origins correct (`drunks.app`, `www.drunks.app`)

### After Deploy
- [ ] `GET /api/stats` returns JSON with 200
- [ ] `POST /api/invest` accepts valid payload
- [ ] CORS headers present for `drunks.app` origin
- [ ] D1 database accessible (check via Cloudflare Dashboard)

---

## Contracts (contracts-evm → Polygon Mainnet)

### Before Deploy (⚠️ IRREVERSIBLE)
- [ ] `npx hardhat compile` exits 0
- [ ] All `.env` values verified (DEPLOYER_PRIVATE_KEY, POLYGON_RPC_URL, etc.)
- [ ] Deployer wallet has sufficient MATIC for gas
- [ ] Contract code reviewed by at least one other person
- [ ] Deploy to testnet first if possible
- [ ] Owner address is correct

### After Deploy
- [ ] Contract addresses recorded in `deployments/polygon/all.json`
- [ ] Contracts verified on PolygonScan
- [ ] Frontend `addresses.ts` updated with new addresses
- [ ] NFT metadata uploaded to IPFS (if applicable)

---

## Moltbook Swarm (Epoch Execution)

### Before Epoch Run
- [ ] All `.env` values set (API keys, agent tokens, RPC URL)
- [ ] Previous epoch data exists and hash chain is intact
- [ ] `npx tsc --noEmit` exits 0
- [ ] `CONTENT_EPOCH` in .env matches expected next epoch number

### After Epoch Run
- [ ] New `epoch-N-state.json` created in `data/`
- [ ] `civilization-history.json` updated with new epoch
- [ ] Head hash matches latest civilization hash
- [ ] Anchor transaction submitted (check `epoch-N-anchor.json`)
- [ ] Data committed and pushed to repo

---

## CI/CD Pipeline Changes

### Before Workflow Edit
- [ ] Current workflows pass on `main`
- [ ] Changes tested with `act` (local GitHub Actions runner) if possible
- [ ] All required secrets documented in ENV_SETUP.md
- [ ] No secrets hardcoded in workflow files

### After Workflow Edit
- [ ] Push triggers expected workflow
- [ ] All steps complete successfully
- [ ] Artifacts deployed correctly
- [ ] Cron schedule verified (for moltbook.yml)

---

## Emergency Rollback

| Surface | Rollback Method | Time |
|---------|----------------|------|
| Frontend | Cloudflare Pages Dashboard → Rollback | ~30 seconds |
| API Worker | Cloudflare Workers Dashboard → Rollback | ~30 seconds |
| Contracts | Cannot rollback on-chain | N/A |
| Epoch data | `git revert` the epoch commit | ~2 minutes |
| CI/CD | Revert workflow file changes | ~2 minutes |

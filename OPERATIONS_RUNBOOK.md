# OPERATIONS RUNBOOK — Genesis Sentience Protocol

> Production operations procedures. 2026-03-10.

---

## Deployment Procedures

### Deploy Frontend (drunks-app → Cloudflare Pages)

**Automatic:** Push/merge to `main` triggers `ci.yml` → auto-deploys.

**Manual:**
```bash
cd drunks-app
npm ci
npm run build
npx wrangler pages deploy out --project-name=drunks-app
```

**Rollback:**
```bash
# Cloudflare Pages supports instant rollback via dashboard
# Navigate to: Cloudflare Dashboard → Pages → drunks-app → Deployments
# Click any previous deployment → "Rollback to this deployment"
```

### Deploy API Worker (gsp-api → Cloudflare Workers)

**Automatic:** Push/merge to `main` triggers `ci.yml` → auto-deploys.

**Manual:**
```bash
cd gsp-api
npm ci
npx wrangler deploy
```

**Rollback:**
```bash
# Workers support version rollback via dashboard
# Cloudflare Dashboard → Workers → gsp-api → Deployments → Rollback
```

### Deploy Contracts (contracts-evm → Polygon)

**⚠️ IRREVERSIBLE on mainnet. Double-check everything.**

```bash
cd contracts-evm
cp .env.example .env  # Fill all values
npx hardhat compile
npx hardhat run scripts/deploy/01_deploy_tokens.ts --network polygon
# Continue with subsequent deploy scripts as needed
```

**Rollback:** Not possible on-chain. Deploy new version and migrate state if needed.

### Run Epoch Manually (Moltbook Swarm)

**Automatic:** `moltbook.yml` cron runs every 6 hours.

**Manual:**
```bash
cd moltbook-swarm
cp .env.example .env  # Fill all values
npx tsx src/run-epoch.ts
```

**Verify:**
```bash
# Check latest epoch file was created
ls -la data/epoch-*-state.json | tail -1
# Verify civilization history chain
node -e "const h=require('./data/civilization-history.json'); console.log('Latest epoch:', h.currentEpoch, 'Head:', h.headHash)"
```

---

## Health Checks

### Frontend Health

```bash
# Check site responds
curl -s -o /dev/null -w "%{http_code}" https://drunks.app
# Expected: 200

# Check all critical pages
for page in "" "agents" "tokenomics" "civic" "patron" "agent/aurum-helion-001"; do
  echo -n "$page: "
  curl -s -o /dev/null -w "%{http_code}" "https://drunks.app/$page"
  echo
done
```

### API Health

```bash
# Check stats endpoint
curl -s https://gsp-api.kevanbtc.workers.dev/api/stats | python -m json.tool

# Check CORS headers
curl -s -I -X OPTIONS https://gsp-api.kevanbtc.workers.dev/api/stats \
  -H "Origin: https://drunks.app" \
  -H "Access-Control-Request-Method: GET"
```

### Contract Health

```bash
# Verify contracts on PolygonScan
# AgentIdentityNFT: https://polygonscan.com/address/0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed
# PatronVault: https://polygonscan.com/address/0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399
```

### Epoch Health

```bash
# Check when last epoch ran (GitHub Actions)
# Go to: GitHub → Actions → moltbook.yml → check last run timestamp
# Should be within 6 hours

# Verify epoch data integrity
cd moltbook-swarm
node -e "
  const h = require('./data/civilization-history.json');
  const latest = h.epochs[h.epochs.length - 1];
  console.log('Chain ID:', h.chainId);
  console.log('Current Epoch:', h.currentEpoch);
  console.log('Head Hash:', h.headHash);
  console.log('Latest timestamp:', latest.timestamp);
  console.log('Hash chain valid:', h.headHash === latest.civilizationHash);
"
```

---

## Incident Response

### Frontend Down

1. Check Cloudflare status: `https://www.cloudflarestatus.com/`
2. Check Pages deployment: Cloudflare Dashboard → Pages → drunks-app
3. If deployment issue: rollback to last known good deployment
4. If DNS issue: check domain config in Cloudflare DNS settings

### API Down

1. Check Workers deployment: Cloudflare Dashboard → Workers → gsp-api
2. Check D1 database: Cloudflare Dashboard → D1 → gsp-investors
3. Verify CORS: test with curl from allowed origin
4. If Worker error: check logs in Cloudflare Dashboard → Workers → gsp-api → Logs

### Epoch Stalled

1. Check GitHub Actions: look for failed `moltbook.yml` runs
2. Common causes: expired agent tokens, RPC rate limits, HF API down
3. Manual fix: run epoch locally with `npx tsx src/run-epoch.ts`
4. Commit and push the epoch data manually

### Contract Issue

1. **DO NOT** redeploy without review
2. Check PolygonScan for unexpected transactions
3. If vault compromise suspected: contact deployer wallet owner immediately
4. Document the issue in KNOWN_ISSUES.md

---

## Monitoring Points

| What | Where | Frequency |
|------|-------|-----------|
| Frontend uptime | `drunks.app` | Continuous (Cloudflare) |
| API uptime | `gsp-api.kevanbtc.workers.dev/api/stats` | Continuous (Cloudflare) |
| Epoch execution | GitHub Actions → moltbook.yml | Every 6 hours |
| Contract state | PolygonScan | On-demand |
| Build health | GitHub Actions → ci.yml | Every push/PR |
| D1 database | Cloudflare Dashboard → D1 | On-demand |

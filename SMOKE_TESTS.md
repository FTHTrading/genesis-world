# SMOKE TESTS — Genesis Sentience Protocol

> Health verification matrix. Run after any deployment. 2026-03-10.

---

## Quick Smoke (< 2 minutes)

Run all of these after any deployment to verify the system is healthy:

```bash
# 1. Rust workspace
cargo build --workspace && echo "RUST BUILD: PASS" || echo "RUST BUILD: FAIL"
cargo test --workspace && echo "RUST TEST: PASS" || echo "RUST TEST: FAIL"

# 2. Frontend
cd drunks-app && npm run build && echo "FRONTEND: PASS" || echo "FRONTEND: FAIL"
cd ..

# 3. API Worker
cd gsp-api && npx wrangler deploy --dry-run && echo "API: PASS" || echo "API: FAIL"
cd ..

# 4. Swarm type-check  
cd moltbook-swarm && npx tsc --noEmit && echo "SWARM: PASS" || echo "SWARM: FAIL"
cd ..

# 5. Contracts
cd contracts-evm && npx hardhat compile && echo "CONTRACTS: PASS" || echo "CONTRACTS: FAIL"
cd ..
```

---

## Live Service Smoke Tests

### Frontend (drunks.app)

| Test | Command | Expected |
|------|---------|----------|
| Landing page | `curl -s -o /dev/null -w "%{http_code}" https://drunks.app` | `200` |
| Agents page | `curl -s -o /dev/null -w "%{http_code}" https://drunks.app/agents` | `200` |
| Agent detail | `curl -s -o /dev/null -w "%{http_code}" https://drunks.app/agent/aurum-helion-001` | `200` |
| Tokenomics | `curl -s -o /dev/null -w "%{http_code}" https://drunks.app/tokenomics` | `200` |
| Civic | `curl -s -o /dev/null -w "%{http_code}" https://drunks.app/civic` | `200` |
| Patron | `curl -s -o /dev/null -w "%{http_code}" https://drunks.app/patron` | `200` |
| WWW redirect | `curl -s -o /dev/null -w "%{http_code}" https://www.drunks.app` | `200` |
| Pages domain | `curl -s -o /dev/null -w "%{http_code}" https://drunks-app.pages.dev` | `200` |

### API Worker (gsp-api)

| Test | Command | Expected |
|------|---------|----------|
| Stats endpoint | `curl -s https://gsp-api.kevanbtc.workers.dev/api/stats` | JSON response with 200 |
| CORS header | `curl -s -I -H "Origin: https://drunks.app" https://gsp-api.kevanbtc.workers.dev/api/stats \| grep -i access-control` | `access-control-allow-origin: https://drunks.app` |

### Contracts (Polygon)

| Test | Check | Expected |
|------|-------|----------|
| AgentIdentityNFT | [PolygonScan](https://polygonscan.com/address/0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed) | Contract verified, 15 NFTs |
| PatronVault | [PolygonScan](https://polygonscan.com/address/0x4AA794ee9B5C7Bf3C683b7bb5dd7528852950399) | Contract verified |
| GSPCore | [PolygonScan](https://polygonscan.com/address/0x2c90f99cEd1f2F90cA19EBD23C82b1eD9B3F2A5c) | Contract verified |

---

## Data Integrity Smoke Tests

### Epoch Chain Verification

```bash
cd moltbook-swarm
node -e "
  const h = require('./data/civilization-history.json');
  console.log('Chain ID:', h.chainId);
  console.log('Genesis Epoch:', h.genesisEpoch);
  console.log('Current Epoch:', h.currentEpoch);
  console.log('Head Hash:', h.headHash);
  
  // Verify hash chain continuity
  let valid = true;
  for (let i = 1; i < h.epochs.length; i++) {
    if (h.epochs[i].parentHash !== h.epochs[i-1].civilizationHash) {
      console.log('BROKEN at epoch', h.epochs[i].epoch);
      valid = false;
    }
  }
  console.log('Hash chain:', valid ? 'VALID' : 'BROKEN');
  console.log('Head matches latest:', h.headHash === h.epochs[h.epochs.length-1].civilizationHash ? 'YES' : 'NO');
"
```

### Genesis Consistency

```bash
# Verify genesis.json has expected structure
node -e "
  const g = require('./genesis.json');
  console.log('Protocol:', g.protocol);
  console.log('Agents:', g.agents?.length || 'N/A');
  console.log('Rails:', Object.keys(g.rails || {}).length || 'N/A');
"
```

---

## CI Verification

| Check | Where | Expected |
|-------|-------|----------|
| Last CI run | GitHub → Actions → ci.yml | Green check on latest commit |
| Last epoch | GitHub → Actions → moltbook.yml | Within last 6 hours |
| Rust tests | CI log | 16 passed, 0 failed |
| Frontend build | CI log | 28/28 pages |
| Deploy status | CI log | Pages + Workers deployed |

---

## Smoke Test Results Template

Copy and fill after running:

```
Date: YYYY-MM-DD
Trigger: [deploy / PR merge / manual check]

| Surface            | Status | Notes |
|--------------------|--------|-------|
| Rust build         |        |       |
| Rust tests (16)    |        |       |
| Frontend build     |        |       |
| Frontend live      |        |       |
| API dry-run        |        |       |
| API live           |        |       |
| Swarm type-check   |        |       |
| Contracts compile  |        |       |
| Epoch chain        |        |       |
| CI green           |        |       |
```

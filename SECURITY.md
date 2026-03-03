# 🛡️ Security Policy — Genesis Sentience Protocol

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: security@fthtrading.com
3. Include: description, reproduction steps, potential impact
4. We will respond within 48 hours

## Scope

- Rust workspace (all 12 crates)
- Cloudflare Worker API
- drunks.app frontend
- Smart contract logic (when deployed)

## Constitutional Invariants

These are consensus-enforced and cannot be modified without hard fork:

| Invariant | Value |
|-----------|-------|
| Max Inflation | 15% annual |
| Min Staking Reward | 3% APY |
| Agent Governance Weight | 5% cap |
| Treasury Reserve | 20% minimum |
| Finality Threshold | 2/3 + 1 |
| Human Constitutional Veto | Required |

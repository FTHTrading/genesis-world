# KNOWN ISSUES — Genesis Sentience Protocol

> Generated: 2026-03-10 | Honest inventory. Nothing hidden.

---

## Critical Issues

### KI-001: Zero Contract Test Coverage
- **Severity:** HIGH
- **Subsystem:** contracts-evm
- **Description:** `npx hardhat test` returns 0 passing — no test files exist in the contracts project
- **Impact:** 9 deployed contracts on Polygon mainnet with no automated verification of behavior
- **Recommendation:** Write Hardhat tests for PatronVault deposit/withdrawal, RailToken minting, and AgentIdentityNFT mint/transfer before any contract upgrades

### KI-002: 8 Rust Crates Have Zero Tests
- **Severity:** MEDIUM
- **Subsystem:** Rust workspace
- **Crates affected:** civic, ai-mesh, validator, narrative-engine, realms, subnets, genesis-compiler, demo
- **Impact:** 8 of 12 crates have no test coverage (only kernel, agents, patron, tokenomics are tested)
- **Recommendation:** Prioritize tests for validator (proof verification) and civic (governance) as these are security-sensitive

---

## Warnings

### KI-003: 21 Rust Compiler Warnings
- **Severity:** LOW
- **Subsystem:** Rust workspace
- **Description:** 21 warnings across workspace: unused imports, unused struct fields, unused variables, dead code
- **Impact:** Cosmetic only — does not affect compilation or test results
- **Recommendation:** Run `cargo clippy --workspace` and address warnings systematically

### KI-004: Demo Binary Blocked on Windows
- **Severity:** LOW
- **Subsystem:** demo crate
- **Description:** `cargo run -p gsp-demo` fails with OS error 4551 (Application Control policy blocked)
- **Impact:** Cannot run demo locally on this Windows machine
- **Cause:** Windows Application Control security policy, not a code defect
- **Workaround:** Runs correctly on CI (Ubuntu runner) or any machine without AppControl restrictions

### KI-005: No Root-Level .env.example
- **Severity:** LOW
- **Subsystem:** Repository configuration
- **Description:** `.env.example` files exist in `contracts-evm/` and `moltbook-swarm/` but no unified root `.env.example`
- **Impact:** New developers must discover env requirements per-subsystem
- **Recommendation:** Create root `.env.example` referencing all subsystem vars or a setup script

---

## Resolved Issues

### KI-R01: HashMap Import Missing in Kernel Tests (FIXED)
- **Severity:** Was HIGH (blocked all workspace tests)
- **Subsystem:** kernel
- **File:** `kernel/src/realm_allocator.rs`
- **Description:** `#[cfg(test)] mod tests` block used `HashMap::new()` without `use std::collections::HashMap;`
- **Error:** `E0433: failed to resolve: use of undeclared type HashMap`
- **Fix Applied:** Added `use std::collections::HashMap;` after `use super::*;` in test module
- **Date Fixed:** 2026-03-10

---

## Risk Assessment

| Area | Risk | Mitigation |
|------|------|------------|
| Contract security | No tests, no audit | Write tests; consider Slither/Mythril static analysis |
| Validator crate | Zero tests on proof verification | Add property-based tests for proof validation |
| Epoch data integrity | Only hash chain proves correctness | Add assertion tests in CI comparing expected vs actual mutations |
| API Worker | No integration tests | Add Miniflare-based test suite |
| Wallet keys | Private keys in .env only | Ensure .gitignore covers all .env files (verified: it does) |

---

## Backlog: Improvement Opportunities

1. **Add `cargo clippy` to CI** — catch warnings before merge
2. **Add Hardhat test workflow** — contract tests in CI
3. **Add Miniflare tests for gsp-api** — worker integration tests
4. **Consolidate env management** — single setup script or root .env.example
5. **Add mutation testing** — cargo-mutants for Rust crates
6. **Contract audit** — professional security audit before mainnet value flows

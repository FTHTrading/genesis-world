# 🤝 Contributing to Genesis Sentience Protocol

## Getting Started

```bash
git clone https://github.com/FTHTrading/genesis-world.git
cd genesis-world
cargo build --workspace
cargo test --workspace
```

## Architecture

GSP is a 12-crate Rust workspace:

| Crate | Purpose |
|-------|---------|
| `kernel` | Trinity Kernel — BFT consensus, entropy, realms |
| `ai-mesh` | MCP orchestrator, RAG engine, governance AI |
| `agents` | Agent DNA, evolution, reputation, economics |
| `tokenomics` | Emission curves, treasury, token models |
| `validator` | Staking engine, AI co-pilots, rewards |
| `subnets` | Elastic security pools, validator leasing |
| `realms` | Sovereign governance templates |
| `narrative-engine` | Causal graphs, proof anchoring |
| `civic` | Moltbook Protocol — threads, debate, precedent |
| `patron` | Agent vaults, shares, scoring, settlement |
| `genesis-compiler` | YAML → deterministic JSON |
| `demo` | Civilization simulator |

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Ensure all tests pass: `cargo test --workspace`
4. Ensure no clippy warnings: `cargo clippy --workspace`
5. Submit a PR against `main`

## Constitutional Constraints

All contributions must respect the six constitutional invariants. PRs that violate these will be rejected automatically.

## Code Style

- Rust 2021 edition
- `cargo fmt` before committing
- Document public APIs with `///` doc comments
- Error types via `thiserror`

## License

Proprietary — © FTHTrading. See repository for terms.

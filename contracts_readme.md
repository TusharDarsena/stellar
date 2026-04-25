# Contracts

Two Soroban smart contracts compiled to `.wasm` and deployed to Stellar Testnet.

**Before writing any contract code read:**
- `docs/architecture.md` — storage models, function signatures, escrow design, deployment sequence
- `AGENTS.md` → contracts section — file responsibilities for every `.rs` file in this directory

---

## Structure

```
contracts/
├── Cargo.toml              Workspace root. SDK pinned here once.
├── ticket/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs          Public contract interface
│       ├── types.rs        All #[contracttype] definitions
│       ├── storage.rs      All storage read/write helpers
│       ├── escrow.rs       Escrow XLM accounting
│       ├── events.rs       Soroban event publishing
│       └── test.rs         Contract tests
└── marketplace/
    ├── Cargo.toml
    └── src/
        ├── lib.rs          Public contract interface + inter-contract call
        ├── types.rs        All #[contracttype] definitions
        ├── storage.rs      Storage read/write helpers
        ├── events.rs       Soroban event publishing
        └── test.rs         Contract tests
```

---

## SDK version

`soroban-sdk = "21.0.0"` pinned in root `Cargo.toml`. Per-contract `Cargo.toml` files use `{ workspace = true }`. Never add a version number to per-contract dependency declarations.

---

## Building

```bash
cd contracts

# Check and run tests (no node required)
cargo build
cargo test

# Build wasm for deployment
cargo build --target wasm32-unknown-unknown --release
```

Wasm output: `target/wasm32-unknown-unknown/release/ticket.wasm` and `marketplace.wasm`.

---

## Deploying

Use `scripts/deploy.sh`. Never deploy manually — the initialization order matters and deploy.sh enforces it. See `docs/architecture.md` → Deployment Sequence for why.
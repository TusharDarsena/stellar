# Contracts

Two Soroban smart contracts compiled to `.wasm` and deployed to Stellar Testnet.

Read `docs/architecture.md` before writing any contract code — it has the storage models, function signatures, and deployment sequence that are binding.

---

## Structure

```
contracts/
├── Cargo.toml              Workspace root. SDK pinned once here.
├── ticket/
│   └── src/
│       ├── lib.rs          Public interface — delegates to modules, never calls env.storage() directly
│       ├── types.rs        All #[contracttype] structs and DataKey enum
│       ├── storage.rs      All read_*/write_* storage helpers
│       ├── escrow.rs       Escrow XLM accounting (checked arithmetic only)
│       ├── events.rs       All env.events().publish() calls
│       └── test.rs         Contract tests (no running node needed)
└── marketplace/
    └── src/
        └── lib.rs          Placeholder — implementation in progress
```

## SDK

`soroban-sdk = "25.3.1"` pinned in root `Cargo.toml`. Per-contract files use `{ workspace = true }` — never add a version number in a per-contract dependency.

## Commands

```bash
cargo build                                              # check compiles
cargo test -p ticket                                     # run ticket tests
cargo build --target wasm32-unknown-unknown --release    # build wasm for deploy
```

## Status

- `ticket` contract: ✅ complete, 6/6 tests passing
- `marketplace` contract: 🔲 not yet implemented

## Deploying

Use `scripts/deploy.sh` (not yet written). Order matters — see `docs/architecture.md` → Deployment Sequence. Never deploy manually.

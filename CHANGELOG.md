# Changelog

## Session 1 — 2026-04-26

### Context
Starting from a docs-only repo. No code, no Cargo workspace, no frontend.
Toolchains already present: Rust 1.91, Stellar CLI 23.1.4, Node 22, wasm32 target.

### Decisions logged
- **D-011** — SDK bumped from 21.0.0 (in docs) to 25.3.1 (what we actually use). 21 is significantly outdated.
- **D-012** — `MarketplaceAddress` stored in `instance()`, not `persistent()`. Intentional — it's contract-lifetime data.
- **D-013** — Frontend will be React + Vite, not Next.js.

### What was built
Created the full `contracts/` workspace:
- `contracts/Cargo.toml` — workspace root, SDK 25.3.1 pinned once
- `contracts/ticket/` — full implementation: `error.rs`, `types.rs`, `storage.rs`, `escrow.rs`, `events.rs`, `lib.rs`, `test.rs`
- `contracts/marketplace/` — Cargo.toml + stub `lib.rs` only (implementation deferred)

### Bugs fixed (in AI-generated source from `my code/`)
| # | File | Problem | Fix |
|---|------|---------|-----|
| 1 | `storage.rs` | Imported `Escrow` type that doesn't exist | Removed from import |
| 2 | `lib.rs` | Duplicate event returned `AlreadyInitialized` | Added `EventAlreadyExists = 18`, used it |
| 3 | `events.rs` | `"ev_release"` is 10 chars, `symbol_short!` max is 9 | Renamed to `"ev_rel"` |
| 4 | `test.rs` | `env.ledger().with_mut()` removed in SDK 25 | Changed to `env.ledger().set_timestamp()` |
| 5 | `test.rs` | `.unwrap()` on client return values (SDK 25 returns directly) | Removed `.unwrap()` calls |
| 6 | `test.rs` | Auth rejection test used `mock_all_auths` — didn't test rejection | Rewrote: set up state with `mock_all_auths`, then `mock_auths(&[])` to clear auth before the restricted call |
| 7 | `marketplace/lib.rs` | Bare `#![no_std]` stub missing panic handler | Removed `#![no_std]` from placeholder |

### Test results
```
cargo build   → Finished (7 deprecation warnings on events::publish — not errors)
cargo test    → 6 passed, 0 failed
```

Tests: create+purchase, capacity exceeded, release after event date, refund on cancel (+ double-refund blocked), restricted transfer by marketplace, restricted transfer rejected when marketplace auth absent.

### Deprecation note
`env.events().publish()` is deprecated in SDK 25 — replaced by `#[contractevent]` macros.
Currently warnings only. Will address when writing the marketplace contract.

### What's next
- Marketplace contract implementation
- `scripts/deploy.sh` and `scripts/fund.sh`
- Frontend (React + Vite) — after contracts deployed

---

## Session 2 — 2026-04-26

### Context
Following up on the initial scaffold, identified several architectural and security improvements for the `TicketContract` before moving on to the marketplace.

### Decisions logged
- **D-014** — `xlm_token` is now stored in `instance()` at `initialize` rather than being provided by the caller, preventing fake-token escrow drain attacks.
- **D-015** — Instance storage TTL is extended on every write (`initialize`) to prevent expiration and unauthorized re-initialization.
- **D-016** — CEI (Check-Effects-Interactions) ordering enforced in `purchase`, `refund`, and `release_funds`. All state and escrow updates occur before external token transfers.
- **D-017** — `create_event` now validates capacity > 0, price > 0, and date in the future.
- **D-018** — Replaced `Ticket.used: bool` with `TicketStatus { Active, Used, Refunded }` enum for clearer on-chain history.
- **D-019** — Added `get_xlm_token()` public read-only method for frontend transparency.

### What was built
- Refactored `TicketContract` (`lib.rs` and `types.rs`) to implement the above decisions.
- Storage helpers updated to support `xlm_token` reads and writes, including TTL extensions.
- Modified tests to align with the new signatures (`purchase`, `refund`, `release_funds` no longer take `xlm_token` as an argument; `TicketStatus` assertions instead of `used` booleans).

---

## Session 3 — 2026-04-26

### Context
Following the completion of the `TicketContract`, implemented the secondary market via `MarketplaceContract`.

### Decisions logged
- **D-019** — Namespaced `Listing` DataKey to `(seller, listing_id)` to prevent ID front-running griefing.
- **D-020** — `buy_listing` incorporates a fail-fast check (`ticket.owner == listing.seller`) before token transfers to save gas on stale listings.
- **D-021** — `buy_listing` derives the authoritative `event_id` from the on-chain ticket record, eliminating seller-supplied `event_id` forgery vulnerabilities.
- **D-022** — Used `#[contractclient]` to define `TicketInterface` manually in `MarketplaceContract` to avoid `symbol multiply defined` linker errors when compiling the `wasm32v1-none` target.

### What was built
- **Implemented `MarketplaceContract`**: `lib.rs`, `types.rs`, `storage.rs`, `events.rs`, `error.rs`, `ticket_interface.rs`, and a comprehensive `test.rs`.
- **Financial accuracy**: Implemented Litemint's ceiling division pattern `((price * rate) + 99) / 100` for royalty calculations to ensure organizers receive their cut even on micro-transactions.
- **Testing**: Added 17 unit tests with a unified `TestSetup` fixture covering happy paths, royalty math, forgery attempts, and adversarial flows.

### Test results
```
cargo build --target wasm32v1-none --release -p marketplace   → Finished
cargo test -p marketplace                                       → 17 passed, 0 failed
```

### What's next
- Deployment scripts (`scripts/deploy.sh`, `scripts/fund.sh`)
- Frontend integration (React + Vite)

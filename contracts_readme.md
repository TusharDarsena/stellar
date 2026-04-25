# Contracts

Two Soroban contracts. Both are compiled to `.wasm` and deployed to Stellar Testnet. Read `docs/architecture.md` before writing any contract code.

---

## Structure

```
contracts/
├── Cargo.toml              Workspace root. SDK version pinned here once.
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

## TicketContract — file responsibilities

### lib.rs
The public face of the contract. Contains `#[contract]` struct and `#[contractimpl]` block. Every public function is declared here. **No business logic lives here** — lib.rs reads inputs, calls into storage.rs/escrow.rs, emits via events.rs, and returns.

Public functions (see `docs/architecture.md` for full signatures and behavior):
- `initialize(marketplace_address)` — one-time setup
- `create_event(organizer, name, date_unix, capacity, price)` — write event record
- `purchase(event_id, buyer)` — lazy mint + XLM into escrow
- `release_funds(event_id)` — post-event XLM release (pull-based, anyone can call)
- `cancel_event(event_id, organizer)` — mark Cancelled
- `refund(ticket_id, attendee)` — per-ticket pull refund
- `restricted_transfer(ticket_id, new_owner)` — marketplace-only transfer
- `mark_used(ticket_id)` — door scanning
- `get_ticket(ticket_id)` — read-only
- `get_event(event_id)` — read-only
- `get_marketplace()` — returns stored marketplace address (used for deploy verification)

### types.rs
All `#[contracttype]` annotated types. Nothing else.

```
DataKey         — enum used as storage keys
Event           — struct: organizer, name, date_unix, capacity, price, current_supply, status
Ticket          — struct: owner, event_id, used
EventStatus     — enum: Active, Cancelled, Completed
```

Rules:
- Every type that touches `env.storage()` must be `#[contracttype]` and `#[derive(Clone)]`
- No functions in this file. Pure type definitions only.

### storage.rs
All calls to `env.storage().persistent()`. Functions are named `read_*` and `write_*`.

```
read_event(env, event_id)          -> Event
write_event(env, event_id, event)

read_ticket(env, ticket_id)        -> Ticket
write_ticket(env, ticket_id, ticket)

read_marketplace(env)              -> Address
write_marketplace(env, address)

read_escrow(env, event_id)         -> i128
write_escrow(env, event_id, amount)
```

Rules:
- `lib.rs` never calls `env.storage()` directly. Always through these functions.
- Return `Option<T>` where the key might not exist. Callers in lib.rs handle the None case explicitly.

### escrow.rs
Escrow arithmetic. All XLM accounting for the contract vault.

```
add_to_escrow(env, event_id, amount)         — increment escrow balance
subtract_from_escrow(env, event_id, amount)  — decrement, panics if insufficient
transfer_escrow_to(env, event_id, recipient, amount, native_token_address)
get_escrow_balance(env, event_id)            -> i128
```

Rules:
- All arithmetic uses `checked_add`, `checked_sub`, `checked_mul`, `checked_div`. Never raw operators on `i128`.
- This file is the only place XLM transfer calls (via `token::Client`) happen for escrow. Not in lib.rs.
- 1 XLM = 10_000_000 stroops. All values here are in stroops.

### events.rs
Soroban event publishing. One function per event type.

```
emit_event_created(env, event_id, organizer)
emit_ticket_purchased(env, ticket_id, event_id, buyer)
emit_funds_released(env, event_id, organizer, amount)
emit_event_cancelled(env, event_id)
emit_refund_issued(env, ticket_id, attendee, amount)
emit_ticket_transferred(env, ticket_id, from, to)
emit_ticket_used(env, ticket_id)
```

Rules:
- All `env.events().publish(...)` calls live here only. `lib.rs` calls these functions, never publishes directly.

### test.rs
Soroban test environment (no running node needed). Uses `soroban_sdk::testutils`.

Required test coverage:
- Happy path: create event → purchase → release funds
- Capacity exceeded: purchase fails when `current_supply >= capacity`
- Wrong caller on `restricted_transfer`: panics when caller != marketplace_address
- Cancelled event: `cancel_event` then `refund` works; `purchase` on cancelled event fails
- Double refund: second `refund(ticket_id)` fails (ticket already marked used)
- Escrow math: escrow balance matches expected after purchase and release

---

## MarketplaceContract — file responsibilities

### lib.rs
Public interface + the inter-contract call.

Public functions:
- `initialize(ticket_contract_address, royalty_rate)` — one-time setup
- `list_ticket(seller, ticket_id, event_id, ask_price)` — create listing
- `buy_listing(listing_id, buyer)` — royalty split + restricted_transfer call
- `cancel_listing(listing_id, seller)` — seller cancels

The inter-contract call in `buy_listing`:
```rust
// This is how the cross-contract call works — use generated client, not env.call_contract()
let ticket_client = TicketContractClient::new(&env, &self.get_ticket_contract(&env));
ticket_client.restricted_transfer(&ticket_id, &buyer);
```

### types.rs
```
DataKey         — storage key enum
Listing         — struct: seller, ticket_id, event_id, ask_price, status
ListingStatus   — enum: Open, Sold, Cancelled
Config          — struct: ticket_contract_address, royalty_rate
```

### storage.rs
```
read_listing(env, listing_id)         -> Listing
write_listing(env, listing_id, listing)
read_config(env)                      -> Config
write_config(env, config)
```

### events.rs
```
emit_listing_created(env, listing_id, seller, ticket_id, ask_price)
emit_listing_sold(env, listing_id, buyer, seller, price, royalty)
emit_listing_cancelled(env, listing_id, seller)
```

### test.rs
Required test coverage:
- Happy path: list → buy → verify ownership transferred + royalty sent
- Royalty calculation: `royalty = ask_price * rate / 100`, seller gets remainder
- Wrong seller cancels listing: panics
- Buy already-sold listing: panics
- Inter-contract call: mocked TicketContract in test environment

---

## Building

```bash
cd contracts
cargo build
cargo test

# Build wasm for deployment
cargo build --target wasm32-unknown-unknown --release
```

The `.wasm` files appear in `target/wasm32-unknown-unknown/release/`.

## Deploying

Use `scripts/deploy.sh`. Do not deploy manually — the order matters. See `docs/architecture.md` → Deployment Sequence.

## SDK version

`soroban-sdk = "21.0.0"` is pinned in the root `Cargo.toml`. Per-contract `Cargo.toml` files use `{ workspace = true }`. Do not add a version number to per-contract dependency declarations.

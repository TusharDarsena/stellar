# Reference Repo Usage Guide
*For AI coding context. These repos are studied, not copied. Each entry says what is useful, what is wrong or broken, and what you must build from scratch.*

---

## Repo 1: sahityaroy/nft-soroban

**What it is**: A hand-rolled ERC721-style NFT contract for Soroban. Minimal, no frontend.

**SDK version**: `soroban-sdk = "0.4.3"` with `soroban-auth = "0.4.3"`. This is a pre-release API from 2022. The `soroban-auth` crate no longer exists. Do not reference any auth, nonce, or Signature code from this repo.

### Use for

**DataKey enum shape** (`storage_types.rs`): The pattern of a typed enum as storage keys is still correct. `DataKey::Owner(i128)`, `DataKey::Balance(Address)`, `DataKey::URI(i128)` — this structural shape maps to your `DataKey::Ticket(Symbol)`, `DataKey::Event(Symbol)`, `DataKey::Escrow(Symbol)`. Use it as syntax reference only.

**NFT function vocabulary** (`interface.rs`): Good mental checklist. Your TicketContract needs equivalents of: initialize, mint (your version = purchase), transfer (your version = restricted_transfer), burn (your version = refund), owner(id), balance(address). The interface gives you function names even though the implementation is entirely outdated.

**File decomposition idea**: One file per logical domain — storage_types, events, admin — rather than one monolithic lib.rs. Follow this.

### Do not use

Everything else. Specifically:
- `admin.rs`, `approval.rs` — the `Signature` type and `soroban_auth::verify` do not exist in modern SDK
- `Identifier` type — replaced by `Address`
- The nonce system — `require_auth()` handles replay protection internally now
- `env.storage().has()` / `env.storage().get_unchecked()` — modern API is `env.storage().persistent().has()` / `env.storage().persistent().get()`
- `check_admin` / `check_owner` pattern with Signatures — modern equivalent is `address.require_auth()`
- Any panic-based error handling — use `Result<T, ContractError>` with `#[contracterror]` instead

---

## Repo 2: josectoscano/entryx

**What it is**: Full-stack Next.js + Soroban event ticketing with SAC-based tickets and auction resale.

**SDK version**: `soroban-sdk = "21.0.0"` — matches what you are pinning.

### Critical bugs in this repo — do not copy

**Wrong stroop multiplier.** Their `purchase()` uses:
```rust
let purchase_total = buy_amount.clone() * 100000;
```
`100000` is five zeros. The correct stroop multiplier is `10_000_000` — seven zeros. 1 XLM = 10,000,000 stroops. This is a bug in their production contract. Every XLM calculation you write must use `10_000_000`.

**XOR operator used instead of exponentiation** in `ticket_auction/src/lib.rs`:
```rust
starting_price: (starting_price.clone() ^ 100),
```
`^` in Rust is bitwise XOR, not exponentiation. This produces completely wrong values. Ignore the entire auction contract file.

**No escrow.** Their `purchase()` pulls XLM in and immediately pays it back out in the same transaction:
```rust
xlm.transfer(&buyer, &contract, &purchase_total);  // pull in
xlm.transfer(&contract, &issuer, &amount_to_issuer);  // push out immediately
xlm.transfer(&contract, &distributor, &amount_to_distributor);  // push out immediately
```
Your architecture holds XLM in the contract until after the event date. This is the architectural opposite of what you need. Do not use their purchase logic.

**No inter-contract call.** Their two contracts never call each other. `token::Client::new(&env, &sac_address)` calls the Stellar Asset Contract standard interface, not a cross-contract call to their own ticket contract. You must build the MarketplaceContract → TicketContract call from scratch. It does not exist in this repo to copy.

### Use for

**Workspace Cargo.toml structure** (`soroban-contracts/Cargo.toml`): Copy the structure.
```toml
[workspace]
resolver = "2"
members = ["contracts/*"]

[workspace.dependencies]
soroban-sdk = "21.0.0"
```
Per-contract Cargo.toml files use `soroban-sdk = { workspace = true }`. This prevents version drift.

**`[profile.release]` block**: Copy verbatim into your workspace Cargo.toml.

**Modern auth pattern**: `buyer.require_auth()` at the top of functions that need it. No Signatures, no nonces, no soroban-auth crate.

**`token::Client` for XLM transfers**:
```rust
let xlm = token::Client::new(&env, &native_token_address);
xlm.transfer(&buyer, &env.current_contract_address(), &amount_in_stroops);
```
This is how you pull XLM from a buyer into the contract's own account (escrow). The `native_token_address` is the XLM SAC address on testnet. Study the shape, not the arithmetic — their arithmetic is wrong.

**`soroban.ts` simulate-before-submit pattern** (`src/lib/soroban.ts`): The three-step flow — build transaction, call `simulateTransaction` to get correct fee, then submit — is correct and must not be skipped. Study `getContractXDR` and `callWithSignedXDR` as the server-side split model.

**`stellar.toml` structure** (`public/.well-known/stellar.toml`): You need one. Copy the structure, replace every field with your project values. Without it your asset shows as "unknown" in wallets.

**`useWallet.ts` hook shape** (`src/hooks/useWallet.ts`): The Freighter integration — connect, store public key, sign transactions. Study the hook shape for your organizer flow. For attendees, replace Freighter-specific calls with Web3Auth SDK equivalents. The hook interface stays the same.

**Server/client transaction split** (`src/server/api/routers/soroban.ts`): Server builds and simulates. Client signs. Server submits. This split prevents sequence number race conditions.

**Friendbot funding pattern** (`src/server/api/routers/stellar-account.ts`): Every new Web3Auth wallet address needs Friendbot funding before it can transact on testnet. Run this immediately after Web3Auth creates a new keypair. The file shows the exact Horizon call.

### Do not use

- SAC-based ticket architecture — you use custom NFT for transfer control
- Their purchase/stroop arithmetic — it contains the 100000 bug described above
- The auction contract (`ticket_auction/src/lib.rs`) — contains the XOR bug, ignore entirely
- The immediate XLM disbursement pattern — you hold in escrow instead

---

## Repo 3: litemint/litemint-soroban-contracts

**What it is**: Production Soroban contracts for timed auctions and royalty enforcement from the Litemint NFT marketplace.

**SDK version**: `soroban-sdk = "20.3.1"` — one minor version behind what you are pinning. All patterns are valid, all APIs are compatible.

### Use for

**`[profile.release]` block** (root `Cargo.toml`): Copy verbatim. `opt-level = "z"`, `overflow-checks = true`, `debug = 0`, `strip = "symbols"`, `panic = "abort"`, `codegen-units = 1`, `lto = true`. These minimize wasm binary size, reducing deployment cost.

**Checked arithmetic with ceiling division** (`crates/litemint-royalty-contract/src/agreement/impl.rs`):
```rust
let admin_share = bid.amount
    .checked_mul(commission_rate)
    .and_then(|val| val.checked_add(99))
    .and_then(|val| val.checked_div(100))
    .unwrap()
    .max(1);
let seller_share = bid.amount.checked_sub(admin_share).unwrap().max(1);
```
The `.checked_add(99)` before dividing by 100 is ceiling division — it prevents the fee from rounding down to zero on small amounts. Use this exact pattern for your royalty split in MarketplaceContract. Always use `checked_mul`, `checked_add`, `checked_sub`, `checked_div`. Never raw arithmetic on `i128`.

**Test scaffold pattern** (`crates/litemint-auction-contract/src/test.rs`): This is the best test setup across all four repos. The pattern:
```rust
fn create_token_contract<'a>(e: &Env, admin: &Address) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let contract_address = e.register_stellar_asset_contract(admin.clone());
    (
        TokenClient::new(e, &contract_address),
        TokenAdminClient::new(e, &contract_address),
    )
}

fn create_auction_contract(e: &Env) -> AuctionContractClient {
    AuctionContractClient::new(e, &e.register_contract(None, AuctionContract {}))
}
```
Copy this scaffold structure directly into your `test.rs` files. Replace `AuctionContract` with `TicketContract` or `MarketplaceContract`. This gives you a real token + your contract in a simulated environment without a running node. In SDK 21, `register_contract` is the correct call (not `register` which is the SDK 23 API from trustless-work).

**Multi-party fund distribution pattern** (`crates/litemint-auction-contract/src/auctions/behavior.rs` → `finalize()`): The structure of iterating over all parties, transferring tokens, and cleaning up state in one function is the model for your `release_funds()`. Study how it cancels losing bids while paying the winner.

**`extend_ttl` on every persistent write**: Both Litemint and trustless-work do this consistently. Soroban persistent storage expires — if you do not extend the TTL, your contract data disappears. After every `env.storage().persistent().set(...)` call, immediately add:
```rust
env.storage().persistent().extend_ttl(&your_key, 17280, 17280);
```
17280 ledgers ≈ 1 day at ~5 seconds per ledger. For long-lived escrow data, use a larger value. trustless-work uses `31536000` for the maximum. Pick based on how long you need the data to survive. This is not optional.

**GitHub Actions CI** (`.github/workflows/rust.yml`): Copy the file. Change `actions/checkout@v3` to `actions/checkout@v4`. It runs `cargo build` and `cargo test` on every push. This satisfies the hackathon CI requirement.

**Types pattern** (`crates/litemint-royalty-contract/src/types.rs`): Shows correct syntax for nested `#[contracttype]` structs with derive macros. Use as syntax reference for your `Event`, `Ticket`, `EventStatus` definitions. Do not copy the License/Terms/Compensation system — too complex for your needs.

### Do not use

- The `soroban_kit` crate dependency — Litemint-internal, you do not have it. Use `env.storage().persistent()` directly
- The auction logic itself — different use case
- The full License/Terms/Compensation royalty system — you only need a single `royalty_rate` integer

---

## Repo 4: trustless-work/trustless-work-smart-escrow

**What it is**: A production Soroban escrow contract with milestone-based fund release, dispute resolution, and fee distribution. The most architecturally relevant repo for your escrow vault design.

**SDK version**: `soroban-sdk = "23.1.1"` — newer than what you are pinning. Do not copy Cargo.toml dependency versions from this repo. All logic patterns are valid but some API calls differ slightly.

**SDK 23 vs SDK 21 API difference to watch**: Their test helpers use `env.register(EscrowContract {}, ())`. In SDK 21 this is `e.register_contract(None, YourContract {})` as Litemint uses. Do not copy their test registration line directly.

### Use for

**`#[contracterror]` enum pattern** (`src/error.rs`): Copy this pattern exactly.
```rust
#[derive(Debug, Copy, Clone, PartialEq)]
#[contracterror]
pub enum ContractError {
    AmountCannotBeZero = 1,
    EscrowNotFound = 3,
    // ...
}
```
Every function returns `Result<T, ContractError>` and uses `?` for propagation. This is cleaner than panic-based error handling. Define your `ContractError` before writing any functions — every function signature depends on it.

**Flags / state struct pattern** (`src/storage/types.rs`):
```rust
pub struct Flags {
    pub disputed: bool,
    pub released: bool,
    pub resolved: bool,
}
```
Your `EventStatus` enum (Active/Cancelled/Completed) serves the same purpose. Study how they use flags to gate execution in validator functions — every function checks flags before doing anything.

**Validator separation pattern** (`src/core/validators/`): Business rule checks are in separate `validate_*` functions that return `Result<(), ContractError>`. The main function calls the validator, then does `address.require_auth()`, then executes. This order matters — validate first, auth second, execute third. Do not put `require_auth()` before validation.

**`validate_release_conditions` pattern** (`src/core/validators/escrow.rs`): This is exactly the shape your `release_funds()` validation needs:
```rust
if escrow.flags.released { return Err(ContractError::EscrowAlreadyReleased); }
if escrow.flags.resolved { return Err(ContractError::EscrowAlreadyResolved); }
if !escrow.milestones.iter().all(|m| m.approved) { return Err(ContractError::EscrowNotCompleted); }
if escrow.flags.disputed { return Err(ContractError::EscrowOpenedForDisputeResolution); }
```
Your equivalent checks: event not already released, `env.ledger().timestamp() > event.date_unix`, contract balance >= expected amount, event not cancelled.

**Fee distribution math** (`src/modules/fee/calculator.rs`):
```rust
const TRUSTLESS_WORK_FEE_BPS: u32 = 30;
const BASIS_POINTS_DENOMINATOR: i128 = 10000;

let fee = amount
    .checked_mul(fee_bps.into())
    .ok_or(ContractError::Overflow)?
    .checked_div(BASIS_POINTS_DENOMINATOR)
    .ok_or(ContractError::DivisionError)?;
```
They use basis points (divide by 10000) for precision. Your `decisions.md` D-010 says to use plain percentage (divide by 100). Both work. What matters is consistency — pick one and never mix them. If royalty_rate = 10 means 10%, divide by 100. If royalty_rate = 1000 means 10%, divide by 10000. Document which you chose.

**`extend_ttl` usage**: Confirmed consistently throughout. After every persistent write:
```rust
e.storage().persistent().extend_ttl(&DataKey::Escrow, 17280, 31536000);
```
This matches Litemint's pattern. Both repos do it this way. It is not optional.

**Test structure** (`src/tests/`): The separation of tests into focused files — `escrow.rs`, `fund.rs`, `dispute.rs`, `milestone.rs` — is a clean pattern. Adapt it: `ticket.rs`, `escrow.rs`, `marketplace.rs`.

**`fund_escrow` state verification pattern** (`src/core/validators/escrow.rs` → `validate_fund_escrow_conditions`): Before accepting XLM, verify that the stored escrow state matches what the caller expects:
```rust
if !stored_escrow.eq(&expected_escrow) {
    return Err(ContractError::EscrowPropertiesMismatch);
}
```
This prevents race conditions where escrow state changes between when the user reads it and when they fund it. Your `purchase()` is atomic so the exact risk is lower, but the principle of verifying state before accepting tokens is correct.

### Do not use

- Cargo.toml dependency versions — SDK 23.1.1, do not copy
- `env.register(Contract {}, ())` test API — use `e.register_contract(None, Contract {})` for SDK 21
- The multi-milestone architecture — your escrow is per-event not per-milestone
- The dispute resolution system — out of scope for your MVP

---

## What no reference repo covers — build from scratch

These are genuine gaps. No repo here shows them. You write them without reference.

**Escrow vault — holding XLM until event date**: When `purchase()` is called, do not forward XLM anywhere. Let it accumulate in the contract's own Stellar account via `token::Client.transfer(&buyer, &env.current_contract_address(), &amount)`. Track the held amount per event in your `escrow.rs`. `release_funds()` checks `env.ledger().timestamp() > event.date_unix` then transfers the full amount minus fees to the organizer.

**Restricted transfer gated by stored address**: `restricted_transfer()` checks `caller == stored_marketplace_address` where `stored_marketplace_address` was set once at `initialize()`. If the check fails, panic. This is the transfer gate that no reference repo implements.

**Inter-contract call from Marketplace to Ticket**: When `buy_listing()` executes, it calls TicketContract to transfer ownership. The pattern uses the generated client type:
```rust
let ticket_client = TicketContractClient::new(&env, &self.get_ticket_contract_address(&env));
ticket_client.restricted_transfer(&ticket_id, &buyer);
```
`TicketContractClient` is auto-generated by the `#[contractclient]` macro when you build your TicketContract. Do not use `env.invoke_contract()` directly — use the generated client.

**QR payload signing and verification**: No contract involvement. Frontend only. `signMessage()` from the WaaS wallet signs `{wallet_address}:{ticket_id}:{timestamp}`. Scanner verifies using Stellar JS SDK's `Keypair.verify(message_bytes, base64_decode(signature))`. This is entirely client-side — no RPC call needed for the signature check. See `decisions.md` D-006 for the absolute timestamp requirement.

**Web3Auth integration**: None of these repos use WaaS. The integration surface: initialize Web3Auth with Stellar network config, get a Stellar keypair on Google login, expose `signMessage` and `signTransaction` methods, wrap in a hook that matches the shape of entryx's `useWallet.ts`. The private key never leaves the Web3Auth SDK.

**Pull-based refund on cancellation**: When an event is cancelled, do not loop over ticket holders. Each attendee individually calls `refund(ticket_id)`. The contract checks `event.status == Cancelled`, `ticket.owner == caller`, returns `price_per_ticket` stroops from the escrow balance, sets `ticket.used = true`. A second call on the same ticket fails because `used == true`. Looping over all holders in one transaction hits Soroban instruction limits — see `decisions.md` D-002.

---

## SDK version

Use `soroban-sdk = "21.0.0"` matching entryx. Do not upgrade mid-project unless you hit a specific blocker. Verify availability at crates.io/crates/soroban-sdk before setting.
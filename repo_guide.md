# Reference Repo Usage Guide
*For AI coding context. These repos are studied, not copied. Each entry says what's useful, what's wrong, and what gap you must fill yourself.*

---

## Repo 1: sahityaroy/nft-soroban

**What it is**: A hand-rolled ERC721-style NFT contract for Soroban. Minimal, no frontend, no backend.

**SDK version**: `soroban-sdk = "0.4.3"` with `soroban-auth = "0.4.3"`. This is a pre-release API from ~2022. The `soroban-auth` crate no longer exists. Do not reference any auth, nonce, or Signature code from this repo.

### Use it for

**DataKey enum pattern** (`storage_types.rs`): The structure of using a typed enum as storage keys is the correct Soroban pattern and hasn't changed. The shape — `DataKey::Owner(i128)`, `DataKey::Balance(Address)`, `DataKey::URI(i128)` — maps directly to what you need. Design your own DataKey enum following this structure.

**NFT function surface** (`interface.rs`): Good checklist. Your TicketContract needs equivalents of: initialize, mint (your version = purchase), transfer (your version = restricted_transfer), burn (your version = refund/mark_used), owner(id), balance(address). The interface gives you the function vocabulary even though the implementation is outdated.

**File organization** (`lib.rs` as module root, separate files per concern): Clean pattern. One file per logical domain (storage_types, events, admin, etc.) rather than one giant lib.rs.

### Do not use

- Any auth code (`admin.rs`, the `Signature` type, `verify_and_consume_nonce`, `soroban_auth::verify`)
- The `Identifier` type (replaced by `Address` in modern SDK)
- The `check_admin` / `check_owner` pattern with Signatures — modern equivalent is `address.require_auth()`
- The nonce system — `require_auth()` handles replay protection internally now
- `env.storage().has()` / `env.storage().get_unchecked()` — modern API uses `env.storage().instance().has()` / `env.storage().persistent().get()`

---

## Repo 2: josectoscano/entryx

**What it is**: A full-stack Next.js + Soroban app for event ticketing with SAC-based tickets and an auction-based resale market. The closest reference to what you're building.

**SDK version**: `soroban-sdk = "21.0.0"` (workspace), per-contract using `{ workspace = true }`.

### Critical corrections before using this repo

**The auction contract does NOT demonstrate inter-contract calls from Marketplace to TicketContract.** It uses `token::Client::new(&env, &sac_address)` to call the SAC directly. There is no cross-contract call between their two contracts. You must build the restricted_transfer inter-contract call from scratch — it doesn't exist here to copy.

**There is no escrow in EntryX.** `purchase()` immediately transfers XLM to issuer and distributor in the same transaction. Your escrow vault (hold funds until after event date) is a design decision that exists in your plan but not in any reference repo. Build it yourself.

### Use it for

**Workspace Cargo.toml** (`soroban-contracts/Cargo.toml`): Copy the structure exactly.
```
[workspace]
resolver = "2"
members = ["contracts/*"]

[workspace.dependencies]
soroban-sdk = "21.0.0"

[profile.release]
opt-level = "z"
overflow-checks = true
...
```
Individual contract Cargo.toml files reference `soroban-sdk = { workspace = true }`. This prevents version drift.

**Modern auth pattern** (`ticket/src/lib.rs`): Uses `buyer.require_auth()` — that's the correct modern pattern. No Signatures, no nonces, no soroban-auth crate.

**token::Client for XLM transfers** (`ticket/src/lib.rs`): `token::Client::new(&env, &native_address)` is how you pull XLM from a buyer into the contract. The `native_address` is the XLM SAC address on testnet. Study how they compute `purchase_total = buy_amount * 100000` — stroops conversion is important and easy to get wrong.

**TransactionBuilder + simulate-before-submit** (`src/lib/soroban.ts`): The pattern of building a transaction, calling `simulateTransaction` on it to get the correct fee, then submitting — is correct and must not be skipped. Don't copy the file; understand the three-step flow.

**Server/client split** (`src/server/api/routers/soroban.ts`): Server builds and simulates. Client signs. Server submits. Follow this split to avoid sequence number race conditions.

**Friendbot call for testnet wallets** (`src/server/api/routers/stellar-account.ts`): Every new WaaS wallet address needs Friendbot funding before it can hold or send assets. This file shows the exact Horizon call. Run this immediately after Web3Auth creates a new keypair.

**stellar.toml** (`public/.well-known/stellar.toml`): You need one. Copy the structure, replace every field with your project details. Without it, your asset shows as "unknown" in wallets.

**fill_sac.cjs deployment sequence** (`scripts/fill_sac.cjs`): Read to understand the deployment order — create asset → deploy contract → store contract address. Adapt the order for your setup (deploy TicketContract → deploy MarketplaceContract with ticket address → initialize TicketContract with marketplace address).

**Prisma schema as a checklist** (`prisma/schema.prisma`): You're not running Prisma for MVP. But the schema tells you what persistent data matters: `sacAddress` on Asset (= your contract_address), event status enum, distributor/issuer separation. Use it as a checklist when you do add a database layer.

**wallet.ts challenge-response pattern** (`src/server/api/routers/wallet.ts`): Shows how to verify that a user actually owns the wallet address they claim (sign a known message, verify server-side). For WaaS attendees, this pattern is how you confirm their wallet before issuing a ticket.

**useWallet.ts** (`src/hooks/useWallet.ts`): This is the Freighter integration — connecting wallet, storing public key, signing transactions. Study it as your "before" picture for the organizer flow. For attendees, replace the Freighter-specific calls with WaaS SDK equivalents — the hook shape stays the same.

**passkey/ components** (`src/app/passkey/`): Do not port this to your app. WaaS replaces what they were attempting. Study `stellar-wallet.tsx` only to understand what operations a wallet abstraction needs to support (generate keypair, sign message, sign transaction). That's your WaaS integration surface.

### Do not use

- SAC-based ticket architecture — you use custom NFT for transfer control
- The immediate XLM disbursement on purchase — you hold in escrow instead
- The auction contract as an inter-contract call example — it isn't one

---

## Repo 3: litemint/litemint-soroban-contracts

**What it is**: Production-grade Soroban contracts for auctions and royalty enforcement from the Litemint NFT marketplace.

**SDK version**: `soroban-sdk = "20.3.1"`. One version behind EntryX. Both are modern API — no soroban-auth, uses Address and require_auth.

### Use it for

**[profile.release] block** (root `Cargo.toml`): Copy verbatim into your workspace Cargo.toml. `opt-level = "z"`, `overflow-checks = true`, `debug = 0`, `strip = "symbols"`, `panic = "abort"`, `codegen-units = 1`, `lto = true`. These minimize wasm binary size, which reduces deployment cost.

**Royalty calculation pattern** (`crates/litemint-royalty-contract/src/agreement/compensation_percentage.rs`): The actual calculation divides by 100 (plain percentage, not basis points — the rate stored as 10 means 10%). Uses checked_mul and checked_div to avoid overflow panics. No floats anywhere. Pattern:
```
royalty = price.checked_mul(rate).and_then(|v| v.checked_div(100)).unwrap()
```
Use this approach. Don't use regular multiplication on i128 without checked_ variants — silent overflow in contracts is catastrophic.

**Test scaffold pattern** (`crates/litemint-auction-contract/src/test.rs`): This is the most useful thing in Litemint for you. How they register a test token, fund addresses, deploy the contract, call functions, and assert storage state — all in a simulated Soroban environment without running a node. Copy the scaffold structure (not the test cases) into your own contract's test.rs. Writing tests this way means you can catch escrow logic bugs before touching testnet.

**Types pattern** (`crates/litemint-royalty-contract/src/types.rs`): Shows how to define complex nested contracttypes with enums as storage keys. Your event status enum and ticket record will follow this pattern. Note: their License struct is more complex than you need — use it as a reference for syntax, not structure.

**GitHub Actions CI** (`.github/workflows/rust.yml`): Copy the file. Change `actions/checkout@v3` to `actions/checkout@v4`. This handles `cargo build` and `cargo test` on every push to main. That's the hackathon CI requirement satisfied. Add a second job for frontend deployment separately — don't put it in the same workflow file.

### Do not use

- The full License/Terms/Compensation system — too complex for your royalty needs. You need one royalty_rate on the MarketplaceContract, not a multi-party licensing agreement
- The auction logic — different use case entirely
- The `soroban_kit` crate dependency — that's a Litemint-internal utility, you don't have it

---

## What no reference repo covers — build from scratch

These are gaps. No repo here shows them. You write them without reference.

**Escrow vault logic**: Holding XLM inside the contract and releasing it based on timestamp is not in any repo. The mechanism: when `purchase()` is called, instead of forwarding XLM to the organizer, keep it in the contract (it stays in the contract's own Stellar account). Track the amount per event in storage. `release_funds()` checks `env.ledger().timestamp() > event.date_unix` then transfers.

**Restricted transfer gated by contract address**: Your TicketContract.restricted_transfer checks `env.current_contract_address() != caller` — actually, you store the marketplace address at init and check `caller == stored_marketplace_address`. The call from MarketplaceContract to TicketContract uses the generated client type from `contractclient` macro.

**Inter-contract call setup**: When MarketplaceContract needs to call TicketContract, it uses the client type generated from your TicketContract. The pattern:
```rust
let ticket_client = TicketContractClient::new(&env, &self.get_ticket_contract_address(&env));
ticket_client.restricted_transfer(&ticket_id, &new_owner);
```
This is standard Soroban cross-contract invocation. No reference repo shows this exact pattern for your use case — it must be written fresh.

**QR signing and verification**: No repo touches this. The signing uses the WaaS wallet's `signMessage()` equivalent. Verification at the scanner uses Stellar JS SDK's `Keypair.verify(message_bytes, signature_bytes)`. This is entirely frontend logic — no contract call required for the signature check itself.

**Web3Auth integration**: None of these repos use WaaS. The integration surface is: initialize Web3Auth with Stellar network params, get keypair on login, expose sign_message and sign_transaction methods, wrap in a hook that matches the shape of EntryX's useWallet.ts.

**Cancellation + per-ticket refund**: Not in any repo. The logic: mark event Cancelled, then each ticket holder individually calls refund(ticket_id). The contract checks event.status == Cancelled, ticket.owner == caller, returns price_per_ticket from escrow, burns ticket. Do not try to loop over all ticket holders in one transaction.

---

## SDK version to use

Start with `soroban-sdk = "21.0.0"` matching EntryX. Do not jump to a higher version mid-hackathon unless you hit a specific blocker that requires it. Version stability during a hackathon matters more than being on the latest patch.

Verify actual available versions at crates.io/crates/soroban-sdk before setting this. The AI that suggested "22.0.0" did not verify this.

---

## File naming convention

Follow EntryX: `contracts/` directory at the workspace root, one subdirectory per contract, each with its own `Cargo.toml` and `src/lib.rs`. Your workspace will have:

```
contracts/
  ticket/
    Cargo.toml
    src/lib.rs
  marketplace/
    Cargo.toml
    src/lib.rs
```

This matches the workspace members pattern `["contracts/*"]` exactly.

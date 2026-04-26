# Decisions

Quick reference for architectural decisions. Read before changing anything significant. Add an entry here whenever you make a new significant choice.

---

## D-001 — Custom NFT, not Stellar Asset Contract

Tickets are hand-rolled NFTs in TicketContract storage. SAC's `transfer` is open to anyone — we need transfer gated to MarketplaceContract only via `restricted_transfer`. Gating a SAC transfer requires overriding SAC itself, which adds surface area we don't need.

## D-002 — Pull-based escrow and refunds

`release_funds` and `refund` are callable by anyone; the contract enforces conditions. Soroban has no auto-execution, and looping over all ticket holders in one transaction hits instruction limits.

## D-003 — Two contracts

TicketContract owns ticket state. MarketplaceContract owns listing state and makes the one inter-contract call to `restricted_transfer`. Kept separate per hackathon requirement and correct architectural boundary.

## D-004 — No database for MVP

Event metadata (name, date, price, capacity) stored on-chain. Negligible ledger rent for minimal fields. Post-MVP: Postgres if caching becomes necessary.

## D-005 — QR verification is client-side

`Keypair.verify()` runs in the browser with no network call — makes the scanner instant. `mark_used` hits the chain after the green/red result is shown.

## D-006 — QR uses absolute timestamp, not windowed

Check `|now - payload_timestamp| < 30`. **Not** `floor(unix/30)` — that fails a QR generated at second 29 when scanned at second 31 (2 seconds later, but different window). See `lib/qr.ts`.

## D-007 — Server builds and simulates transactions, client only signs

Server fetches sequence number, builds TransactionEnvelope, simulates (for correct fee), returns unsigned XDR. Client signs. Client sends back. Server submits. Never build client-side — sequence number diverges under concurrent usage.

## D-008 — Web3Auth for attendees, Freighter for organizers

Attendees: Google/email login, silent keypair creation, no crypto knowledge required. Organizers: Freighter, full key control. Both unified behind `useWallet` hook — nothing outside that hook knows which provider is active.

## D-009 — No marketplace listing lock

A listed ticket can be used at the door before it sells, making the listing stale. Acceptable for MVP — `restricted_transfer` is required to actually move ownership, so financial risk is contained.

## D-010 — royalty_rate as integer percentage, ceiling division

`royalty_rate = 10` means 10%. Royalty uses ceiling division to prevent micro-transaction evasion:
`royalty = (ask_price * royalty_rate + 99) / 100`.
Standard floor division (`* rate / 100`) rounds down to 0 for small prices (e.g. 9 stroops × 10% = 0.9 → 0), completely bypassing the organizer's cut.
Ceiling division ensures organizers always receive at least 1 stroop when `rate > 0` and `ask_price > 0`.
Pattern adopted from litemint-royalty-contract. Switch to basis points (/ 10000) if finer granularity is ever needed.
`buy_listing` skips the organizer transfer entirely if `royalty == 0` (rate=0 case) — the XLM SAC panics on a zero-amount transfer.

## D-011 — SDK pinned at 25.3.1

Started docs saying 21.0.0 but that's significantly outdated. Using 25.3.1 (latest stable at project start). Notable API differences from 21: `env.register()` in tests, `set_timestamp()` for ledger, `#[contractevent]` replacing `events().publish()`.

## D-012 — MarketplaceAddress in instance() storage

Set once at `initialize()`, never changes — it IS contract-lifetime data. `instance()` is semantically correct. All other state (Events, Tickets, Escrow) uses `persistent()`.

## D-013 — React + Vite for frontend

No SSR needed for a hackathon demo. The server/client transaction split (D-007) uses a lightweight API server alongside Vite, not Next.js API routes. Docs originally assumed Next.js — ignore those references.

## D-014 — XLM token address stored at initialize, never caller-supplied (S-001)

`initialize` accepts both `marketplace_address` and `xlm_token`. Both are stored in `instance()` storage. `purchase`, `refund`, and `release_funds` read the token address from storage. Callers cannot inject a fake token contract to inflate escrow accounting and drain real XLM.

## D-015 — Instance storage TTL extended on every write (S-002)

`write_marketplace_address` and `write_xlm_token` both call `instance().extend_ttl(TTL_MIN, TTL_TARGET)` after the set. If instance storage expires, an attacker could re-call `initialize()` to replace the marketplace address and gain transfer authority over all tickets. TTL extension on every write prevents this.

## D-016 — CEI ordering enforced in purchase, refund, release_funds (S-003)

All state mutations (ticket write, supply increment, escrow accounting) happen before the external `token.transfer` call in all three functions. This is the standard Check-Effects-Interactions pattern — it prevents re-entrancy-style execution-flow abuse where external call failure could leave state half-updated.

## D-017 — create_event validates capacity > 0, price > 0, date in the future

Zero or negative capacity allows events that are immediately sold out or allow infinite tickets. Zero or negative price breaks escrow math. A past date allows immediate fund release without running an actual event. All three are rejected at create time with explicit error codes.

## D-018 — TicketStatus enum instead of used: bool

`Ticket.status` is `TicketStatus { Active, Used, Refunded }` instead of a `bool`. A bool cannot distinguish "scanned at the door" from "refunded after cancellation" — both would be `true`. On-chain data is permanent; a bool here would require a storage migration to fix post-mainnet. The three-variant enum costs nothing extra and makes analytics, scanner UIs, and future tooling unambiguous.

## D-019 — get_xlm_token transparency query

Added `get_xlm_token` as a public read-only method alongside `get_marketplace`. The frontend and tests can verify that the stored XLM SAC address matches the expected network token without needing off-chain config cross-referencing.

## D-020 — Namespaced Listing IDs

Listings in `MarketplaceContract` are keyed by `(seller, listing_id)` rather than a globally unique `listing_id`. This prevents a griefing attack where a malicious actor observes a pending `list_ticket` transaction in the mempool and front-runs it with their own transaction using the same `listing_id`, causing the legitimate seller's transaction to fail.

## D-021 — Stale Listing Fail-Fast

When a buyer attempts to purchase a listing via `buy_listing`, the contract first verifies that `ticket.owner == listing.seller`. If the seller transferred or used the ticket out-of-band, the transaction fails immediately. While Soroban rolls back failed transactions regardless, this fail-fast check avoids the gas costs associated with cross-contract token transfers that would inevitably be rolled back.

## D-022 — On-Chain Event Derivation for Royalties

In `buy_listing`, the contract derives the event (and thus the organizer who receives royalties) by querying the on-chain ticket record (`get_ticket(listing.ticket_id).event_id`). It explicitly does NOT trust the `event_id` provided by the seller in the listing struct, closing a vulnerability where a malicious seller could list a real ticket but supply a fake `event_id` pointing to an event they control, thereby redirecting royalties to themselves.

## D-023 — `contractclient` for Cross-Contract WASM builds

To avoid `symbol multiply defined` linker errors when building `wasm32v1-none` binaries that perform cross-contract calls, the `TicketContract` is strictly isolated as a `[dev-dependency]`. For production builds, `MarketplaceContract` uses the `#[contractclient]` macro on a minimal interface trait (`TicketInterface`) alongside identical struct definitions, enabling XDR-compatible cross-contract calls without linking the other contract's binary.


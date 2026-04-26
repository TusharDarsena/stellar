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

## D-010 — royalty_rate as integer percentage

`royalty_rate = 10` means 10%. `royalty = ask_price * royalty_rate / 100`. No floats in Soroban. Switch to basis points (/ 10000) if finer granularity is ever needed.

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


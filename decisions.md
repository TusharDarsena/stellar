# Decisions Log
*When you make a significant architectural or design decision, add it here. Format: what was decided, why, and what was rejected. Future AI agents check this before changing things.*

---

## D-001 — Custom NFT over Stellar Asset Contract (SAC)

**Decided**: Tickets are custom NFTs with hand-rolled ownership in TicketContract storage.

**Why**: SAC's `transfer` function is standard and can be called by anyone who holds the asset. We need `restricted_transfer` to be callable ONLY by MarketplaceContract. Gating a SAC transfer requires overriding the SAC itself, which adds significant complexity. Custom NFT gives full control with less surface area.

**Rejected**: SAC-based tickets (as used in EntryX). Their approach is simpler for basic ticketing but doesn't support our resale restriction requirement.

---

## D-002 — Pull-based escrow, not automatic release

**Decided**: Escrow is released by calling `release_funds(event_id)`. Refunds are claimed by calling `refund(ticket_id)`. Both are callable by anyone; the contract enforces conditions internally.

**Why**: Soroban has no cron jobs or auto-execution. Contracts only run when invoked. "Automatic" release would require an off-chain trigger anyway.

**Rejected**: Any push-based or loop-based release. Looping over all ticket holders in one transaction hits Soroban instruction limits.

---

## D-003 — Two contracts, not one

**Decided**: TicketContract and MarketplaceContract are separate deployed contracts.

**Why**: The inter-contract call from Marketplace → Ticket is a hackathon requirement. It also enforces the correct architectural boundary — ticket state is owned by TicketContract, marketplace state is owned by MarketplaceContract.

**Rejected**: Merging both into one contract. Satisfies no hackathon requirement and conflates responsibilities.

---

## D-004 — No database for MVP

**Decided**: Event metadata (name, date, price, capacity) is stored on-chain in TicketContract. No Postgres, no Prisma.

**Why**: Adds infra complexity for no functional gain at hackathon scale. On-chain storage of minimal metadata (Symbol, u64, i128) costs negligible ledger rent.

**Rejected**: Postgres + Prisma for all metadata. Post-MVP path if caching becomes necessary.

---

## D-005 — QR verification is off-chain

**Decided**: Signature verification at the scanner uses `Keypair.verify()` from Stellar JS SDK, client-side. No blockchain call is on the critical path for the green/red display.

**Why**: On-chain verification would add 1–3 seconds latency per scan. The signature math is deterministic and needs no on-chain state — it just needs the public key, which is embedded in the QR payload.

**Rejected**: Calling a contract function for verification. The `mark_used` call still happens on-chain, but after the visual feedback is shown.

---

## D-006 — QR uses absolute timestamp, not windowed timestamp

**Decided**: QR payload contains raw Unix timestamp. Verifier checks `|now - payload_timestamp| < 30`.

**Why**: The alternative (floor(unix/30)) creates a window boundary problem — a QR generated at second 29 of a window and scanned at second 31 fails even though only 2 seconds passed. Absolute timestamp with delta check has no such edge case.

**Rejected**: `floor(unix/30)` windowed approach, suggested by external AI but mathematically flawed for this use case.

---

## D-007 — Server builds and simulates transactions, client only signs

**Decided**: API routes (`api/build-tx`, `api/submit-tx`) handle transaction lifecycle. Client sends intent, receives unsigned XDR, signs it, returns signed XDR.

**Why**: Building a transaction requires the current ledger sequence number. If both client and server build independently, sequence numbers diverge. If only the client builds, the server can't validate before submission. Server-builds-client-signs is the clean split: server has ledger state, client has private key.

**Rejected**: Client-side transaction building. Race conditions on sequence number under concurrent usage.

---

## D-008 — Web3Auth for attendees, Freighter for organizers

**Decided**: Two wallet paths unified behind `useWallet` hook.

**Why**: Attendees have no crypto knowledge — they need Google/email sign-in with silent wallet creation. Organizers deploy contracts and need full key control. Web3Auth fills the attendee gap; Freighter is the standard Stellar organizer wallet.

**Rejected**: Freighter for everyone (bad UX for non-crypto attendees). PassKey auth (EntryX attempted this and didn't ship it — too much implementation risk).

---

## D-009 — No marketplace listing lock

**Decided**: When a ticket is listed on MarketplaceContract, it is NOT locked in TicketContract.

**Why**: A lock/unlock mechanism requires two contract calls for every listing action, and creates edge cases around cancellation. For MVP, the risk (a listed ticket getting used at the door, making the listing stale) is acceptable.

**Rejected**: On-chain lock. Post-MVP improvement if needed.

---

## D-010 — royalty_rate stored as integer percentage

**Decided**: `royalty_rate = 10` means 10%. Calculation: `royalty = price * rate / 100`.

**Why**: Simplest no-float approach that's readable. Basis points (dividing by 10000) adds precision that isn't needed for a fixed 10% rate.

**Rejected**: Basis points (suggested by one reference AI, not matching actual Litemint implementation which also uses plain percentage).

---

## D-011 — soroban-sdk pinned at 25.3.1, not 21.0.0

**Decided**: Workspace `Cargo.toml` pins `soroban-sdk = "25.3.1"`.

**Why**: 21.0.0 is significantly out of date. Key API changes between 21 and 25 include `env.register()` replacing `env.register_contract()` in tests, and improved `extend_ttl` ergonomics. The initial AI-generated code was already written against 25.x patterns (`env.register`, `register_stellar_asset_contract_v2`). Backporting to 21 would require rewriting the test helpers.

**Rejected**: 21.0.0 (what AGENTS.md originally said — updated to match reality).

---

## D-012 — MarketplaceAddress stored in instance() not persistent()

**Decided**: `DataKey::MarketplaceAddress` uses `env.storage().instance()`.

**Why**: The AGENTS.md convention "use `persistent()` unless data truly lives for the contract lifetime only" explicitly carves out this exception. MarketplaceAddress IS contract-lifetime data — it is set once at `initialize()` and never changes. Using `instance()` is semantically correct and avoids the need for a separate `extend_ttl` call. All other contract state (Events, Tickets, Escrow) uses `persistent()`.

**Rejected**: Moving MarketplaceAddress to `persistent()` — technically works but is semantically wrong. `instance()` signals "this lives as long as the contract does."

---

## D-013 — React + Vite for frontend, not Next.js

**Decided**: Frontend will be built with React + Vite.

**Why**: This is a hackathon demo — no SSR, no server components, no API routes needed at the framework level. The server/client transaction split (D-007) is implemented via a lightweight Express or Hono server alongside Vite, not Next.js API routes. Vite is simpler to configure, faster to dev-iterate, and has no framework-imposed opinions on routing.

**Rejected**: Next.js 14 App Router (what the docs originally assumed). The frontend_readme.md and AGENTS.md frontend section reference Next.js — these will be updated when frontend work begins.


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

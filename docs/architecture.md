# Architecture — NFT Event Ticketing on Stellar
*Written for AI context. These are design decisions, not a wishlist. Deviate when you have good reason, but explain why.*

---

## Contract Design

### Two contracts, not one

**TicketContract** — owns NFT state and enforces ticket business rules.
**MarketplaceContract** — handles resale listings. Has permission to call TicketContract's restricted transfer. Nothing else does.

Do not merge them. The inter-contract call from Marketplace → Ticket is both a hackathon requirement and the correct architectural boundary.

### Ticket representation — custom NFT, not SAC

Tickets are NOT Stellar Asset Contracts. They are custom NFTs with a hand-rolled ownership map inside TicketContract storage. This is a deliberate deviation from EntryX's SAC approach.

Why: With SAC, anyone holding the asset can transfer it freely via the standard token interface. We need transfer to be gated — only the MarketplaceContract address can call the restricted_transfer function. That's not possible if the ticket is a SAC without overriding the SAC itself, which adds complexity. Custom NFT gives us full control with less surface area.

### TicketContract storage model

```
Event record keyed by event_id:
  - organizer: Address
  - name: String
  - date_unix: u64
  - capacity: i128
  - price_per_ticket: i128  (in stroops — 1 XLM = 10_000_000 stroops)
  - current_supply: i128
  - status: Enum { Active, Cancelled, Completed }

Ticket record keyed by ticket_id:
  - owner: Address
  - event_id: Symbol
  - used: bool

Escrow record keyed by event_id:
  - xlm_held: i128  (total stroops locked in contract)

Marketplace permission:
  - marketplace_address: Address  (set once at init, cannot change)
```

### TicketContract functions

`initialize(marketplace_address)` — sets the one address allowed to call restricted_transfer. Called once on deploy.

`create_event(organizer, name, date_unix, capacity, price)` — writes event record. Does NOT mint anything. Lazy minting means nothing is minted at event creation time.

`purchase(event_id, buyer)` — called when attendee buys. Atomically: (1) checks capacity not exceeded and event is Active, (2) increments current_supply, (3) creates a new ticket record with owner = buyer, (4) pulls price_per_ticket XLM from buyer into contract's own account (escrow), (5) increments escrow record for this event.

`release_funds(event_id, organizer)` — checks current ledger timestamp > event.date_unix. If so, transfers escrowed XLM to organizer and marks event Completed.

`cancel_event(event_id, organizer)` — organizer only. Marks event Cancelled. Does not automatically refund — see refund.

`refund(ticket_id, attendee)` — callable only when event is Cancelled. Returns price_per_ticket stroops to ticket owner. Burns ticket (marks used = true). Decrements escrow record.

`restricted_transfer(ticket_id, new_owner)` — checks caller == marketplace_address (the one stored at init). If not, panics. Updates ticket owner. This is the ONLY transfer path for resale. Attendees cannot call this directly.

`mark_used(ticket_id)` — called at venue door after QR verification. Sets used = true. Organizer or a designated scanner address can call this.

`get_ticket(ticket_id)` — read-only, returns ticket record.

`get_event(event_id)` — read-only, returns event record.

### MarketplaceContract storage model

```
Listing record keyed by listing_id:
  - seller: Address
  - ticket_id: Symbol
  - event_id: Symbol
  - ask_price: i128  (stroops)
  - status: Enum { Open, Sold, Cancelled }

Config (set at init):
  - ticket_contract_address: Address
  - royalty_rate: i128  (stored as integer percentage, e.g. 10 = 10%)
```

### MarketplaceContract functions

`initialize(ticket_contract_address, royalty_rate)` — set once.

`list_ticket(seller, ticket_id, event_id, ask_price)` — seller creates a listing. Does NOT lock the ticket on-chain at this point (no lock mechanism — trust is enforced because restricted_transfer is required to actually move the ticket).

`buy_listing(listing_id, buyer)` — atomically: (1) pulls ask_price XLM from buyer, (2) computes royalty = ask_price * royalty_rate / 100, (3) transfers royalty XLM to the event organizer (fetched from TicketContract.get_event), (4) transfers remainder XLM to seller, (5) calls TicketContract.restricted_transfer(ticket_id, buyer), (6) marks listing Sold.

`cancel_listing(listing_id, seller)` — seller only. Marks listing Cancelled. No XLM involved.

### Royalty calculation

Use integer arithmetic only. No floats exist in Soroban.

```
royalty = ask_price * royalty_rate / 100
seller_gets = ask_price - royalty
```

If you need finer granularity later, switch to basis points (divide by 10000). Don't start there — adds confusion in a hackathon.

---

## Wallet Architecture

### Two wallet types, two paths

**Organizer — Freighter.** Full wallet control. They deploy contracts and receive released funds. The organizer's Freighter key signs contract deployments and the release_funds call.

**Attendee — Web3Auth (or Magic Link as fallback).** Sign in with Google or email. A Stellar keypair is generated silently on first login and never exposed to the attendee. The attendee signs purchase transactions and QR messages — both happen invisibly inside the WaaS SDK.

### Attendee wallet lifecycle

1. Attendee authenticates via Web3Auth
2. Web3Auth returns a Stellar keypair (deterministic from their OAuth identity)
3. Frontend checks if this address exists on Stellar testnet (Horizon account endpoint)
4. If not found: call Friendbot immediately to fund the account
5. Store only the public key in app state — the private key stays inside WaaS
6. Attendee is now ready to transact

### Transaction flow — server/client split

Build and simulate on the server. Sign on the client. Submit on the server.

Why: Building a transaction requires the current ledger sequence number, which the server fetches from Horizon. If client builds and server submits, you get race conditions on the sequence number. If both build independently, you get divergence. The split is: server knows ledger state, client knows private key. Neither shares what the other has.

Concretely:
1. Client tells server "I want to buy ticket for event X"
2. Server fetches sequence number from Horizon, builds TransactionEnvelope, simulates it (gets correct fee), returns unsigned XDR to client
3. Client passes XDR to WaaS/Freighter, which signs and returns signed XDR
4. Client sends signed XDR back to server
5. Server submits to Stellar testnet via Horizon

Never skip simulation. Blind submission gives wrong fees and opaque errors.

---

## QR Entry Verification

### QR payload construction

When attendee opens "My Tickets," the frontend does the following every 30 seconds:

1. Get current Unix timestamp (client-side)
2. Construct message string: `{wallet_address}:{ticket_id}:{timestamp}`
3. Ask WaaS wallet to sign this message
4. Encode the result as: `{wallet_address}:{ticket_id}:{timestamp}:{base64_signature}`
5. Render this as a QR code

The QR is never static. It is regenerated every 30 seconds by re-signing with a new timestamp.

### Verification at the door

The scanner (browser-based camera) decodes the QR and:

1. Splits payload into components
2. Checks timestamp is within the last 30 seconds — reject if older
3. Verifies the ed25519 signature against wallet_address and the message
4. Calls TicketContract.get_ticket(ticket_id) to confirm owner == wallet_address and used == false
5. If all pass: displays green, calls TicketContract.mark_used(ticket_id)
6. If any fail: displays red with reason

Screenshot attack: fails at step 2 (timestamp expired).
Replay attack: fails at step 6 (already marked used).
Impersonation attack: fails at step 3 (signature won't verify).

### Why signature verification without the blockchain

Step 3 (signature verification) can be done entirely client-side using the Stellar JS SDK's `Keypair.verify()` method. It doesn't require a network call. This makes the scanner fast. Step 4 is the network call — it happens in parallel with step 3 and is not on the critical path for the green/red display.

---

## Frontend Structure

### Two distinct user flows

Organizer flow: connect Freighter → create event → monitor dashboard → trigger release after event.

Attendee flow: sign in with Google → browse events → buy ticket → view "My Tickets" → show QR at door.

These are not the same app in terms of interaction model. Keep their components separate even if they share a domain.

### State that lives on-chain vs off-chain

On-chain (source of truth):
- Ticket ownership
- Escrow amounts
- Event status (Active/Cancelled/Completed)
- Ticket used/unused status

Off-chain (UI convenience only — can be rebuilt from chain):
- Event name, description, image URL
- User's email/display name
- Listing metadata on the marketplace

Do not put metadata on-chain if it is display-only. Storage on Soroban costs ledger rent. Event name and description should live in a lightweight database or even just the frontend constants for MVP.

### MVP database decision

For MVP: no database. Store event metadata in the contract itself (name as a short Symbol, date as u64, price as i128 — that's enough to display). For post-MVP: add Postgres to cache event metadata and avoid repeated Horizon calls.

---

## Deployment Sequence

This order matters. Deploying out of order causes silent failures.

1. Deploy TicketContract to Stellar testnet. Get its contract address.
2. Deploy MarketplaceContract, passing TicketContract address as constructor arg.
3. Call TicketContract.initialize(marketplace_contract_address).
4. Verify: call TicketContract.get_marketplace() and confirm the address matches.
5. Fund all test accounts via Friendbot.
6. Create a test event. Buy a ticket. Verify escrow balance.

Steps 1 and 3 must be separate. initialize() sets the marketplace permission — if you call it before MarketplaceContract is deployed, you don't have its address yet.

---

## What is NOT built and why

**Passkey auth**: Skipped. Web3Auth covers the same user need with less implementation risk. EntryX attempted passkeys in a side route and didn't ship it.

**On-chain event images**: Off-chain. No value in paying ledger rent for an image URL.

**Automatic refunds on cancel**: Not automatic. Attendee calls refund() themselves. Automatic refunds would require looping over all ticket holders in a single transaction — that hits instruction limits on Soroban.

**Marketplace lock mechanism**: Not implemented. If a ticket is listed but also used at the door, the listing becomes stale. For MVP this is acceptable — add lock/unlock as a post-MVP improvement.

**Email/push notifications**: Out of scope. Google Form for user feedback instead.

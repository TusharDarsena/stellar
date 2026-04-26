# Architecture — NFT Event Ticketing on Stellar
*Binding technical spec. See `decisions.md` for design rationale (D-xxx).*

## Smart Contracts

**TicketContract**: Owns NFT state, enforces ticket logic. Custom NFT implementation (D-001).
**MarketplaceContract**: Handles listings, calls `restricted_transfer`. (D-003)

### TicketContract

**Storage Model**
- **Event** (persistent, keyed by `event_id`): `organizer`, `name`, `date_unix`, `capacity`, `price_per_ticket`, `current_supply`, `status` (Active, Cancelled, Completed)
- **Ticket** (persistent, keyed by `ticket_id`): `owner`, `event_id`, `status` (Active, Used, Refunded)
- **Escrow** (persistent, keyed by `event_id`): `xlm_held`
- **Config** (instance): `marketplace_address`, `xlm_token`
- **TTL Policy** (persistent + instance): Extend TTL on reads/writes for Event and Ticket storage; bump instance storage TTL for Config (D-014, D-015).

**Functions**
- `initialize(marketplace_address, xlm_token)`: Sets contract config.
- `create_event(organizer, name, date_unix, capacity, price)`: Validates args (D-017). Writes Event.
- `purchase(event_id, buyer)`: Checks capacity/status, generates unique `ticket_id` on-chain (D-018), mints Ticket (Active), updates state before token transfer (CEI - D-016), adds to Escrow.
- `release_funds(event_id, organizer)`: Checks date. Marks Completed, clears Escrow, transfers XLM to organizer (CEI).
- `cancel_event(event_id, organizer)`: Marks Cancelled. No auto-refund (D-002).
- `refund(ticket_id, attendee)`: Checks event Cancelled. Marks Ticket Refunded, decrements Escrow, returns XLM (CEI).
- `restricted_transfer(ticket_id, new_owner)`: Marketplace only. Allows transfer only for valid active listings (D-009), then updates owner.
- `mark_used(ticket_id, organizer)`: Sets Ticket Used.
- **Read-only**: `get_ticket`, `get_event`, `get_marketplace`, `get_xlm_token`

### MarketplaceContract

**Storage Model**
- **Listing** (persistent, keyed by `(seller, listing_id)`): `seller`, `ticket_id`, `event_id`, `ask_price`, `status` (Open, Sold, Cancelled). Namespaced to `seller` to prevent ID front-running (D-019).
- **Config** (instance): `ticket_contract_address`, `royalty_rate` (integer percentage, e.g., 10 = 10% - D-010)

**Functions**
- `initialize(ticket_contract_address, royalty_rate)`: Sets contract config.
- `list_ticket(seller, listing_id, ticket_id, event_id, ask_price)`: Creates Open listing. No on-chain lock (D-009). `event_id` is stored for informational purposes only.
- `buy_listing(seller, listing_id, buyer)`: Fails fast if ticket owner changed (D-020). Derives authoritative `event_id` from on-chain ticket record (D-021). Pulls `ask_price`, calculates ceiling royalty `(price * rate + 99) / 100`, pays organizer and seller, calls TicketContract.`restricted_transfer`, marks Sold.
- `cancel_listing(seller, listing_id)`: Marks Cancelled.

---

## Application Architecture

### Wallet Flow (D-008)
- **Organizer**: Freighter (full key control).
- **Attendee**: Web3Auth (silent keypair). If new address, auto-funded via Friendbot.

### Transaction Split (D-007)
**Server builds/simulates → Client signs → Server submits.** 
Prevents sequence number races. Never skip simulation.

### QR Verification (D-005, D-006)
1. **Frontend (every 30s)**: Attendee wallet signs `{wallet_address}:{ticket_id}:{timestamp}`. Encodes as QR.
2. **Scanner (at door)**: Decodes QR.
   - Rejects if `|now - timestamp| > 30s`.
   - Verifies `ed25519` signature locally (`Keypair.verify()`).
   - Calls `get_ticket(ticket_id)` to ensure `owner == wallet_address` & `status == Active`.
   - Displays Green, executes `mark_used` on-chain.

---

## Deployment Sequence
1. Fund test accounts, including auto-generating the `organizer` CLI identity (D-024).
2. Deploy TicketContract. Get address.
3. Deploy MarketplaceContract. Get address.
4. Call TicketContract.`initialize(marketplace_address, xlm_token)`.
5. Call MarketplaceContract.`initialize(ticket_contract_address, royalty_rate)`.

## Excluded from MVP
- Passkey auth (Web3Auth preferred)
- On-chain event images (Use off-chain metadata)
- Automated refunds (Hits instruction limits - D-002)
- Marketplace locks (D-009)

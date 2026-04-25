# AGENTS.md
*Read this before touching any file in this repo. This is the single source of truth for how an AI should navigate and contribute to this codebase.*

---

## What this project is

NFT event ticketing on Stellar. Two Soroban smart contracts + a Next.js frontend. Full description in `README.md`. Before writing any code, read `docs/architecture.md` — it contains binding design decisions that should not be changed without updating `docs/decisions.md`.

---

## Mandatory reads before coding

| If you're working on | Read first |
|---|---|
| Anything | `docs/architecture.md` |
| Contracts | `docs/architecture.md` + `contracts/README.md` |
| Frontend | `docs/architecture.md` + `frontend/README.md` |
| Using reference repos | `docs/repo_guide.md` |
| Changing a design decision | `docs/decisions.md` — check if it's already decided |

---

## Repository file responsibilities

### Root

| File | Responsibility |
|---|---|
| `README.md` | Human-facing project overview. Stack, commands, directory map. |
| `AGENTS.md` | This file. AI context. File responsibilities. Conventions. Anti-patterns. |
| `Cargo.toml` | Workspace root. Declares `members = ["contracts/*"]`. Pins `soroban-sdk = "25.3.1"`. Contains `[profile.release]` block. Do not add per-contract SDK pins. |

### docs/

| File | Responsibility |
|---|---|
| `architecture.md` | **Binding design document.** Contract storage models, function signatures, wallet flows, QR mechanism, deployment sequence, what is deliberately NOT built. |
| `repo_guide.md` | What to use and what to avoid from the three reference repos (nft-soroban, EntryX, Litemint). Corrections to common AI mistakes about those repos. |
| `decisions.md` | ADR-style log of key decisions with rationale. Check here before overriding a design choice. Add here when you make a new significant decision. |

### contracts/ticket/src/

| File | Responsibility |
|---|---|
| `lib.rs` | Contract entry point. `#[contract]` struct, `#[contractimpl]` block. All public functions declared here. No business logic — delegates to storage.rs and escrow.rs. |
| `types.rs` | All `#[contracttype]` structs and enums: `DataKey`, `Event`, `Ticket`, `EventStatus`. Nothing else. |
| `storage.rs` | All storage read/write functions. Raw calls to `env.storage().persistent()`. No business logic — pure get/set wrappers. Functions named `read_*` and `write_*`. |
| `escrow.rs` | Escrow accounting logic: `add_to_escrow`, `subtract_from_escrow`, `get_escrow_balance`, `transfer_escrow_to`. Handles XLM stroop arithmetic. Uses `checked_mul`/`checked_div` everywhere — no raw arithmetic. |
| `events.rs` | Soroban event publishing. One function per event type: `emit_ticket_purchased`, `emit_event_created`, `emit_funds_released`, etc. All `env.events().publish(...)` calls live here only. |
| `test.rs` | Contract tests. Uses Soroban test environment (no running node needed). Tests each public function. Must test: happy path, capacity exceeded, wrong caller on restricted_transfer, expired event refund, double-spend prevention. |

### contracts/marketplace/src/

| File | Responsibility |
|---|---|
| `lib.rs` | Contract entry point. Public functions: `initialize`, `list_ticket`, `buy_listing`, `cancel_listing`. Delegates to storage.rs. The inter-contract call to TicketContract lives here, in `buy_listing`. |
| `types.rs` | `DataKey`, `Listing`, `ListingStatus` enums/structs. |
| `storage.rs` | Storage read/write helpers. Same pattern as ticket/storage.rs. |
| `events.rs` | Emit events for listings created, sold, cancelled. |
| `test.rs` | Tests for marketplace functions. Must include: royalty calculation, inter-contract call behavior, listing cancellation. |

### frontend/src/lib/

| File | Responsibility |
|---|---|
| `soroban.ts` | Transaction building and simulation. `buildTransaction(operation, account)`, `simulateTransaction(tx)`, `submitTransaction(signedXdr)`. Never skip simulation. This is the only file that calls Horizon directly for transaction purposes. |
| `stellar.ts` | Stellar JS SDK wrappers. Account existence check, Friendbot funding call, balance fetch, `Keypair.verify()` for QR. Stateless utility functions only. |
| `qr.ts` | QR payload construction and verification. `buildQRPayload(walletAddress, ticketId, timestamp)`, `verifyQRPayload(payload)`. Verification is purely local (no network call). |
| `web3auth.ts` | Web3Auth initialization, login, and wallet extraction. Returns a Stellar keypair interface compatible with the wallet hook. Never expose private key outside this file. |
| `constants.ts` | Contract addresses (ticket + marketplace), network config (RPC URL, passphrase), Friendbot URL. The only place these values live. When contracts are redeployed, update only this file. |

### frontend/src/hooks/

| File | Responsibility |
|---|---|
| `useWallet.ts` | Unified wallet hook. Abstracts over Freighter (organizer) and Web3Auth (attendee). Exposes: `publicKey`, `connect()`, `signTransaction(xdr)`, `signMessage(message)`, `walletType`. No blockchain calls — delegates to lib/. |
| `useEvents.ts` | Fetches and caches event list and individual event data from TicketContract. Cache TTL: 30 seconds. Never fetches inside a render — always through this hook. |
| `useTickets.ts` | Fetches and caches tickets owned by the current wallet. Invalidates cache on purchase. |

### frontend/src/app/

| Route | Responsibility |
|---|---|
| `page.tsx` | Landing page. Links to attendee and organizer flows. |
| `events/page.tsx` | Attendee event browser. Uses `useEvents`. |
| `events/[id]/page.tsx` | Event detail + buy ticket button. Attendee flow. |
| `my-tickets/page.tsx` | Attendee ticket list. Uses `useTickets`. Each ticket shows QR button. |
| `my-tickets/[id]/qr/page.tsx` | Full-screen QR display. Signs message every 30 seconds via `useWallet`. Uses `lib/qr.ts` to build payload. |
| `scanner/page.tsx` | Venue staff QR scanner. Camera API → decode → `lib/qr.ts` verify → `lib/stellar.ts` ownership check → mark used. |
| `organizer/page.tsx` | Organizer dashboard. Requires Freighter connection. Shows events, ticket counts, escrow balances. |
| `organizer/create/page.tsx` | Event creation form. Calls `create_event` via server-side transaction builder. |
| `api/fund/route.ts` | Server route. Proxies Friendbot call for new attendee wallets. Called once per new Web3Auth account. |
| `api/build-tx/route.ts` | Server route. Receives operation intent from client, fetches sequence number, builds + simulates transaction, returns unsigned XDR. |
| `api/submit-tx/route.ts` | Server route. Receives signed XDR from client, submits to Stellar testnet, returns result. |

### frontend/src/components/

| Directory | Responsibility |
|---|---|
| `shared/` | Reusable UI: buttons, modals, loading states, error display. No blockchain logic. |
| `attendee/` | Components used only in attendee flow: TicketCard, QRDisplay, EventCard, PurchaseButton. |
| `organizer/` | Components used only in organizer flow: EventForm, DashboardStats, EscrowStatus. |
| `scanner/` | QR scanner component wrapping camera API. Verification result display (green/red). |

### scripts/

| File | Responsibility |
|---|---|
| `deploy.sh` | Deploys contracts in correct order: TicketContract first, then MarketplaceContract with ticket address, then initializes TicketContract with marketplace address. Fails loudly if any step fails. |
| `fund.sh` | Hits Friendbot for a list of test addresses. Used to set up test accounts before a demo. |

### .github/workflows/

| File | Responsibility |
|---|---|
| `rust.yml` | On push to main: `cargo build --verbose`, `cargo test --verbose`. Runs from `contracts/` directory. |
| `frontend.yml` | On push to main: `npm ci`, `npm run build`. Deploys to Vercel on success. |

---

## Conventions

### Contracts (Rust)

- All storage access goes through `storage.rs`. `lib.rs` never calls `env.storage()` directly.
- All `env.events().publish()` calls go in `events.rs`. `lib.rs` calls the emit functions.
- Use `checked_mul`, `checked_add`, `checked_div`, `checked_sub` everywhere. Never raw arithmetic on `i128`.
- Auth: `address.require_auth()` at the top of every function that needs it. No Signature types, no nonces, no soroban-auth crate.
- Storage type: use `env.storage().persistent()` for all contract state. Not `instance()` unless the data truly lives for the contract lifetime only.
- Error handling: `panic!("descriptive message")` is fine for Soroban. Avoid `unwrap()` on Option without a comment explaining why it's safe.

### Frontend (TypeScript)

- The server/client split is enforced: `api/build-tx` builds, client signs, `api/submit-tx` submits. Never build a transaction client-side. Never submit from the client directly.
- All Horizon and Soroban RPC calls go through `lib/soroban.ts` or `lib/stellar.ts`. Components do not import `@stellar/stellar-sdk` directly.
- Cache all read-only contract state in hooks with a 30-second TTL. Testnet RPC latency is real — don't let it block renders.
- `constants.ts` is the only place contract addresses live. If you hardcode an address anywhere else, that's a bug.
- Two wallet paths (`Freighter` for organizer, `Web3Auth` for attendee) are unified behind `useWallet`. Nothing outside `useWallet.ts` and `lib/web3auth.ts` should know which provider is active.

---

## What NOT to do

**Do not** use SAC (Stellar Asset Contract) for tickets. Tickets are custom NFTs. Reason: SAC transfer cannot be gated. See `docs/architecture.md`.

**Do not** implement automatic refunds on event cancellation by looping over ticket holders. This hits Soroban instruction limits. Refunds are pull-based — each attendee calls `refund(ticket_id)` themselves.

**Do not** add a lock mechanism to listed tickets. Known gap, acceptable for MVP. See `docs/architecture.md` → "What is NOT built."

**Do not** call `env.call_contract()` for inter-contract calls. Use the generated client type from `#[contractclient]`. See `docs/repo_guide.md` → "Build from scratch" section.

**Do not** skip transaction simulation. `simulateTransaction` must be called before every `submitTransaction`. Without it, fees are wrong and errors are opaque.

**Do not** put contract addresses or RPC URLs in any file other than `frontend/src/constants.ts`.

**Do not** import soroban-auth or use `Signature` / `Identifier` types. These are from an ancient SDK version (0.4.x). Modern auth is `address.require_auth()`.

**Do not** emit QR timestamp as `floor(unix/30)` windowed. Use absolute timestamp and check `|now - payload_timestamp| < 30`. The windowed approach causes valid QRs to fail at window boundaries.

---

## Before you write code for any file

1. Check `docs/decisions.md` — has this decision already been made?
2. Check this file — is there a stated responsibility for the file you're editing?
3. Check `docs/architecture.md` — does your implementation match the storage model and function signatures?
4. If you're deviating from any of the above, write a note in `docs/decisions.md` explaining why.

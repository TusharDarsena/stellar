# NFT Event Ticketing — Stellar / Soroban

Event tickets as NFTs on Stellar. Organizers create events, hold funds in escrow, and release them after the event. Attendees sign in with Google, buy tickets with XLM, and enter via a rotating QR code.


## Two User Types

**Organizer** — creates events, mints tickets, monitors sales, earns royalties on resales. Uses Freighter wallet since they handle real XLM and contract deployments.

**Attendee** — signs in with email or Google, buys a ticket, sees it in their wallet, shows QR at the door. Never sees a seed phrase or blockchain address.


## Full Feature List

**Functional — **
- Event creation (name, date, capacity, price)
- Lazy minting of NFT tickets on Stellar testnet
- Ticket purchase with XLM into escrow vault
- My Tickets view for attendees
- Dynamic QR code generation (signed + timestamped)
- QR scanner for venue staff with on-chain verification
- Organizer dashboard (tickets sold, revenue, attendee list)
- Restricted resale with auto royalty deduction
- Event cancellation with automatic refunds
- Google Form for user onboarding (name, email, wallet address, feedback rating)
- CI/CD via GitHub Actions

**Non-functional — how it must behave:**
- Transaction confirms in under 5 seconds on testnet
- Only the wallet owner can produce a valid entry QR
- Zero crypto knowledge needed for attendees
- Works on mobile browser (attendees scan at the door on their phone)

## Current state

| Layer                           | Status                          |
| ------------------------------- | ------------------------------- |
| Soroban contracts (ticket)      | ✅ Built and tested              |
| Soroban contracts (marketplace) | ✅ Built and tested              |
| Deployment scripts              | ✅ Built and deployed to Testnet |
| Frontend (React + Vite)         | 🔲 Not started                   |

## Quick start

```bash
# Build contracts
cd contracts
cargo build

# Run tests
cargo test -p ticket

# Build wasm for deployment
cargo build --target wasm32-unknown-unknown --release
```

## Directory map

```
contracts/          Soroban smart contracts (Rust)
  ticket/           TicketContract — NFT ownership, escrow, QR verification
  marketplace/      MarketplaceContract — resale listings (in progress)
docs/               Design docs
  architecture.md   Storage models, function signatures, wallet flows
  decisions.md      Why each design choice was made
  repo_guide.md     What to use/avoid from reference repos
  frontend.md       Frontend spec (React + Vite, deferred)
scripts/            deploy.sh, fund.sh (not yet written)
```

## Deployment

Run `scripts/deploy.sh` once it exists. Order matters — TicketContract first, then MarketplaceContract, then `initialize()`. See `docs/architecture.md` → Deployment Sequence.

## Testnet accounts

Existing CLI identities: `alice`, `buyer`, `inspector`, `seller`. Add `organizer` pointing to your Freighter wallet before deploying.

## Tech Stack

| Layer            | Tool                                   |
| ---------------- | -------------------------------------- |
| Smart contract   | Rust + Soroban SDK                     |
| Blockchain       | Stellar Testnet                        |
| Frontend         | React + Stellar JS SDK                 |
| Attendee wallet  | Web3Auth or Magic Link                 |
| Organizer wallet | Freighter                              |
| QR generation    | Frontend signs message via WaaS wallet |
| QR scanning      | Browser camera API                     |
| CI/CD            | GitHub Actions                         |
| User onboarding  | Google Forms                           |

## For AI context

Read `AGENTS.md` first. Always.

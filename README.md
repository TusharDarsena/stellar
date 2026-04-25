# NFT Event Ticketing — Stellar / Soroban

Event tickets as NFTs on Stellar. Organizers create events, hold funds in escrow, and release them after the event. Attendees sign in with Google, buy tickets with XLM, and enter via a rotating QR code.

## Current state

| Layer | Status |
|-------|--------|
| Soroban contracts (ticket) | ✅ Built and tested — 6/6 tests passing |
| Soroban contracts (marketplace) | 🔲 Not started |
| Deployment scripts | 🔲 Not started |
| Frontend (React + Vite) | 🔲 Not started |

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

## For AI context

Read `AGENTS.md` first. Always.

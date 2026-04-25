# NFT Event Ticketing — Stellar / Soroban

Event tickets as NFTs on the Stellar blockchain. Organizers create events and earn royalties on resales. Attendees sign in with Google, buy tickets with XLM, and enter via a cryptographic QR code. No crypto knowledge required for attendees.

## What's built

- **Two Soroban smart contracts**: TicketContract (NFT ownership, escrow, lazy minting) and MarketplaceContract (resale, royalties, inter-contract calls)
- **React/Next.js frontend**: Organizer portal (Freighter) + Attendee portal (Web3Auth) + QR scanner
- **Zero-knowledge-required attendee flow**: Google sign-in → silent wallet → buy ticket → show QR

## Directory map

```
contracts/       Rust/Soroban smart contracts (workspace)
frontend/        React/Next.js app
docs/            Architecture, decisions, repo reference guide
scripts/         Deployment and test-account funding scripts
.github/         CI/CD workflows
```

## Key docs (read these before touching code)

- `docs/architecture.md` — contract design, storage model, wallet flows, QR mechanism
- `docs/repo_guide.md` — what to learn from reference repos and what to avoid
- `docs/decisions.md` — why specific decisions were made (check here before changing something)
- `AGENTS.md` — AI agent instructions, file responsibilities, conventions

## Stack

| Layer | Tool |
|---|---|
| Smart contracts | Rust + Soroban SDK 21.0.0 |
| Blockchain | Stellar Testnet |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Attendee wallet | Web3Auth |
| Organizer wallet | Freighter |
| CI/CD | GitHub Actions |

## Running locally

```bash
# Contracts
cd contracts
cargo build
cargo test

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

See `scripts/deploy.sh`. Order matters — read it before running.

## Testnet

All contracts are deployed to Stellar Testnet. Contract addresses live in `frontend/src/constants.ts`. Fund test accounts via `scripts/fund.sh`.

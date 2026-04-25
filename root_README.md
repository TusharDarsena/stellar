# NFT Event Ticketing — Stellar / Soroban

Event tickets as NFTs on Stellar. Organizers create events and hold funds in escrow until after the event date. Attendees sign in with Google, buy tickets with XLM, and enter via a rotating cryptographic QR code. No crypto knowledge required for attendees.

## Quick start

```bash
# Contracts
cd contracts
cargo build
cargo test

# Build wasm for deployment
cargo build --target wasm32-unknown-unknown --release

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

Run `scripts/deploy.sh`. Order matters — do not deploy manually. See `docs/architecture.md` → Deployment Sequence.

## Testnet accounts

Fund test accounts via `scripts/fund.sh` before running demos.

## Docs

| File                   | What it covers                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| `AGENTS.md`            | AI instructions, file responsibilities, conventions, anti-patterns |
| `docs/architecture.md` | Contract design, storage models, wallet flows, QR mechanism        |
| `docs/decisions.md`    | Why each design decision was made, what was rejected               |
| `docs/repo_guide.md`   | What to use and avoid from reference repos                         |
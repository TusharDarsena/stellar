# Frontend

Next.js 14 (App Router) + TypeScript. Two distinct user flows sharing one domain. Read `docs/architecture.md` before writing any frontend code.

---

## Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                    Landing page
│   │   ├── events/
│   │   │   ├── page.tsx                Attendee: browse all events
│   │   │   └── [id]/
│   │   │       └── page.tsx            Attendee: event detail + buy
│   │   ├── my-tickets/
│   │   │   ├── page.tsx                Attendee: ticket list
│   │   │   └── [id]/
│   │   │       └── qr/
│   │   │           └── page.tsx        Attendee: full-screen QR display
│   │   ├── scanner/
│   │   │   └── page.tsx                Venue staff: QR scanner
│   │   ├── organizer/
│   │   │   ├── page.tsx                Organizer: dashboard
│   │   │   └── create/
│   │   │       └── page.tsx            Organizer: event creation form
│   │   └── api/
│   │       ├── fund/
│   │       │   └── route.ts            Server: Friendbot proxy
│   │       ├── build-tx/
│   │       │   └── route.ts            Server: build + simulate transaction
│   │       └── submit-tx/
│   │           └── route.ts            Server: submit signed transaction
│   ├── components/
│   │   ├── shared/                     Shared UI components
│   │   ├── attendee/                   Attendee-only components
│   │   ├── organizer/                  Organizer-only components
│   │   └── scanner/                    Scanner component
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   ├── useEvents.ts
│   │   └── useTickets.ts
│   └── lib/
│       ├── soroban.ts
│       ├── stellar.ts
│       ├── qr.ts
│       ├── web3auth.ts
│       └── constants.ts
└── public/
    └── .well-known/
        └── stellar.toml
```

---

## lib/ — file responsibilities

### constants.ts
**Single source of truth for all network config and contract addresses.**

Contains:
- `TICKET_CONTRACT_ADDRESS` — deployed TicketContract address on Stellar Testnet
- `MARKETPLACE_CONTRACT_ADDRESS` — deployed MarketplaceContract address
- `STELLAR_RPC_URL` — Soroban RPC endpoint
- `STELLAR_NETWORK_PASSPHRASE` — testnet passphrase
- `FRIENDBOT_URL` — testnet funding endpoint
- `HORIZON_URL` — Horizon REST API endpoint

Rule: If you find a contract address, RPC URL, or network passphrase hardcoded anywhere other than this file, that is a bug. Move it here.

### soroban.ts
**Transaction lifecycle. Build, simulate, submit. Nothing else.**

Exports:
- `buildTransaction(sourceAccount, operation)` → `Transaction` — constructs a TransactionEnvelope from a Soroban operation
- `simulateTransaction(tx)` → `SorobanRpc.SimulateTransactionResponse` — dry-run, returns correct fee
- `prepareTransaction(tx, simulationResult)` → `Transaction` — applies fee from simulation
- `submitTransaction(signedXdrBase64)` → result — submits to Horizon

Rule: Never skip simulation. `build → simulate → prepare → sign (client) → submit` is the required sequence every time.

Rule: This is the only file that imports `SorobanRpc` from `@stellar/stellar-sdk`. Nothing else does.

### stellar.ts
**Stellar network utilities. Stateless helpers.**

Exports:
- `accountExists(publicKey)` → `boolean` — checks Horizon for account
- `fundAccount(publicKey)` → calls `/api/fund` route (not Friendbot directly — goes through server proxy)
- `getBalance(publicKey)` → `string` — XLM balance in stroops
- `verifySignature(publicKey, message, signature)` → `boolean` — ed25519 verification using `Keypair.verify()`. Used in QR scanner.
- `stroopsToXlm(stroops: i128)` → `string` — display conversion only

Rule: No transaction building here. No Soroban RPC calls. Only Horizon REST and crypto utilities.

### qr.ts
**QR payload construction and verification. Zero network calls.**

Exports:
- `buildQRPayload(walletAddress, ticketId, timestampSeconds)` → `string` — format: `{walletAddress}:{ticketId}:{timestamp}:{base64Signature}`
- `verifyQRPayload(payload, currentTimestampSeconds)` → `{ valid: boolean, reason?: string, walletAddress?: string, ticketId?: string }` — checks timestamp delta, verifies signature. No network call.
- `QR_EXPIRY_SECONDS = 30` — exported constant

Timestamp rule: Verifier checks `Math.abs(current - payload.timestamp) < QR_EXPIRY_SECONDS`. Do NOT use `Math.floor(timestamp / 30)` windowing — causes valid QRs to fail at window boundaries. See `docs/decisions.md` D-006.

### web3auth.ts
**Web3Auth initialization and Stellar keypair extraction.**

Exports:
- `initWeb3Auth()` — initializes Web3Auth with Stellar network config. Called once at app startup.
- `loginWithGoogle()` → `StellarKeypairInterface` — OAuth flow, returns keypair wrapper
- `loginWithEmail(email)` → `StellarKeypairInterface` — magic link flow
- `logout()`

The `StellarKeypairInterface` returned exposes:
- `publicKey: string`
- `signTransaction(xdrBase64: string): Promise<string>` — returns signed XDR
- `signMessage(message: string): Promise<string>` — returns base64 signature

Rule: Private key never leaves this file. The interface wraps it. Nothing outside this file can access the raw keypair.

---

## hooks/ — file responsibilities

### useWallet.ts
**Unified wallet hook. Abstracts Freighter and Web3Auth behind one interface.**

Returns:
```typescript
{
  publicKey: string | null
  walletType: 'freighter' | 'web3auth' | null
  isConnected: boolean
  connect: (type: 'freighter' | 'web3auth') => Promise<void>
  disconnect: () => void
  signTransaction: (xdrBase64: string) => Promise<string>
  signMessage: (message: string) => Promise<string>
}
```

Rule: Organizer pages call `connect('freighter')`. Attendee pages call `connect('web3auth')`. Nothing outside this hook knows which provider is active.

Rule: On Web3Auth login, this hook calls `stellar.accountExists(publicKey)` and if false, calls `stellar.fundAccount(publicKey)` via the server proxy. This is the Friendbot trigger.

### useEvents.ts
**Event data with caching.**

Returns:
```typescript
{
  events: Event[]
  getEvent: (eventId: string) => Event | undefined
  isLoading: boolean
  error: string | null
  refetch: () => void
}
```

Rule: Cache TTL is 30 seconds. On testnet, Horizon calls can take 2–4 seconds — never fetch inside a render. If `events` is stale but not expired, return the cached version immediately while refetching in the background.

### useTickets.ts
**Tickets owned by current wallet, with caching.**

Returns:
```typescript
{
  tickets: Ticket[]
  getTicket: (ticketId: string) => Ticket | undefined
  isLoading: boolean
  error: string | null
  invalidate: () => void  // call after purchase to force refresh
}
```

---

## app/ — page responsibilities

### page.tsx (landing)
Entry point. Two clear CTAs: "I'm an attendee" and "I'm an organizer." No blockchain calls on this page.

### events/page.tsx
Uses `useEvents` to display all Active events. Attendee-facing. Shows event name, date, price in XLM, tickets remaining. Links to `events/[id]`.

### events/[id]/page.tsx
Event detail. Buy Ticket button. On click:
1. Check wallet connected (Web3Auth) — if not, trigger login
2. POST to `/api/build-tx` with intent: `{ type: 'purchase', eventId, buyer: publicKey }`
3. Receive unsigned XDR
4. Call `useWallet.signTransaction(xdr)`
5. POST signed XDR to `/api/submit-tx`
6. On success: redirect to `/my-tickets`, call `useTickets.invalidate()`

### my-tickets/page.tsx
Lists attendee's tickets. Uses `useTickets`. Each ticket card shows event name, date, status (used/unused). Button: "Show QR" → navigate to `/my-tickets/[id]/qr`.

### my-tickets/[id]/qr/page.tsx
Full-screen QR display. No navigation chrome — this is what the attendee shows at the door.

Behavior:
1. Get ticket data from `useTickets`
2. Every 30 seconds: call `useWallet.signMessage(buildQRPayload(publicKey, ticketId, Date.now()/1000))` → render as QR
3. Countdown timer showing seconds until next refresh
4. If ticket is already `used`: show "Ticket Already Used" screen instead of QR

Rule: The signing call must NOT show a prompt or popup. Web3Auth signs silently. If there's a prompt, the WaaS integration is wrong.

### scanner/page.tsx
Venue staff page. Camera access → decode QR → verify → mark used.

Steps on successful QR decode:
1. Call `qr.verifyQRPayload(payload, Date.now()/1000)` — signature check, timestamp check
2. If invalid: show red, display reason, do not proceed
3. Fetch ticket from TicketContract: `get_ticket(ticketId)` — check `owner == walletAddress` and `used == false`
4. If checks pass: show green, immediately POST to `/api/build-tx` to mark_used, sign with organizer wallet, submit
5. If ticket already used: show red "Already Scanned"

Steps 1 and 3 run in parallel (3 is a network call; 1 is instant). Show green/red on step 1+3 combined.

### organizer/page.tsx
Requires Freighter. Dashboard showing: events created, total tickets sold per event, escrow balance per event, "Release Funds" button (active only if event date has passed).

### organizer/create/page.tsx
Form: event name, date, capacity, price in XLM. On submit: builds `create_event` transaction through the server API pair. Freighter signs.

### api/fund/route.ts
`POST { publicKey }` → hits Friendbot → returns result. Proxied through server to avoid CORS and to allow rate-limiting in the future.

### api/build-tx/route.ts
`POST { type, ...params }` → fetches current ledger sequence from Horizon → builds appropriate Soroban operation → simulates → returns `{ unsignedXdr: string }`.

The `type` field dispatches to the right contract call:
- `'purchase'` → TicketContract.purchase
- `'create_event'` → TicketContract.create_event
- `'release_funds'` → TicketContract.release_funds
- `'mark_used'` → TicketContract.mark_used
- `'buy_listing'` → MarketplaceContract.buy_listing
- etc.

### api/submit-tx/route.ts
`POST { signedXdr }` → submits to Horizon → returns `{ success: boolean, hash?: string, error?: string }`.

---

## components/ — responsibilities

### shared/
- `Button.tsx` — primary, secondary, danger variants
- `LoadingSpinner.tsx`
- `ErrorDisplay.tsx` — takes `error: string | null`, renders nothing if null
- `Modal.tsx`

### attendee/
- `EventCard.tsx` — displays one event (name, date, price, remaining capacity)
- `TicketCard.tsx` — displays one ticket (event name, date, used status, QR button)
- `PurchaseButton.tsx` — handles the full buy flow (steps 1–5 in events/[id] page)

### organizer/
- `EventForm.tsx` — controlled form for event creation
- `EscrowStatus.tsx` — shows escrow balance + Release button with condition check
- `DashboardStats.tsx` — ticket count, revenue summary per event

### scanner/
- `QRScanner.tsx` — wraps camera API and QR decoding library. Calls `onDecode(payload: string)` callback.
- `ScanResult.tsx` — green/red result display with reason text

---

## public/.well-known/stellar.toml
Required for the Stellar network to recognize your asset issuer. Without it, custom tokens show as "unknown" in wallets. Copy the structure from EntryX's version, replace all fields with project-specific values. See `docs/repo_guide.md`.

---

## Conventions

- Server/client split: pages build intent → server builds+simulates → client signs → server submits. Never bypass.
- Cache all read-only state in hooks (30s TTL). Never fetch in render.
- `constants.ts` only for addresses and URLs.
- Two wallet types unified in `useWallet`. Pages don't know which provider is active.
- Components in `attendee/` and `organizer/` do not import from each other.

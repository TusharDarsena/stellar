export type TicketStatus = 'Active' | 'Used' | 'Refunded';
export type EventStatus = 'Active' | 'Cancelled' | 'Completed';
export type WalletType = 'freighter' | 'burner';  // D-028: burner replaces web3auth for MVP
export type TxStatus = 'idle' | 'building' | 'signing' | 'submitting' | 'success' | 'error';
export type AppView = 'landing' | 'browse' | 'event-detail' | 'purchase' | 'my-tickets' | 'qr-display' | 'organizer-dashboard' | 'organizer-create' | 'scanner';

// Abstraction so soroban.ts doesn't care whether the user is on Freighter or Burner. (D-007 revised)
// Freighter: wraps signTransaction from @stellar/freighter-api
// Burner:    wraps Keypair.fromSecret(secret).sign(...)
export type SignFn = (xdr: string, opts?: { networkPassphrase?: string; address?: string }) => Promise<{ signedTxXdr: string; signerAddress?: string }>;

export interface Event {
  eventId: string;
  organizer: string;
  name: string;
  dateUnix: number;
  capacity: number;
  pricePerTicket: number;   // in stroops
  currentSupply: number;
  status: EventStatus;
  imageUrl?: string;
  description?: string;
  venue?: string;
  city?: string;
}

export interface Ticket {
  ticketId: string;
  eventId: string;
  owner: string;
  status: TicketStatus;   // D-018: three-state enum, not a bool
}

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  xlmBalance: string | null;
  secretKey: string | null;  // burner only — always null for freighter (D-028)
  signFn: SignFn | null;     // ready-to-use signing function, null when disconnected
}

export interface TxState {
  status: TxStatus;
  hash?: string;
  errorMessage?: string;
  message?: string;
}

export const xlmToStroops = (xlm: number): bigint => BigInt(Math.floor(xlm * 10_000_000));
export const stroopsToXlm = (s: number) => (s / 10_000_000).toFixed(2);
export const formatEventDate = (unix: number) =>
  new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export const truncateKey = (k: string) => `${k.slice(0, 4)}...${k.slice(-4)}`;


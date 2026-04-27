export type TicketStatus = 'Active' | 'Used' | 'Refunded';
export type EventStatus = 'Active' | 'Cancelled' | 'Completed';
export type WalletType = 'web3auth' | 'freighter';
export type TxStatus = 'idle' | 'building' | 'signing' | 'submitting' | 'success' | 'error';
export type AppView = 'landing' | 'browse' | 'event-detail' | 'purchase' | 'my-tickets' | 'qr-display' | 'organizer-dashboard' | 'organizer-create' | 'scanner';

export interface Event { 
  eventId: string; 
  organizer: string; 
  name: string; 
  dateUnix: number; 
  capacity: number; 
  pricePerTicket: number; 
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
  isUsed: boolean;
  purchaseTimestamp: number;
}

export interface WalletState { 
  isConnected: boolean; 
  publicKey: string | null; 
  walletType: WalletType | null; 
  xlmBalance: string | null; 
  displayName?: string; 
  email?: string; 
  avatarUrl?: string; 
}

export interface TxState { 
  status: TxStatus; 
  hash?: string; 
  errorMessage?: string; 
}

export const stroopsToXlm = (s: number) => (s / 10_000_000).toFixed(2);
export const formatEventDate = (unix: number) => new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export const truncateKey = (k: string) => `${k.slice(0,4)}...${k.slice(-4)}`;

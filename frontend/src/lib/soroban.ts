import { Event, Ticket } from '../types';
import { generateID } from './utils';

// These functions represent the client-side wrappers that would communicate with our backend.
// As per D-007, the backend builds and simulates the transaction, the client signs it, and the backend submits it.
// Since the backend is not yet implemented, these functions are currently stubs.

export interface CreateEventParams {
  organizer: string;
  name: string;
  dateUnix: number;
  capacity: number;
  priceStroops: number;
}

export async function purchaseTicket(eventId: string, buyerPublicKey: string): Promise<string> {
  console.log(`[Soroban Mock] purchaseTicket - Event: ${eventId}, Buyer: ${buyerPublicKey}`);
  // In a real implementation:
  // 1. Fetch unsigned XDR from backend /api/purchase
  // 2. Sign XDR with Freighter
  // 3. Submit signed XDR to backend /api/submit
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return generateID(); // Mock tx hash or ticket ID
}

export async function createEvent(params: CreateEventParams): Promise<string> {
  console.log(`[Soroban Mock] createEvent - Params:`, params);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return generateID(); // Mock event ID
}


export async function releaseFunds(eventId: string, organizerPublicKey: string): Promise<string> {
  console.log(`[Soroban Mock] releaseFunds - Event: ${eventId}, Organizer: ${organizerPublicKey}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return 'tx_hash_mock_release_789';
}

export async function fetchEvents(): Promise<Event[]> {
  console.log(`[Soroban Mock] fetchEvents`);
  // This would typically read from the Soroban RPC or an indexer.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return []; // Mock data will be handled at the component level or via useEvents hook later
}

export async function fetchTicketsByOwner(publicKey: string): Promise<Ticket[]> {
  console.log(`[Soroban Mock] fetchTicketsByOwner - Owner: ${publicKey}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [];
}

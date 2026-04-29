import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types matching our Supabase schema
export interface EventMetadata {
  event_id: string;
  organizer_address: string;
  name: string;
  description: string | null;
  image_url: string | null;
  venue: string | null;
  city: string | null;
  category: string | null;
  status: string; // 'Active' | 'Cancelled' | 'Completed'
  current_supply: number;
  date_unix: number;
  capacity: number;
  price_per_ticket: number;
  created_at: string;
}

export interface TicketRow {
  ticket_id: string;
  event_id: string;
  owner_address: string;
  status: string; // 'Active' | 'Used' | 'Refunded'
  purchased_at: string;
}

export interface ListingRow {
  listing_id: string;
  seller_address: string;
  ticket_id: string;
  event_id: string;
  ask_price_stroops: string; // Using string or numeric string due to bigint in Postgres
  status: string; // 'Open' | 'Sold' | 'Cancelled'
  listed_at: string;
}

export interface UserProfileRow {
  wallet_address: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

/**
 * Fetch all events directly from Supabase (bypassing slow RPC scans).
 * Replaces the need for SorobanRpc.getEvents() on list views.
 */
export async function fetchAllEvents(): Promise<EventMetadata[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[supabase] fetchAllEvents failed:', error.message);
    throw new Error('Service Unavailable / Database unreachable');
  }

  return data ?? [];
}

/**
 * Fetch metadata for a list of event IDs in one query.
 * Returns a map of event_id → metadata for easy lookup.
 */
export async function fetchEventsMetadata(
  eventIds: string[]
): Promise<Record<string, EventMetadata>> {
  if (eventIds.length === 0) return {};

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('event_id', eventIds);

  if (error) {
    console.warn('[supabase] fetchEventsMetadata failed:', error.message);
    return {};
  }

  const map: Record<string, EventMetadata> = {};
  for (const row of data ?? []) {
    map[row.event_id] = row;
  }
  return map;
}

/**
 * Fetch tickets for a specific wallet directly from Supabase.
 */
export async function fetchTicketsByOwner(walletAddress: string): Promise<TicketRow[]> {
  if (!walletAddress) return [];
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('owner_address', walletAddress)
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('[supabase] fetchTicketsByOwner failed:', error.message);
    throw new Error('Service Unavailable / Database unreachable');
  }

  return data ?? [];
}

/**
 * Fetch open listing for a specific ticket to determine "Cancel Listing" UI state.
 */
export async function fetchOpenListingByTicket(ticketId: string): Promise<ListingRow | null> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('ticket_id', ticketId)
    .eq('status', 'Open')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('[supabase] fetchOpenListingByTicket failed:', error.message);
    return null;
  }

  return data;
}

/**
 * Upsert event metadata after a successful on-chain createEvent call.
 * Non-blocking — caller should not await this in the critical path.
 */
export async function upsertEventMetadata(
  metadata: Omit<EventMetadata, 'created_at' | 'status' | 'current_supply'> & { status?: string, current_supply?: number, date_unix?: number, capacity?: number, price_per_ticket?: number }
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .upsert(metadata, { onConflict: 'event_id' });

  if (error) {
    console.warn('[supabase] upsertEventMetadata failed:', error.message);
  }
}

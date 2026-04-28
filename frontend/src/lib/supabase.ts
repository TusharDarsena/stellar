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
  created_at: string;
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
 * Upsert event metadata after a successful on-chain createEvent call.
 * Non-blocking — caller should not await this in the critical path.
 */
export async function upsertEventMetadata(
  metadata: Omit<EventMetadata, 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .upsert(metadata, { onConflict: 'event_id' });

  if (error) {
    console.warn('[supabase] upsertEventMetadata failed:', error.message);
  }
}
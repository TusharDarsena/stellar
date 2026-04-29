import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { EventStatus } from '../types';

export interface ListingWithEvent {
  listingId: string;
  seller: string;
  ticketId: string;
  eventId: string;
  askPriceStroops: bigint;
  status: 'Open' | 'Sold' | 'Cancelled';
  eventName: string;
  eventImageUrl: string | null;
  eventDateUnix: number;
}

const POLL_INTERVAL_MS = 30_000;

export function useListings(): {
  listings: ListingWithEvent[];
  loading: boolean;
  error: string | null;
  invalidate: () => Promise<void>;
} {
  const [listings, setListings] = useState<ListingWithEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(0);

  const fetchListings = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('listings')
        .select(`
          listing_id,
          seller_address,
          ticket_id,
          event_id,
          ask_price_stroops,
          status,
          events:event_id (
            name,
            image_url,
            date_unix
          )
        `)
        .eq('status', 'Open')
        .order('listed_at', { ascending: false });

      if (dbError) throw dbError;

      if (fetchId !== fetchRef.current) return;

      const resolved: ListingWithEvent[] = (data || []).map((row: any) => ({
        listingId: row.listing_id,
        seller: row.seller_address,
        ticketId: row.ticket_id,
        eventId: row.event_id,
        askPriceStroops: BigInt(row.ask_price_stroops),
        status: row.status as 'Open' | 'Sold' | 'Cancelled',
        eventName: row.events?.name || 'Unknown Event',
        eventImageUrl: row.events?.image_url || null,
        eventDateUnix: row.events?.date_unix || 0,
      }));

      setListings(resolved);
    } catch (err) {
      if (fetchId !== fetchRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load listings.');
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    intervalRef.current = setInterval(fetchListings, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchListings]);

  return { listings, loading, error, invalidate: fetchListings };
}

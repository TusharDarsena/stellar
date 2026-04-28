import { useEffect, useRef, useState, useCallback } from 'react';
import { xdr, scValToNative } from '@stellar/stellar-sdk';
import { getRpcServer, getEvent } from '../lib/soroban';
import { TICKET_CONTRACT_ID } from '../lib/constants';
import { fetchEventsMetadata } from '../lib/supabase';
import type { Event } from '../types';

const POLL_INTERVAL_MS = 30_000;
const LEDGER_LOOKBACK = 17_280;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';

export function useEvents(): {
  events: Event[];
  loading: boolean;
  error: string | null;
} {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(0);

  const fetchEvents = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(null);

    try {
      const server = getRpcServer();
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - LEDGER_LOOKBACK);

      // Step 1: Discover event IDs from RPC events
      const eventsResult = await server.getEvents({
        startLedger,
        filters: [{
          type: 'contract',
          contractIds: [TICKET_CONTRACT_ID],
          topics: [
            [xdr.ScVal.scvSymbol('ev_create').toXDR('base64')],
            ['*'], // Wildcard added to catch the event_id slot
          ],
        }],
      });

      if (fetchId !== fetchRef.current) return;

      console.log("RPC Events Result:", eventsResult);

      const eventIds: string[] = [];
      for (const event of eventsResult.events) {
        try {
          if (event.topic.length < 2) continue;
          const eventId = scValToNative(event.topic[1]) as string;
          if (eventId && !eventIds.includes(eventId)) {
            eventIds.push(eventId);
          }
        } catch {
          // skip malformed
        }
      }

      console.log("Discovered Event IDs:", eventIds);

      // If no events found on-chain, exit early to avoid empty Supabase call
      if (eventIds.length === 0) {
        setEvents([]);
        return;
      }

      // Step 2: Fetch on-chain state + Supabase metadata in parallel
      const [settled, metaMap] = await Promise.all([
        Promise.allSettled(eventIds.map((id) => getEvent(id))),
        fetchEventsMetadata(eventIds),
      ]);

      if (fetchId !== fetchRef.current) return;

      // Step 3: Merge — RPC wins for on-chain fields, Supabase wins for metadata
      const resolved: Event[] = settled
        .map((r, i) => {
          if (r.status !== 'fulfilled' || !r.value) return null;
          const onChain = r.value;
          const meta = metaMap[eventIds[i]];

          return {
            ...onChain,
            name: meta?.name ?? onChain.name ?? 'Unnamed Event',
            venue: meta?.venue ?? 'Venue TBA',
            city: meta?.city ?? '',
            imageUrl: meta?.image_url ?? FALLBACK_IMAGE,
            description: meta?.description ?? 'No description provided.',
          } as Event;
        })
        .filter((e): e is Event => e !== null);

      setEvents(resolved);
    } catch (err) {
      if (fetchId !== fetchRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load events.');
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchEvents]);

  return { events, loading, error };
}
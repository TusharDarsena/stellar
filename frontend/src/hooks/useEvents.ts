// useEvents.ts — event list discovered via Soroban RPC event polling. (D-029)
// Two-step: discover event IDs from ev_create events → fetch current on-chain state.
// 30s cache. Never fetches inside render. No wallet connection required (public browse).

import { useEffect, useRef, useState, useCallback } from 'react';
import { xdr, scValToNative } from '@stellar/stellar-sdk';
import { getRpcServer, getEvent } from '../lib/soroban';
import { TICKET_CONTRACT_ID } from '../lib/constants';
import type { Event } from '../types';

const POLL_INTERVAL_MS = 30_000;
// Approximate ledger window to scan (~24h on testnet, ~5s/ledger).
// RPC nodes only retain events within their retention window — fetching
// from genesis would fail. For mainnet, swap for an indexer. (D-029)
const LEDGER_LOOKBACK = 17_280;

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

      // Get current ledger so we know a safe startLedger within the retention window
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - LEDGER_LOOKBACK);

      // Step 1: Discover event IDs from ev_create contract events. (D-029)
      // Contract publishes: topics=(ev_create, event_id), value=organizer
      const eventsResult = await server.getEvents({
        startLedger,
        filters: [{
          type: 'contract',
          contractIds: [TICKET_CONTRACT_ID],
          topics: [
            // topic[0] must match "ev_create" symbol
            [xdr.ScVal.scvSymbol('ev_create').toXDR('base64')],
          ],
        }],
      });

      if (fetchId !== fetchRef.current) return;

      // Step 2: Extract event IDs from topic[1] (soroban String → ScvString)
      const eventIds: string[] = [];
      for (const event of eventsResult.events) {
        try {
          if (event.topic.length < 2) continue;
          // scValToNative converts ScvString → string, ScvSymbol → string
          const eventId = scValToNative(event.topic[1]) as string;
          if (eventId && !eventIds.includes(eventId)) {
            eventIds.push(eventId);
          }
        } catch {
          // Skip malformed events
        }
      }

      // Step 3: Fetch current on-chain state for each discovered event ID
      const settled = await Promise.allSettled(eventIds.map((id) => getEvent(id)));
      const resolved: Event[] = settled
        .map((r) => {
          if (r.status === 'fulfilled' && r.value) {
            return {
              ...r.value,
              imageUrl: r.value.imageUrl || 'https://images.unsplash.com/photo-1540039155732-d67414073fb8?q=80&w=2667&auto=format&fit=crop',
              description: r.value.description || 'Join us for an unforgettable event! Secure your tickets now.',
              venue: r.value.venue || 'TBA Venue',
              city: r.value.city || 'TBA City',
            } as Event;
          }
          return null;
        })
        .filter((e): e is Event => e !== null);

      if (fetchId !== fetchRef.current) return;
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

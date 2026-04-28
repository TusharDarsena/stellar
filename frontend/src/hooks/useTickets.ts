// useTickets.ts — tickets owned by the current wallet, discovered via RPC events. (D-029)
// Two-step: discover ticket IDs from tk_buy events → fetch current state per ticket.
// Polls every 30s. Call invalidate() after a purchase to refresh immediately.

import { useEffect, useRef, useState, useCallback } from 'react';
import { xdr, scValToNative } from '@stellar/stellar-sdk';
import { useAppStore } from '../store/useAppStore';
import { getRpcServer, getTicket } from '../lib/soroban';
import { TICKET_CONTRACT_ID } from '../lib/constants';
import type { Ticket } from '../types';

const POLL_INTERVAL_MS = 30_000;
const LEDGER_LOOKBACK = 17_280; // ~24h on testnet, stays within RPC retention window

export function useTickets(): {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  invalidate: () => void;
} {
  const { wallet } = useAppStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef(0);

  const fetchTickets = useCallback(async (publicKey: string) => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(null);

    try {
      const server = getRpcServer();
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - LEDGER_LOOKBACK);

      // Step 1: Fetch all tk_buy events for this contract. (D-029)
      // Contract publishes: topics=(tk_buy, ticket_id), value=(buyer, event_id)
      const eventsResult = await server.getEvents({
        startLedger,
        filters: [{
          type: 'contract',
          contractIds: [TICKET_CONTRACT_ID],
          topics: [
            [xdr.ScVal.scvSymbol('tk_buy').toXDR('base64')],
          ],
        }],
      });

      if (fetchId !== fetchRef.current) return;

      // Step 2: Filter events where the buyer (in value[0]) matches this wallet.
      // scValToNative converts ScvAddress → G... string, ScvString → string
      const myTicketIds: string[] = [];
      for (const event of eventsResult.events) {
        try {
          if (event.topic.length < 2) continue;

          // value is a tuple (buyer: Address, event_id: String) → native [string, string]
          const valueNative = scValToNative(event.value) as [string, string];
          const buyerAddress = valueNative[0];
          if (buyerAddress !== publicKey) continue;

          // topic[1] is the ticket_id (soroban String → string)
          const ticketId = scValToNative(event.topic[1]) as string;
          if (ticketId && !myTicketIds.includes(ticketId)) {
            myTicketIds.push(ticketId);
          }
        } catch {
          // Skip malformed events
        }
      }

      // Step 3: Fetch current on-chain status for each ticket ID
      const settled = await Promise.allSettled(myTicketIds.map((id) => getTicket(id)));
      const resolved: Ticket[] = settled
        .map((r) => (r.status === 'fulfilled' && r.value ? r.value : null))
        .filter((t): t is Ticket => t !== null);

      if (fetchId !== fetchRef.current) return;
      setTickets(resolved);
    } catch (err) {
      if (fetchId !== fetchRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load tickets.');
    } finally {
      if (fetchId === fetchRef.current) setLoading(false);
    }
  }, []);

  const startPolling = useCallback((publicKey: string) => {
    fetchTickets(publicKey);
    intervalRef.current = setInterval(() => fetchTickets(publicKey), POLL_INTERVAL_MS);
  }, [fetchTickets]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Re-fetch immediately and reset the 30s timer (call after purchase)
  const invalidate = useCallback(() => {
    stopPolling();
    if (wallet.isConnected && wallet.publicKey) {
      startPolling(wallet.publicKey);
    }
  }, [wallet.isConnected, wallet.publicKey, startPolling, stopPolling]);

  useEffect(() => {
    if (!wallet.isConnected || !wallet.publicKey) {
      setTimeout(() => setTickets([]), 0);
      stopPolling();
      return;
    }
    setTimeout(() => startPolling(wallet.publicKey!), 0);
    return stopPolling;
  }, [wallet.isConnected, wallet.publicKey, startPolling, stopPolling]);

  return { tickets, loading, error, invalidate };
}

import React from 'react';
import { Event, formatEventDate } from '../../types';
import { OrganizerEventRow } from '../../components/organizer/OrganizerEventRow';

interface DashboardPageProps {
  readonly events: Event[];
  readonly onCreateEvent: () => void;
  readonly onScanTickets: () => void;
  readonly invalidateEvents: () => Promise<void>;
}

import { useEvents } from '../../hooks/useEvents';
import { useAppStore } from '../../store/useAppStore';
import { useWallet } from '../../hooks/useWallet';
import { releaseFunds, cancelEvent } from '../../lib/soroban';
import { upsertEventMetadata } from '../../lib/supabase'; // We'll just use a raw supabase query, wait, no, `upsertEventMetadata` handles events. But it's an update, let's import supabase.
import { supabase } from '../../lib/supabase';

export function DashboardPage({ events, onCreateEvent, onScanTickets, invalidateEvents }: DashboardPageProps) {
  const { wallet, setTxState } = useAppStore();
  const { connectOrganizer } = useWallet();

  const organizerEvents = wallet.publicKey
    ? events.filter(e => e.organizer === wallet.publicKey)
    : [];

  const activeEvents = organizerEvents.filter(e => e.status === 'Active');

  const totalEvents = organizerEvents.length;
  const totalTicketsSold = organizerEvents.reduce((s, event) => s + event.currentSupply, 0);
  const totalEscrow = activeEvents.reduce((s, event) => s + (event.currentSupply * (event.pricePerTicket / 10_000_000)), 0);

  const handleRelease = async (eventId: string) => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn) return;
    setTxState({ status: 'signing' });
    try {
      await releaseFunds(eventId, wallet.publicKey, wallet.signFn);
      
      // Update Supabase mirror
      await supabase.from('events').update({ status: 'Completed' }).eq('event_id', eventId);
      await invalidateEvents();

      setTxState({ status: 'success', hash: 'Funds released successfully!' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    } catch (e: any) {
      console.error('Release funds failed', e);
      setTxState({ status: 'error', errorMessage: e.message || 'Failed to release funds' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn) return;
    setTxState({ status: 'signing' });
    try {
      await cancelEvent(eventId, wallet.publicKey, wallet.signFn);
      
      // Update Supabase mirror
      await supabase.from('events').update({ status: 'Cancelled' }).eq('event_id', eventId);
      await invalidateEvents();

      setTxState({ status: 'success', hash: 'Event cancelled successfully.' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    } catch (e: any) {
      console.error('Cancel event failed', e);
      setTxState({ status: 'error', errorMessage: e.message || 'Failed to cancel event' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="bg-[#14121b] text-[#e6e0ee] min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 w-full overflow-x-hidden text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tighter text-center w-full max-w-4xl">Organizer Hub</h1>
        <p className="text-[#c9c4d8] mb-8 sm:mb-10 w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl text-center mx-auto leading-relaxed text-sm sm:text-base">
          Connect your Freighter wallet to manage events, scan tickets, and withdraw funds.
        </p>
        <button
          onClick={connectOrganizer}
          className="bg-[#7C5CFF] hover:bg-[#8d72ff] text-[#EAEFF4] font-semibold text-lg py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(124,92,255,0.3)] active:scale-[0.98]"
        >
          Connect Freighter
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#14121b] text-[#e6e0ee] min-h-screen">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50 bg-[#15181C] border-b border-[#272C33]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tighter text-[#EAEFF4]">Dashboard</span>
        </div>
        <nav className="hidden md:flex gap-8">
          <span className="text-[#7C5CFF] border-b-2 border-[#7C5CFF] pb-2 text-xs font-semibold tracking-wider">
            Dashboard
          </span>
          <button className="text-[#EAEFF4]/60 hover:text-[#EAEFF4] transition-colors text-xs font-semibold tracking-wider">
            Events
          </button>
          <button className="text-[#EAEFF4]/60 hover:text-[#EAEFF4] transition-colors text-xs font-semibold tracking-wider">
            Finances
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={onScanTickets}
            title="Scan Tickets"
            className="p-2 rounded-full hover:bg-[#272C33] transition-colors text-[#EAEFF4]/60 hover:text-[#EAEFF4]"
          >
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </button>
          <span className="material-symbols-outlined text-[#EAEFF4]/60 cursor-pointer">
            notifications
          </span>
          <span className="material-symbols-outlined text-[#EAEFF4]/60 cursor-pointer">
            account_circle
          </span>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 sm:pb-32">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-16">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#e6e0ee] tracking-tight">Organizer Hub</h1>
            <p className="text-base text-[#c9c4d8] mt-1">
              Manage your stellar event inventory and settlements.
            </p>
          </div>
          <button
            onClick={onCreateEvent}
            className="bg-[#7C5CFF] text-[#EAEFF4] px-6 py-3 rounded-lg text-xs font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(124,92,255,0.2)]"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Event
          </button>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Total Events */}
          <div className="bg-[#15181C]/70 backdrop-blur-md border border-[#272C33] p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">event</span>
            </div>
            <p className="text-[#c9c4d8] text-[10px] font-semibold uppercase tracking-widest mb-2">
              Total Events
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#e6e0ee]">{totalEvents}</span>
            </div>
          </div>

          {/* Tickets Sold */}
          <div className="bg-[#15181C]/70 backdrop-blur-md border border-[#272C33] p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">confirmation_number</span>
            </div>
            <p className="text-[#c9c4d8] text-[10px] font-semibold uppercase tracking-widest mb-2">
              Tickets Sold
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#e6e0ee]">
                {totalTicketsSold.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Escrow */}
          <div className="bg-[#15181C]/70 backdrop-blur-md border border-[#272C33] p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
            </div>
            <p className="text-[#c9c4d8] text-[10px] font-semibold uppercase tracking-widest mb-2">
              In Escrow (XLM)
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#7C5CFF]">
                {totalEscrow.toLocaleString()}.00
              </span>
              <span className="text-[#c9c4d8] font-mono text-sm">XLM</span>
            </div>
          </div>
        </section>

        {/* Active Events */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[#e6e0ee]">Active Events</h2>
            <div className="flex gap-2">
              <span className="text-xs font-semibold text-[#c9c4d8]">Sorted by:</span>
              <span className="text-xs font-semibold text-[#7C5CFF] cursor-pointer border-b border-[#7C5CFF]/30">
                Upcoming
              </span>
            </div>
          </div>

          {organizerEvents.map((event) => {
            const ticketsSold = event.currentSupply;
            const escrowXlm = event.status === 'Active' ? ticketsSold * (event.pricePerTicket / 10_000_000) : 0;
            const canRelease = event.status === 'Active' && event.dateUnix * 1000 < Date.now();
            const lockedUntilLabel = canRelease || event.status === 'Completed' || event.status === 'Cancelled' ? undefined : `Locked Until ${new Date(event.dateUnix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

            return (
              <OrganizerEventRow
                key={event.eventId}
                event={event}
                ticketsSold={ticketsSold}
                escrowXlm={escrowXlm}
                canRelease={canRelease}
                lockedUntilLabel={lockedUntilLabel}
                onRelease={handleRelease}
                onCancel={handleCancel}
              />
            );
          })}
        </section>

        {/* Transaction History */}
        <section className="mt-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#7C5CFF]">history</span>
            <h2 className="text-2xl font-semibold text-[#e6e0ee]">Stellar Transaction History</h2>
          </div>

          <div className="bg-[#15181C]/70 backdrop-blur-md border border-[#272C33] rounded-xl p-8 text-center text-slate-400">
            Transaction history coming soon
          </div>
        </section>
      </main>
    </div>
  );
}

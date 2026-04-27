import React from 'react';
import { Event, formatEventDate } from '../../types';
import { OrganizerEventRow } from '../../components/organizer/OrganizerEventRow';

interface DashboardPageProps {
  readonly onCreateEvent: () => void;
  readonly onScanTickets: () => void;
}

import { useEvents } from '../../hooks/useEvents';
import { useAppStore } from '../../store/useAppStore';

export function DashboardPage({ onCreateEvent, onScanTickets }: DashboardPageProps) {
  const { events } = useEvents();
  const { wallet } = useAppStore();

  const organizerEvents = wallet.publicKey 
    ? events.filter(e => e.organizer === wallet.publicKey) 
    : [];
  
  const totalEvents = organizerEvents.length;
  const totalTicketsSold = organizerEvents.reduce((s, event) => s + event.currentSupply, 0);
  const totalEscrow = organizerEvents.reduce((s, event) => s + (event.currentSupply * (event.pricePerTicket / 10_000_000)), 0);

  const handleRelease = async (eventId: string) => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn) return;
    try {
      // TODO: wire to Soroban release_funds call in soroban.ts
      console.log(`Release funds for ${eventId}`);
    } catch (e) {
      console.error('Release funds failed', e);
    }
  };

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

      <main className="max-w-[1280px] mx-auto px-6 py-8 pb-32">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-16">
          <div>
            <h1 className="text-5xl font-bold text-[#e6e0ee] tracking-tight">Organizer Hub</h1>
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
              <span className="text-[#7C5CFF] text-sm">+2 this month</span>
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
              <span className="text-[#7C5CFF] text-sm">84% capacity</span>
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
            const escrowXlm = ticketsSold * (event.pricePerTicket / 10_000_000);
            const canRelease = event.status === 'Completed';
            const lockedUntilLabel = canRelease ? undefined : `Locked Until ${new Date(event.dateUnix * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            
            return (
              <OrganizerEventRow
                key={event.eventId}
                event={event}
                ticketsSold={ticketsSold}
                escrowXlm={escrowXlm}
                canRelease={canRelease}
                lockedUntilLabel={lockedUntilLabel}
                onRelease={handleRelease}
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

import React from 'react';
import { Event, formatEventDate } from '../../types';
import { OrganizerEventRow } from '../../components/organizer/OrganizerEventRow';

interface DashboardPageProps {
  readonly onCreateEvent: () => void;
  readonly onScanTickets: () => void;
}

// ── Mock data from Stitch design ──────────────────────────────────────────────
const MOCK_EVENTS: Event[] = [
  {
    eventId: 'evt_org_1',
    organizer: 'G...ORG',
    name: 'Nebula Nights: Summer Gala',
    dateUnix: 1692057600,
    capacity: 500,
    pricePerTicket: 1500000000,
    currentSupply: 500,
    status: 'Completed',
    imageUrl: 'https://images.unsplash.com/photo-1540039155732-d67414006c3a?w=400&q=80',
    venue: 'The Void Arena',
    city: 'New York',
  },
  {
    eventId: 'evt_org_2',
    organizer: 'G...ORG',
    name: 'Stellar DevCon 2024',
    dateUnix: 1729641600,
    capacity: 1500,
    pricePerTicket: 500000000,
    currentSupply: 748,
    status: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&q=80',
    venue: 'Silicon Plaza',
    city: 'San Francisco',
  },
  {
    eventId: 'evt_org_3',
    organizer: 'G...ORG',
    name: 'NFT Art Expo',
    dateUnix: 1720137600,
    capacity: 300,
    pricePerTicket: 800000000,
    currentSupply: 120,
    status: 'Active',
    imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=80',
    venue: 'Metropolis Gallery',
    city: 'Los Angeles',
  },
];

interface EventMeta {
  ticketsSold: number;
  escrowXlm: number;
  canRelease: boolean;
  lockedUntilLabel?: string;
}

const EVENT_META: Record<string, EventMeta> = {
  evt_org_1: { ticketsSold: 500, escrowXlm: 15000, canRelease: true },
  evt_org_2: { ticketsSold: 748, escrowXlm: 30200, canRelease: false, lockedUntilLabel: 'Locked Until Oct 23' },
  evt_org_3: { ticketsSold: 120, escrowXlm: 4800, canRelease: false, lockedUntilLabel: 'Locked Until July 6' },
};

const TX_HISTORY = [
  { hash: 'GBD2...7K3P', label: 'Escrow Deposit - Nebula Nights', amount: '+250.00 XLM', positive: true },
  { hash: 'GDS9...2X8A', label: 'Escrow Deposit - DevCon 2024', amount: '+150.00 XLM', positive: true },
  { hash: 'GAA1...9L0Z', label: 'Service Fee Payment', amount: '-15.00 XLM', positive: false },
];

export function DashboardPage({ onCreateEvent, onScanTickets }: DashboardPageProps) {
  const totalEvents = MOCK_EVENTS.length;
  const totalTicketsSold = Object.values(EVENT_META).reduce((s, m) => s + m.ticketsSold, 0);
  const totalEscrow = Object.values(EVENT_META).reduce((s, m) => s + m.escrowXlm, 0);

  const handleRelease = (eventId: string) => {
    // TODO: wire to Soroban release_funds call
    console.log(`Release funds for ${eventId}`);
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

          {MOCK_EVENTS.map((event) => {
            const meta = EVENT_META[event.eventId];
            return (
              <OrganizerEventRow
                key={event.eventId}
                event={event}
                ticketsSold={meta.ticketsSold}
                escrowXlm={meta.escrowXlm}
                canRelease={meta.canRelease}
                lockedUntilLabel={meta.lockedUntilLabel}
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

          <div className="bg-[#15181C]/70 backdrop-blur-md border border-[#272C33] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#15181C] border-b border-[#272C33]">
                  {['Transaction Hash', 'Action', 'Amount'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-[10px] font-semibold text-[#c9c4d8] uppercase tracking-widest ${i === 2 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272C33]">
                {TX_HISTORY.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-[#272C33]/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-[#7C5CFF]">{tx.hash}</td>
                    <td className="px-6 py-4 text-sm text-[#e6e0ee]">{tx.label}</td>
                    <td
                      className={`px-6 py-4 font-mono text-sm text-right ${tx.positive ? 'text-[#e6e0ee]' : 'text-[#ffb4ab]'}`}
                    >
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-[#15181C]/90 backdrop-blur-md border-t border-[#272C33] shadow-[0_-4px_20px_rgba(124,92,255,0.1)]">
        <button className="flex flex-col items-center justify-center text-[#7C5CFF] bg-[#7C5CFF]/10 rounded-xl px-3 py-1">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest">Home</span>
        </button>
        <button
          onClick={onCreateEvent}
          className="flex flex-col items-center justify-center text-[#EAEFF4]/50 hover:text-[#7C5CFF] transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest">Create</span>
        </button>
        <button
          onClick={onScanTickets}
          className="flex flex-col items-center justify-center text-[#EAEFF4]/50 hover:text-[#7C5CFF] transition-all"
        >
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest">Scan</span>
        </button>
        <button className="flex flex-col items-center justify-center text-[#EAEFF4]/50 hover:text-[#7C5CFF] transition-all">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest">Settings</span>
        </button>
      </nav>
    </div>
  );
}

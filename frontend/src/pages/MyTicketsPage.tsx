import React, { useState } from 'react';
import { Ticket, Event } from '../types';
import { TicketCard } from '../components/tickets/TicketCard';

// Mocks
const MOCK_EVENTS: Record<string, Event> = {
  'evt_1': {
    eventId: 'evt_1',
    organizer: 'org_1',
    name: 'Neon Genesis Music Festival 2024',
    dateUnix: 1729800000,
    capacity: 1000,
    pricePerTicket: 1250000000,
    currentSupply: 500,
    status: 'Active',
    venue: 'The Cyber Vault',
    city: 'Shibuya',
    imageUrl: 'https://images.unsplash.com/photo-1540039155732-d67414006c3a?w=800&q=80'
  },
  'evt_2': {
    eventId: 'evt_2',
    organizer: 'org_2',
    name: 'BLOCKCHAIN SUMMIT',
    dateUnix: 1736067600,
    capacity: 5000,
    pricePerTicket: 0,
    currentSupply: 5000,
    status: 'Active',
    venue: 'Web3 Convention Center',
    city: 'Miami',
    imageUrl: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&q=80'
  }
};

const MOCK_TICKETS: Ticket[] = [
  {
    ticketId: 'xlr_8293_stellar_9021_f92_vlt',
    eventId: 'evt_1',
    owner: 'G...3k9P',
    isUsed: false,
    purchaseTimestamp: 1720000000
  },
  {
    ticketId: 'st_9942_vault_1102_a33_chain',
    eventId: 'evt_2',
    owner: 'G...3k9P',
    isUsed: false,
    purchaseTimestamp: 1720000000
  }
];

interface MyTicketsPageProps {
  onShowQR: (ticketId: string) => void;
  onBrowseMore: () => void;
}

export function MyTicketsPage({ onShowQR, onBrowseMore }: MyTicketsPageProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  return (
    <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Tickets</h1>
        <p className="text-[#c9c4d8] text-sm md:text-base">Manage your exclusive event entries and digital assets.</p>
      </section>

      {/* Tabs */}
      <nav className="flex gap-6 border-b border-[#272C33] mb-10">
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`pb-4 text-sm font-semibold transition-colors ${activeTab === 'ACTIVE' ? 'border-b-2 border-[#7C5CFF] text-[#7C5CFF]' : 'border-b-2 border-transparent text-[#c9c4d8] hover:text-white'}`}
        >
          ACTIVE
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-4 text-sm font-semibold transition-colors ${activeTab === 'HISTORY' ? 'border-b-2 border-[#7C5CFF] text-[#7C5CFF]' : 'border-b-2 border-transparent text-[#c9c4d8] hover:text-white'}`}
        >
          HISTORY
        </button>
      </nav>

      {/* Ticket Grid */}
      {activeTab === 'ACTIVE' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TICKETS.map(ticket => (
            <TicketCard 
              key={ticket.ticketId} 
              ticket={ticket} 
              event={MOCK_EVENTS[ticket.eventId]} 
              onShowQR={onShowQR} 
            />
          ))}
          
          {/* Empty State / Upcoming Placeholder */}
          <button 
            onClick={onBrowseMore}
            className="bg-[#15181C] border border-dashed border-[#272C33] rounded-xl flex flex-col items-center justify-center p-16 min-h-[300px] text-center opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[48px] text-[#c9c4d8] mb-4">add_circle</span>
            <p className="text-xs font-semibold tracking-wider uppercase text-[#e6e0ee]">BROWSE MORE EVENTS</p>
          </button>
        </div>
      ) : (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent History</h2>
          </div>
          <div className="bg-[#15181C]/70 backdrop-blur-md border border-[#272C33] rounded-xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[#c9c4d8] border-b border-[#272C33]">
                    <th className="pb-4 text-xs font-semibold tracking-wider uppercase">EVENT</th>
                    <th className="pb-4 text-xs font-semibold tracking-wider uppercase">DATE</th>
                    <th className="pb-4 text-xs font-semibold tracking-wider uppercase">STATUS</th>
                    <th className="pb-4 text-xs font-semibold tracking-wider uppercase text-right">TRANSACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272C33]/30">
                  <tr className="group hover:bg-white/5 transition-colors">
                    <td className="py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#272C33]"></div>
                        <span className="text-base">Stellar Gala 2024</span>
                      </div>
                    </td>
                    <td className="py-6 text-[#c9c4d8] text-sm">Oct 20, 2024</td>
                    <td className="py-6">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#272C33] text-slate-400">Used</span>
                    </td>
                    <td className="py-6 text-right">
                      <span className="font-mono text-[#7C5CFF]/70 text-sm">0x882...f9a</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

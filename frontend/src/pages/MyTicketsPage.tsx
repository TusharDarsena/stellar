import React, { useState } from 'react';
import { Ticket, Event, formatEventDate } from '../types';
import { TicketCard } from '../components/tickets/TicketCard';

import { useTickets } from '../hooks/useTickets';
import { useEvents } from '../hooks/useEvents';
interface MyTicketsPageProps {
  onShowQR: (ticketId: string) => void;
  onBrowseMore: () => void;
}

export function MyTicketsPage({ onShowQR, onBrowseMore }: MyTicketsPageProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const { tickets, loading: ticketsLoading, error } = useTickets();
  const { events, loading: eventsLoading } = useEvents();

  const loading = ticketsLoading || eventsLoading;

  const activeTickets = tickets.filter(t => t.status === 'Active');
  const historyTickets = tickets.filter(t => t.status === 'Used' || t.status === 'Refunded');

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
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#947dff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="col-span-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
              {error}
            </div>
          ) : (
            activeTickets.map(ticket => {
              const event = events.find(e => e.eventId === ticket.eventId);
              if (!event) return null;
              return (
                <TicketCard 
                  key={ticket.ticketId} 
                  ticket={ticket} 
                  event={event}
                  onShowQR={onShowQR} 
                />
              );
            })
          )}
          
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
                  {historyTickets.map(ticket => {
                    const event = events.find(e => e.eventId === ticket.eventId);
                    if (!event) return null;
                    return (
                      <tr key={ticket.ticketId} className="group hover:bg-white/5 transition-colors">
                        <td className="py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#272C33] overflow-hidden">
                              <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-base">{event.name}</span>
                          </div>
                        </td>
                        <td className="py-6 text-[#c9c4d8] text-sm">{formatEventDate(event.dateUnix)}</td>
                        <td className="py-6">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#272C33] text-slate-400">{ticket.status}</span>
                        </td>
                        <td className="py-6 text-right">
                          <span className="font-mono text-[#7C5CFF]/70 text-sm">
                            {ticket.ticketId.substring(0, 12)}...
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {historyTickets.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No recent history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

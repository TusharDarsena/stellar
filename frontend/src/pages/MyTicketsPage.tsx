import React, { useState, useEffect } from 'react';
import { Ticket, Event, formatEventDate, xlmToStroops } from '../types';
import { TicketCard } from '../components/tickets/TicketCard';

import { useTickets } from '../hooks/useTickets';
import { useEvents } from '../hooks/useEvents';
import { generateID } from '../lib/utils';
import { refundTicket, listTicket, cancelListing } from '../lib/soroban';
import { supabase, fetchOpenListingByTicket } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

interface MyTicketsPageProps {
  onShowQR: (ticketId: string) => void;
  onBrowseMore: () => void;
  invalidateEvents: () => Promise<void>;
  invalidateTickets: () => void;
}

export function MyTicketsPage({ onShowQR, onBrowseMore, invalidateEvents, invalidateTickets }: MyTicketsPageProps) {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [openListings, setOpenListings] = useState<Record<string, any>>({});
  const [showListingModal, setShowListingModal] = useState<string | null>(null);
  const [askPrice, setAskPrice] = useState('');
  
  const { tickets, loading: ticketsLoading, error } = useTickets();
  const { events, loading: eventsLoading } = useEvents();
  const { wallet, setTxState } = useAppStore();

  const handleRefund = async (ticketId: string) => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn) return;
    setTxState({ status: 'building' });
    try {
      await refundTicket(ticketId, wallet.publicKey, wallet.signFn);
      
      // Update Supabase
      await supabase.from('tickets').update({ status: 'Refunded' }).eq('ticket_id', ticketId);
      
      invalidateTickets();
      await invalidateEvents();

      setTxState({ status: 'success', hash: 'Refund processed successfully' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    } catch (e: any) {
      console.error('Refund failed:', e);
      setTxState({ status: 'error', errorMessage: e.message || 'Refund failed' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  const handleListForSale = async () => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn || !showListingModal) return;
    
    const price = parseFloat(askPrice);
    if (isNaN(price) || price <= 0) {
      alert("Invalid price.");
      return;
    }
    
    setTxState({ status: 'building' });
    
    try {
      const ticket = activeTickets.find(t => t.ticketId === showListingModal);
      if (!ticket) throw new Error("Ticket not found.");
      
      const listingId = generateID();
      const askPriceStroops = xlmToStroops(price);
      
      await listTicket(
        wallet.publicKey,
        listingId,
        ticket.ticketId,
        ticket.eventId,
        askPriceStroops,
        wallet.signFn
      );
      
      // Update Supabase
      await supabase.from('listings').insert({
        listing_id: listingId,
        seller_address: wallet.publicKey,
        ticket_id: ticket.ticketId,
        event_id: ticket.eventId,
        ask_price_stroops: askPriceStroops.toString(),
        status: 'Open'
      });
      
      setShowListingModal(null);
      setAskPrice('');
      
      // Refresh local state manually to avoid full reload delay
      setOpenListings(prev => ({ ...prev, [ticket.ticketId]: { listing_id: listingId } }));

      setTxState({ status: 'success', hash: 'Ticket listed for sale!' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    } catch (e: any) {
      console.error('List ticket failed:', e);
      setTxState({ status: 'error', errorMessage: e.message || 'Listing failed' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  const handleCancelListing = async (ticketId: string) => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn) return;
    
    const listing = openListings[ticketId];
    if (!listing) return;

    setTxState({ status: 'building' });
    try {
      await cancelListing(wallet.publicKey, listing.listing_id || listing.listingId, wallet.signFn);
      
      // Update Supabase
      await supabase.from('listings').update({ status: 'Cancelled' }).eq('listing_id', listing.listing_id || listing.listingId);
      
      setOpenListings(prev => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });

      setTxState({ status: 'success', hash: 'Listing cancelled' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    } catch (e: any) {
      console.error('Cancel listing failed:', e);
      setTxState({ status: 'error', errorMessage: e.message || 'Cancel failed' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  const loading = ticketsLoading || eventsLoading;

  const activeTickets = tickets.filter(t => t.status === 'Active');
  const historyTickets = tickets.filter(t => t.status === 'Used' || t.status === 'Refunded');

  useEffect(() => {
    if (activeTickets.length === 0) return;
    
    let isMounted = true;
    async function checkListings() {
      const results: Record<string, any> = {};
      await Promise.all(activeTickets.map(async (t) => {
        const listing = await fetchOpenListingByTicket(t.ticketId);
        if (listing) {
          results[t.ticketId] = listing;
        }
      }));
      if (isMounted) {
        setOpenListings(results);
      }
    }
    checkListings();
    return () => { isMounted = false; };
  }, [activeTickets.map(t => t.ticketId).join(',')]);

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
                    onRefund={event.status === 'Cancelled' ? handleRefund : undefined}
                    onListForSale={() => setShowListingModal(ticket.ticketId)}
                    onCancelListing={() => handleCancelListing(ticket.ticketId)}
                    hasOpenListing={!!openListings[ticket.ticketId]}
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

      {showListingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#15181C] border border-[#272C33] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold text-white mb-4">List Ticket for Sale</h3>
            <p className="text-sm text-slate-400 mb-6">
              Enter your ask price in XLM. A royalty fee may be automatically deducted by the event organizer upon sale.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#c9c4d8] uppercase tracking-widest mb-2">Price (XLM)</label>
              <input 
                type="number" 
                value={askPrice}
                onChange={e => setAskPrice(e.target.value)}
                placeholder="100.00"
                min="0.1"
                step="0.1"
                className="w-full bg-[#0f0d16] border border-[#272C33] rounded-lg px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-[#7C5CFF]"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowListingModal(null)}
                className="flex-1 py-3 bg-[#272C33] text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleListForSale}
                className="flex-1 py-3 bg-[#7C5CFF] text-white font-semibold rounded-lg hover:brightness-110 transition-colors"
              >
                Confirm Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

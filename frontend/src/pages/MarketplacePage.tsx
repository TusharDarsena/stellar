import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { buyListing, getTicket } from '../lib/soroban';
import { supabase } from '../lib/supabase';
import { useWallet } from '../hooks/useWallet';
import { formatEventDate, stroopsToXlm } from '../types';
import type { ListingWithEvent } from '../hooks/useListings';

interface MarketplacePageProps {
  listings: ListingWithEvent[];
  loading: boolean;
  error: string | null;
  invalidateListings: () => Promise<void>;
  invalidateTickets: () => void;
}

export function MarketplacePage({ listings, loading, error, invalidateListings, invalidateTickets }: MarketplacePageProps) {
  const { wallet, setTxState } = useAppStore();
  const { connectAttendee } = useWallet();

  const handleBuy = async (listing: ListingWithEvent) => {
    if (!wallet.isConnected || !wallet.publicKey || !wallet.signFn) {
      alert("Please connect your wallet first.");
      return;
    }

    setTxState({ status: 'building' });

    try {
      // Confirm on-chain ownership before submitting
      const ticket = await getTicket(listing.ticketId);
      if (!ticket || ticket.owner !== listing.seller || ticket.status !== 'Active') {
        throw new Error('Ticket ownership changed or ticket is no longer active.');
      }

      await buyListing(listing.seller, listing.listingId, wallet.publicKey, wallet.signFn);

      // Update Supabase
      await supabase.from('listings').update({ status: 'Sold' }).eq('listing_id', listing.listingId);
      await supabase.from('tickets').update({ owner_address: wallet.publicKey }).eq('ticket_id', listing.ticketId);

      await invalidateListings();
      invalidateTickets();

      setTxState({ status: 'success', hash: 'Ticket purchased successfully!' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    } catch (e: any) {
      console.error('Buy listing failed:', e);
      setTxState({ status: 'error', errorMessage: e.message || 'Purchase failed.' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  return (
    <main className="pt-24 pb-20 max-w-7xl mx-auto px-4 md:px-8 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tighter">Marketplace</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Buy and sell tickets safely with enforced royalties.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-[#947dff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          No tickets are currently listed for sale.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map(listing => (
            <div key={listing.listingId} className="bg-[#15181C] border border-[#272C33] rounded-xl overflow-hidden hover:border-[#7C5CFF]/50 transition-all duration-300 flex flex-col">
              <div className="h-40 overflow-hidden relative">
                <img 
                  src={listing.eventImageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'} 
                  alt={listing.eventName} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15181C] to-transparent"></div>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between -mt-10 relative z-10">
                <div>
                  <h3 className="text-xl font-semibold leading-tight text-white mb-2">{listing.eventName}</h3>
                  <div className="flex items-center gap-2 text-[#c9c4d8] mb-4">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    <p className="text-sm">{formatEventDate(listing.eventDateUnix)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Seller</span>
                    <span className="font-mono text-xs text-[#7C5CFF]">
                      {listing.seller.substring(0, 4)}...{listing.seller.substring(listing.seller.length - 4)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-6 bg-[#0E1113]/50 p-3 rounded-lg border border-[#272C33]/50">
                    <span className="text-xs font-semibold text-[#c9c4d8]">Price</span>
                    <span className="text-lg font-bold text-white">{parseFloat(stroopsToXlm(Number(listing.askPriceStroops))).toFixed(2)} XLM</span>
                  </div>
                </div>
                
                {wallet.isConnected && wallet.publicKey === listing.seller ? (
                  <button disabled className="w-full py-3 bg-[#272C33] text-[#EAEFF4]/50 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                    YOUR LISTING
                  </button>
                ) : (
                  <button 
                    onClick={() => handleBuy(listing)}
                    className="w-full py-3 bg-[#7C5CFF] text-[#EAEFF4] font-semibold text-sm rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    BUY NOW
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

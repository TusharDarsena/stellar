import React, { useState } from 'react';
import { Event, stroopsToXlm, TxState } from '../types';
import { Button } from '../components/ui/Button';

interface PurchasePageProps {
  event: Event;
  onBack: () => void;
  onPurchaseComplete: (eventId: string, txHash: string) => void;
}

import { useAppStore } from '../store/useAppStore';
import { purchaseTicket } from '../lib/soroban';

export function PurchasePage({ event, onBack, onPurchaseComplete }: PurchasePageProps) {
  const [quantity, setQuantity] = useState(1);
  const { wallet, setTxState } = useAppStore();
  const priceXlm = parseFloat(stroopsToXlm(event.pricePerTicket));
  const totalPrice = priceXlm * quantity;

  const handleIncrement = () => {
    if (quantity < 10) setQuantity(q => q + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const handlePurchase = async () => {
    if (!wallet.isConnected || !wallet.publicKey) return;
    
    setTxState({ status: 'building' });
    try {
      const txHash = await purchaseTicket(event.eventId, wallet.publicKey);
      setTxState({ status: 'success', hash: txHash });
      
      // Wait for success animation before navigating
      setTimeout(() => {
        setTxState({ status: 'idle' });
        onPurchaseComplete(event.eventId, txHash);
      }, 1500);
    } catch (err: any) {
      setTxState({ status: 'error', errorMessage: err.message || 'Purchase failed' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);
    }
  };

  return (
    <div className="bg-[#0E1113] min-h-screen text-[#EAEFF4]">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#15181C]/90 backdrop-blur-md border-b border-[#272C33] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-[#272C33] rounded-full transition-colors">
              <span className="material-symbols-outlined text-white">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold tracking-tighter">Buy Tickets</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-slate-400">notifications</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#272C33] rounded-full border border-[#7C5CFF]/30">
              <span className="material-symbols-outlined text-[#7C5CFF] text-sm">account_balance_wallet</span>
              <span className="font-mono text-xs text-slate-50">
                {wallet.isConnected ? `${wallet.publicKey?.substring(0, 4)}...${wallet.publicKey?.substring(wallet.publicKey.length - 4)}` : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7C5CFF] text-white flex items-center justify-center font-bold">1</div>
            <span className="text-xs font-semibold text-[#7C5CFF]">Quantity</span>
          </div>
          <div className="h-[1px] flex-1 bg-[#272C33] mx-4 -mt-6"></div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-8 h-8 rounded-full bg-[#272C33] text-white flex items-center justify-center font-bold">2</div>
            <span className="text-xs font-semibold">Confirm</span>
          </div>
        </div>

        {/* Event Summary Card */}
        <div className="bg-[#15181C] border border-[#272C33] rounded-xl overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-48 h-48 md:h-auto overflow-hidden">
              <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#7C5CFF]/10 text-[#7C5CFF] text-[10px] font-bold rounded uppercase tracking-wider">On Sale</span>
                <span className="text-xs font-semibold text-[#938ea1]">NFT Pass • Stellar Network</span>
              </div>
              <h2 className="text-2xl font-bold">{event.name}</h2>
              <div className="flex items-center gap-4 text-sm text-[#938ea1]">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Oct 24, 2024
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Crypto Arena
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Selection Section */}
        <div className="bg-[#15181C] border border-[#272C33] rounded-xl p-8 mb-8">
          <div className="text-center mb-10">
            <h3 className="text-xs font-semibold text-[#938ea1] uppercase tracking-[0.2em] mb-2">Select Quantity</h3>
            <p className="text-sm text-[#938ea1]">General Admission - Tier 1</p>
          </div>
          <div className="flex items-center justify-center gap-12 mb-10">
            <button 
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="w-16 h-16 rounded-full border border-[#272C33] bg-[#0E1113] hover:border-[#7C5CFF] text-white transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:hover:border-[#272C33]"
            >
              <span className="material-symbols-outlined text-3xl">remove</span>
            </button>
            <div className="text-center w-24">
              <span className="text-[80px] font-bold leading-none">{quantity.toString().padStart(2, '0')}</span>
            </div>
            <button 
              onClick={handleIncrement}
              disabled={quantity >= 10}
              className="w-16 h-16 rounded-full border border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
          
          <div className="border-t border-[#272C33] pt-6 flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-[#938ea1] block mb-1">Price per ticket</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{priceXlm.toFixed(2)} XLM</span>
                <span className="text-sm text-[#938ea1]">($15.20)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-[#938ea1] block mb-1">Total Amount</span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl font-bold text-[#7C5CFF]">{totalPrice.toFixed(2)} XLM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Source Note */}
        <div className="bg-[#15181C]/80 backdrop-blur-md border border-[#272C33] rounded-lg p-4 flex items-start gap-4 mb-8">
          <span className="material-symbols-outlined text-[#7C5CFF]">info</span>
          <div className="flex-1">
            <p className="text-sm">Payment will be processed from your connected <strong>Stellar Wallet</strong>.</p>
            <p className="text-xs text-[#938ea1] mt-1">Please ensure you have enough XLM to cover transaction fees.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <Button 
            onClick={handlePurchase} 
            size="lg" 
            className="w-full py-4 text-lg"
            disabled={!wallet.isConnected}
          >
            {wallet.isConnected ? 'Continue to Payment' : 'Connect Wallet to continue'}
          </Button>
          <Button variant="secondary" onClick={onBack} size="lg" className="w-full py-4 text-lg">
            Cancel
          </Button>
        </div>
      </main>
    </div>
  );
}

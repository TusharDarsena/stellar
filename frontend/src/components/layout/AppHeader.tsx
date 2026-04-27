import React from 'react';
import { AppView, WalletState } from '../../types';

interface AppHeaderProps {
  currentView: AppView;
  wallet: WalletState;
  onNavigate: (view: AppView) => void;
  onConnectWallet: () => void;
}

export function AppHeader({ currentView, wallet, onNavigate, onConnectWallet }: AppHeaderProps) {
  // Only show navigation links if not on landing page
  if (currentView === 'landing') return null;

  return (
    <header className="fixed top-0 w-full z-50 border-b border-[#272C33] bg-[#15181C]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-slate-50 tracking-tighter">StellarTickets</span>
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => onNavigate('browse')}
              className={`font-semibold text-sm h-16 flex items-center px-4 transition-colors ${currentView === 'browse' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF]' : 'text-slate-400 hover:bg-[#272C33] hover:text-white'}`}
            >
              Browse
            </button>
            <button 
              onClick={() => onNavigate('my-tickets')}
              className={`font-semibold text-sm h-16 flex items-center px-4 transition-colors ${currentView === 'my-tickets' ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF]' : 'text-slate-400 hover:bg-[#272C33] hover:text-white'}`}
            >
              My Tickets
            </button>
            <button 
              onClick={() => onNavigate('organizer-dashboard')}
              className={`font-semibold text-sm h-16 flex items-center px-4 transition-colors ${currentView.startsWith('organizer') ? 'text-[#7C5CFF] border-b-2 border-[#7C5CFF]' : 'text-slate-400 hover:bg-[#272C33] hover:text-white'}`}
            >
              Organizer
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-[#15181C] border border-[#272C33] rounded-lg px-3 py-1.5 focus-within:border-[#7C5CFF] transition-all">
            <span className="material-symbols-outlined text-[#938ea1] text-sm">search</span>
            <input 
              className="bg-transparent border-none outline-none focus:ring-0 text-sm text-[#e6e0ee] placeholder:text-[#938ea1] w-48 ml-2" 
              placeholder="Search events..." 
              type="text" 
            />
          </div>
          <button className="p-2 text-slate-400 hover:bg-[#272C33] rounded-full transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          {wallet.isConnected ? (
            <button className="hidden md:flex items-center gap-2 bg-[#15181C] border border-[#272C33] text-[#EAEFF4] px-4 py-2 rounded-lg font-semibold hover:bg-[#272C33] active:scale-95 duration-150">
              <span className="material-symbols-outlined text-sm text-[#7C5CFF]">wallet</span>
              {wallet.xlmBalance} XLM
            </button>
          ) : (
            <button 
              onClick={onConnectWallet}
              className="hidden md:flex items-center gap-2 bg-[#7C5CFF] text-[#EAEFF4] px-4 py-2 rounded-lg font-semibold hover:brightness-110 active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

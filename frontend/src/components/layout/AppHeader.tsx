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
    <header className="fixed top-0 w-full z-50 border-b border-outline-dim bg-surface-container/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-slate-50 tracking-tighter">StellarTickets</span>
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => onNavigate('browse')}
              className={`font-semibold text-sm h-16 flex items-center px-4 transition-colors ${currentView === 'browse' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-outline-dim hover:text-on-surface'}`}
            >
              Browse
            </button>
            <button 
              onClick={() => onNavigate('my-tickets')}
              className={`font-semibold text-sm h-16 flex items-center px-4 transition-colors ${currentView === 'my-tickets' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-outline-dim hover:text-on-surface'}`}
            >
              My Tickets
            </button>
            <button 
              onClick={() => onNavigate('organizer-dashboard')}
              className={`font-semibold text-sm h-16 flex items-center px-4 transition-colors ${currentView.startsWith('organizer') ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-outline-dim hover:text-on-surface'}`}
            >
              Organizer
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-surface-container border border-outline-dim rounded-lg px-3 py-1.5 focus-within:border-primary transition-all">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input 
              className="bg-transparent border-none outline-none focus:ring-0 text-sm text-on-surface placeholder:text-outline w-48 ml-2" 
              placeholder="Search events..." 
              type="text" 
            />
          </div>
          <button className="p-2 text-on-surface-variant hover:bg-outline-dim rounded-full transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          {wallet.isConnected ? (
            <button className="hidden md:flex items-center gap-2 bg-surface-container border border-outline-dim text-on-primary px-4 py-2 rounded-lg font-semibold hover:bg-outline-dim active:scale-95 duration-150">
              <span className="material-symbols-outlined text-sm text-primary">wallet</span>
              {wallet.xlmBalance} XLM
            </button>
          ) : (
            <button 
              onClick={onConnectWallet}
              className="hidden md:flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-semibold hover:brightness-110 active:scale-95 duration-150"
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

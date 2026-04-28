import React from 'react';
import { AppView } from '../types';

export interface LandingPageProps {
  onSelectRole: (role: AppView) => void;
}

export function LandingPage({ onSelectRole }: LandingPageProps) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative bg-background text-on-surface overflow-x-hidden">
      {/* Abstract Background Element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary opacity-5 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary opacity-[0.03] blur-[100px]"></div>
      </div>

      {/* Header Section */}
      <div className="z-10 flex flex-col items-center text-center mb-8 sm:mb-12 w-full px-2">
        <div className="p-4 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(124,92,255,0.1)]">
          <span className="material-symbols-outlined text-primary text-4xl">confirmation_number</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-6 tracking-tighter w-full break-words">StellarTickets</h1>
        <p className="text-lg text-on-surface-variant mt-2 max-w-md">NFT event tickets on the Stellar blockchain</p>
      </div>

      {/* Role Selection Grid */}
      <div className="z-10 w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl flex flex-col md:flex-row gap-4">
        {/* Attendee Card */}
        <button 
          onClick={() => onSelectRole('browse')}
          className="group flex-1 w-full p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center md:flex-row md:text-left gap-4 sm:gap-5 transition-all duration-300 hover:border-primary/50 bg-surface-container/80 backdrop-blur-md border border-outline-dim hover:shadow-[0_0_20px_rgba(124,92,255,0.15)]"
        >
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined text-3xl">group</span>
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-white">I'm an Attendee</h2>
            <p className="text-sm text-on-surface-variant">Browse events, buy tickets with XLM</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hidden md:block">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </button>

        {/* Organizer Card */}
        <button 
          onClick={() => onSelectRole('organizer-dashboard')}
          className="group flex-1 w-full p-5 sm:p-6 rounded-2xl flex flex-col items-center text-center md:flex-row md:text-left gap-4 sm:gap-5 transition-all duration-300 hover:border-primary/50 bg-surface-container/80 backdrop-blur-md border border-outline-dim hover:shadow-[0_0_20px_rgba(124,92,255,0.15)]"
        >
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined text-3xl">dashboard</span>
          </div>
          <div className="flex-grow">
            <h2 className="text-xl font-semibold text-white">I'm an Organizer</h2>
            <p className="text-sm text-on-surface-variant">Create events, manage sales, release funds</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hidden md:block">
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        </button>
      </div>

      {/* Visual Anchor: NFT Mockup Preview */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 opacity-10 pointer-events-none"
        style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 100%)', maskImage: 'linear-gradient(to top, transparent 0%, black 100%)' }}
      >
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 border border-outline-dim rounded-t-3xl bg-gradient-to-b from-surface-container to-transparent"></div>
          <div className="h-80 border border-outline-dim rounded-t-3xl bg-gradient-to-b from-surface-container to-transparent"></div>
          <div className="h-64 border border-outline-dim rounded-t-3xl bg-gradient-to-b from-surface-container to-transparent"></div>
        </div>
      </div>

      {/* Footer Credits */}
      <footer className="mt-16 z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-[1px] w-8 bg-outline-dim"></div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/60">Secure Protocol</span>
          <div className="h-[1px] w-8 bg-outline-dim"></div>
        </div>
        <p className="text-[10px] text-on-surface-variant/40 tracking-wider uppercase font-semibold">
          Powered by Stellar · Soroban smart contracts
        </p>
      </footer>
    </main>
  );
}

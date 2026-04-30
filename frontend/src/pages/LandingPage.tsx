import React from 'react';
import { AppView } from '../types';

export interface LandingPageProps {
  onSelectRole: (role: AppView) => void;
}

export function LandingPage({ onSelectRole }: LandingPageProps) {
  return (
    <div className="min-h-screen w-full bg-background relative overflow-x-hidden flex flex-col">
      {/* Abstract Background Element - Now Full Width */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-primary opacity-[0.07] blur-[120px]"></div>
        <div className="absolute top-[20%] right-[0%] w-[40%] h-[40%] rounded-full bg-primary opacity-[0.03] blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-primary opacity-[0.04] blur-[100px]"></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-start py-20 px-4 md:px-8 max-w-7xl mx-auto w-full relative text-on-surface z-10">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-10 sm:mb-16 w-full px-2">
          <div className="p-5 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-[0_0_30px_rgba(124,92,255,0.15)] animate-in fade-in zoom-in duration-700">
            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mt-8 tracking-tighter w-full break-words leading-none">
            StellarTickets
          </h1>
          <p className="text-xl text-on-surface-variant mt-4 max-w-md font-medium opacity-80">
            NFT event tickets on the Stellar blockchain
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-5xl flex flex-col md:flex-row gap-6 mb-20">
          {/* Attendee Card */}
          <button
            onClick={() => onSelectRole('browse')}
            className="group flex-1 w-full p-6 sm:p-8 rounded-[2rem] flex flex-col items-center text-center md:flex-row md:text-left gap-6 transition-all duration-500 hover:border-primary/50 bg-surface-container/40 backdrop-blur-xl border border-outline-dim hover:shadow-[0_20px_50px_rgba(124,92,255,0.1)] hover:-translate-y-1"
          >
            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
              <span className="material-symbols-outlined text-4xl">group</span>
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-white mb-1">I'm an Attendee</h2>
              <p className="text-base text-on-surface-variant leading-relaxed">Browse events and buy tickets with XLM</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 text-primary hidden md:block translate-x-[-10px] group-hover:translate-x-0">
              <span className="material-symbols-outlined text-3xl">arrow_forward_ios</span>
            </div>
          </button>

          {/* Organizer Card */}
          <button
            onClick={() => onSelectRole('organizer-dashboard')}
            className="group flex-1 w-full p-6 sm:p-8 rounded-[2rem] flex flex-col items-center text-center md:flex-row md:text-left gap-6 transition-all duration-500 hover:border-primary/50 bg-surface-container/40 backdrop-blur-xl border border-outline-dim hover:shadow-[0_20px_50px_rgba(124,92,255,0.1)] hover:-translate-y-1"
          >
            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
              <span className="material-symbols-outlined text-4xl">dashboard</span>
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-white mb-1">I'm an Organizer</h2>
              <p className="text-base text-on-surface-variant leading-relaxed">Create events and manage your settlements</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 text-primary hidden md:block translate-x-[-10px] group-hover:translate-x-0">
              <span className="material-symbols-outlined text-3xl">arrow_forward_ios</span>
            </div>
          </button>
        </div>

        {/* Visual Anchor: NFT Mockup Preview */}
        <div
          className="w-full max-w-4xl h-48 opacity-[0.07] pointer-events-none mt-auto"
          style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 100%)', maskImage: 'linear-gradient(to top, transparent 0%, black 100%)' }}
        >
          <div className="grid grid-cols-3 gap-8">
            <div className="h-64 border border-outline-dim rounded-t-[3rem] bg-gradient-to-b from-primary/20 to-transparent"></div>
            <div className="h-80 border border-outline-dim rounded-t-[3rem] bg-gradient-to-b from-primary/20 to-transparent"></div>
            <div className="h-64 border border-outline-dim rounded-t-[3rem] bg-gradient-to-b from-primary/20 to-transparent"></div>
          </div>
        </div>

        {/* Footer Credits */}
        <footer className="mt-12 flex flex-col items-center opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-outline-dim"></div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">Secure Protocol</span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-outline-dim"></div>
          </div>
          <p className="text-[10px] text-on-surface-variant tracking-widest uppercase font-bold text-center">
            Powered by Stellar · Soroban smart contracts
          </p>
        </footer>
      </main>
    </div>
  );
}


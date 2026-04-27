import React from 'react';
import { AppView } from '../../types';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  if (currentView === 'landing') return null;

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 border-t border-[#272C33] bg-[#15181C] shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 pb-safe w-full">
        <button 
          onClick={() => onNavigate('browse')}
          className={`flex flex-col items-center justify-center relative w-16 ${currentView === 'browse' ? "text-[#7C5CFF] after:content-[''] after:absolute after:-top-3 after:w-8 after:h-1 after:bg-[#7C5CFF] after:rounded-full" : "text-slate-500 active:bg-[#272C33]"}`}
        >
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] font-medium mt-1">Browse</span>
        </button>
        
        <button 
          onClick={() => onNavigate('my-tickets')}
          className={`flex flex-col items-center justify-center relative w-16 ${currentView === 'my-tickets' ? "text-[#7C5CFF] after:content-[''] after:absolute after:-top-3 after:w-8 after:h-1 after:bg-[#7C5CFF] after:rounded-full" : "text-slate-500 active:bg-[#272C33]"}`}
        >
          <span className="material-symbols-outlined">confirmation_number</span>
          <span className="text-[10px] font-medium mt-1">Tickets</span>
        </button>

        <button 
          onClick={() => onNavigate('scanner')}
          className={`flex flex-col items-center justify-center relative w-16 ${currentView === 'scanner' ? "text-[#7C5CFF] after:content-[''] after:absolute after:-top-3 after:w-8 after:h-1 after:bg-[#7C5CFF] after:rounded-full" : "text-slate-500 active:bg-[#272C33]"}`}
        >
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span className="text-[10px] font-medium mt-1">Scan</span>
        </button>
        
        <button 
          onClick={() => onNavigate('organizer-dashboard')}
          className={`flex flex-col items-center justify-center relative w-16 ${currentView.startsWith('organizer') ? "text-[#7C5CFF] after:content-[''] after:absolute after:-top-3 after:w-8 after:h-1 after:bg-[#7C5CFF] after:rounded-full" : "text-slate-500 active:bg-[#272C33]"}`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium mt-1">Manage</span>
        </button>
      </div>
    </nav>
  );
}

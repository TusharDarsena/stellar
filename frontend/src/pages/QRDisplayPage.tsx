import React, { useState, useEffect } from 'react';

interface QRDisplayPageProps {
  ticketId: string;
  onBack: () => void;
}

export function QRDisplayPage({ ticketId, onBack }: QRDisplayPageProps) {
  const [countdown, setCountdown] = useState(24);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-black min-h-screen text-[#e6e0ee] flex flex-col">
      {/* Top Navigation */}
      <header className="flex justify-between items-center px-6 h-16 w-full fixed top-0 z-50">
        <button 
          onClick={onBack}
          className="flex items-center justify-center p-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[#e6e0ee]">arrow_back</span>
        </button>
        <h1 className="text-xl font-semibold tracking-tight uppercase truncate max-w-[200px]">
          TICKET: {ticketId.substring(0, 8)}...
        </h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      {/* Main QR Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-16 pb-32">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* QR Code Container */}
          <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center p-8 mb-10 border border-[#7C5CFF]/20 shadow-[0_0_40px_rgba(124,92,255,0.15)]">
            <div className="relative w-full h-full">
              {/* Using a placeholder for QR code image */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketId}-${countdown}`} 
                alt="QR Code" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          {/* Refresh Countdown Pill */}
          <div className="bg-[#2b2933]/40 backdrop-blur-md px-6 py-2 rounded-full flex items-center gap-2 border border-[#484555]/30">
            <span className={`material-symbols-outlined text-[#7C5CFF] text-sm ${countdown === 30 ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span className="text-xs font-semibold text-[#c9c4d8]">Refreshes in {countdown}s</span>
          </div>
        </div>
      </main>

      {/* Bottom Identity Verification */}
      <footer className="w-full px-6 pb-16 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 opacity-60">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c9c4d8]">
            Signed with your wallet key
          </span>
        </div>
        <div className="font-mono text-[10px] text-[#7C5CFF]/50 tracking-tighter bg-[#0f0d16]/50 px-4 py-1 rounded">
          GDCX...W4KL
        </div>
      </footer>

      {/* Floating Ticket Info */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="h-[1px] w-12 bg-[#7C5CFF]/20 mb-4"></div>
          <div className="flex gap-10">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-[#938ea1] uppercase mb-1">Section</span>
              <span className="text-2xl font-semibold text-[#e6e0ee]">VIP</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-semibold text-[#938ea1] uppercase mb-1">Entry</span>
              <span className="text-2xl font-semibold text-[#e6e0ee]">West</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

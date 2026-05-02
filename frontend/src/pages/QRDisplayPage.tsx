import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '../store/useAppStore';
import { buildQRPayload } from '../lib/qr';

interface QRDisplayPageProps {
  ticketId: string;
}

export function QRDisplayPage({ ticketId }: QRDisplayPageProps) {
  const [countdown, setCountdown] = useState(30);
  const [tick, setTick] = useState(0); // increments every rotation to rebuild payload
  const { wallet } = useAppStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setTick((t) => t + 1); // trigger payload rebuild
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rebuild the signed payload on each 30s rotation.
  // Organizers use Freighter and cannot expose their private key — QR is attendee-only. (D-028)
  const qrPayload = useMemo(() => {
    if (!wallet.isConnected || !wallet.publicKey) return null;
    if (wallet.walletType !== 'burner' || !wallet.secretKey) return null;
    return buildQRPayload(wallet.publicKey, ticketId, wallet.secretKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, wallet.publicKey, wallet.walletType, wallet.secretKey, ticketId]);

  const isFreighter = wallet.walletType === 'freighter';

  return (
    <div className="bg-black min-h-screen text-[#e6e0ee] flex flex-col pt-16">

      {/* Main QR Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-16 pb-32">
        <div className="w-full max-w-sm flex flex-col items-center">

          {/* Freighter wallet guard — organizers scan, not show QR */}
          {isFreighter ? (
            <div className="w-full aspect-square bg-[#15181C] rounded-xl flex flex-col items-center justify-center p-8 mb-10 border border-[#7C5CFF]/20 gap-6">
              <span className="material-symbols-outlined text-6xl text-[#7C5CFF]/40">qr_code_off</span>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#c9c4d8] mb-1">Organizer Wallet Detected</p>
                <p className="text-xs text-[#938ea1]">QR codes are for attendees only. Use the scanner to validate tickets.</p>
              </div>
            </div>
          ) : (
            /* QR Code Container */
            <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center p-8 mb-10 border border-[#7C5CFF]/20 shadow-[0_0_40px_rgba(124,92,255,0.15)]">
              {qrPayload ? (
                <QRCodeSVG
                  value={qrPayload}
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl text-gray-400">wifi_off</span>
                  <p className="text-xs text-gray-500 text-center">Connect an attendee wallet to generate a QR code.</p>
                </div>
              )}
            </div>
          )}

          {/* Refresh Countdown Pill — only shown for attendee wallets */}
          {!isFreighter && (
            <div className="bg-[#2b2933]/40 backdrop-blur-md px-6 py-2 rounded-full flex items-center gap-2 border border-[#484555]/30">
              <span className={`material-symbols-outlined text-[#7C5CFF] text-sm ${countdown === 30 ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span className="text-xs font-semibold text-[#c9c4d8]">Refreshes in {countdown}s</span>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Identity Verification */}
      <footer className="w-full px-6 pb-16 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 opacity-60">
          <span className="material-symbols-outlined text-[14px]">verified_user</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c9c4d8]">
            {wallet.walletType === 'burner' ? 'Signed with local wallet key' : 'Stellar NFT Ticket'}
          </span>
        </div>
        <div className="font-mono text-[10px] text-[#7C5CFF]/50 tracking-tighter bg-[#0f0d16]/50 px-4 py-1 rounded">
          {wallet.isConnected && wallet.publicKey ? wallet.publicKey : 'Wallet Not Connected'}
        </div>
      </footer>

      {/* Floating Ticket Info */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="h-[1px] w-12 bg-[#7C5CFF]/20 mb-4" />
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

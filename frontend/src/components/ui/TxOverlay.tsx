import React from 'react';
import { TxState } from '../../types';

interface TxOverlayProps {
  txState: TxState;
}

export function TxOverlay({ txState }: TxOverlayProps) {
  if (txState.status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0E1113]/80 backdrop-blur-sm">
      <div className="bg-[#15181C] border border-[#272C33] rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center shadow-2xl">
        
        {txState.status === 'success' ? (
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
        ) : txState.status === 'error' ? (
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
        ) : (
          <div className="w-16 h-16 mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-[#272C33]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#7C5CFF] border-t-transparent animate-spin"></div>
          </div>
        )}

        <h3 className="text-xl font-bold text-white mb-2">
          {txState.status === 'building' && 'Building Transaction...'}
          {txState.status === 'signing' && 'Waiting for Signature...'}
          {txState.status === 'submitting' && 'Submitting to Network...'}
          {txState.status === 'success' && 'Transaction Successful'}
          {txState.status === 'error' && 'Transaction Failed'}
        </h3>

        {txState.hash && (
          <p className="text-sm text-[#B7C0CC] mb-4">
            Hash: <span className="font-mono text-[#7C5CFF]">{txState.hash.slice(0, 8)}...{txState.hash.slice(-8)}</span>
          </p>
        )}

        {txState.errorMessage && (
          <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg w-full text-left font-mono whitespace-pre-wrap">
            {txState.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

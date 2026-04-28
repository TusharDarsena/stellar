import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TxState, WalletState, SignFn } from '../types';
import { buildBurnerSignFn } from '../lib/stellar';
import { signTransaction as freighterSignTransaction } from '@stellar/freighter-api';

interface AppState {
  _hasHydrated: boolean; // Add this
  setHasHydrated: (state: boolean) => void; // Add this
  txState: TxState;
  setTxState: (state: TxState) => void;
  wallet: WalletState;
  setWallet: (state: WalletState) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      _hasHydrated: false, // Default to false
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      txState: { status: 'idle' },
      setTxState: (state) => set({ txState: state }),
      wallet: {
        isConnected: false,
        publicKey: null,
        walletType: null,
        xlmBalance: null,
        secretKey: null,
        signFn: null,
      },
      setWallet: (state) => set({ wallet: state }),
    }),
    {
      name: 'stellar-tickets-store',
      // DO NOT persist _hasHydrated. We want it false on every hard load.
      partialize: (state) => ({
        wallet: { ...state.wallet, signFn: null },
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // 1. Mark hydration as complete immediately
        state.setHasHydrated(true); 
        
        const { wallet } = state;
        if (!wallet.isConnected) return;

        // 2. Existing signFn rebuild logic
        if (wallet.walletType === 'burner' && wallet.secretKey) {
          state.setWallet({ 
            ...wallet, 
            signFn: buildBurnerSignFn(wallet.secretKey) 
          });
        } 
        else if (wallet.walletType === 'freighter') {
          const signFn: SignFn = async (xdr, opts) => {
            const passphrase = opts?.networkPassphrase || "Test SDF Network ; September 2015";
            const result = await freighterSignTransaction(xdr, { networkPassphrase: passphrase });
            if (result.error) throw new Error(result.error);
            return { signedTxXdr: result.signedTxXdr };
          };
          state.setWallet({ ...wallet, signFn });
        }
      },
    }
  )
);
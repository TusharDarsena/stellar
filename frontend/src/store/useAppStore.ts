import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TxState, WalletState, SignFn } from '../types';
import { buildBurnerSignFn } from '../lib/stellar';
import { signTransaction as freighterSignTransaction } from '@stellar/freighter-api';

interface AppState {
  txState: TxState;
  setTxState: (state: TxState) => void;

  wallet: WalletState;
  setWallet: (state: WalletState) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      txState: { status: 'idle' },

      setTxState: (state) =>
        set({
          txState: state,
        }),

      wallet: {
        isConnected: false,
        publicKey: null,
        walletType: null,
        xlmBalance: null,
        secretKey: null,
        signFn: null,
      },

      setWallet: (state) =>
        set({
          wallet: state,
        }),
    }),
    {
      name: 'stellar-tickets-store',

      // Persist only serializable wallet data.
      // signFn must never be persisted.
      partialize: (state) => ({
        wallet: {
          ...state.wallet,
          signFn: null,
        },
      }),

      // Restore signFn during hydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const { wallet } = state;

        if (!wallet.isConnected) return;

        if (wallet.walletType === 'burner' && wallet.secretKey) {
          // Safe direct mutation during hydration before store fully mounts
          state.wallet.signFn = buildBurnerSignFn(wallet.secretKey);
        } 
        else if (wallet.walletType === 'freighter') {
          state.wallet.signFn = async (xdr, opts) => {
            const passphrase =
              opts?.networkPassphrase ||
              'Test SDF Network ; September 2015';

            const result = await freighterSignTransaction(
              xdr,
              { networkPassphrase: passphrase }
            );

            if (result.error) {
              throw new Error(result.error);
            }

            return {
              signedTxXdr: result.signedTxXdr,
            };
          };
        }
      },
    }
  )
);
import { create } from 'zustand';
import { TxState, WalletState } from '../types';

interface AppState {
  txState: TxState;
  setTxState: (state: TxState) => void;
  wallet: WalletState;
  setWallet: (state: WalletState) => void;
}

export const useAppStore = create<AppState>((set) => ({
  txState: { status: 'idle' },
  setTxState: (state) => set({ txState: state }),
  wallet: { isConnected: false, publicKey: null, walletType: null, xlmBalance: null, secretKey: null, signFn: null },
  setWallet: (state) => set({ wallet: state }),
}));

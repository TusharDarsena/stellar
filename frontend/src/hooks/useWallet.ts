import { useCallback } from 'react';
import { isConnected as isFreighterConnected, requestAccess as requestFreighterAccess } from '@stellar/freighter-api';
import { WalletState } from '../types';

import { useAppStore } from '../store/useAppStore';

export function useWallet() {
  const { wallet, setWallet } = useAppStore();

  const connectWallet = useCallback(async () => {
    try {
      const connected = await isFreighterConnected();
      if (!connected) {
        console.warn('Freighter is not installed or not connected.');
        return;
      }

      const accessResult = await requestFreighterAccess();
      if (accessResult.error) {
        console.error('Freighter access error:', accessResult.error);
        return;
      }
      
      setWallet({
        isConnected: true,
        publicKey: accessResult.address,
        walletType: 'freighter',
        xlmBalance: '150.50' // Mock balance for now
      });
    } catch (error) {
      console.error('Failed to connect wallet', error);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      publicKey: null,
      walletType: null,
      xlmBalance: null
    });
  }, []);

  return {
    wallet,
    connectWallet,
    disconnectWallet
  };
}

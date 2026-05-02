// useWallet.ts — unified Freighter + Burner Wallet hook. (D-028)
// Nothing outside this file knows which wallet provider is active.
// walletType: 'freighter' | 'burner' | null

import { useCallback } from 'react';
import {
  isConnected as isFreighterConnected,
  requestAccess as requestFreighterAccess,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

import { useAppStore } from '../store/useAppStore';
import type { SignFn } from '../types';
import {
  getOrCreateBurnerWallet,
  fundWithFriendbot,
  fetchXlmBalance,
  buildBurnerSignFn,
} from '../lib/stellar';
import { supabase } from '../lib/supabase';

export function useWallet() {
  const { setWallet } = useAppStore();

  // ── Organizer path: Freighter ──────────────────────────────────────────────
  const connectOrganizer = useCallback(async () => {
    try {
      const connected = await isFreighterConnected();
      if (!connected.isConnected) {
        console.warn('[useWallet] Freighter is not installed or not connected.');
        return;
      }

      const accessResult = await requestFreighterAccess();
      if (accessResult.error) {
        console.error('[useWallet] Freighter access error:', accessResult.error);
        return;
      }

      const publicKey = accessResult.address;

      // Build signFn wrapping Freighter's signTransaction
      const signFn: SignFn = async (xdr, opts) => {
        const passphrase = opts?.networkPassphrase || "Test SDF Network ; September 2015";
        const result = await freighterSignTransaction(xdr, { networkPassphrase: passphrase });
        if (result.error) throw new Error(result.error);
        return { signedTxXdr: result.signedTxXdr };
      };

      const xlmBalance = await fetchXlmBalance(publicKey);

      setWallet({
        isConnected: true,
        publicKey,
        walletType: 'freighter',
        xlmBalance,
        secretKey: null,  // Freighter never exposes private keys
        signFn,
      });
    } catch (err) {
      console.error('[useWallet] Failed to connect Freighter:', err);
    }
  }, [setWallet]);

  // ── Attendee path: Burner Wallet ───────────────────────────────────────────
  const connectAttendee = useCallback(async () => {
    try {
      const { secretKey, publicKey } = getOrCreateBurnerWallet();

      // Fund the account if it doesn't exist yet (Friendbot is idempotent for existing accounts)
      await fundWithFriendbot(publicKey);

      // Phase 2a: Generate a mock user profile since we defer Web3Auth to Phase 2b
      await supabase.from('user_profiles').upsert({
        wallet_address: publicKey,
        display_name: 'Test Attendee ' + publicKey.substring(0, 4),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicKey}`,
      }, { onConflict: 'wallet_address' }).then(({ error }) => {
        if (error) console.warn('Failed to upsert mock profile:', error);
      });

      const signFn = buildBurnerSignFn(secretKey);
      const xlmBalance = await fetchXlmBalance(publicKey);

      setWallet({
        isConnected: true,
        publicKey,
        walletType: 'burner',
        xlmBalance,
        secretKey,
        signFn,
      });

      // Show success overlay
      const { setTxState } = useAppStore.getState();
      setTxState({ status: 'success', message: 'Burner Wallet Created & Funded (10,000 testnet XLM)' });
      setTimeout(() => setTxState({ status: 'idle' }), 3000);

    } catch (err) {
      console.error('[useWallet] Failed to connect Burner Wallet:', err);
    }
  }, [setWallet]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnectWallet = () => {
    // 1. Wipe the physical burner key from storage so it cannot be rehydrated
    localStorage.removeItem('stellar_burner_secret');

    // 2. Clear the Zustand application state
    useAppStore.getState().setWallet({
      isConnected: false,
      publicKey: null,
      walletType: null,
      xlmBalance: null,
      secretKey: null,
      signFn: null,
    });
  };

  // Ensure it's exported at the bottom of your hook
  return { connectOrganizer, connectAttendee, disconnectWallet };
}

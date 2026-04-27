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

export function useWallet() {
  const { wallet, setWallet } = useAppStore();

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
      const signFn: SignFn = async (xdr, { networkPassphrase }) => {
        const result = await freighterSignTransaction(xdr, { networkPassphrase });
        if (result.error) throw new Error(result.error);
        return result.signedTxXdr;
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
    } catch (err) {
      console.error('[useWallet] Failed to connect Burner Wallet:', err);
    }
  }, [setWallet]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  // Does NOT clear localStorage — the burner key persists across sessions. (D-028)
  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      publicKey: null,
      walletType: null,
      xlmBalance: null,
      secretKey: null,
      signFn: null,
    });
  }, [setWallet]);

  return {
    wallet,
    connectOrganizer,
    connectAttendee,
    disconnectWallet,
  };
}

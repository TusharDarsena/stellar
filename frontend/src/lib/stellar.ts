// stellar.ts — Burner Wallet generation and Friendbot funding. (D-028)
// Also re-exports Keypair.verify for use in qr.ts.
// No transaction building here — that lives in soroban.ts.

import { Keypair } from '@stellar/stellar-sdk';
import { FRIENDBOT_URL } from './constants';

const BURNER_SECRET_KEY = 'stellar_burner_secret';

// ─── Burner Wallet ────────────────────────────────────────────────────────────

/**
 * Restore an existing burner wallet from localStorage, or create a new one.
 * Returns the secret key and derived public key.
 */
export function getOrCreateBurnerWallet(): { secretKey: string; publicKey: string } {
  const existing = localStorage.getItem(BURNER_SECRET_KEY);
  if (existing) {
    try {
      const keypair = Keypair.fromSecret(existing);
      return { secretKey: existing, publicKey: keypair.publicKey() };
    } catch {
      // Corrupted key — generate a new one
      localStorage.removeItem(BURNER_SECRET_KEY);
    }
  }

  const keypair = Keypair.random();
  const secretKey = keypair.secret();
  localStorage.setItem(BURNER_SECRET_KEY, secretKey);
  return { secretKey, publicKey: keypair.publicKey() };
}

/**
 * Fund a new burner wallet via Friendbot (testnet only).
 * Throws if Friendbot returns an error.
 */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(publicKey)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Friendbot returns 400 if the account already exists — that is fine
    if (res.status === 400 && body.includes('createAccountAlreadyExist')) return;
    throw new Error(`Friendbot failed (${res.status}): ${body}`);
  }
}

/**
 * Fetch the XLM balance for a given public key from the Horizon testnet API.
 * Returns '0.00' if the account does not exist yet (unfunded).
 */
export async function fetchXlmBalance(publicKey: string): Promise<string> {
  try {
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
    if (res.status === 404) return '0.00';
    if (!res.ok) throw new Error(`Horizon error: ${res.status}`);

    const data = await res.json() as { balances: Array<{ asset_type: string; balance: string }> };
    const xlmBalance = data.balances.find((b) => b.asset_type === 'native');
    return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : '0.00';
  } catch {
    return '0.00';
  }
}

/**
 * Build a SignFn for a burner wallet using the local secret key.
 * The returned function matches the SignFn type so soroban.ts stays wallet-agnostic.
 */
export function buildBurnerSignFn(secretKey: string) {
  return async (xdr: string, _opts: { networkPassphrase: string }): Promise<string> => {
    const { TransactionBuilder } = await import('@stellar/stellar-sdk');
    const keypair = Keypair.fromSecret(secretKey);
    const tx = TransactionBuilder.fromXDR(xdr, _opts.networkPassphrase);
    tx.sign(keypair);
    return tx.toXDR();
  };
}

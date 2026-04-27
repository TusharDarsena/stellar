// All values come from frontend/.env.local, written by scripts/deploy.sh.
// Never hardcode contract IDs here — they change on each deployment. (D-004, D-007 revised)
export const TICKET_CONTRACT_ID = import.meta.env.VITE_TICKET_CONTRACT_ID as string;
export const MARKETPLACE_CONTRACT_ID = import.meta.env.VITE_MARKETPLACE_CONTRACT_ID as string;
export const NETWORK_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE as string;
export const RPC_URL = import.meta.env.VITE_RPC_URL as string;

export const FRIENDBOT_URL = 'https://friendbot.stellar.org';

// Fail fast at startup — prevents silent undefined errors during development.
if (!TICKET_CONTRACT_ID || !MARKETPLACE_CONTRACT_ID || !NETWORK_PASSPHRASE || !RPC_URL) {
  throw new Error(
    '[constants] Missing required env vars. Run scripts/deploy.sh first, ' +
    'or copy .env.example to .env.local and fill in the values.'
  );
}

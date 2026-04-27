import { customAlphabet } from 'nanoid';

// Standard alphanumeric alphabet (no hyphens or underscores)
// Prevents Soroban Symbol crashes and ensures compact IDs.
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generates a strictly alphanumeric ID for events and tickets.
 * Length 16 provides ~10^28 combinations, sufficient for ticketing.
 */
export const generateID = customAlphabet(alphabet, 16);

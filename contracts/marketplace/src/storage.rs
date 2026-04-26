use soroban_sdk::{Address, Env, Symbol};

use crate::error::ContractError;
use crate::types::{DataKey, Listing};

// TTL thresholds (in ledgers). Min TTL: 17280 (~1 day). Target TTL: 31536000 (~1 year).
// Mirrors ticket/storage.rs constants exactly.
const TTL_MIN: u32 = 17_280;
const TTL_TARGET: u32 = 31_536_000;

// ---------------------------------------------------------------------------
// TicketContract address (set once at initialize)
// Stored in instance() — contract-lifetime data. Same pattern as ticket D-012.
// ---------------------------------------------------------------------------

pub fn read_ticket_contract(env: &Env) -> Result<Address, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::TicketContract)
        .ok_or(ContractError::NotInitialized)
}

pub fn write_ticket_contract(env: &Env, address: &Address) {
    env.storage()
        .instance()
        .set(&DataKey::TicketContract, address);
    // Extend instance TTL on every write to prevent expiry-based re-init attack (S-002).
    env.storage().instance().extend_ttl(TTL_MIN, TTL_TARGET);
}

pub fn has_ticket_contract(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::TicketContract)
}

// ---------------------------------------------------------------------------
// Royalty rate (set once at initialize, clamped to [0, 100])
// Stored in instance() — contract-lifetime config.
// ---------------------------------------------------------------------------

pub fn read_royalty_rate(env: &Env) -> Result<i128, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::RoyaltyRate)
        .ok_or(ContractError::NotInitialized)
}

pub fn write_royalty_rate(env: &Env, rate: i128) {
    env.storage().instance().set(&DataKey::RoyaltyRate, &rate);
    env.storage().instance().extend_ttl(TTL_MIN, TTL_TARGET);
}

// ---------------------------------------------------------------------------
// Listing (persistent, keyed by (seller, listing_id))
// Namespaced to seller so front-running griefing is impossible.
// ---------------------------------------------------------------------------

pub fn read_listing(
    env: &Env,
    seller: &Address,
    listing_id: &Symbol,
) -> Result<Listing, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Listing(seller.clone(), listing_id.clone()))
        .ok_or(ContractError::ListingNotFound)
}

pub fn write_listing(env: &Env, seller: &Address, listing_id: &Symbol, listing: &Listing) {
    let key = DataKey::Listing(seller.clone(), listing_id.clone());
    env.storage().persistent().set(&key, listing);
    env.storage()
        .persistent()
        .extend_ttl(&key, TTL_MIN, TTL_TARGET);
}

pub fn has_listing(env: &Env, seller: &Address, listing_id: &Symbol) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Listing(seller.clone(), listing_id.clone()))
}

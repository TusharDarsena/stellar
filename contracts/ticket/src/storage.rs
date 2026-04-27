use soroban_sdk::{Address, Env, String};

use crate::error::ContractError;
use crate::types::{DataKey, Event, Ticket};

// TTL thresholds (in ledgers). Min TTL: 17280 (~1 day). Target TTL: 31536000 (~1 year).
const TTL_MIN: u32 = 17_280;
const TTL_TARGET: u32 = 31_536_000;

// ---------------------------------------------------------------------------
// Marketplace address (set once at initialize)
// Stored in instance() — this is contract-lifetime data. See D-012.
// ---------------------------------------------------------------------------

pub fn read_marketplace_address(env: &Env) -> Result<Address, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::MarketplaceAddress)
        .ok_or(ContractError::NotInitialized)
}

pub fn write_marketplace_address(env: &Env, address: &Address) {
    env.storage()
        .instance()
        .set(&DataKey::MarketplaceAddress, address);
    // Extend instance TTL so the marketplace address never expires and cannot
    // be hijacked via re-initialization after expiry (S-002).
    env.storage().instance().extend_ttl(TTL_MIN, TTL_TARGET);
}

pub fn has_marketplace_address(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::MarketplaceAddress)
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

pub fn read_event(env: &Env, event_id: &String) -> Result<Event, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Event(event_id.clone()))
        .ok_or(ContractError::EventNotFound)
}

pub fn write_event(env: &Env, event_id: &String, event: &Event) {
    env.storage()
        .persistent()
        .set(&DataKey::Event(event_id.clone()), event);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Event(event_id.clone()), TTL_MIN, TTL_TARGET);
}

pub fn has_event(env: &Env, event_id: &String) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Event(event_id.clone()))
}

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

pub fn read_ticket(env: &Env, ticket_id: &String) -> Result<Ticket, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Ticket(ticket_id.clone()))
        .ok_or(ContractError::TicketNotFound)
}

pub fn write_ticket(env: &Env, ticket_id: &String, ticket: &Ticket) {
    env.storage()
        .persistent()
        .set(&DataKey::Ticket(ticket_id.clone()), ticket);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Ticket(ticket_id.clone()), TTL_MIN, TTL_TARGET);
}

pub fn has_ticket(env: &Env, ticket_id: &String) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Ticket(ticket_id.clone()))
}

// ---------------------------------------------------------------------------
// Escrow (XLM held per event, in stroops)
// ---------------------------------------------------------------------------

pub fn read_escrow(env: &Env, event_id: &String) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Escrow(event_id.clone()))
        .unwrap_or(0i128)
}

pub fn write_escrow(env: &Env, event_id: &String, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(event_id.clone()), &amount);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Escrow(event_id.clone()), TTL_MIN, TTL_TARGET);
}

// ---------------------------------------------------------------------------
// XLM token address (set once at initialize — never trust caller-supplied)
// ---------------------------------------------------------------------------

pub fn read_xlm_token(env: &Env) -> Result<Address, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::XlmToken)
        .ok_or(ContractError::NotInitialized)
}

pub fn write_xlm_token(env: &Env, address: &Address) {
    env.storage().instance().set(&DataKey::XlmToken, address);
    env.storage().instance().extend_ttl(TTL_MIN, TTL_TARGET);
}

pub fn has_xlm_token(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::XlmToken)
}

// ---------------------------------------------------------------------------
// Admin address (set once at initialize — contract-wide admin)
// ---------------------------------------------------------------------------

pub fn read_admin(env: &Env) -> Result<Address, ContractError> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(ContractError::NotInitialized)
}

pub fn write_admin(env: &Env, address: &Address) {
    env.storage().instance().set(&DataKey::Admin, address);
    env.storage().instance().extend_ttl(TTL_MIN, TTL_TARGET);
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

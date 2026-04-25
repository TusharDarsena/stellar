use soroban_sdk::{Address, Env, Symbol};

use crate::error::ContractError;
use crate::types::{DataKey, Event, Ticket};

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
}

pub fn has_marketplace_address(env: &Env) -> bool {
    env.storage()
        .instance()
        .has(&DataKey::MarketplaceAddress)
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

pub fn read_event(env: &Env, event_id: &Symbol) -> Result<Event, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Event(event_id.clone()))
        .ok_or(ContractError::EventNotFound)
}

pub fn write_event(env: &Env, event_id: &Symbol, event: &Event) {
    env.storage()
        .persistent()
        .set(&DataKey::Event(event_id.clone()), event);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Event(event_id.clone()), 17280, 31536000);
}

pub fn has_event(env: &Env, event_id: &Symbol) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Event(event_id.clone()))
}

// ---------------------------------------------------------------------------
// Ticket
// ---------------------------------------------------------------------------

pub fn read_ticket(env: &Env, ticket_id: &Symbol) -> Result<Ticket, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Ticket(ticket_id.clone()))
        .ok_or(ContractError::TicketNotFound)
}

pub fn write_ticket(env: &Env, ticket_id: &Symbol, ticket: &Ticket) {
    env.storage()
        .persistent()
        .set(&DataKey::Ticket(ticket_id.clone()), ticket);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Ticket(ticket_id.clone()), 17280, 31536000);
}

// ---------------------------------------------------------------------------
// Escrow (XLM held per event, in stroops)
// ---------------------------------------------------------------------------

pub fn read_escrow(env: &Env, event_id: &Symbol) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::Escrow(event_id.clone()))
        .unwrap_or(0i128)
}

pub fn write_escrow(env: &Env, event_id: &Symbol, amount: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(event_id.clone()), &amount);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Escrow(event_id.clone()), 17280, 31536000);
}

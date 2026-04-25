use soroban_sdk::{Env, Symbol};

use crate::error::ContractError;
use crate::storage;

/// Add stroops to the escrow balance for an event.
pub fn add_to_escrow(env: &Env, event_id: &Symbol, amount: i128) -> Result<(), ContractError> {
    let current = storage::read_escrow(env, event_id);
    let updated = current
        .checked_add(amount)
        .ok_or(ContractError::Overflow)?;
    storage::write_escrow(env, event_id, updated);
    Ok(())
}

/// Subtract stroops from the escrow balance for an event.
pub fn subtract_from_escrow(
    env: &Env,
    event_id: &Symbol,
    amount: i128,
) -> Result<(), ContractError> {
    let current = storage::read_escrow(env, event_id);
    let updated = current
        .checked_sub(amount)
        .ok_or(ContractError::Underflow)?;
    storage::write_escrow(env, event_id, updated);
    Ok(())
}

/// Read the current escrow balance for an event.
pub fn get_escrow_balance(env: &Env, event_id: &Symbol) -> i128 {
    storage::read_escrow(env, event_id)
}

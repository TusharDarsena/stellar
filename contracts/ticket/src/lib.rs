#![no_std]

mod error;
mod escrow;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, token, Address, Env, Symbol};

use crate::error::ContractError;
use crate::types::{Event, EventStatus, Ticket};

#[contract]
pub struct TicketContract;

#[contractimpl]
impl TicketContract {
    // -----------------------------------------------------------------------
    // Initialization
    // -----------------------------------------------------------------------

    /// Set the one marketplace address allowed to call restricted_transfer.
    /// Can only be called once.
    pub fn initialize(env: Env, marketplace_address: Address) -> Result<(), ContractError> {
        if storage::has_marketplace_address(&env) {
            return Err(ContractError::AlreadyInitialized);
        }
        storage::write_marketplace_address(&env, &marketplace_address);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Event management
    // -----------------------------------------------------------------------

    /// Create a new event. Does NOT mint tickets — lazy minting at purchase time.
    pub fn create_event(
        env: Env,
        organizer: Address,
        event_id: Symbol,
        name: Symbol,
        date_unix: u64,
        capacity: i128,
        price_per_ticket: i128,
    ) -> Result<(), ContractError> {
        organizer.require_auth();

        if storage::has_event(&env, &event_id) {
            return Err(ContractError::EventAlreadyExists);
        }

        let event = Event {
            organizer: organizer.clone(),
            name,
            date_unix,
            capacity,
            price_per_ticket,
            current_supply: 0,
            status: EventStatus::Active,
        };

        storage::write_event(&env, &event_id, &event);
        events::emit_event_created(&env, &event_id, &organizer);
        Ok(())
    }

    /// Cancel event. Only organizer. Does not auto-refund — pull-based per D-002.
    pub fn cancel_event(
        env: Env,
        event_id: Symbol,
        organizer: Address,
    ) -> Result<(), ContractError> {
        organizer.require_auth();

        let mut event = storage::read_event(&env, &event_id)?;

        if event.organizer != organizer {
            return Err(ContractError::OnlyOrganizerAllowed);
        }
        if event.status == EventStatus::Completed {
            return Err(ContractError::EventAlreadyCompleted);
        }

        event.status = EventStatus::Cancelled;
        storage::write_event(&env, &event_id, &event);
        events::emit_event_cancelled(&env, &event_id, &organizer);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Ticket purchase
    // -----------------------------------------------------------------------

    /// Purchase a ticket. Pulls price_per_ticket XLM from buyer into escrow.
    /// `xlm_token` is the XLM SAC address on the current network.
    pub fn purchase(
        env: Env,
        event_id: Symbol,
        buyer: Address,
        ticket_id: Symbol,
        xlm_token: Address,
    ) -> Result<(), ContractError> {
        buyer.require_auth();

        let mut event = storage::read_event(&env, &event_id)?;

        if event.status != EventStatus::Active {
            return Err(ContractError::EventNotActive);
        }
        if event.current_supply >= event.capacity {
            return Err(ContractError::EventCapacityExceeded);
        }

        // Pull XLM from buyer into contract (escrow). price_per_ticket is in stroops.
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(
            &buyer,
            &env.current_contract_address(),
            &event.price_per_ticket,
        );

        // Mint ticket (lazy — only on purchase)
        let ticket = Ticket {
            owner: buyer.clone(),
            event_id: event_id.clone(),
            used: false,
        };
        storage::write_ticket(&env, &ticket_id, &ticket);

        // Update supply and escrow
        event.current_supply = event
            .current_supply
            .checked_add(1)
            .ok_or(ContractError::Overflow)?;
        storage::write_event(&env, &event_id, &event);

        escrow::add_to_escrow(&env, &event_id, event.price_per_ticket)?;

        events::emit_ticket_purchased(&env, &ticket_id, &buyer, &event_id);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Escrow release
    // -----------------------------------------------------------------------

    /// Release escrowed funds to organizer. Only callable after event date.
    pub fn release_funds(
        env: Env,
        event_id: Symbol,
        organizer: Address,
        xlm_token: Address,
    ) -> Result<(), ContractError> {
        organizer.require_auth();

        let mut event = storage::read_event(&env, &event_id)?;

        if event.organizer != organizer {
            return Err(ContractError::OnlyOrganizerAllowed);
        }
        if event.status == EventStatus::Cancelled {
            return Err(ContractError::EventNotActive);
        }
        if event.status == EventStatus::Completed {
            return Err(ContractError::EventAlreadyCompleted);
        }
        if env.ledger().timestamp() <= event.date_unix {
            return Err(ContractError::EventNotEligibleForRelease);
        }

        let held = escrow::get_escrow_balance(&env, &event_id);
        if held == 0 {
            return Err(ContractError::InsufficientEscrowBalance);
        }

        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(&env.current_contract_address(), &organizer, &held);

        escrow::subtract_from_escrow(&env, &event_id, held)?;

        event.status = EventStatus::Completed;
        storage::write_event(&env, &event_id, &event);

        events::emit_funds_released(&env, &event_id, &organizer, held);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Refund (pull-based, only when event is Cancelled — see D-002)
    // -----------------------------------------------------------------------

    pub fn refund(
        env: Env,
        ticket_id: Symbol,
        attendee: Address,
        xlm_token: Address,
    ) -> Result<(), ContractError> {
        attendee.require_auth();

        let mut ticket = storage::read_ticket(&env, &ticket_id)?;

        if ticket.owner != attendee {
            return Err(ContractError::TicketNotOwnedByCaller);
        }
        if ticket.used {
            return Err(ContractError::TicketAlreadyUsed);
        }

        let event = storage::read_event(&env, &ticket.event_id)?;

        if event.status != EventStatus::Cancelled {
            return Err(ContractError::EventNotCancelled);
        }

        // Mark ticket as used to prevent double-refund
        ticket.used = true;
        storage::write_ticket(&env, &ticket_id, &ticket);

        // Return price to attendee
        let token_client = token::Client::new(&env, &xlm_token);
        token_client.transfer(
            &env.current_contract_address(),
            &attendee,
            &event.price_per_ticket,
        );

        escrow::subtract_from_escrow(&env, &ticket.event_id, event.price_per_ticket)?;

        events::emit_refund(&env, &ticket_id, &attendee, event.price_per_ticket);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Restricted transfer (only callable by marketplace — see D-003, D-009)
    // -----------------------------------------------------------------------

    /// Transfer ticket ownership. ONLY the stored marketplace address can call this.
    pub fn restricted_transfer(
        env: Env,
        ticket_id: Symbol,
        new_owner: Address,
    ) -> Result<(), ContractError> {
        let marketplace = storage::read_marketplace_address(&env)?;
        marketplace.require_auth();

        let mut ticket = storage::read_ticket(&env, &ticket_id)?;

        if ticket.used {
            return Err(ContractError::TicketAlreadyUsed);
        }

        ticket.owner = new_owner.clone();
        storage::write_ticket(&env, &ticket_id, &ticket);

        events::emit_restricted_transfer(&env, &ticket_id, &new_owner);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Mark used (at venue door after QR verification — see architecture.md QR section)
    // -----------------------------------------------------------------------

    pub fn mark_used(
        env: Env,
        ticket_id: Symbol,
        organizer: Address,
    ) -> Result<(), ContractError> {
        organizer.require_auth();

        let mut ticket = storage::read_ticket(&env, &ticket_id)?;

        if ticket.used {
            return Err(ContractError::TicketAlreadyUsed);
        }

        let event = storage::read_event(&env, &ticket.event_id)?;
        if event.organizer != organizer {
            return Err(ContractError::OnlyOrganizerAllowed);
        }

        ticket.used = true;
        storage::write_ticket(&env, &ticket_id, &ticket);

        events::emit_ticket_used(&env, &ticket_id);
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Read-only queries
    // -----------------------------------------------------------------------

    pub fn get_ticket(env: Env, ticket_id: Symbol) -> Result<Ticket, ContractError> {
        storage::read_ticket(&env, &ticket_id)
    }

    pub fn get_event(env: Env, event_id: Symbol) -> Result<Event, ContractError> {
        storage::read_event(&env, &event_id)
    }

    pub fn get_marketplace(env: Env) -> Result<Address, ContractError> {
        storage::read_marketplace_address(&env)
    }
}

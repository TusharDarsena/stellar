use soroban_sdk::{symbol_short, Address, Env, String};

pub fn emit_event_created(env: &Env, event_id: &String, organizer: &Address) {
    env.events().publish(
        (symbol_short!("ev_create"), event_id.clone()),
        organizer.clone(),
    );
}

pub fn emit_ticket_purchased(env: &Env, ticket_id: &String, buyer: &Address, event_id: &String) {
    env.events().publish(
        (symbol_short!("tk_buy"), ticket_id.clone()),
        (buyer.clone(), event_id.clone()),
    );
}

pub fn emit_funds_released(env: &Env, event_id: &String, organizer: &Address, amount: i128) {
    env.events().publish(
        (symbol_short!("ev_rel"), event_id.clone()),
        (organizer.clone(), amount),
    );
}

pub fn emit_event_cancelled(env: &Env, event_id: &String, organizer: &Address) {
    env.events().publish(
        (symbol_short!("ev_cancel"), event_id.clone()),
        organizer.clone(),
    );
}

pub fn emit_refund(env: &Env, ticket_id: &String, attendee: &Address, amount: i128) {
    env.events().publish(
        (symbol_short!("tk_refund"), ticket_id.clone()),
        (attendee.clone(), amount),
    );
}

pub fn emit_ticket_used(env: &Env, ticket_id: &String) {
    env.events()
        .publish((symbol_short!("tk_used"), ticket_id.clone()), ());
}

pub fn emit_restricted_transfer(env: &Env, ticket_id: &String, new_owner: &Address) {
    env.events().publish(
        (symbol_short!("tk_xfer"), ticket_id.clone()),
        new_owner.clone(),
    );
}


#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, Symbol,
};
use token::Client as TokenClient;
use token::StellarAssetClient as TokenAdminClient;

use crate::types::TicketStatus;
use crate::{TicketContract, TicketContractClient};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

fn create_xlm_token<'a>(
    env: &Env,
    admin: &Address,
) -> (TokenClient<'a>, TokenAdminClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    (
        TokenClient::new(env, &sac.address()),
        TokenAdminClient::new(env, &sac.address()),
    )
}

fn create_ticket_contract(env: &Env) -> TicketContractClient {
    TicketContractClient::new(env, &env.register(TicketContract, ()))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[test]
fn test_create_event_and_purchase() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);

    let price: i128 = 10_000_000; // 1 XLM in stroops
    xlm_admin.mint(&buyer, &(price * 10));

    let contract = create_ticket_contract(&env);
    // initialize now requires both marketplace and xlm_token addresses
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event1");
    let ticket_id = Symbol::new(&env, "ticket1");

    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "Concert"),
        &(env.ledger().timestamp() + 86400),
        &100i128,
        &price,
    );

    // purchase no longer takes xlm_token — uses stored address
    contract.purchase(&event_id, &buyer, &ticket_id);

    let ticket = contract.get_ticket(&ticket_id);
    assert_eq!(ticket.owner, buyer);
    assert_eq!(ticket.status, TicketStatus::Active);

    let event = contract.get_event(&event_id);
    assert_eq!(event.current_supply, 1);

    // Contract should hold the XLM in escrow
    assert_eq!(xlm.balance(&contract.address), price);

    // Verify get_xlm_token returns the address stored at initialize
    assert_eq!(contract.get_xlm_token(), xlm.address);
}

#[test]
fn test_capacity_exceeded() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer1 = Address::generate(&env);
    let buyer2 = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);
    let price: i128 = 10_000_000;
    xlm_admin.mint(&buyer1, &price);
    xlm_admin.mint(&buyer2, &price);

    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event2");

    // Capacity of 1
    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "SmallShow"),
        &(env.ledger().timestamp() + 86400),
        &1i128,
        &price,
    );

    contract.purchase(&event_id, &buyer1, &Symbol::new(&env, "t1"));

    // Second purchase must fail
    let result = contract.try_purchase(
        &event_id,
        &buyer2,
        &Symbol::new(&env, "t2"),
    );
    assert!(result.is_err());
}

#[test]
fn test_release_funds_after_event_date() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);
    let price: i128 = 10_000_000;
    xlm_admin.mint(&buyer, &price);

    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event3");
    let event_date = env.ledger().timestamp() + 100;

    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "Festival"),
        &event_date,
        &50i128,
        &price,
    );

    contract.purchase(&event_id, &buyer, &Symbol::new(&env, "t1"));

    // Release before event date must fail — release_funds no longer takes xlm_token
    let result = contract.try_release_funds(&event_id, &organizer);
    assert!(result.is_err());

    // Advance ledger past event date
    env.ledger().set_timestamp(event_date + 1);

    // Now release must succeed
    contract.release_funds(&event_id, &organizer);

    assert_eq!(xlm.balance(&organizer), price);
    assert_eq!(xlm.balance(&contract.address), 0);
}

#[test]
fn test_refund_when_cancelled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);
    let price: i128 = 10_000_000;
    xlm_admin.mint(&buyer, &price);

    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event4");
    let ticket_id = Symbol::new(&env, "t1");

    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "Cancelled"),
        &(env.ledger().timestamp() + 86400),
        &50i128,
        &price,
    );

    contract.purchase(&event_id, &buyer, &ticket_id);
    assert_eq!(xlm.balance(&buyer), 0);

    contract.cancel_event(&event_id, &organizer);
    // refund no longer takes xlm_token
    contract.refund(&ticket_id, &buyer);

    // Buyer must get their XLM back
    assert_eq!(xlm.balance(&buyer), price);
    // Ticket must be in Refunded state — not Used — so analytics can distinguish
    let refunded = contract.get_ticket(&ticket_id);
    assert_eq!(refunded.status, TicketStatus::Refunded);

    // Double refund must fail (ticket no longer Active)
    let result = contract.try_refund(&ticket_id, &buyer);
    assert!(result.is_err());
}

#[test]
fn test_restricted_transfer_by_marketplace() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);
    let price: i128 = 10_000_000;
    xlm_admin.mint(&buyer, &price);

    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event5");
    let ticket_id = Symbol::new(&env, "t1");

    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "Show"),
        &(env.ledger().timestamp() + 86400),
        &50i128,
        &price,
    );

    contract.purchase(&event_id, &buyer, &ticket_id);

    // Marketplace can transfer
    contract.restricted_transfer(&ticket_id, &new_owner);
    let ticket = contract.get_ticket(&ticket_id);
    assert_eq!(ticket.owner, new_owner);
    assert_eq!(ticket.status, TicketStatus::Active);
}

#[test]
fn test_restricted_transfer_rejects_non_marketplace() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);
    let price: i128 = 10_000_000;
    xlm_admin.mint(&buyer, &price);

    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event6");
    let ticket_id = Symbol::new(&env, "t_rt");

    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "AuthTest"),
        &(env.ledger().timestamp() + 86400),
        &10i128,
        &price,
    );

    contract.purchase(&event_id, &buyer, &ticket_id);

    // Switch to empty auth mock — no address has auth now, including marketplace.
    // restricted_transfer calls marketplace.require_auth() → panics → try_ returns Err.
    env.mock_auths(&[]);

    let result = contract.try_restricted_transfer(&ticket_id, &new_owner);
    assert!(
        result.is_err(),
        "restricted_transfer must fail when marketplace auth is not present"
    );

    // Ticket owner must be unchanged and still Active
    let ticket = {
        env.mock_all_auths();
        contract.get_ticket(&ticket_id)
    };
    assert_eq!(ticket.owner, buyer, "owner must not change on failed transfer");
    assert_eq!(ticket.status, TicketStatus::Active, "status must not change on failed transfer");
}

#[test]
fn test_purchase_rejects_duplicate_ticket_id() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, xlm_admin) = create_xlm_token(&env, &admin);
    let price: i128 = 10_000_000;
    xlm_admin.mint(&buyer, &(price * 10));

    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let event_id = Symbol::new(&env, "event7");
    let ticket_id = Symbol::new(&env, "dup");

    contract.create_event(
        &organizer,
        &event_id,
        &Symbol::new(&env, "DupTest"),
        &(env.ledger().timestamp() + 86400),
        &10i128,
        &price,
    );

    contract.purchase(&event_id, &buyer, &ticket_id);

    // Second purchase with same ticket_id must be rejected
    let result = contract.try_purchase(&event_id, &buyer, &ticket_id);
    assert!(result.is_err(), "duplicate ticket_id must be rejected");

    // Original ticket ownership must be intact
    let ticket = contract.get_ticket(&ticket_id);
    assert_eq!(ticket.owner, buyer);
}

#[test]
fn test_create_event_rejects_invalid_params() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let marketplace = Address::generate(&env);

    let (xlm, _) = create_xlm_token(&env, &admin);
    let contract = create_ticket_contract(&env);
    contract.initialize(&marketplace, &xlm.address);

    let future = env.ledger().timestamp() + 86400;
    let price: i128 = 10_000_000;

    // Zero capacity
    let r = contract.try_create_event(
        &organizer,
        &Symbol::new(&env, "ev_a"),
        &Symbol::new(&env, "Bad"),
        &future,
        &0i128,
        &price,
    );
    assert!(r.is_err(), "zero capacity must be rejected");

    // Zero price
    let r = contract.try_create_event(
        &organizer,
        &Symbol::new(&env, "ev_b"),
        &Symbol::new(&env, "Bad"),
        &future,
        &100i128,
        &0i128,
    );
    assert!(r.is_err(), "zero price must be rejected");

    // Date in the past — ledger starts at 0 in tests, so timestamp 0 satisfies date_unix <= now
    let r = contract.try_create_event(
        &organizer,
        &Symbol::new(&env, "ev_c"),
        &Symbol::new(&env, "Bad"),
        &0u64,
        &100i128,
        &price,
    );
    assert!(r.is_err(), "past event date must be rejected");
}

use soroban_sdk::{contracttype, Address, Symbol};

/// Storage keys for all persistent data in TicketContract.
/// Keyed by event_id or ticket_id (both Symbols).
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    /// Stores an Event record, keyed by event_id
    Event(Symbol),
    /// Stores a Ticket record, keyed by ticket_id
    Ticket(Symbol),
    /// Stores escrow balance (in stroops) for an event, keyed by event_id
    Escrow(Symbol),
    /// The one address allowed to call restricted_transfer.
    /// Set once at initialize(), never changes.
    /// NOTE: Stored in instance() storage — not persistent() — because this IS
    /// contract-lifetime data. See decisions.md D-012.
    MarketplaceAddress,
}

/// Event status lifecycle.
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum EventStatus {
    Active,
    Cancelled,
    Completed,
}

/// Full event record stored on-chain.
#[derive(Clone)]
#[contracttype]
pub struct Event {
    /// Address that created the event and will receive funds after release
    pub organizer: Address,
    /// Short display name (stored as Symbol to save ledger rent)
    pub name: Symbol,
    /// Unix timestamp of the event date
    pub date_unix: u64,
    /// Maximum number of tickets that can be sold
    pub capacity: i128,
    /// Price per ticket in stroops (1 XLM = 10_000_000 stroops)
    pub price_per_ticket: i128,
    /// How many tickets have been sold so far
    pub current_supply: i128,
    pub status: EventStatus,
}

/// Individual ticket record stored on-chain.
#[derive(Clone)]
#[contracttype]
pub struct Ticket {
    /// Current owner of this ticket
    pub owner: Address,
    /// Which event this ticket belongs to
    pub event_id: Symbol,
    /// Whether this ticket has been scanned/used at the door
    pub used: bool,
}

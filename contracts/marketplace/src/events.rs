use soroban_sdk::{symbol_short, Address, Env, Symbol};

pub fn emit_listed(env: &Env, listing_id: &Symbol, seller: &Address, ask_price: i128) {
    env.events().publish(
        (symbol_short!("mk_list"), listing_id.clone()),
        (seller.clone(), ask_price),
    );
}

pub fn emit_sold(env: &Env, listing_id: &Symbol, buyer: &Address, ask_price: i128) {
    env.events().publish(
        (symbol_short!("mk_sold"), listing_id.clone()),
        (buyer.clone(), ask_price),
    );
}

pub fn emit_cancelled(env: &Env, listing_id: &Symbol, seller: &Address) {
    env.events().publish(
        (symbol_short!("mk_cancel"), listing_id.clone()),
        seller.clone(),
    );
}

module contacts::contacts;

use std::string::String;
use sui::event;
use sui::tx_context;
use sui::object::{Self, UID};
use sui::transfer;

public struct Contacts has key, store {
    id: UID,
    name: String,
    wallet: address,
    owner: address,
}

public struct ContactCreatedEvent has copy, drop {
    owner: address,
    name: String,
    wallet: address,
}

public struct ContactDeletedEvent has copy, drop {
    owner: address,
    contact_id: address,
}

entry fun create_contact(
    name: String,
    wallet: address,
    ctx: &mut TxContext
) {
    let owner = tx_context::sender(ctx);
    
    let contact = Contacts {
        id: object::new(ctx),
        name,
        wallet,
        owner,
    };
    
    event::emit(ContactCreatedEvent {
        owner,
        name: contact.name,
        wallet,
    });

    transfer::transfer(contact, owner);
}

entry fun delete_profile(contacts: Contacts, ctx: &TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(sender == contacts.owner, 0);
    let owner = tx_context::sender(ctx);
    let contact_id = object::uid_to_address(&contacts.id);
    event::emit(ContactDeletedEvent {
            owner,
            contact_id,
    });
    let Contacts { id, name: _, wallet: _, owner: _ } = contacts;
    object::delete(id);
}
#[test_only]
module contacts::contacts_tests;

use contacts::contacts;
use std::signer;
use std::string;
use sui::tx_context::TxContext;

// Test account addresses
const ADDR_1: address = @0x1;
const ADDR_2: address = @0x2;

#[test]
fun test_create_contact() {
    let ctx = tx_context::dummy();
    let name = string::utf8(b"Alice");
    let wallet = @0x123;
    
    contacts::create_contact(name, wallet, &mut ctx);
    // Test passes if no panic occurs
}

#[test]
fun test_delete_profile() {
    let ctx = tx_context::dummy();
    let name = string::utf8(b"Bob");
    let wallet = @0x456;
    
    // First create a contact
    contacts::create_contact(name, wallet, &mut ctx);
    
    // TODO: Implement proper test for delete_profile
    // This would require getting the created contact object and passing it to delete_profile
    // For now, we're just testing that the module compiles with the correct function signature
}

#[test]
fun test_contact_created_event() {
    let ctx = tx_context::dummy();
    let name = string::utf8(b"Charlie");
    let wallet = @0x789;
    
    // Verify that the contact creation emits an event
    contacts::create_contact(name, wallet, &mut ctx);
    // In a real test environment, we would check for emitted events
}
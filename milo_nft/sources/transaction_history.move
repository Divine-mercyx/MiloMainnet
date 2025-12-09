module milo_nft::transaction_history {
    use std::string::String;
    use sui::object::{UID, new, uid_to_address};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use sui::event;

    // Error codes
    const ENotOwner: u64 = 1;
    const ETransactionNotFound: u64 = 2;

    // Transaction types
    const TRANSACTION_TYPE_SWAP: u8 = 0;
    const TRANSACTION_TYPE_SEND: u8 = 1;
    const TRANSACTION_TYPE_RECEIVE: u8 = 2;
    const TRANSACTION_TYPE_MINT: u8 = 3;
    const TRANSACTION_TYPE_FIAT_CONVERSION: u8 = 4;

    // Transaction status
    const STATUS_PENDING: u8 = 0;
    const STATUS_COMPLETED: u8 = 1;
    const STATUS_FAILED: u8 = 2;

    /// Transaction record stored on-chain
    public struct TransactionRecord has key, store {
        id: UID,
        owner: address,
        transaction_type: u8,
        from_asset: String,
        to_asset: String,
        from_amount: u64, // Amount in base units (e.g., MIST for SUI)
        to_amount: u64,
        recipient: String,
        sender_addr: String,
        bank_name: String,
        account_number: String,
        transaction_id: String,
        timestamp: u64,
        status: u8,
        gas_used: u64,
    }

    /// Global registry to track all user transaction histories
    public struct TransactionRegistry has key {
        id: UID,
        user_transactions: Table<address, vector<address>>, // user address -> list of transaction object IDs
    }

    /// Event emitted when a transaction is recorded
    public struct TransactionRecorded has copy, drop {
        transaction_id: address,
        owner: address,
        transaction_type: u8,
        from_asset: String,
        to_asset: String,
        from_amount: u64,
        to_amount: u64,
        timestamp: u64,
    }

    /// Initialize the transaction registry (call once during module publish)
    fun init(ctx: &mut TxContext) {
        let registry = TransactionRegistry {
            id: new(ctx),
            user_transactions: table::new<address, vector<address>>(ctx),
        };
        transfer::share_object(registry);
    }

    /// Record a new transaction on-chain
    public entry fun record_transaction(
        registry: &mut TransactionRegistry,
        clock: &Clock,
        transaction_type: u8,
        from_asset: String,
        to_asset: String,
        from_amount: u64,
        to_amount: u64,
        recipient: String,
        sender_addr: String,
        bank_name: String,
        account_number: String,
        transaction_id: String,
        status: u8,
        gas_used: u64,
        ctx: &mut TxContext
    ) {
        let owner = sender(ctx);
        let timestamp = clock::timestamp_ms(clock);

        let transaction = TransactionRecord {
            id: new(ctx),
            owner,
            transaction_type,
            from_asset,
            to_asset,
            from_amount,
            to_amount,
            recipient,
            sender_addr,
            bank_name,
            account_number,
            transaction_id,
            timestamp,
            status,
            gas_used,
        };

        let transaction_addr = uid_to_address(&transaction.id);

        // Add to user's transaction list
        if (!table::contains(&registry.user_transactions, owner)) {
            table::add(&mut registry.user_transactions, owner, vector::empty<address>());
        };
        
        let user_txs = table::borrow_mut(&mut registry.user_transactions, owner);
        vector::push_back(user_txs, transaction_addr);

        // Emit event
        event::emit(TransactionRecorded {
            transaction_id: transaction_addr,
            owner,
            transaction_type,
            from_asset,
            to_asset,
            from_amount,
            to_amount,
            timestamp,
        });

        // Transfer the transaction record to the owner
        transfer::transfer(transaction, owner);
    }

    /// Update transaction status
    public entry fun update_status(
        transaction: &mut TransactionRecord,
        new_status: u8,
        ctx: &TxContext
    ) {
        assert!(transaction.owner == sender(ctx), ENotOwner);
        transaction.status = new_status;
    }

    // Getter functions for reading transaction data
    public fun get_owner(transaction: &TransactionRecord): address {
        transaction.owner
    }

    public fun get_type(transaction: &TransactionRecord): u8 {
        transaction.transaction_type
    }

    public fun get_from_asset(transaction: &TransactionRecord): String {
        transaction.from_asset
    }

    public fun get_to_asset(transaction: &TransactionRecord): String {
        transaction.to_asset
    }

    public fun get_from_amount(transaction: &TransactionRecord): u64 {
        transaction.from_amount
    }

    public fun get_to_amount(transaction: &TransactionRecord): u64 {
        transaction.to_amount
    }

    public fun get_timestamp(transaction: &TransactionRecord): u64 {
        transaction.timestamp
    }

    public fun get_status(transaction: &TransactionRecord): u8 {
        transaction.status
    }

    public fun get_transaction_id(transaction: &TransactionRecord): String {
        transaction.transaction_id
    }

    public fun get_recipient(transaction: &TransactionRecord): String {
        transaction.recipient
    }

    public fun get_bank_name(transaction: &TransactionRecord): String {
        transaction.bank_name
    }

    public fun get_account_number(transaction: &TransactionRecord): String {
        transaction.account_number
    }
}

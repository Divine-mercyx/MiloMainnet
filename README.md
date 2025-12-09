# MYLO Conversational Wallet

A conversational crypto wallet that simplifies complex blockchain operations through natural language commands.

## Paystack Test Mode Limit

When testing the bank account verification feature, you may encounter the following error:

```
Test mode daily limit of 3 live bank resolves exceeded. Use test bank codes 001 or upgrade to live mode.
```

This is a limitation of Paystack's test mode, which restricts live bank account verification to 3 requests per day.

### Workaround Solutions:

1. **Use the Test Account Number**: 
   - Enter account number "0000000000" with any bank
   - The system will automatically verify this as a test account

2. **Use Paystack's Official Test Data**:
   - Account Number: 0000000000
   - Bank Code: 001 (Test bank)

3. **Wait for the Daily Limit to Reset**:
   - The limit resets every 24 hours

### For Production Use:
- Upgrade your Paystack account to live mode to remove these limitations

## On-Chain Transaction History

MYLO stores transaction history immutably on the SUI blockchain for transparency and verification.

### Deploy Transaction History Module

1. **Navigate to the Move package**:
   ```bash
   cd milo_nft
   ```

2. **Build and publish the contract**:
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **After deployment, note down**:
   - Package ID (starts with `0x...`)
   - TransactionRegistry object ID (a shared object created during init)

4. **Update your `.env` file**:
   ```
   VITE_TRANSACTION_HISTORY_PACKAGE_ID=0x_your_package_id
   VITE_TRANSACTION_REGISTRY_ID=0x_your_registry_id
   ```

### How It Works

- Every swap/transfer/mint creates an on-chain transaction record
- Records are stored as owned objects and indexed by the TransactionRegistry
- Transaction history is fetched directly from the blockchain
- Data is immutable and verifiable by anyone
- No centralized database required
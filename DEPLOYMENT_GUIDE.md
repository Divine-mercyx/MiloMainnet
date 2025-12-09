# On-Chain Transaction History - Deployment Guide

This guide will help you deploy the transaction history Move contract to the SUI blockchain.

## Prerequisites

- SUI CLI installed (`sui --version` to verify)
- Active SUI wallet with testnet/mainnet SUI for gas fees
- Basic understanding of SUI Move contracts

## Step 1: Navigate to the Move Package

```bash
cd milo_nft
```

## Step 2: Build the Contract (Optional - Test for Errors)

```bash
sui move build
```

This will compile the contract and show any errors. Fix any issues before proceeding.

## Step 3: Publish to Testnet

For testing, publish to testnet first:

```bash
sui client publish --gas-budget 100000000
```

### What to Expect:

The command will output several important pieces of information. Look for:

1. **Package ID**: This is your deployed contract address
   ```
   Published Objects:
   ├─ PackageID: 0x1234abcd...
   ```

2. **Transaction Registry ID**: Look for the shared object created during `init()`
   ```
   Created Objects:
   ├─ ObjectID: 0x5678efgh... (TransactionRegistry - SHARED)
   ```

## Step 4: Save the IDs

Copy the Package ID and Registry ID from the output.

## Step 5: Update Environment Variables

Create or update your `.env` file:

```bash
# In the root directory (MiloMainnet/)
cp .env.example .env
```

Edit `.env` and replace the placeholder values:

```env
VITE_TRANSACTION_HISTORY_PACKAGE_ID=0x1234abcd... # Your Package ID
VITE_TRANSACTION_REGISTRY_ID=0x5678efgh...        # Your Registry ID
```

## Step 6: Verify Deployment

You can verify the deployment using SUI Explorer:

**Testnet**: https://suiexplorer.com/?network=testnet
**Mainnet**: https://suiexplorer.com/?network=mainnet

Search for your Package ID to see the deployed contract.

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Perform a swap transaction

3. Check the browser console for confirmation messages:
   - "Transaction recorded on blockchain!" - Success
   - Any errors will be logged

4. View transaction history in the Activity page

## Deploy to Mainnet

When ready for production:

1. Switch to mainnet:
   ```bash
   sui client switch --env mainnet
   ```

2. Ensure you have enough SUI for gas fees

3. Publish the contract:
   ```bash
   sui client publish --gas-budget 100000000
   ```

4. Update your `.env` with mainnet Package ID and Registry ID

5. Update `VITE_NETWORK=mainnet` in `.env`

## Troubleshooting

### Error: "Insufficient gas"

Increase the gas budget:
```bash
sui client publish --gas-budget 200000000
```

### Error: "Package not found"

Make sure you're in the `milo_nft` directory when running the publish command.

### Error: "Active address not set"

Configure your SUI wallet:
```bash
sui client active-address
```

If no address is set, create or import one:
```bash
sui client new-address ed25519
```

### Transactions Not Showing

1. Check that env variables are set correctly
2. Ensure you're connected with the correct wallet
3. Check browser console for errors
4. Verify the package is deployed on the correct network (testnet/mainnet)

## On-Chain Data Structure

Each transaction record contains:
- Transaction type (swap, send, receive, mint, fiat_conversion)
- Asset details (from/to, amounts)
- Bank information (for fiat conversions)
- Timestamp (blockchain time)
- Status (pending, completed, failed)
- Gas used

All data is immutable once recorded on the blockchain.

## Cost Considerations

- **Gas cost per transaction**: ~0.001-0.01 SUI depending on network congestion
- Records are stored as owned objects (minimal ongoing cost)
- No recurring fees - one-time gas payment per transaction

## Next Steps

After successful deployment:

1. Test thoroughly on testnet
2. Monitor gas costs
3. Consider implementing transaction batching for high-volume use
4. Set up event listeners for real-time updates
5. Deploy to mainnet when ready for production

## Support

For issues or questions:
- Check SUI documentation: https://docs.sui.io
- SUI Discord: https://discord.gg/sui
- GitHub Issues: Create an issue in this repository

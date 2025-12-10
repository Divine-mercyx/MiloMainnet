import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

async function findTransactionRegistry(packageId: string) {
  const client = new SuiClient({ url: getFullnodeUrl('testnet') }); // Change to 'mainnet' if needed
  
  try {
    console.log(`Searching for TransactionRegistry from package: ${packageId}\n`);
    
    // Get the current address
    const address = process.env.SUI_ADDRESS || 'YOUR_ADDRESS_HERE';
    
    // Get all owned objects
    const objects = await client.getOwnedObjects({
      owner: address,
      options: {
        showType: true,
        showContent: true,
      },
    });
    
    console.log(`Found ${objects.data.length} objects owned by ${address}\n`);
    
    // Look for TransactionRegistry
    for (const obj of objects.data) {
      if (obj.data?.type) {
        const type = obj.data.type as string;
        if (type.includes('TransactionRegistry') || type.includes('transaction_history')) {
          console.log('✅ Found TransactionRegistry!');
          console.log(`Registry ID: ${obj.data.objectId}`);
          console.log(`Type: ${type}`);
          console.log('\nAdd this to your .env file:');
          console.log(`VITE_TRANSACTION_REGISTRY_ID=${obj.data.objectId}`);
          return;
        }
      }
    }
    
    console.log('❌ TransactionRegistry not found in owned objects.');
    console.log('\nTrying to find shared objects...\n');
    
    // TransactionRegistry is a shared object, so we need to query differently
    // We'll look at the package's published objects
    const packageInfo = await client.getObject({
      id: packageId,
      options: {
        showContent: true,
        showPreviousTransaction: true,
      },
    });
    
    if (packageInfo.data?.previousTransaction) {
      console.log(`Found publish transaction: ${packageInfo.data.previousTransaction}`);
      
      // Get the transaction details
      const txBlock = await client.getTransactionBlock({
        digest: packageInfo.data.previousTransaction,
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      });
      
      console.log('\nObjects created in publish transaction:\n');
      
      if (txBlock.objectChanges) {
        for (const change of txBlock.objectChanges) {
          if (change.type === 'created' || change.type === 'published') {
            console.log(`- ${change.objectType || 'Unknown type'}`);
            console.log(`  ID: ${change.objectId || 'N/A'}`);
            
            if (change.objectType && change.objectType.includes('TransactionRegistry')) {
              console.log('\n✅ Found TransactionRegistry!');
              console.log(`Registry ID: ${change.objectId}`);
              console.log('\nAdd this to your .env file:');
              console.log(`VITE_TRANSACTION_REGISTRY_ID=${change.objectId}`);
              return;
            }
          }
        }
      }
    }
    
    console.log('\n❌ Could not find TransactionRegistry.');
    console.log('Please check your package ID or re-publish the contract.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
const packageId = process.argv[2];

if (!packageId) {
  console.log('Usage: tsx find-registry.ts <PACKAGE_ID>');
  console.log('Example: tsx find-registry.ts 0x123abc...');
  process.exit(1);
}

findTransactionRegistry(packageId);

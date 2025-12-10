// import {  } from '@naviprotocol/lending';
// import { Transaction } from '@mysten/sui/transactions';
// import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

// // Initialize the Modern Navi Client
// const client = new NaviClient({ networkType: 'mainnet' });

// export const NaviService = {
  
//   /**
//    * 1. GET YIELD & POOL DATA
//    * Calculates how much you will earn.
//    */
//   async getPoolYieldInfo(coinType: 'SUI' | 'USDC' | 'USDT' | 'WETH') {
//     // The new SDK lets you get reserves easily
//     const reserves = await client.getReserves();
    
//     // Find the specific pool (reserve) for the token
//     const pool = reserves.find(r => r.symbol === coinType);
//     if (!pool) throw new Error(`Pool for ${coinType} not found`);

//     // Parse APY (Supply Rate)
//     // The SDK returns these as strings usually
//     const supplyApy = Number(pool.supply_apy); 
//     const borrowApy = Number(pool.borrow_apy);

//     return {
//       symbol: pool.symbol,
//       supplyApy: supplyApy.toFixed(2) + '%',
//       borrowApy: borrowApy.toFixed(2) + '%',
//       totalSupplied: pool.total_supply,
//       // Helper function to estimate earnings for a specific amount
//       calculateEarnings: (amount: number) => {
//         const daily = (amount * (supplyApy / 100)) / 365;
//         return {
//           daily: daily.toFixed(4),
//           monthly: (daily * 30).toFixed(4),
//           yearly: (amount * (supplyApy / 100)).toFixed(4)
//         };
//       }
//     };
//   },

//   /**
//    * 2. CREATE SUPPLY (LEND) TRANSACTION
//    */
//   async createSupplyTx(
//     senderAddress: string,
//     coinType: 'SUI' | 'USDC' | 'USDT' | 'WETH',
//     amount: number
//   ) {
//     const tx = new Transaction();
//     tx.setSender(senderAddress);

//     // Get the Pool Config from the SDK
//     const pool = client.getPoolConfigBySymbol(coinType);
//     if (!pool) throw new Error('Invalid Coin Type');

//     const amountInMist = amount * Math.pow(10, pool.coin_decimal);
    
//     // --- COIN MANAGEMENT ---
//     let coinObject;
//     if (coinType === 'SUI') {
//         // If SUI, split from gas
//         coinObject = tx.splitCoins(tx.gas, [amountInMist]);
//     } else {
//         // If USDC/USDT, the UI must have already selected the object, 
//         // OR we just assume the wallet will handle object selection (advanced).
//         // For simplicity in this snippet, we demand the Frontend passes the object ID.
//         // In a real app, you'd use `tx.moveCall` to merge coins first.
//         throw new Error("For non-SUI assets, pass the coin object ID logic here");
//     }

//     // --- NAVI INTERACTION ---
//     // The new SDK simplifies the deposit call
//     await client.deposit(tx, {
//         pool,
//         amount: amountInMist,
//         coinObject: coinObject,
//     });

//     return tx;
//   },

//   /**
//    * 3. GET USER PORTFOLIO
//    * See what the user has already lent/borrowed
//    */
//   async getPortfolio(userAddress: string) {
//     // This returns a detailed object of all user positions
//     const portfolio = await client.getAccountPortfolio(userAddress);
//     return portfolio;
//   }
// };
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { initCetusSDK, Percentage, d } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { BN } from 'bn.js';

/**
 * Service for handling token swaps on Sui using Cetus SDK
 */
export class SwapService {
  private client: SuiClient;
  private cetusSdk: any;

  constructor(client: SuiClient) {
    this.client = client;
    // Initialize Cetus SDK
    this.cetusSdk = initCetusSDK({ network: 'mainnet' });
  }

  /**
   * Get all pools from Cetus
   */
  async getAllPools() {
    try {
      const pools = await this.cetusSdk.Pool.getPools();
      return pools;
    } catch (error) {
      console.error('Error fetching pools:', error);
      throw error;
    }
  }

  /**
   * Find SUI/USDC pool
   */
  async findSuiUsdcPool() {
    try {
      const pools = await this.getAllPools();
      
      const suiCoinType = '0x2::sui::SUI';
      
      // Common USDC contract address on Sui
      const usdcCoinType = '0x5d4b302506645c37ff133b98c4b7f1d8d9ca5a38e284d351c952093bed373099::coin::COIN';
      
      const suiUsdcPool = pools.find((pool: any) => 
        (pool.coin_type_a === suiCoinType && pool.coin_type_b === usdcCoinType) ||
        (pool.coin_type_a === usdcCoinType && pool.coin_type_b === suiCoinType)
      );
      
      return suiUsdcPool;
    } catch (error) {
      console.error('Error finding SUI/USDC pool:', error);
      throw error;
    }
  }

  /**
   * Get quote for SUI to USDC swap using Cetus
   */
  async getSuiToUsdcQuote(amount: number): Promise<number> {
    try {
      const pool = await this.findSuiUsdcPool();
      if (!pool) {
        throw new Error('SUI/USDC pool not found');
      }
      
      const suiCoinType = '0x2::sui::SUI';
      const a2b = pool.coin_type_a === suiCoinType;
      
      const swapParams = {
        pool,
        current_sqrt_price: pool.current_sqrt_price,
        coin_type_a: pool.coin_type_a,
        coin_type_b: pool.coin_type_b,
        decimals_a: 9, 
        decimals_b: 6, 
        a2b,
        by_amount_in: true,
        amount: (amount * 1_000_000_000).toString(), 
      };
      
      const quote = await this.cetusSdk.Swap.preSwap(swapParams);
      
      const estimatedOutput = parseInt(quote.amount) / 1_000_000;
      
      return estimatedOutput;
    } catch (error) {
      console.error('Error getting SUI/USDC quote:', error);
      return amount * 1.2;
    }
  }

  /**
   * Swap SUI to USDC using Cetus SDK
   */
  async swapSuiToUsdc(amount: number, senderAddress: string): Promise<any> {
    try {
      this.cetusSdk.senderAddress = senderAddress;
      
      const pool = await this.findSuiUsdcPool();
      if (!pool) {
        throw new Error('SUI/USDC pool not found');
      }
      
      const suiCoinType = '0x2::sui::SUI';
      const usdcCoinType = '0x5d4b302506645c37ff133b98c4b7f1d8d9ca5a38e284d351c952093bed373099::coin::COIN';
      const a2b = pool.coin_type_a === suiCoinType;
      
      const slippage = Percentage.fromDecimal(d(0.05));
      
      const amountInBaseUnits = new BN(amount * 1_000_000_000);
      
      const swapPayload = await this.cetusSdk.Swap.createSwapTransactionPayload({
        pool_id: pool.pool_id,
        a2b,
        by_amount_in: true,
        amount: amountInBaseUnits.toString(),
        amount_limit: '0', 
        slippage
      });
      
      const tx = new Transaction();
      
      tx.add(swapPayload);
      
      const estimatedOutput = await this.getSuiToUsdcQuote(amount);
      
      return {
        tx,
        estimatedOutput,
        pool,
        fee: 0.001 * amount 
      };
    } catch (error) {
      console.error('Error swapping SUI to USDC:', error);
      throw error;
    }
  }
}
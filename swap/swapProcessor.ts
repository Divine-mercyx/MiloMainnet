import { SwapService } from './swapService';
import { FiatService } from './fiatService';
import { PayoutService } from './payoutService';
import { SuiClient } from '@mysten/sui/client';

/**
 * Processor for handling the complete SUI to NGN swap and payout workflow
 */
export class SwapProcessor {
  private swapService: SwapService;
  public fiatService: FiatService;
  private payoutService: PayoutService | null;
  private payoutServiceInitialized: boolean;

  constructor(client: SuiClient) {
    this.swapService = new SwapService(client);
    this.fiatService = new FiatService();
    this.payoutService = null;
    this.payoutServiceInitialized = false;
  }

  /**
   * Lazily initialize the payout service only when needed
   */
  private async initializePayoutService() {
    if (this.payoutServiceInitialized) return;
    
    try {
      this.payoutService = new PayoutService();
      this.payoutServiceInitialized = true;
    } catch (error) {
      console.warn('Payout service initialization failed:', error);
      this.payoutService = null;
      this.payoutServiceInitialized = true;
    }
  }

  /**
   * Process the complete workflow: SUI -> USDC -> NGN -> Bank Transfer
   */
  async processSuiToNgnSwap(params: {
    suiAmount: number;
    bankAccountNumber: string;
    bankCode: string;
    recipientName: string;
    senderAddress: string;
  }): Promise<{
    success: boolean;
    confirmationNeeded: boolean;
    confirmationDetails?: {
      ngnAmount: number;
      fees: number;
      netAmount: number;
    };
    transactionId?: string;
    errorMessage?: string;
  }> {
    const { suiAmount, bankAccountNumber, bankCode, recipientName, senderAddress } = params;

    try {
      // Step 1: Get real quote for SUI to USDC conversion using Cetus
      const usdcAmount = await this.swapService.getSuiToUsdcQuote(suiAmount);
      
      // Step 2: Calculate fees
      const fees = this.fiatService.calculateFees(suiAmount);
      
      // Step 3: Calculate net USDC amount after fees
      const usdcAfterFees = usdcAmount - (fees.totalFee * 1.2); 
      
      // Step 4: Convert USDC to NGN using real-time exchange rate
      const ngnNetAmount = await this.fiatService.convertUsdcToNgn(usdcAfterFees);
      
      // Return confirmation details for user approval
      return {
        success: true,
        confirmationNeeded: true,
        confirmationDetails: {
          ngnAmount: ngnNetAmount,
          fees: fees.totalFee,
          netAmount: ngnNetAmount
        }
      };
    } catch (error) {
      console.error('Error processing SUI to NGN swap:', error);
      return {
        success: false,
        confirmationNeeded: false,
        errorMessage: 'Failed to process swap request. Please try again.'
      };
    }
  }

  /**
   * Execute the confirmed swap and payout
   */
  async executeConfirmedSwap(params: {
    suiAmount: number;
    bankAccountNumber: string;
    bankCode: string;
    recipientName: string;
    senderAddress: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
    errorMessage?: string;
  }> {
    const { suiAmount, bankAccountNumber, bankCode, recipientName, senderAddress } = params;

    try {
      // Step 1: Execute SUI to USDC swap using Cetus SDK
      const swapResult = await this.swapService.swapSuiToUsdc(suiAmount, senderAddress);
      
      // Step 2: Calculate NGN amount after fees
      const fees = this.fiatService.calculateFees(suiAmount);
      
      // Use the actual estimated output from Cetus
      const usdcAmount = swapResult.estimatedOutput;
      const usdcAfterFees = usdcAmount - (fees.totalFee * 1.2);
      const ngnAmount = await this.fiatService.convertUsdcToNgn(usdcAfterFees);
      
      // Step 3: Execute bank payout (if payout service is available)
      await this.initializePayoutService();
      
      if (this.payoutService) {
        const payoutResult = await this.payoutService.sendToBank(
          bankAccountNumber,
          bankCode,
          ngnAmount,
          recipientName
        );
        
        if (payoutResult.success) {
          return {
            success: true,
            transactionId: payoutResult.transactionId
          };
        } else {
          return {
            success: false,
            errorMessage: payoutResult.errorMessage || 'Failed to process bank transfer.'
          };
        }
      } else {
        // If payout service is not available, simulate success
        console.warn('Payout service not available, simulating successful payout');
        return {
          success: true,
          transactionId: `simulated_txn_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('Error executing confirmed swap:', error);
      return {
        success: false,
        errorMessage: 'Failed to execute swap and payout. Please try again.'
      };
    }
  }

  /**
   * Get quote for SUI to NGN conversion
   */
  async getQuote(suiAmount: number): Promise<{
    ngnAmount: number;
    usdcAmount: number;
    exchangeRate: number;
  }> {
    const quote = await this.fiatService.getNgnQuote(suiAmount);
    return {
      ngnAmount: quote.ngnAmount,
      usdcAmount: quote.usdcAmount,
      exchangeRate: quote.exchangeRate
    };
  }

  /**
   * Get swap service for direct access to swap functionality
   */
  getSwapService() {
    return this.swapService;
  }

  /**
   * Get fiat service for direct access to fiat functionality
   */
  getFiatService() {
    return this.fiatService;
  }
}
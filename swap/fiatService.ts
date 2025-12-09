/**
 * Service for handling fiat currency conversions
 */
export class FiatService {
  // Simulated exchange rates (in a real app, these would come from an API)
  private exchangeRates = {
    USDC_TO_NGN: 1500, // 1 USDC = 1500 NGN
    SUI_TO_NGN: 1800,  // 1 SUI = 1800 NGN (derived from SUI->USDC->NGN)
  };

  /**
   * Convert USDC to Nigerian Naira
   */
  convertUsdcToNgn(usdcAmount: number): number {
    return usdcAmount * this.exchangeRates.USDC_TO_NGN;
  }

  /**
   * Convert SUI to Nigerian Naira (through USDC)
   */
  convertSuiToNgn(suiAmount: number): number {
    return suiAmount * this.exchangeRates.SUI_TO_NGN;
  }

  /**
   * Get the current NGN quote for a given amount of SUI
   */
  async getNgnQuote(suiAmount: number): Promise<{ 
    ngnAmount: number; 
    usdcAmount: number;
    exchangeRate: number;
  }> {
    // First convert SUI to USDC
    const usdcAmount = suiAmount * 1.2; // Simulated SUI to USDC rate
    
    // Then convert USDC to NGN
    const ngnAmount = usdcAmount * this.exchangeRates.USDC_TO_NGN;
    
    return {
      ngnAmount,
      usdcAmount,
      exchangeRate: this.exchangeRates.USDC_TO_NGN
    };
  }

  /**
   * Calculate fees for the conversion
   */
  calculateFees(suiAmount: number): { 
    networkFee: number; 
    conversionFee: number; 
    totalFee: number;
    totalAfterFees: number;
  } {
    const networkFee = 0.001; 
    const conversionFee = suiAmount * 0.005; 
    const totalFee = networkFee + conversionFee;
    const totalAfterFees = suiAmount - totalFee;
    
    return {
      networkFee,
      conversionFee,
      totalFee,
      totalAfterFees
    };
  }
}
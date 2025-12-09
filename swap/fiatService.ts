import { DataService } from '../services/dataService';

/**
 * Service for handling fiat currency conversions
 */
export class FiatService {
  // Cache for exchange rates to avoid repeated API calls
  private cachedRates: {
    usdcToNgn: number | null;
    suiToNgn: number | null;
    lastUpdated: number | null;
  } = {
    usdcToNgn: null,
    suiToNgn: null,
    lastUpdated: null
  };

  // Cache expiration time (5 minutes)
  private CACHE_EXPIRATION = 5 * 60 * 1000;

  /**
   * Get fresh or cached USD to NGN exchange rate
   */
  private async getUsdToNgnRate(): Promise<number> {
    const now = Date.now();
    
    // Check if cache is valid
    if (this.cachedRates.usdcToNgn && 
        this.cachedRates.lastUpdated && 
        (now - this.cachedRates.lastUpdated) < this.CACHE_EXPIRATION) {
      return this.cachedRates.usdcToNgn;
    }

    // Fetch fresh rate
    try {
      const rate = await DataService.getUsdToNgnRate();
      this.cachedRates.usdcToNgn = rate;
      this.cachedRates.lastUpdated = now;
      return rate;
    } catch (error) {
      console.error('Error fetching USD to NGN rate:', error);
      // Return cached rate if available, otherwise fallback
      return this.cachedRates.usdcToNgn || 1500;
    }
  }

  /**
   * Get fresh or cached SUI price in USD
   */
  private async getSuiPrice(): Promise<number> {
    try {
      return await DataService.getSuiPrice();
    } catch (error) {
      console.error('Error fetching SUI price:', error);
      return 1.85; // Fallback price
    }
  }

  /**
   * Convert USDC to Nigerian Naira using real-time exchange rate
   */
  async convertUsdcToNgn(usdcAmount: number): Promise<number> {
    const rate = await this.getUsdToNgnRate();
    return usdcAmount * rate;
  }

  /**
   * Convert SUI to Nigerian Naira using real-time exchange rates
   */
  async convertSuiToNgn(suiAmount: number): Promise<number> {
    const suiPrice = await this.getSuiPrice();
    const usdAmount = suiAmount * suiPrice;
    const rate = await this.getUsdToNgnRate();
    return usdAmount * rate;
  }

  /**
   * Get the current NGN quote for a given amount of SUI with real-time rates
   */
  async getNgnQuote(suiAmount: number): Promise<{ 
    ngnAmount: number; 
    usdcAmount: number;
    exchangeRate: number;
    suiToUsdRate: number;
  }> {
    // Get real SUI price
    const suiPrice = await this.getSuiPrice();
    const usdcAmount = suiAmount * suiPrice;
    
    // Get real USD to NGN rate
    const ngnRate = await this.getUsdToNgnRate();
    const ngnAmount = usdcAmount * ngnRate;
    
    return {
      ngnAmount,
      usdcAmount,
      exchangeRate: ngnRate,
      suiToUsdRate: suiPrice
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
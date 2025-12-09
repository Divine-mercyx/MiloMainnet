import { LendingOpportunity, PortfolioStats, Platform } from '../types/types';

// Map common token symbols to readable names
const SYMBOL_MAP: Record<string, string> = {
  'SUI': 'Sui',
  'USDC': 'USD Coin',
  'USDT': 'Tether',
  'WETH': 'Ethereum',
  'WBTC': 'Bitcoin',
  'CETUS': 'Cetus',
  'NAVX': 'Navi',
  'SCA': 'Scallop',
  'HASUI': 'HaSui',
  'VSUI': 'Volo Sui',
  'AFSUI': 'Aftermath Sui',
  'BUCK': 'Bucket',
  'AUSD': 'Agora USD',
  'FUD': 'Fud the Pug',
  'DEEP': 'DeepBook',
  'SOL': 'Solana'
};

export const DataService = {
  // Fetch real SUI price from Binance Public API
  async getSuiPrice(): Promise<number> {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SUIUSDT');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return parseFloat(data.price);
    } catch (e) {
      console.warn("API limit or error, using fallback price", e);
      return 1.85; // Fallback
    }
  },

  // Get price for any supported token
  async getTokenPrice(symbol: string): Promise<number> {
    const s = symbol.toUpperCase().replace(/^W/, ''); // Normalize WBTC -> BTC, WETH -> ETH
    
    // 1. SUI (Use existing method)
    if (s === 'SUI') return this.getSuiPrice();

    // 2. Stablecoins (Pegged to 1 for MVP)
    if (['USDC', 'USDT', 'USDY', 'AUSD', 'BUCK', 'FDUSD'].includes(s)) return 1.0;
    
    // 3. Liquid Staking Tokens (Approx SUI price)
    if (['HASUI', 'VSUI', 'AFSUI', 'STSUI'].includes(s)) {
        return this.getSuiPrice();
    }

    // 4. Majors via Binance
    if (['BTC', 'ETH', 'SOL', 'BNB'].includes(s)) {
        try {
            const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}USDT`);
            if (res.ok) {
                const data = await res.json();
                return parseFloat(data.price);
            }
        } catch (e) { console.warn('Price fetch failed for', s); }
    }

    // 5. Ecosystem Tokens (Static Fallback for Demo/Stability)
    // In a prod app, use CoinGecko/Birdeye API with a key
    const PRICES: Record<string, number> = {
        'CETUS': 0.35,
        'NAVX': 0.15,
        'SCA': 0.85,
        'DEEP': 0.08,
        'FUD': 0.0000008,
        'NS': 0.2,
        'IKA': 0.05
    };
    
    return PRICES[s] || 0;
  },

  // Fetch real-time USD to NGN exchange rate from exchangerate-api.com
  async getUsdToNgnRate(): Promise<number> {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!res.ok) throw new Error('Failed to fetch exchange rate');
      const data = await res.json();
      return data.rates.NGN || 1500; // Fallback to 1500 if NGN rate not found
    } catch (e) {
      console.warn("Error fetching USD to NGN rate, using fallback", e);
      return 1500; // Fallback rate
    }
  },

  // Fetch live lending rates from DefiLlama
  async getLendingRates(): Promise<LendingOpportunity[]> {
    try {
      const res = await fetch('https://yields.llama.fi/pools');
      if (!res.ok) throw new Error('Failed to fetch yields');
      const json = await res.json();
      
      const targetProtocols = ['navi-lending', 'scallop-lend', 'suilend'];
      
      const suiPools = json.data.filter((pool: any) => 
        pool.chain === 'Sui' && 
        targetProtocols.includes(pool.project)
      );

      return suiPools.map((pool: any) => {
        let platform: Platform = 'Navi';
        if (pool.project === 'scallop-lend') platform = 'Scallop';
        if (pool.project === 'suilend') platform = 'Suilend';
        
        return {
          id: pool.pool,
          asset: SYMBOL_MAP[pool.symbol] || pool.symbol,
          symbol: pool.symbol,
          platform: platform,
          apy: pool.apy,
          tvl: pool.tvlUsd,
          trend: 'stable'
        };
      });
    } catch (e) {
      console.error("Error fetching lending rates:", e);
      return [];
    }
  },

  // Simulate fetching user portfolio data
  async getPortfolio(address: string): Promise<PortfolioStats> {
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
          totalValue: 12450.80 + (Math.random() * 50 - 25),
          dailyEarnings: 4.25 + (Math.random() * 0.1),
          netApy: 12.8 + (Math.random() * 0.2 - 0.1)
      };
  }
};
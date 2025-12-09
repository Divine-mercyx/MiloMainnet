import { ExchangeRatePoint } from '../types/types';

const STORAGE_KEY = 'mylo_exchange_rate_history';
const MAX_POINTS = 50; // Keep last 50 data points

export const ExchangeRateService = {
  /**
   * Save exchange rate data point
   */
  saveRatePoint(point: ExchangeRatePoint): void {
    try {
      const existing = this.getRateHistory();
      existing.push(point);
      
      // Keep only last MAX_POINTS
      const limited = existing.slice(-MAX_POINTS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving exchange rate:', error);
    }
  },

  /**
   * Get exchange rate history
   */
  getRateHistory(): ExchangeRatePoint[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
      return [];
    }
  },

  /**
   * Clear all exchange rate history
   */
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Get last 24 hours of data
   */
  getLast24Hours(): ExchangeRatePoint[] {
    const all = this.getRateHistory();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return all.filter(point => point.timestamp >= oneDayAgo);
  }
};

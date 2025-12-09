import { TransactionHistory } from '../types/types';

const STORAGE_KEY = 'mylo_transaction_history';

export const TransactionHistoryService = {
  /**
   * Save a transaction to history
   */
  saveTransaction(transaction: TransactionHistory): void {
    try {
      const existing = this.getAllTransactions();
      existing.unshift(transaction); // Add to beginning
      
      // Keep only last 100 transactions
      const limited = existing.slice(0, 100);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  },

  /**
   * Get all transactions
   */
  getAllTransactions(): TransactionHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const transactions = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return transactions.map((tx: any) => ({
        ...tx,
        timestamp: new Date(tx.timestamp)
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  },

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: string): TransactionHistory[] {
    return this.getAllTransactions().filter(tx => tx.type === type);
  },

  /**
   * Clear all transaction history
   */
  clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Delete a specific transaction
   */
  deleteTransaction(id: string): void {
    try {
      const existing = this.getAllTransactions();
      const filtered = existing.filter(tx => tx.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }
};

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { TransactionHistory, TransactionType } from '../types/types';

// Transaction type mapping to on-chain constants
const TRANSACTION_TYPE_MAP: Record<TransactionType, number> = {
  'swap': 0,
  'send': 1,
  'receive': 2,
  'mint': 3,
  'fiat_conversion': 4,
};

// Status mapping
const STATUS_MAP = {
  'pending': 0,
  'completed': 1,
  'failed': 2,
} as const;

// Reverse mappings for reading from chain
const TRANSACTION_TYPE_REVERSE: Record<number, TransactionType> = {
  0: 'swap',
  1: 'send',
  2: 'receive',
  3: 'mint',
  4: 'fiat_conversion',
};

const STATUS_REVERSE = {
  0: 'pending',
  1: 'completed',
  2: 'failed',
} as const;

/**
 * Service for managing transaction history on-chain using SUI blockchain
 */
export class OnChainTransactionService {
  private client: SuiClient;
  private packageId: string;
  private registryId: string;

  constructor(client: SuiClient, packageId: string, registryId: string) {
    this.client = client;
    this.packageId = packageId;
    this.registryId = registryId;
  }

  /**
   * Create a transaction to record transaction history on-chain
   * This returns a Transaction object that needs to be signed and executed by the user
   */
  createRecordTransactionTx(transaction: TransactionHistory): Transaction {
    const tx = new Transaction();

    // Convert amounts to base units (MIST for SUI, etc.)
    const fromAmountMist = Math.floor((transaction.fromAmount || 0) * 1_000_000_000);
    const toAmountMist = Math.floor((transaction.toAmount || 0) * 1_000_000_000);
    const gasUsedMist = Math.floor((transaction.gasUsed || 0) * 1_000_000_000);

    tx.moveCall({
      target: `${this.packageId}::transaction_history::record_transaction`,
      arguments: [
        tx.object(this.registryId), // TransactionRegistry shared object
        tx.object('0x6'), // Clock object (standard SUI clock)
        tx.pure.u8(TRANSACTION_TYPE_MAP[transaction.type]), // transaction_type
        tx.pure.string(transaction.fromAsset || ''), // from_asset
        tx.pure.string(transaction.toAsset || ''), // to_asset
        tx.pure.u64(fromAmountMist), // from_amount
        tx.pure.u64(toAmountMist), // to_amount
        tx.pure.string(transaction.recipient || ''), // recipient
        tx.pure.string(transaction.sender || ''), // sender_addr
        tx.pure.string(transaction.bankName || ''), // bank_name
        tx.pure.string(transaction.accountNumber || ''), // account_number
        tx.pure.string(transaction.transactionId || ''), // transaction_id
        tx.pure.u8(STATUS_MAP[transaction.status]), // status
        tx.pure.u64(gasUsedMist), // gas_used
      ],
    });

    return tx;
  }

  /**
   * Fetch all transactions for a user from the blockchain
   */
  async getUserTransactions(userAddress: string): Promise<TransactionHistory[]> {
    try {
      // Get all objects owned by the user that are TransactionRecord type
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId}::transaction_history::TransactionRecord`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const transactions: TransactionHistory[] = [];

      for (const obj of objects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;

          // Convert from MIST to SUI (divide by 1B)
          const fromAmount = Number(fields.from_amount) / 1_000_000_000;
          const toAmount = Number(fields.to_amount) / 1_000_000_000;
          const gasUsed = Number(fields.gas_used) / 1_000_000_000;

          const transaction: TransactionHistory = {
            id: fields.transaction_id || obj.data.objectId,
            type: TRANSACTION_TYPE_REVERSE[Number(fields.transaction_type)] || 'swap',
            fromAsset: fields.from_asset || undefined,
            toAsset: fields.to_asset || undefined,
            fromAmount: fromAmount || undefined,
            toAmount: toAmount || undefined,
            recipient: fields.recipient || undefined,
            sender: fields.sender_addr || undefined,
            bankName: fields.bank_name || undefined,
            accountNumber: fields.account_number || undefined,
            transactionId: fields.transaction_id || undefined,
            timestamp: new Date(Number(fields.timestamp)),
            status: STATUS_REVERSE[Number(fields.status)] || 'completed',
            gasUsed: gasUsed || undefined,
          };

          transactions.push(transaction);
        }
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return transactions;
    } catch (error) {
      console.error('Error fetching user transactions from blockchain:', error);
      return [];
    }
  }

  /**
   * Fetch transactions using events (alternative method)
   */
  async getUserTransactionsByEvents(userAddress: string): Promise<TransactionHistory[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::transaction_history::TransactionRecorded`,
        },
        limit: 100,
      });

      const transactions: TransactionHistory[] = [];

      for (const event of events.data) {
        if (event.parsedJson) {
          const data = event.parsedJson as any;
          
          // Only include transactions for this user
          if (data.owner !== userAddress) continue;

          const fromAmount = Number(data.from_amount) / 1_000_000_000;
          const toAmount = Number(data.to_amount) / 1_000_000_000;

          const transaction: TransactionHistory = {
            id: data.transaction_id || event.id.txDigest,
            type: TRANSACTION_TYPE_REVERSE[Number(data.transaction_type)] || 'swap',
            fromAsset: data.from_asset,
            toAsset: data.to_asset,
            fromAmount,
            toAmount,
            timestamp: new Date(Number(data.timestamp)),
            status: 'completed', // Events are emitted after completion
            transactionId: data.transaction_id,
          };

          transactions.push(transaction);
        }
      }

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions by events:', error);
      return [];
    }
  }
}

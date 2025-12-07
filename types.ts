export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export enum MessageType {
  Text = 'text',
  Draft = 'draft', // Represents a transaction draft
  Transaction = 'transaction', // Represents a transaction status
}

export interface TransactionData {
  digest?: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed?: string;
  eventsCount?: number;
  timestamp: Date;
}

export interface TransactionDraft {
  name: string;
  description: string;
  network: string;
  gas: string;
  image?: string; // Base64 or URL
}

export interface Message {
  id: string;
  sender: Sender;
  type: MessageType;
  text: string; // For text messages
  draft?: TransactionDraft; // For draft messages
  image?: string; // If the user attached an image
  transactionData?: TransactionData; // For transaction messages
  timestamp: Date;
}

export interface UserState {
  balance: number;
  name: string;
}

export interface ChatSession {
  id: string;
  preview: string;
  timestamp: string; // ISO string for storage
  messages: Message[];
}
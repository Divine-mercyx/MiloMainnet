export type Contact = {
    name: string;
    address: string;
};

export type Message = {
    sender: "user" | "bot";
    text: string;
    type?: string;
    transactionData?: any;
    timestamp: Date;
};

export type ChatHistoryItem = {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
};

// Simplified types for external AI service
export type IntentType = 'command' | 'question' | 'greeting';

export interface CommandResult {
    action: string;
    reply?: string;
    message?: string;
}

export interface ConversationResult {
    type: 'conversational';
    intent: IntentType;
    message: string;
}

export interface TranscriptionResult {
    transcription: string;
}

// Updated types for lending opportunities
export type Platform = 'Suilend' | 'Scallop' | 'Navi';

export interface LendingOpportunity {
  id: string;
  asset: string;
  symbol: string;
  platform: Platform;
  apy: number;
  tvl: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PortfolioStats {
  totalValue: number;
  dailyEarnings: number;
  netApy: number;
}

export interface ActivePosition {
  id: string;
  asset: string;
  platform: Platform;
  amount: number;
  earnings: number;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number;
}

export type SortField = 'asset' | 'platform' | 'apy' | 'tvl';
export type SortOrder = 'asc' | 'desc';

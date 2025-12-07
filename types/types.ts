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

// AI Module Types
export interface AIModels {
    routerModel: any; // We'll refine this type later
    commandModel: any;
    transcribeModel: any;
    conversationModel: any;
}

export interface AIParseResult {
    intent?: string;
    action?: string;
    asset?: string;
    amount?: string;
    recipient?: string;
    reply?: string;
    message?: string;
    transcription?: string;
}

export type IntentType = 'command' | 'question' | 'greeting';

export interface CommandResult extends AIParseResult {
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
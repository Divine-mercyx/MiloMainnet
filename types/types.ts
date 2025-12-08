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
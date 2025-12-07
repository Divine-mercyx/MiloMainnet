// Main AI processor for frontend - combines all functionality
import { initializeAI } from './aiClient';
import { routeIntent } from './router';
import { handleCommand } from './commandHandler';
import { handleConversation } from './conversationHandler';
import { transcribeAudio } from './transcribeHandler.ts';
import type { AIModels, CommandResult, ConversationResult, TranscriptionResult, Contact } from "../types/types";

/**
 * Main AI processor class for frontend use
 */
export class AIProcessor {
    private apiKey: string;
    private models: AIModels | null;
    private initialized: boolean;

    /**
     * Create an AI processor
     * @param {string} apiKey - Google Generative AI API key
     */
    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.models = null;
        this.initialized = false;
    }

    /**
     * Initialize AI models
     * @returns {Promise<void>}
     */
    async initialize(): Promise<void> {
        if (!this.apiKey) {
            throw new Error("API key is required for initialization");
        }
        
        try {
            this.models = initializeAI(this.apiKey);
            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize AI models:", error);
            throw new Error("AI initialization failed");
        }
    }

    /**
     * Process user input through the full AI pipeline
     * @param {string} prompt - User input to process
     * @param {Contact[]} contacts - User's contact list (optional)
     * @returns {Promise<CommandResult | ConversationResult>} Processing result
     */
    async processInput(prompt: string, contacts: Contact[] = []): Promise<CommandResult | ConversationResult> {
        if (!this.initialized) {
            throw new Error("AI processor not initialized. Call initialize() first.");
        }

        if (!prompt || typeof prompt !== 'string') {
            throw new Error("Invalid request: 'prompt' must be a string.");
        }

        try {
            // Step 1: Classify intent
            const { intent } = await routeIntent(this.models!, prompt);

            // Step 2: Process based on intent
            let response: CommandResult | ConversationResult;
            switch (intent) {
                case 'command':
                    response = await handleCommand(this.models!, prompt, contacts);
                    break;

                case 'question':
                case 'greeting':
                    response = await handleConversation(this.models!, prompt, intent);
                    break;

                default:
                    throw new Error(`Unknown intent: ${intent}`);
            }

            return response;
        } catch (error) {
            console.error("Error processing input:", error);
            throw new Error("Failed to process input");
        }
    }

    /**
     * Transcribe audio
     * @param {string} audioBase64 - Base64 encoded audio data
     * @param {string} mimeType - Audio MIME type
     * @param {string} language - Language for transcription
     * @returns {Promise<TranscriptionResult>} Transcription result
     */
    async transcribe(audioBase64: string, mimeType: string, language: string = "en"): Promise<TranscriptionResult> {
        if (!this.initialized) {
            throw new Error("AI processor not initialized. Call initialize() first.");
        }

        return await transcribeAudio(this.models!, audioBase64, mimeType, language);
    }
}
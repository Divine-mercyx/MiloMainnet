// Main AI processor for frontend - connects to external AI service
import type { CommandResult, ConversationResult, TranscriptionResult, Contact } from "../types/types";

/**
 * Main AI processor class for frontend use
 */
export class AIProcessor {
    private initialized: boolean;
    private apiUrl: string;
    private transcribeUrl: string;

    /**
     * Create an AI processor
     */
    constructor() {
        this.initialized = false;
        this.apiUrl = "https://milobrain-production.up.railway.app/api/v1/ai/response";
        this.transcribeUrl = "https://milobrain-production.up.railway.app/api/v1/ai/transcribe";
    }

    /**
     * Initialize AI processor
     * @returns {Promise<void>}
     */
    async initialize(): Promise<void> {
        // No initialization needed for external service
        this.initialized = true;
        console.log("AI Processor initialized!");
    }

    /**
     * Process user input through the external AI service
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
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt,
                    contacts
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            
            return data;
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

        try {
            const response = await fetch(this.transcribeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    audio: audioBase64,
                    mimeType: mimeType,
                    language: language
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Transcription API request failed with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            return data;
        } catch (error) {
            console.error("Error transcribing audio:", error);
            throw new Error("Failed to transcribe audio");
        }
    }
}
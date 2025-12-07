// Main AI processor for frontend - combines all functionality
import { initializeAI } from './aiClient.js';
import { routeIntent } from './router.js';
import { handleCommand } from './commandHandler.js';
import { handleConversation } from './conversationHandler.js';
import { transcribeAudio } from './transcribeHandler.js';

/**
 * Main AI processor class for frontend use
 */
export class AIProcessor {
    /**
     * Create an AI processor
     * @param {string} apiKey - Google Generative AI API key
     */
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.models = null;
        this.initialized = false;
    }

    /**
     * Initialize AI models
     * @returns {Promise<void>}
     */
    async initialize() {
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
     * @param {Array} contacts - User's contact list (optional)
     * @returns {Promise<Object>} Processing result
     */
    async processInput(prompt, contacts = []) {
        if (!this.initialized) {
            throw new Error("AI processor not initialized. Call initialize() first.");
        }

        if (!prompt || typeof prompt !== 'string') {
            throw new Error("Invalid request: 'prompt' must be a string.");
        }

        try {
            // Step 1: Classify intent
            const { intent } = await routeIntent(this.models, prompt);

            // Step 2: Process based on intent
            let response;
            switch (intent) {
                case 'command':
                    response = await handleCommand(this.models, prompt, contacts);
                    break;

                case 'question':
                case 'greeting':
                    response = await handleConversation(this.models, prompt, intent);
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
     * @returns {Promise<Object>} Transcription result
     */
    async transcribe(audioBase64, mimeType, language = "en") {
        if (!this.initialized) {
            throw new Error("AI processor not initialized. Call initialize() first.");
        }

        return await transcribeAudio(this.models, audioBase64, mimeType, language);
    }
}
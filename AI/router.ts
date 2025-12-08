// Frontend router for intent classification
import { parseGeminiResponse } from './aiClient.ts';
import type { AIModels, AIParseResult } from "../types/types";

/**
 * Classify user intent using AI
 * @param {AIModels} models - Initialized AI models
 * @param {string} prompt - User input to classify
 * @returns {Promise<AIParseResult>} Classified intent
 */
export async function routeIntent(models: AIModels, prompt: string): Promise<AIParseResult> {
    if (!models || !models.routerModel) {
        throw new Error("Router model not initialized");
    }
    
    const routerPrompt = `
Classify the user's intent. 
- "command": They want to PERFORM A BLOCKCHAIN ACTION (send, transfer, swap, check balance)
- "question": They are asking HOW or WHAT about blockchain (even if it contains action words)  
- "greeting": Simple hello, hi, how are you, thanks

Respond with ONLY JSON: {"intent":"command"|"question"|"greeting"}

Message: "${prompt}"
`;

    try {
        const result = await models.routerModel.generateContent(routerPrompt);
        const response = await result.response;
        const text = response.text();
        return parseGeminiResponse(text);
    } catch (error) {
        console.error("Error routing intent:", error);
        throw new Error("Failed to classify intent");
    }
}
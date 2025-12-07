// Frontend conversation handler for chat interactions
import type { AIModels, ConversationResult, IntentType } from "../types/types";

/**
 * Handle conversational responses using AI
 * @param {AIModels} models - Initialized AI models
 * @param {string} prompt - User message to respond to
 * @param {IntentType} intent - Classified intent (question, greeting, etc.)
 * @returns {Promise<ConversationResult>} Conversational response
 */
export async function handleConversation(models: AIModels, prompt: string, intent: IntentType): Promise<ConversationResult> {
    if (!models || !models.conversationModel) {
        throw new Error("Conversation model not initialized");
    }
    
    const conversationalPrompt = `
You are Milo, a helpful Sui blockchain assistant. 

# TONE:
- For greetings: Warm, enthusiastic, 1-2 sentences. Invite them to ask about Sui.
- For questions: Clear, concise, helpful. Explain complex topics simply - keep it short.

# USER'S MESSAGE:
"${prompt}"

Provide an appropriate response. If greeting, make it friendly and inviting. If question, be informative.
`;

    try {
        const result = await models.conversationModel.generateContent(conversationalPrompt);
        const response = await result.response;
        const message = response.text().trim();

        return {
            type: "conversational",
            intent: intent,
            message: message
        };
    } catch (error) {
        console.error("Error handling conversation:", error);
        throw new Error("Failed to generate conversational response");
    }
}
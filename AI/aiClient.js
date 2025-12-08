// Frontend-compatible AI client using Google Generative AI
import { GoogleGenerativeAI } from "@google/generative-ai";
// import type { AIModels, AIParseResult } from "../types/types";

/**
 * Initialize AI models with the provided API key
 * @param {string} apiKey - Google Generative AI API key
 * @returns {AIModels} Configured AI models
 */
export function initializeAI(apiKey) {
    if (!apiKey) {
        throw new Error("API key is required to initialize AI models");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Export configured models
    return {
        routerModel: genAI.getGenerativeModel({ model: "gemini-2.5-flash" }),
        commandModel: genAI.getGenerativeModel({ model: "gemini-2.5-flash" }),
        transcribeModel: genAI.getGenerativeModel({ model: "gemini-2.5-flash" }),
        conversationModel: genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    };
}

/**
 * Parse AI response text to extract JSON
 * @param {string} text - Raw AI response text
 * @returns {AIParseResult} Parsed JSON object
 */
export function parseGeminiResponse(text) {
    try {
        const jsonString = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", text);
        throw new Error("AI generated an invalid response.");
    }
}
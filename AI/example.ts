// Example usage of the refactored AI module for frontend

import { AIProcessor } from './index';
import type { Contact } from '../types/types';

// Example contacts list
const contacts: Contact[] = [
    { name: "John", address: "0x123456789abcdef" },
    { name: "Alex", address: "0xabcdef123456789" },
    { name: "Sarah", address: "0x987654321fedcba" }
];

/**
 * Example function showing how to use the AI processor
 */
async function example() {
    // You would get this from an environment variable or user input in a real app
    const API_KEY = "AIzaSyCXMXpE5JRwUIQJXdIJAjNf0FrkQLnRres";
    
    // Create and initialize the AI processor
    const aiProcessor = new AIProcessor();
    
    try {
        await aiProcessor.initialize();
        console.log("AI Processor initialized successfully!");
        
        // Example 1: Process a command
        const commandPrompt = "Send 5 SUI to John";
        console.log(`\nProcessing command: "${commandPrompt}"`);
        const commandResult = await aiProcessor.processInput(commandPrompt, contacts);
        console.log("Command result:", commandResult);
        
        // Example 2: Process a question
        const questionPrompt = "What is Sui blockchain?";
        console.log(`\nProcessing question: "${questionPrompt}"`);
        const questionResult = await aiProcessor.processInput(questionPrompt);
        console.log("Question result:", questionResult);
        
        // Example 3: Process a greeting
        const greetingPrompt = "Hello Milo!";
        console.log(`\nProcessing greeting: "${greetingPrompt}"`);
        const greetingResult = await aiProcessor.processInput(greetingPrompt);
        console.log("Greeting result:", greetingResult);
        
        // Example 4: Transcribe audio (if you have base64 audio data)
        // const audioBase64 = "base64_encoded_audio_data_here";
        // const mimeType = "audio/webm";
        // const transcriptionResult = await aiProcessor.transcribe(audioBase64, mimeType, "en");
        // console.log("Transcription result:", transcriptionResult);
        
    } catch (error) {
        console.error("Error:", (error as Error).message);
    }
}

// Run the example
example();

export { AIProcessor, example };
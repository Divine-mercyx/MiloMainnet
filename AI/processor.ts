// Main AI processor for frontend - combines all functionality
import type { CommandResult, ConversationResult, TranscriptionResult, Contact } from "../types/types";

/**
 * Main AI processor class for frontend use
 */
// src/AI/index.ts
export class AIProcessor {
  private initialized: boolean;

  constructor() {
    // No API key needed in frontend anymore!
    this.initialized = false;
  }

  async initialize(): Promise<void> {
    // Just mark as initialized - no models to load in frontend
    this.initialized = true;
    console.log("AI Processor initialized (using serverless backend)!");
  }

  async processInput(prompt: string, contacts: Contact[] = []): Promise<CommandResult | ConversationResult> {
    if (!this.initialized) {
      throw new Error("AI processor not initialized");
    }

    try {
      // Call YOUR serverless function instead of initializing models here
      const response = await fetch('/api/chat', {
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
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error processing input:", error);
      throw error;
    }
  }

  async transcribe(audioBase64: string, mimeType: string, language: string = "en"): Promise<TranscriptionResult> {
    if (!this.initialized) {
      throw new Error("AI processor not initialized");
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          audioBase64,
          mimeType,
          language
        })
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      return await response.json();
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }
}
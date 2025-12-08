// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeAI } from '../AI/aiClient';
import { routeIntent } from '../AI/router';
import { handleCommand } from '../AI/commandHandler';
import { handleConversation } from '../AI/conversationHandler';
import { transcribeAudio } from '../AI/transcribeHandler';
import type { CommandResult, ConversationResult } from '../types/types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Fixed: Use correct environment variable name (NO VITE_ prefix!)
  const API_KEY = process.env.GOOGLE_AI_KEY;

  if (!API_KEY) {
    console.error('API key not found in environment variables');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { prompt, contacts, audioBase64, mimeType, language } = req.body;

    // Initialize AI models
    const models = initializeAI(API_KEY);

    // Handle transcription requests
    if (audioBase64 && mimeType) {
      const result = await transcribeAudio(models, audioBase64, mimeType, language || "en");
      return res.status(200).json(result);
    }

    // Handle text-based requests
    if (prompt) {
      const { intent } = await routeIntent(models, prompt);

      let response: CommandResult | ConversationResult;

      switch (intent) {
        case 'command':
          response = await handleCommand(models, prompt, contacts || []);
          break;
        case 'question':
        case 'greeting':
          response = await handleConversation(models, prompt, intent);
          break;
        default:
          response = {
            type: 'conversational',
            intent: 'question',
            message: "I'm not sure how to help with that."
          } as ConversationResult;
      }

      return res.status(200).json(response);
    }

    return res.status(400).json({ error: 'Missing prompt or audio data' });
  } catch (error) {
    console.error('AI API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
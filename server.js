const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI API server is running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { prompt, contacts, audioBase64, mimeType, language } = req.body;
    
    // Get API key from environment
    const API_KEY = process.env.GOOGLE_AI_KEY || process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      console.error('API key not configured on server');
      return res.status(500).json({ error: 'API key not configured on server' });
    }
    
    console.log('Using API key:', API_KEY ? 'YES' : 'NO');
    
    // Handle transcription requests
    if (audioBase64 && mimeType) {
      console.log('Handling transcription request');
      // For now, return a placeholder for transcription
      return res.status(200).json({
        transcription: "Transcription is not implemented in this demo version."
      });
    }
    
    // Handle text-based requests
    if (prompt) {
      console.log('Handling text request:', prompt);
      
      // Dynamically import the AI modules
      const { initializeAI } = await import('./AI/aiClient.js');
      const { routeIntent } = await import('./AI/router.js');
      const { handleCommand } = await import('./AI/commandHandler.js');
      const { handleConversation } = await import('./AI/conversationHandler.js');
      
      // Initialize AI models
      const models = initializeAI(API_KEY);
      
      // Route the intent
      const { intent } = await routeIntent(models, prompt);
      console.log('Intent identified:', intent);
      
      // Process based on intent
      let response;
      switch (intent) {
        case 'command':
          console.log('Processing command');
          response = await handleCommand(models, prompt, contacts || []);
          break;
          
        case 'question':
        case 'greeting':
          console.log('Processing conversation');
          response = await handleConversation(models, prompt, intent);
          break;
          
        default:
          console.log('Processing default response');
          response = {
            type: 'conversational',
            intent: 'question',
            message: "I'm not sure how to help with that."
          };
      }
      
      console.log('Sending response:', response);
      return res.status(200).json(response);
    }
    
    console.log('Missing prompt or audio data');
    return res.status(400).json({ error: 'Missing prompt or audio data' });
  } catch (error) {
    console.error('AI API error:', error);
    return res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI API server running on http://localhost:${PORT}`);
});
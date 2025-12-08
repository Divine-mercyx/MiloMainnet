import { 
  GoogleGenAI, 
  GenerateContentResponse,
  FunctionDeclaration,
  Type,
  Tool
} from "@google/genai";
import { Message, Sender, MessageType } from "../types";

// Initialize Gemini Client with a fallback
const apiKey = import.meta.env.VITE_AI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are MYLO, a helpful, intelligent, and friendly AI assistant for a crypto wallet.
Your goal is to help users manage their assets, answer questions about blockchain (like NFTs, DeFi), and draft transactions.
Keep your responses concise, professional, yet warm.
Do not execute transactions directly; instead, use the "draftNftTransaction" tool when a user wants to mint an NFT or perform a transaction.
The user might provide an image to mint. If they do, acknowledge it and use the tool if requested.
If the user asks educational questions, provide clear, simple explanations.
`;

// Define the tool for drafting transactions
const draftNftTransactionTool: FunctionDeclaration = {
  name: 'draftNftTransaction',
  description: 'Drafts an NFT minting transaction for the user to review.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'The name of the NFT.',
      },
      description: {
        type: Type.STRING,
        description: 'A short description of the NFT.',
      },
      network: {
        type: Type.STRING,
        description: 'The blockchain network to mint on (e.g., Sui, Ethereum, Solana). Default to Sui if not specified.',
      },
      estimatedGas: {
        type: Type.STRING,
        description: 'Estimated gas fee (e.g., 0.001 SUI).',
      }
    },
    required: ['name', 'description'],
  },
};

const tools: Tool[] = [
  { functionDeclarations: [draftNftTransactionTool] }
];

// Helper to convert internal messages to Gemini history format
const convertHistory = (messages: Message[]) => {
  return messages.map(m => ({
    role: m.sender === Sender.User ? 'user' : 'model',
    parts: [
      { text: m.text },
      // Note: In a real app, we'd pass back tool responses here too, but for this demo, strictly text history is usually enough context unless complex multi-turn tool logic is needed.
    ]
  }));
};

export const sendMessageToGemini = async (
  currentMessage: string,
  imageBase64: string | undefined,
  history: Message[]
): Promise<{ text: string, draft?: any }> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct content parts
    const parts: any[] = [];
    
    if (imageBase64) {
       // Remove data URL prefix if present for the API call if raw base64 is needed, 
       // but GoogleGenAI usually expects standard base64 strings in inlineData.
       const base64Data = imageBase64.split(',')[1]; 
       parts.push({
         inlineData: {
           mimeType: 'image/png', // Assuming PNG or JPEG, usually safe to default or detect
           data: base64Data
         }
       });
    }
    
    parts.push({ text: currentMessage });

    const chatHistory = convertHistory(history);

    const result = await ai.models.generateContent({
      model,
      contents: [
        ...chatHistory.map(h => ({ role: h.role, parts: h.parts })), // Add previous history
        { role: 'user', parts: parts } // Add current message
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
      }
    });

    const textPart = result.text || '';
    
    // Check for function calls
    const functionCalls = result.functionCalls;
    
    let draft = null;

    if (functionCalls && functionCalls.length > 0) {
       const call = functionCalls[0];
       if (call.name === 'draftNftTransaction') {
         draft = call.args;
       }
    }

    return {
      text: textPart || (draft ? "I've drafted that transaction for you." : "I'm not sure how to help with that."),
      draft: draft
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I encountered an error connecting to MYLO services." };
  }
};
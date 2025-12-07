import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Image as ImageIcon, X, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Message, Sender, MessageType, ChatSession } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from './ChatMessage';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
// Add Sui imports
import { useSignTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { buildTransaction, queryBalance } from './lib/suiTxBuilder';
import toast from 'react-hot-toast';
// Add AI processor import
import { AIProcessor } from '../AI/processor';
// Remove useContacts import since we'll receive contacts as props
// import { useContacts } from '../hooks/useContacts';

const INITIAL_GREETING: Message = {
  id: 'init-1',
  sender: Sender.Bot,
  type: MessageType.Text,
  text: "Hello! I'm MYLO. I can help you manage your assets, answer questions about crypto, or mint NFTs. How can I help you today?",
  timestamp: new Date()
};

const API_KEY = import.meta.env.VITE_AI_API_KEY;

interface ChatAreaProps {
  sessionId?: string | null; // If null, it's a new chat. If string, load that chat.
  contacts: any[]; // Receive contacts as props
  resolveContact: (nameOrAddress: string) => string; // Receive resolveContact function as props
}

export const ChatArea: React.FC<ChatAreaProps> = ({ sessionId, contacts, resolveContact }) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add Sui hooks
  const { mutate: signTransaction } = useSignTransaction();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  
  // Initialize AI processor
  const [aiProcessor, setAiProcessor] = useState<AIProcessor | null>(null);
  
    useEffect(() => {
        const initAI = async () => {
            try {
                const processor = new AIProcessor(API_KEY);
                await processor.initialize();
                setAiProcessor(processor);
                console.log("AI Processor initialized successfully!");
            } catch (error) {
                console.error("Failed to initialize AI processor:", error);
            }
        };
        
        initAI();
    }, []);

  // Load session when ID changes
  useEffect(() => {
    if (sessionId) {
      const allSessions = JSON.parse(localStorage.getItem('mylo_chat_sessions') || '[]');
      const session = allSessions.find((s: ChatSession) => s.id === sessionId);
      if (session) {
        // Convert timestamp strings back to Date objects
        const loadedMessages = session.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
        }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      }
    } else {
      // Reset for new chat
      setMessages([INITIAL_GREETING]);
      setCurrentSessionId(null);
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save session whenever messages change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if it's just the greeting
        const saveSession = () => {
            const allSessions: ChatSession[] = JSON.parse(localStorage.getItem('mylo_chat_sessions') || '[]');
            
            let idToSave = currentSessionId;
            if (!idToSave) {
                idToSave = Date.now().toString();
                setCurrentSessionId(idToSave);
            }

            const preview = messages.find(m => m.sender === Sender.User)?.text || 'New Conversation';
            
            const newSession: ChatSession = {
                id: idToSave,
                preview: preview.substring(0, 50) + (preview.length > 50 ? '...' : ''),
                timestamp: new Date().toISOString(),
                messages: messages
            };

            const existingIndex = allSessions.findIndex(s => s.id === idToSave);
            if (existingIndex >= 0) {
                allSessions[existingIndex] = newSession;
            } else {
                allSessions.push(newSession);
            }

            localStorage.setItem('mylo_chat_sessions', JSON.stringify(allSessions));
        };
        saveSession();
    }
  }, [messages, currentSessionId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add transaction submission function
  const submitTransaction = async (bytes: string, signature: string) => {
    try {
      // Add pending transaction message immediately
      const pendingMsg = {
        id: Date.now().toString() + '_pending',
        sender: Sender.Bot,
        type: MessageType.Transaction,
        text: "⏳ Transaction submitted to network...",
        transactionData: {
          status: 'pending',
          timestamp: new Date()
        },
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, pendingMsg]);

      const response = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: signature,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      const { digest, effects, events } = response;
      
      // Remove pending message and add success message
      setMessages(prev => {
        const newMessages = prev.filter(msg => 
          !(msg.type === MessageType.Transaction && msg.transactionData?.status === 'pending')
        );

        return [
          ...newMessages,
          {
            id: Date.now().toString() + '_success',
            sender: Sender.Bot,
            type: MessageType.Transaction,
            text: `Transaction Successful!`,
            transactionData: {
              digest: digest,
              status: 'success',
              gasUsed: effects?.gasUsed?.computationCost?.toString() || 'N/A',
              eventsCount: events?.length || 0,
              timestamp: new Date()
            },
            timestamp: new Date()
          },
        ];
      });

    } catch (error: any) {
      // Remove pending message and add error message
      setMessages(prev => {
        const newMessages = prev.filter(msg => 
          !(msg.type === MessageType.Transaction && msg.transactionData?.status === 'pending')
        );

        return [
          ...newMessages,
          {
            id: Date.now().toString() + '_error',
            sender: Sender.Bot,
            type: MessageType.Transaction,
            text: `❌ Transaction Failed: ${error.message || 'Unknown error'}`,
            transactionData: {
              status: 'failed',
              timestamp: new Date()
            },
            timestamp: new Date()
          },
        ];
      });
    }
  };

  // Add execute transfer function
  const executeTransfer = async (intent: any) => {
    try {
      // Ensure recipient is properly resolved
      if (intent.action === "transfer" && intent.recipient) {
        try {
          // Try to resolve the recipient using our contact resolver
          intent.recipient = resolveContact(intent.recipient);
        } catch (resolveError) {
          // If resolution fails, the AI should have already provided a valid address
          console.warn("Could not resolve recipient, using AI-provided value:", intent.recipient);
        }
      }
      
      const transaction = await buildTransaction(intent);

      signTransaction(
        { transaction },
        {
          onSuccess: async ({ bytes, signature }) => {
            await submitTransaction(bytes, signature);
          },
          onError: (error: Error) => {
            console.error("Transaction failed:", error);
            setMessages(prev => [...prev, {
              id: Date.now().toString() + '_tx_error',
              sender: Sender.Bot,
              type: MessageType.Text,
              text: `❌ Transaction failed: ${error.message || "Unknown error"}`,
              timestamp: new Date()
            }]);
          }
        }
      );

    } catch (error: any) {
      console.error("Transaction building failed:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_build_error',
        sender: Sender.Bot,
        type: MessageType.Text,
        text: `❌ Failed to create transaction: ${error.message || "Unknown error"}`,
        timestamp: new Date()
      }]);
    }
  }

  // Add query balance function
  const queryUserBalance = async () => {
    if (!currentAccount) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_balance_error',
        sender: Sender.Bot,
        type: MessageType.Text,
        text: "❌ Please connect your wallet to check your balance.",
        timestamp: new Date()
      }]);
      return;
    }

    try {
      // Show loading message
      const loadingMsg: Message = {
        id: Date.now().toString() + '_balance_loading',
        sender: Sender.Bot,
        type: MessageType.Text,
        text: "🔍 Fetching your SUI balance...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, loadingMsg]);

      // Query the balance
      const balance = await queryBalance(currentAccount.address, "SUI");
      
      // Remove loading message and show balance
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => 
          !(msg.id.includes('_balance_loading'))
        );
        
        return [...filteredMessages, {
          id: Date.now().toString() + '_balance_result',
          sender: Sender.Bot,
          type: MessageType.Text,
          text: `💰 Your SUI Balance: ${balance.toFixed(4)} SUI`,
          timestamp: new Date()
        }];
      });
    } catch (error: any) {
      // Remove loading message and show error
      setMessages(prev => {
        const filteredMessages = prev.filter(msg => 
          !(msg.id.includes('_balance_loading'))
        );
        
        return [...filteredMessages, {
          id: Date.now().toString() + '_balance_error',
          sender: Sender.Bot,
          type: MessageType.Text,
          text: `❌ Failed to fetch balance: ${error.message || "Unknown error"}`,
          timestamp: new Date()
        }];
      });
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: Sender.User,
      type: MessageType.Text,
      text: input,
      image: attachedImage || undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    const currentImage = attachedImage; // Capture for closure
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Use AI processor if available and input is not empty
      if (aiProcessor && input.trim()) {
        try {
          // Use the AI processor's processInput function with contacts
          const data = await aiProcessor.processInput(input, contacts);
          
          // Type guard to check if it's a command result
          if ('action' in data) {
            // This is a CommandResult
            if (data.action === "transfer") {
              const botText = data.message || data.reply || "Processing your transfer request...";
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: Sender.Bot, 
                type: MessageType.Text, 
                text: botText,
                timestamp: new Date() 
              }]);
              
              // Execute the transfer
              await executeTransfer(data);
              return;
            } else if (data.action === "query_balance") {
              const botText = data.message || "Checking your balance...";
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: Sender.Bot, 
                type: MessageType.Text, 
                text: botText,
                timestamp: new Date() 
              }]);
              
              // Query the user's balance
              await queryUserBalance();
              return;
            } else if (data.action === "error") {
              const botText = data.message || "Sorry, I couldn't understand that command.";
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: Sender.Bot, 
                type: MessageType.Text, 
                text: botText,
                timestamp: new Date() 
              }]);
              return;
            } else {
              const botText = data.reply || data.message || "I'm not sure how to help with that.";
              setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                sender: Sender.Bot, 
                type: MessageType.Text, 
                text: botText,
                timestamp: new Date() 
              }]);
              return;
            }
          } else {
            // This is a ConversationResult
            const botText = data.message || "I'm not sure how to help with that.";
            setMessages(prev => [...prev, { 
              id: Date.now().toString(), 
              sender: Sender.Bot, 
              type: MessageType.Text, 
              text: botText,
              timestamp: new Date() 
            }]);
            return;
          }
        } catch (aiError) {
          console.error("AI processing error:", aiError);
          // Fall back to Gemini service if AI processing fails
        }
      }
      
      // Fallback to Gemini service if AI processor is not available or fails
      const { text, draft } = await sendMessageToGemini(
          newUserMessage.text, 
          currentImage || undefined, 
          messages
      );

      const botMsgId = (Date.now() + 1).toString();
      
      const newBotMessages: Message[] = [];

      if (text) {
          newBotMessages.push({
              id: botMsgId,
              sender: Sender.Bot,
              type: MessageType.Text,
              text: text,
              timestamp: new Date(),
          });
      }

      if (draft) {
          newBotMessages.push({
              id: botMsgId + '_draft',
              sender: Sender.Bot,
              type: MessageType.Draft,
              text: '',
              draft: {
                  name: draft.name,
                  description: draft.description,
                  network: draft.network || 'Sui',
                  gas: draft.estimatedGas || '0.001 SUI',
                  image: currentImage || undefined
              },
              timestamp: new Date(),
          });
      }

      setMessages(prev => [...prev, ...newBotMessages]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
          id: Date.now().toString() + '_error',
          sender: Sender.Bot,
          type: MessageType.Text,
          text: "I'm having trouble connecting right now. Please try again.",
          timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleConfirmDraft to execute actual transactions
  const handleConfirmDraft = async (draftId: string) => {
    // Find the draft message
    const draftMessage = messages.find(msg => msg.id === draftId);
    
    if (!draftMessage || !draftMessage.draft) {
      toast.error("Could not find draft transaction");
      return;
    }

    // Create intent based on draft
    const intent = {
      action: "mint",
      name: draftMessage.draft.name,
      description: draftMessage.draft.description,
      blobId: "blob_" + Math.random().toString(36).substring(2, 15) // Generate a fake blobId for demo
    };

    try {
      // Show loading message
      const loadingMsg: Message = {
        id: Date.now().toString() + '_loading',
        sender: Sender.Bot,
        type: MessageType.Text,
        text: "🔄 Preparing transaction...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, loadingMsg]);

      // Execute the transaction
      await executeTransfer(intent);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '_confirm_error',
        sender: Sender.Bot,
        type: MessageType.Text,
        text: `❌ Transaction failed: ${error.message || "Unknown error"}`,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onConfirmDraft={handleConfirmDraft} />
        ))}
        {isLoading && (
            <div className="flex justify-start mb-6">
                 <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <br /><br /><br />

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-6 md:px-10">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 flex flex-col gap-2">
            
            {attachedImage && (
                <div className="px-2 pt-2 flex items-center gap-2">
                    <div className="relative group">
                        <img src={attachedImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                        <Tooltip content="Remove image">
                            <button 
                                onClick={() => setAttachedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        </Tooltip>
                    </div>
                    <span className="text-xs text-slate-400">Image attached</span>
                </div>
            )}

            <div className="flex items-center gap-2 pl-3 pr-2 py-1">
                <Tooltip content="Attach image">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon size={20} />
                    </Button>
                </Tooltip>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                />
                
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask MYLO anything..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 font-medium h-10"
                    disabled={isLoading}
                />
                
                <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
                     <Tooltip content="Use voice input">
                         <Button variant="ghost" size="icon" className="text-slate-400">
                            <Mic size={20} />
                         </Button>
                     </Tooltip>
                     <Tooltip content="Send message">
                        <Button 
                            variant="primary" 
                            size="icon" 
                            onClick={handleSend}
                            disabled={(!input && !attachedImage) || isLoading}
                            className={(!input && !attachedImage) ? "bg-slate-200 text-slate-400" : ""}
                        >
                            <Send size={18} className={input || attachedImage ? "ml-0.5" : ""} />
                        </Button>
                     </Tooltip>
                </div>
            </div>
        </div>
        <p className="text-center text-[10px] text-slate-300 mt-3 font-medium tracking-wide">MYLO AI • Powered by Gemini 2.5</p>
      </div>
    </div>
  );
};
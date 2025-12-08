import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Image as ImageIcon, X, ExternalLink, Clock, CheckCircle, XCircle, Globe, Square } from 'lucide-react';
import { Message, Sender, MessageType, ChatSession } from '../types';
import { ChatMessage } from './ChatMessage';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
// Add Sui imports
import { useSignTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { buildTransaction, queryBalance } from './lib/suiTxBuilder';
import toast from 'react-hot-toast';
// Add AI processor import
import { AIProcessor } from '../AI';
// Remove useContacts import since we'll receive contacts as props
// import { useContacts } from '../hooks/useContacts';

const INITIAL_GREETING: Message = {
  id: 'init-1',
  sender: Sender.Bot,
  type: MessageType.Text,
  text: "Hello! I'm MYLO. I can help you manage your assets, answer questions about crypto, or mint NFTs. How can I help you today?",
  timestamp: new Date()
};


let aiProcessor: AIProcessor | null = null;


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
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Add Sui hooks
  const { mutate: signTransaction } = useSignTransaction();
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
    
  useEffect(() => {
    const initAI = async () => {
      try {
        aiProcessor = new AIProcessor(); // No API key!
        await aiProcessor.initialize();
        console.log("AI Processor initialized successfully!");
      } catch (error) {
        console.error("Failed to initialize AI processor:", error);
      }
    };
    
    initAI();
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageButtonRef.current && !languageButtonRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  // Get language API code
  const getLanguageApiCode = (langCode: string): string => {
    // Map full language codes to API codes
    const langMap: Record<string, string> = {
      'en-US': 'en',
      'es-ES': 'es',
      'fr-FR': 'fr',
      'de-DE': 'de',
      'it-IT': 'it',
      'pt-BR': 'pt',
      'ja-JP': 'ja',
      'ko-KR': 'ko',
      'zh-CN': 'zh',
      'ig-NG': 'ig',
      'yo-NG': 'yo',
      'ha-NG': 'ha'
    };
    
    console.log("Mapping language code:", langCode, "to API code:", langMap[langCode] || 'en');
    return langMap[langCode] || 'en';
  };

  // Transcribe audio using AI processor
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!aiProcessor) {
      toast.error("AI processor not initialized");
      return;
    }

    try {
      setIsTranscribing(true);
      // Show "Transcribing..." in the input field while processing
      setInput("Transcribing...");
      
      // Convert blob to base64
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Properly extract base64 data from data URL
          const result = reader.result as string;
          if (result.startsWith('data:')) {
            // Extract base64 data after the comma
            const base64data = result.split(',')[1];
            resolve(base64data);
          } else {
            // If it's already base64, use as is
            resolve(result);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Get the MIME type from the blob
      const mimeType = audioBlob.type || 'audio/webm;codecs=opus';
      
      // Get language code for API
      const languageCode = getLanguageApiCode(selectedLanguage);
      console.log("Using language code for transcription:", languageCode);

      // Transcribe using the AI processor
      const result = await aiProcessor.transcribe(audioBase64, mimeType, languageCode);
      
      // Set the transcribed text as input
      setInput(result.transcription);
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
      // Clear the "Transcribing..." text on error
      setInput("");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioChunksRef.current = [];
      // Use a widely supported MIME type
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length > 0) {
          // Create blob with the same MIME type as the recorder
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm;codecs=opus' 
          });

          try {
            await transcribeAudio(audioBlob);
          } catch (error) {
            console.error('Transcription failed:', error);
            toast.error("Voice transcription failed. Please try again or type your message.");
          }
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Microphone access is required for voice input. Please allow microphone permissions.");
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Text-to-speech function
  const speakText = (text: string) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Use the selected language directly for speech synthesis
      // Some browsers may require specific language codes for speech synthesis
      utterance.lang = selectedLanguage;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      console.log("Speaking text in language:", selectedLanguage);
      synthRef.current.speak(utterance);
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
      

      const botMsgId = (Date.now() + 1).toString();
      
      const newBotMessages: Message[] = [];

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

  // Define supported languages
  const supportedLanguages = [
    // Nigerian Languages
    { code: 'ig-NG', name: 'Igbo', flag: '🇳🇬', nativeName: 'Ásụ̀sụ́ Ìgbò' },
    { code: 'yo-NG', name: 'Yoruba', flag: '🇳🇬', nativeName: 'Èdè Yorùbá' },
    { code: 'ha-NG', name: 'Hausa', flag: '🇳🇬', nativeName: 'Harshen Hausa' },

    // International Languages
    { code: 'en-US', name: 'English', flag: '🇺🇸', nativeName: 'English' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
    { code: 'it-IT', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
    { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷', nativeName: 'Português' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
    { code: 'ko-KR', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
    { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  ];

  // Get current language details
  const currentLanguage = supportedLanguages.find(lang => lang.code === selectedLanguage) || supportedLanguages[0];

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
                
                {/* Language Selector */}
                <div className="relative">
                  <Tooltip content="Select language">
                    <Button 
                      ref={languageButtonRef}
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-slate-700"
                      onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    >
                      <Globe size={20} />
                    </Button>
                  </Tooltip>
                  
                  {/* Language Dropdown */}
                  {showLanguageDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10">
                      <div className="max-h-60 overflow-y-auto">
                        {supportedLanguages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang.code);
                              setShowLanguageDropdown(false);
                              // Temporary debug log to verify language selection
                              console.log("Language selected:", lang.code);
                            }}
                            className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-slate-50 ${
                              selectedLanguage === lang.code ? 'bg-slate-100' : ''
                            }`}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <div>
                              <div className="font-medium text-slate-800">{lang.name}</div>
                              <div className="text-xs text-slate-500">{lang.nativeName}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Voice Recording Button */}
                <Tooltip content={isRecording ? "Stop recording" : "Voice input"}>
                  <Button 
                    ref={micButtonRef}
                    variant="ghost" 
                    size="icon" 
                    className={`text-slate-400 ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-slate-700'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                  >
                    {isRecording ? <Square size={20} /> : <Mic size={20} />}
                  </Button>
                </Tooltip>
                
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask MYLO anything..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 font-medium h-10"
                    disabled={isLoading || isTranscribing}
                />
                
                <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
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
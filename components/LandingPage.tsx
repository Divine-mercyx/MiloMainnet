import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { 
  Box, 
  Globe, 
  MessageSquare, 
  Shield, 
  Zap, 
  Send, 
  Sparkles, 
  CheckCircle, 
  Layers, 
  GitMerge, 
  FileQuestion, 
  AlertTriangle, 
  Languages, 
  Clock,
  Droplets,
  ArrowUpRight,
  Wallet,
  Cpu,
  Menu,
  ChevronDown
} from 'lucide-react';
import { Message, Sender, MessageType } from '../types';
import { AIProcessor } from '../AI/index.ts';
import { useConnectWallet, useWallets } from '@mysten/dapp-kit';

const API_KEY = null; // Not needed anymore since we're using external service
let aiProcessor: AIProcessor | null = null;

// Add a check for the API key
console.log("Using external AI service");

interface LandingPageProps {
  onConnect: () => void;
}

// Component definitions moved to the top to fix the "Expected 0 arguments, but got 1" error
const ProblemCard: React.FC<{ icon: React.ReactNode, text: string, delay?: string }> = ({ icon, text, delay = "0" }) => (
    <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/80 hover:border-teal-500/30 transition-all group backdrop-blur-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform group-hover:bg-teal-500/20">
            {icon}
        </div>
        <span className="text-slate-200 font-medium text-lg">{text}</span>
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="bg-slate-50 p-8 rounded-[2rem] hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group">
    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform text-[#3B8D85] group-hover:bg-teal-50">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{description}</p>
  </div>
);

const LandingChatWidget: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            sender: Sender.Bot,
            type: MessageType.Text,
            text: "Hi! I'm MYLO. Ask me anything about blockchain, Sui, or how I can help manage your finances.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

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
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading || !aiProcessor) {
            // If AI processor is not available, show a friendly message
        if (!aiProcessor) {
            setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            sender: Sender.Bot,
            type: MessageType.Text,
            text: "AI features are currently unavailable. Please try again later.",
            timestamp: new Date()
            }]);
            return;
        }
            return;
        }
        
        const userMsg = {
            id: Date.now().toString(),
            sender: Sender.User,
            type: MessageType.Text,
            text: input,
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const data = await aiProcessor.processInput(input);
            
            let botText = "";
            if ('action' in data) {
                botText = data.message || data.reply || "Sorry, something went wrong.";
            } else {
                botText = data.message || "Sorry, something went wrong.";
            }
            
            const botMsg = {
                id: (Date.now() + 1).toString(),
                sender: Sender.Bot,
                type: MessageType.Text,
                text: botText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("AI processing error:", error);
            const errorMsg = {
                id: (Date.now() + 1).toString(),
                sender: Sender.Bot,
                type: MessageType.Text,
                text: "Sorry, I encountered an error processing your request.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                            msg.sender === Sender.User 
                            ? 'bg-[#0F172A] text-white rounded-tr-sm' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 rounded-full border border-slate-200 px-2 py-2 shadow-inner focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-slate-800 placeholder:text-slate-400"
                        disabled={loading}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onConnect }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const wallets = useWallets(); 
  const { mutate: connect } = useConnectWallet();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isWalletDropdownOpen) {
        const dropdown = document.querySelector('.wallet-dropdown');
        const button = document.querySelector('.wallet-button');
        if (dropdown && button && 
            !dropdown.contains(event.target as Node) && 
            !button.contains(event.target as Node)) {
          setIsWalletDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isWalletDropdownOpen]);

  const handleConnectWallet = (wallet?: any) => {
    connect(
      wallet ? { wallet } : undefined,
      {
        onSuccess: () => {
          console.log('Successfully connected!');
          onConnect(); // Navigate to dashboard
        },
        onError: (error) => {
          console.error('Connection failed:', error);
        }
      }
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-slate-50 font-sans text-slate-800 selection:bg-teal-100 selection:text-teal-900 scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 supports-[backdrop-filter]:bg-white/60"></div>
        <div className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
                <div className="absolute inset-0 bg-teal-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity rounded-full duration-500"></div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#334155] flex items-center justify-center text-white shadow-lg shadow-slate-900/10 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-300">
                  <Box size={20} strokeWidth={2.5} className="text-teal-400" />
                </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">MYLO</span>
          </div>

          {/* Centered Pill Navigation */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <div className="flex items-center gap-1 bg-white/50 p-1.5 rounded-full border border-slate-200/60 backdrop-blur-md shadow-sm">
                <a href="#problem" className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200">The Problem</a>
                <a href="#demo" className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200">Live Demo</a>
                <a href="#vision" className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200">Vision</a>
             </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button 
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                variant="primary" 
                className="wallet-button shadow-xl shadow-slate-900/10 rounded-full px-6 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white border border-slate-700 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              >
                Connect Wallet
                <ChevronDown size={16} className={`transition-transform duration-300 ${isWalletDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {isWalletDropdownOpen && (
                <div className="wallet-dropdown absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in" 
                     style={{ animation: 'fadeIn 0.2s ease-out forwards' }}>
                  {wallets.length > 0 ? (
                    wallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        onClick={() => {
                          handleConnectWallet(wallet);
                          setIsWalletDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                      >
                        {wallet.icon ? (
                          <img 
                            src={wallet.icon} 
                            alt={wallet.name} 
                            className="w-8 h-8 rounded-full object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Wallet size={16} className="text-slate-500" />
                          </div>
                        )}
                        <span className="font-medium text-slate-700">{wallet.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <Wallet className="mx-auto text-slate-400 mb-2" size={24} />
                      <p className="text-slate-500 text-sm">No wallets detected</p>
                      <p className="text-slate-400 text-xs mt-1">Please install a Sui-compatible wallet</p>
                    </div>
                  )}
                  
                  <div className="border-t border-slate-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        handleConnectWallet();
                        setIsWalletDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Sparkles size={16} className="text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-700">Auto Select</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative pt-32 pb-32 lg:pt-48 lg:pb-56 overflow-hidden bg-slate-50 perspective-[2000px]"
        onMouseMove={handleMouseMove}
      >
         {/* Tech Background Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none"></div>
         
         {/* Abstract Geometric Shapes (Crypto Feel) */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Floating Cube 1 */}
            <div 
                className="absolute top-[15%] left-[5%] w-32 h-32 border border-slate-200/60 rounded-3xl rotate-12 bg-gradient-to-br from-white/40 to-transparent backdrop-blur-sm"
                style={{ transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px) rotate(${mousePos.x * 10}deg)` }}
            ></div>
             {/* Floating Cube 2 */}
            <div 
                className="absolute top-[30%] right-[10%] w-24 h-24 border border-teal-100/60 rounded-2xl -rotate-12 bg-gradient-to-bl from-teal-50/40 to-transparent backdrop-blur-sm"
                 style={{ transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -20}px) rotate(${mousePos.y * 10}deg)` }}
            ></div>
             {/* Gradient Glows */}
            <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-teal-200/10 rounded-full blur-[120px] mix-blend-multiply"></div>
            <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-indigo-200/10 rounded-full blur-[100px] mix-blend-multiply"></div>
         </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
             
            {/* Pill Badge */}
            <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-10 cursor-default hover:border-teal-200 transition-colors group"
                style={{ transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}
            >
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-teal-700 transition-colors">Powered by Sui Network</span>
            </div>

            <div className="relative max-w-5xl mx-auto">
                <h1 
                    className="text-6xl md:text-8xl font-bold tracking-tight text-slate-900 mb-8 leading-[0.95] drop-shadow-sm"
                    style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` }}
                >
                    Not a bank.<br />
                    <span className="relative inline-block">
                        <span className="absolute -inset-1 bg-gradient-to-r from-teal-100 to-indigo-100 blur-xl opacity-50"></span>
                        <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-[#2C7A7B] via-[#3B8D85] to-indigo-600">Smarter than a wallet.</span>
                    </span>
                </h1>

                <p 
                    className="text-xl md:text-2xl text-slate-500 mb-10 max-w-2xl mx-auto font-light leading-relaxed"
                    style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)` }}
                >
                    The first AI wallet that speaks your language. <br className="hidden md:block" />
                    <span className="text-slate-800 font-medium">Swap, mint, and manage assets on Sui</span> with simple conversation.
                </p>

                <div 
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-28"
                    style={{ transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}
                >
                    <Button 
                      onClick={() => setIsWalletDropdownOpen(true)}
                      size="lg" 
                      className="h-14 px-8 text-lg rounded-full shadow-xl shadow-teal-900/10 bg-[#0F172A] hover:bg-[#1E293B] text-white border border-slate-800 transition-all hover:-translate-y-1 active:scale-95"
                    >
                        Connect Wallet
                    </Button>
                    <Button variant="secondary" size="lg" className="h-14 px-8 text-lg rounded-full bg-white/80 backdrop-blur-sm border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition-all hover:shadow-lg hover:-translate-y-1 group">
                        <span className="mr-2">View Demo</span>
                        <ArrowUpRight size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </Button>
                </div>
            </div>
            
            {/* 3D Floating Interface Mockup */}
            <div 
                className="relative max-w-4xl mx-auto perspective-[3000px] group"
                style={{ 
                    transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -5}px) rotateX(${20 + mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                 {/* Main Dashboard Card */}
                 <div className="relative z-20 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(50,50,93,0.15),0_30px_60px_-30px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-900/5 overflow-hidden">
                      
                      {/* Reflection Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 opacity-50 pointer-events-none"></div>
                      
                      {/* Fake UI Header */}
                      <div className="h-16 border-b border-slate-100/80 flex items-center px-8 justify-between bg-white/50">
                          <div className="flex items-center gap-3">
                             <div className="flex gap-1.5">
                                 <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                             </div>
                          </div>
                          <div className="px-4 py-1.5 bg-slate-100/50 rounded-full border border-slate-200/50 flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mainnet</span>
                          </div>
                      </div>

                      {/* Fake UI Body */}
                      <div className="flex h-[400px] bg-slate-50/30 relative">
                           {/* Sidebar */}
                           <div className="w-20 border-r border-slate-100/50 flex flex-col items-center py-8 gap-6 bg-white/40">
                               <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                                  <Wallet size={20} />
                               </div>
                               <div className="w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400">
                                  <Cpu size={20} />
                               </div>
                               <div className="w-10 h-10 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-400">
                                  <Layers size={20} />
                               </div>
                           </div>

                           {/* Main Chat Area */}
                           <div className="flex-1 p-8 flex flex-col">
                               <div className="flex-1 space-y-6">
                                    {/* Bot Message */}
                                    <div className="flex items-start gap-4 max-w-lg">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex-shrink-0 shadow-lg shadow-teal-500/30"></div>
                                        <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 text-sm text-slate-600 leading-relaxed">
                                            Hello! I see you have <strong>1,450 SUI</strong> available. Would you like to swap some for USDC or mint a new NFT collection?
                                        </div>
                                    </div>

                                    {/* User Message */}
                                    <div className="flex items-center justify-end gap-4">
                                        <div className="bg-[#0F172A] px-6 py-4 rounded-2xl rounded-tr-sm shadow-xl shadow-slate-900/10 text-sm text-white leading-relaxed">
                                            Mint this image as "Cosmic Fox".
                                        </div>
                                    </div>

                                    {/* Transaction Card */}
                                    <div className="flex items-start gap-4 max-w-lg animate-fade-in-up">
                                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex-shrink-0 shadow-lg shadow-teal-500/30 opacity-50"></div>
                                         <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-teal-100 shadow-sm ring-1 ring-teal-50">
                                              <div className="flex items-center gap-3 mb-3">
                                                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                                                      <img src="https://picsum.photos/seed/fox/100/100" className="w-full h-full object-cover" />
                                                  </div>
                                                  <div>
                                                      <div className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-0.5">Drafting Transaction</div>
                                                      <div className="font-bold text-slate-800">Mint "Cosmic Fox"</div>
                                                  </div>
                                              </div>
                                              <div className="flex gap-2">
                                                  <div className="h-8 bg-[#3B8D85] text-white rounded-lg flex-1 flex items-center justify-center text-xs font-bold shadow-lg shadow-teal-500/20">Confirm</div>
                                                  <div className="h-8 bg-slate-100 text-slate-500 rounded-lg w-20 flex items-center justify-center text-xs font-bold">Edit</div>
                                              </div>
                                         </div>
                                    </div>
                               </div>
                           </div>
                      </div>
                 </div>

                 {/* Floating Elements for Depth */}
                 <div className="absolute -right-12 top-20 z-30 animate-float-slow">
                     <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50 ring-1 ring-slate-900/5">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                 <CheckCircle size={20} />
                             </div>
                             <div>
                                 <div className="text-[10px] text-slate-400 uppercase font-bold">Status</div>
                                 <div className="text-sm font-bold text-slate-800">Mint Success</div>
                             </div>
                         </div>
                     </div>
                 </div>

                 <div className="absolute -left-8 bottom-32 z-30 animate-float-medium">
                     <div className="bg-[#0F172A] p-4 rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-700">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                 <Zap size={16} />
                             </div>
                             <div>
                                 <div className="text-[10px] text-slate-400 uppercase font-bold">Gas Fee</div>
                                 <div className="text-sm font-bold text-white">0.001 SUI</div>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section id="problem" className="py-24 bg-[#0F172A] text-white relative overflow-hidden -mt-2">
         {/* Pattern Overlay */}
         <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(45deg,#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent opacity-10"></div>
         
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-start">
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="h-px w-12 bg-teal-500"></div>
                        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-widest">The Problem</h2>
                    </div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                        Why is managing money still so <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">hard?</span>
                    </h3>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                        People struggle to manage money because financial systems, especially crypto, remain complex, technical, and fragmented.
                    </p>
                    <div className="p-8 rounded-3xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                        <p className="text-slate-300 italic relative z-10 font-light text-lg">"There are too many apps, too many steps, and too much technical jargon. I just want it to work."</p>
                    </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                    <ProblemCard icon={<Layers size={20} />} text="Multiple interfaces" delay="0" />
                    <ProblemCard icon={<GitMerge size={20} />} text="Multi-step processes" delay="100" />
                    <ProblemCard icon={<FileQuestion size={20} />} text="Confusing terminology" delay="200" />
                    <ProblemCard icon={<AlertTriangle size={20} />} text="Fear of making mistakes" delay="300" />
                    <ProblemCard icon={<Languages size={20} />} text="Language limitations" delay="400" />
                    <ProblemCard icon={<Clock size={20} />} text="Lack of real-time help" delay="500" />
                </div>
            </div>
         </div>
      </section>

      {/* Interactive Demo Chat Section */}
      <section id="demo" className="py-24 px-6 relative bg-slate-50 border-t border-slate-200">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Ask MYLO Anything</h2>
                <p className="text-slate-500 max-w-lg mx-auto text-lg">Curious about Sui, NFTs, or DeFi? Chat with MYLO right now to see how it simplifies blockchain education.</p>
            </div>
            
            <div className="relative">
                {/* Chat Widget Container */}
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden transform transition-all hover:shadow-slate-300/50">
                     {/* Fake Browser Header */}
                     <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                mylo.ai/demo
                            </div>
                        </div>
                        <div className="w-12"></div> 
                     </div>
                     
                     {/* Chat Interface */}
                     <LandingChatWidget />
                </div>
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Why MYLO Matters</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="text-[#3B8D85]" size={24} />}
              title="Multilingual by Default"
              description="Break down language barriers. MYLO executes financial commands in any language, bridging the gap for global adoption."
            />
            <FeatureCard 
              icon={<Shield className="text-[#3B8D85]" size={24} />}
              title="Secure & User-Controlled"
              description="AI handles the complexity, you hold the keys. Transactions are drafted for your review and signed only by you."
            />
            <FeatureCard 
              icon={<Zap className="text-[#3B8D85]" size={24} />}
              title="Unified Finance"
              description="Stop switching apps. Manage fiat, crypto, and NFTs in one continuous, intelligent conversation thread."
            />
          </div>
        </div>
      </section>

      {/* Vision / Bento Grid Section */}
      <section id="vision" className="py-24 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
             <div className="mb-16 md:text-center max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Built for the Future of Money</h2>
                <p className="text-lg text-slate-500 leading-relaxed">MYLO is not just a wallet; it's a new paradigm where intent replaces interface.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                 {/* Large Block */}
                 <div className="md:col-span-8 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal-100 transition-colors"></div>
                     <div className="relative z-10">
                         <div className="w-14 h-14 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-slate-900/20">
                             <MessageSquare size={26} />
                         </div>
                         <h3 className="text-3xl font-bold text-slate-900 mb-4">Conversation is the Interface</h3>
                         <p className="text-slate-500 max-w-lg text-lg leading-relaxed">We believe people shouldn't have to learn how technology works. Technology should learn how people speak. MYLO translates natural language into blockchain execution.</p>
                     </div>
                 </div>

                 {/* Tall Block */}
                 <div className="md:col-span-4 bg-[#0F172A] rounded-[2rem] p-10 shadow-2xl shadow-slate-900/20 text-white flex flex-col justify-between relative overflow-hidden group border border-slate-800">
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                     <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                     <div>
                         <h3 className="text-2xl font-bold mb-3">Sui Powered</h3>
                         <p className="text-slate-400">Leveraging the speed and scalability of the Sui Network.</p>
                     </div>
                     <div className="mt-8 flex gap-2 flex-wrap">
                         <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium border border-white-10">Instant Finality</div>
                         <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium border border-white-10">Low Gas</div>
                     </div>
                 </div>

                 {/* Wide Block */}
                 <div className="md:col-span-12 bg-white rounded-[2rem] p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-12 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                     <div className="flex-1">
                         <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
                         <p className="text-slate-500 text-xl leading-relaxed font-light">
                             "To eliminate the friction, complexity, and technical barriers that limit users from fully participating in digital finance."
                         </p>
                         <div className="mt-8 flex items-center gap-6">
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle size={12} />
                                </div>
                                <span className="font-semibold text-slate-700">Simplifying Web3</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle size={12} />
                                </div>
                                <span className="font-semibold text-slate-700">Expanding Access</span>
                             </div>
                         </div>
                     </div>
                     <div className="w-full md:w-1/3 h-56 bg-slate-100 rounded-3xl overflow-hidden relative group shadow-inner">
                         <img src="https://picsum.photos/seed/future/600/400" alt="Future" className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 transition-all duration-700" />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
                             <p className="text-white font-bold text-lg">Join the revolution</p>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] text-slate-400 py-20 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16 border-b border-slate-800/50 pb-16">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-[#0F172A] shadow-lg shadow-teal-500/20">
                        <Box size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-3xl font-bold text-white tracking-tight">MYLO</span>
                </div>
                <div className="flex gap-10 text-sm font-medium">
                    <a href="#" className="hover:text-teal-400 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-teal-400 transition-colors">Terms</a>
                    <a href="#" className="hover:text-teal-400 transition-colors">Twitter</a>
                    <a href="#" className="hover:text-teal-400 transition-colors">Discord</a>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
                <p>&copy; 2024 MYLO Financial Technologies. All rights reserved.</p>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    <p>Built on Sui. Powered by Gemini.</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};
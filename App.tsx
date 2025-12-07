import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ChatArea } from './components/ChatArea';
import { LandingPage } from './components/LandingPage';
import { MintPage } from './components/MintPage';
import { GalleryPage } from './components/GalleryPage';
import { SwapPage } from './components/SwapPage';
import { BeneficiariesPage } from './components/BeneficiariesPage';
import { ActivityPage } from './components/ActivityPage';
import { Button } from './components/Button';
import { LogOut, Menu, Globe, ChevronDown } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useDisconnectWallet, useSuiClient } from '@mysten/dapp-kit';
import { Toaster } from 'react-hot-toast';
// Import the useContacts hook
import { useContacts } from './hooks/useContacts';

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'mint' | 'gallery' | 'swap' | 'beneficiaries' | 'activity'
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>(() => {
    // Get saved network from localStorage or default to mainnet
    const savedNetwork = localStorage.getItem('selectedNetwork');
    return (savedNetwork === 'mainnet' || savedNetwork === 'testnet') ? savedNetwork : 'mainnet';
  });
  const [isNetworkMenuOpen, setIsNetworkMenuOpen] = useState(false);
  const currentAccount = useCurrentAccount();
  const disconnectWalletMutation = useDisconnectWallet();
  
  // Use the contacts hook at the App level
  const { contacts, addContact, deleteContact, resolveContact } = useContacts();
  
  // Add debugging to see what contacts are loaded
  useEffect(() => {
    console.log("App contacts updated:", contacts);
  }, [contacts]);

  if (!currentAccount) {
    return <LandingPage onConnect={() => setIsConnected(true)} />;
  }

  const toggleNetwork = (net: 'mainnet' | 'testnet') => {
    setNetwork(net);
    setIsNetworkMenuOpen(false);
    // Save network to localStorage
    localStorage.setItem('selectedNetwork', net);
    // Dispatch a custom event to notify index.tsx about network change
    window.dispatchEvent(new CustomEvent('networkChange', { detail: net }));
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'chat' && currentView !== 'activity') {
        // If navigating to chat explicitly via sidebar (not from activity list), reset session
        setSelectedChatId(null);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedChatId(sessionId);
    setCurrentView('chat');
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={handleNavigate}
      isMobileMenuOpen={isMobileMenuOpen}
      onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      network={network} // Pass network prop to Layout
    >
      <div className="flex flex-col h-full w-full">
         {/* Top Header specific to Dashboard */}
         <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/50 bg-white/50 backdrop-blur-md sticky top-0 z-30">
             <div className="flex items-center gap-3">
                <Tooltip content="Open Menu" className="lg:hidden">
                    <button 
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full"
                    onClick={() => setIsMobileMenuOpen(true)}
                    >
                    <Menu size={24} />
                    </button>
                </Tooltip>
                 <div>
                     <h1 className="text-xl font-bold text-slate-800">
                        MYLO
                     </h1>
                     <p className="text-xs text-slate-400 hidden sm:block">
                        {currentView === 'chat' ? (selectedChatId ? 'Chat History' : 'Conversational Interface') : 
                         currentView === 'mint' ? 'Minting Studio' : 
                         currentView === 'swap' ? 'Asset Swap' : 
                         currentView === 'beneficiaries' ? 'Contact Management' : 
                         currentView === 'activity' ? 'History' : 'Digital Assets'}
                     </p>
                 </div>
             </div>
             
             <div className="flex items-center gap-3">
                 {/* Network Selector */}
                 <div className="relative">
                    <Tooltip content="Switch Network">
                        <button 
                            onClick={() => setIsNetworkMenuOpen(!isNetworkMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <div className={`w-2 h-2 rounded-full ${network === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                {network === 'mainnet' ? 'Sui Mainnet' : 'Sui Testnet'}
                            </span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>
                    </Tooltip>
                    
                    {isNetworkMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-fade-in">
                            <button 
                                onClick={() => toggleNetwork('mainnet')}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium text-slate-700">Mainnet</span>
                                {network === 'mainnet' && <span className="ml-auto text-green-500 text-xs font-bold">✓</span>}
                            </button>
                            <button 
                                onClick={() => toggleNetwork('testnet')}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-left"
                            >
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <span className="text-sm font-medium text-slate-700">Testnet</span>
                                {network === 'testnet' && <span className="ml-auto text-green-500 text-xs font-bold">✓</span>}
                            </button>
                        </div>
                    )}
                 </div>

                 <Tooltip content="Disconnect Wallet" position="bottom">
                   <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => disconnectWalletMutation.mutate()}
                       className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                   >
                       <LogOut size={16} />
                   </Button>
                </Tooltip>
             </div>
         </div>
         
         {currentView === 'chat' && <ChatArea sessionId={selectedChatId} contacts={contacts} resolveContact={resolveContact} />}
         {currentView === 'mint' && <MintPage />}
         {currentView === 'gallery' && <GalleryPage />}
         {currentView === 'swap' && <SwapPage />}
         {currentView === 'beneficiaries' && <BeneficiariesPage contacts={contacts} addContact={addContact} deleteContact={deleteContact} />}
         {currentView === 'activity' && <ActivityPage onSelectSession={handleSelectSession} />}
      </div>
      <Toaster position="top-right" reverseOrder={false} /> {/* Add Toaster component */}
    </Layout>
  );
};

export default App;
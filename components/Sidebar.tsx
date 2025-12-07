
import React from 'react';
import { 
  LayoutGrid, 
  History, 
  Wallet, 
  Users,
  Box,
  ChevronRight,
  PlusSquare,
  RefreshCw,
  X
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  network?: 'mainnet' | 'testnet'; // Add optional network prop
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose, network }) => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null); // Add USDC balance state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentAccount?.address) {
        setBalance(null);
        setUsdcBalance(null);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch SUI balance
        const suiBalanceResponse = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: "0x2::sui::SUI"
        });
        
        const suiBalanceValue = Number(suiBalanceResponse.totalBalance) / 1_000_000_000;
        setBalance(suiBalanceValue);
        
        // Fetch USDC balance (using a common USDC contract address on Sui)
        try {
          const usdcBalanceResponse = await suiClient.getBalance({
            owner: currentAccount.address,
            coinType: "0x5d4b302506645c37ff133b98c4b7f1d8d9ca5a38e284d351c952093bed373099::coin::COIN"
          });
          
          const usdcBalanceValue = Number(usdcBalanceResponse.totalBalance) / 1_000_000; // USDC has 6 decimals
          setUsdcBalance(usdcBalanceValue);
        } catch (usdcError) {
          // USDC might not be available on this network or wallet doesn't have USDC
          setUsdcBalance(null);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch balances");
        setBalance(null);
        setUsdcBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [suiClient, currentAccount?.address]);

  const handleNavClick = (view: string) => {
      onNavigate(view);
      onClose?.();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-100 shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-64 lg:bg-transparent lg:border-r lg:border-slate-100/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col pt-6 pb-4">
          
          {/* Header */}
          <div className="px-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#3B8D85]">
              <div className="w-8 h-8 rounded-full bg-[#3B8D85]/10 flex items-center justify-center">
                <Box size={20} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">MYLO</span>
            </div>
            {/* Close Button Mobile */}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Balance Card */}
          <div className="px-4 mb-6">
            <Tooltip content="Your asset balances on the current network" position="bottom" className="w-full">
                <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-100 cursor-help">
                    <p className="text-sm text-slate-500 font-medium mb-1">Asset Balances</p>
                    {loading ? (
                      <div className="flex flex-col gap-2">
                        <div className="animate-pulse h-6 w-24 bg-slate-200 rounded"></div>
                        <div className="animate-pulse h-6 w-20 bg-slate-200 rounded"></div>
                      </div>
                    ) : error ? (
                      <h2 className="text-lg font-bold text-red-500">Error loading balances</h2>
                    ) : (
                      <div className="space-y-1">
                        {balance !== null ? (
                          <h2 className="text-xl font-bold text-slate-900">
                            {balance.toFixed(4)} <span className="text-sm font-normal text-slate-500">SUI</span>
                          </h2>
                        ) : (
                          <h2 className="text-lg font-bold text-slate-400">No SUI balance</h2>
                        )}
                        {usdcBalance !== null && usdcBalance > 0 ? (
                          <h2 className="text-xl font-bold text-slate-900">
                            {usdcBalance.toFixed(2)} <span className="text-sm font-normal text-slate-500">USDC</span>
                          </h2>
                        ) : null}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      {network ? `${network.charAt(0).toUpperCase() + network.slice(1)} network` : 'Current network'} balances
                    </p>
                </div>
            </Tooltip>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
            <NavItem 
              icon={<Wallet size={18} />} 
              label="Assistant" 
              description="Chat with MYLO AI"
              active={currentView === 'chat'} 
              onClick={() => handleNavClick('chat')}
            />
            <NavItem 
              icon={<RefreshCw size={18} />} 
              label="Swap" 
              description="Exchange tokens instantly"
              active={currentView === 'swap'} 
              onClick={() => handleNavClick('swap')}
            />
            <NavItem 
                icon={<PlusSquare size={18} />} 
                label="Mint NFT" 
                description="Create new digital assets"
                active={currentView === 'mint'}
                onClick={() => handleNavClick('mint')}
            />
            
            <div className="pt-4 pb-2">
              <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">History</p>
            </div>
            <NavItem 
                icon={<History size={18} />} 
                label="Activity" 
                description="View past conversations"
                active={currentView === 'activity'}
                onClick={() => handleNavClick('activity')}
            />
            
            <div className="pt-4 pb-2">
               <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Collectibles</p>
            </div>
            <NavItem 
                icon={<LayoutGrid size={18} />} 
                label="Gallery" 
                description="Manage your NFTs"
                active={currentView === 'gallery'}
                onClick={() => handleNavClick('gallery')}
            />
            
            <div className="pt-4 pb-2">
               <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">People</p>
            </div>
            <NavItem 
                icon={<Users size={18} />} 
                label="Beneficiaries" 
                description="Saved contacts"
                active={currentView === 'beneficiaries'}
                onClick={() => handleNavClick('beneficiaries')}
            />
          </nav>
        </div>
      </div>
    </>
  );
};

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  description: string;
  active?: boolean; 
  hasSub?: boolean;
  onClick?: () => void;
}> = ({ 
  icon, 
  label, 
  description,
  active,
  hasSub,
  onClick
}) => {
  return (
    <Tooltip content={description} position="right" className="w-full">
        <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active 
            ? 'bg-slate-100 text-slate-900 shadow-sm' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}>
        <div className="flex items-center gap-3">
            <span className={`${active ? 'text-[#3B8D85]' : 'text-slate-400'}`}>{icon}</span>
            <span>{label}</span>
        </div>
        {hasSub && <ChevronRight size={14} className="text-slate-300" />}
        </button>
    </Tooltip>
  );
};


import React, { useEffect, useState } from 'react';
import { MoreVertical, ArrowUpRight, ArrowDownLeft, QrCode, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Tooltip } from './Tooltip';
import { ExchangeRateService } from '../services/exchangeRateService';
import { ExchangeRatePoint } from '../types/types';
import { DataService } from '../services/dataService';
import { OnChainTransactionService } from '../services/onChainTransactionService';
import { TransactionHistory } from '../types/types';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

export const RightPanel: React.FC = () => {
  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRatePoint[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionHistory[]>([]);
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [rateChange, setRateChange] = useState<number>(0);
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      const history = ExchangeRateService.getRateHistory();
      setExchangeRateData(history);
      
      // Load transactions from blockchain
      if (currentAccount?.address) {
        const packageId = import.meta.env.VITE_TRANSACTION_HISTORY_PACKAGE_ID;
        const registryId = import.meta.env.VITE_TRANSACTION_REGISTRY_ID;
        
        if (packageId && registryId && packageId !== '0x_your_package_id_here') {
          try {
            const onChainService = new OnChainTransactionService(suiClient, packageId, registryId);
            const txHistory = await onChainService.getUserTransactions(currentAccount.address);
            setRecentTransactions(txHistory.slice(0, 3));
          } catch (error) {
            console.error('Error loading transactions:', error);
          }
        }
      }
      
      // Calculate rate change
      if (history.length > 1) {
        const latest = history[history.length - 1];
        const previous = history[0];
        const change = ((latest.rate - previous.rate) / previous.rate) * 100;
        setRateChange(change);
        setCurrentRate(latest.rate);
      }
    };

    loadData();

    // Fetch and save exchange rate data every 5 minutes
    const fetchAndSaveRate = async () => {
      try {
        const [suiPrice, ngnRate] = await Promise.all([
          DataService.getSuiPrice(),
          DataService.getUsdToNgnRate()
        ]);

        const rate = suiPrice * ngnRate;
        const point: ExchangeRatePoint = {
          timestamp: Date.now(),
          rate,
          suiPrice,
          ngnRate
        };

        ExchangeRateService.saveRatePoint(point);
        
        // Update state
        const updatedHistory = ExchangeRateService.getRateHistory();
        setExchangeRateData(updatedHistory);
        setCurrentRate(rate);

        // Calculate rate change
        if (updatedHistory.length > 1) {
          const latest = updatedHistory[updatedHistory.length - 1];
          const previous = updatedHistory[0];
          const change = ((latest.rate - previous.rate) / previous.rate) * 100;
          setRateChange(change);
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      }
    };

    // Fetch initial rate
    fetchAndSaveRate();

    // Update every 5 minutes
    const rateInterval = setInterval(fetchAndSaveRate, 5 * 60 * 1000);
    
    // Refresh transactions every 30 seconds (blockchain data)
    const txInterval = setInterval(async () => {
      if (currentAccount?.address) {
        const packageId = import.meta.env.VITE_TRANSACTION_HISTORY_PACKAGE_ID;
        const registryId = import.meta.env.VITE_TRANSACTION_REGISTRY_ID;
        
        if (packageId && registryId && packageId !== '0x_your_package_id_here') {
          try {
            const onChainService = new OnChainTransactionService(suiClient, packageId, registryId);
            const txHistory = await onChainService.getUserTransactions(currentAccount.address);
            setRecentTransactions(txHistory.slice(0, 3));
          } catch (error) {
            console.error('Error loading transactions:', error);
          }
        }
      }
    }, 30000);

    return () => {
      clearInterval(rateInterval);
      clearInterval(txInterval);
    };
  }, []);

  // Format data for the chart
  const chartData = exchangeRateData.map((point, index) => ({
    name: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rate: point.rate,
    timestamp: point.timestamp
  }));

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <ArrowUpRight size={14} />;
      case 'receive': return <ArrowDownLeft size={14} />;
      default: return <ShieldCheck size={14} />;
    }
  };

  const getTransactionType = (type: string) => {
    switch (type) {
      case 'send': return 'sent';
      case 'receive': return 'received';
      default: return 'neutral';
    }
  };

  const formatTransactionTitle = (tx: TransactionHistory) => {
    switch (tx.type) {
      case 'swap': return `Swapped ${tx.fromAsset}`;
      case 'send': return `Sent ${tx.fromAsset}`;
      case 'receive': return `Received ${tx.toAsset}`;
      case 'fiat_conversion': return 'Converted to NGN';
      default: return 'Transaction';
    }
  };

  const formatTransactionSubtitle = (tx: TransactionHistory) => {
    switch (tx.type) {
      case 'swap': return `To ${tx.toAsset}`;
      case 'send': return `To ${tx.recipient?.substring(0, 8)}...`;
      case 'receive': return `From ${tx.sender?.substring(0, 8)}...`;
      case 'fiat_conversion': return tx.bankName || 'Bank';
      default: return '';
    }
  };

  const formatTransactionAmount = (tx: TransactionHistory) => {
    switch (tx.type) {
      case 'swap': return `${tx.fromAmount} ${tx.fromAsset}`;
      case 'send': return `-${tx.fromAmount} ${tx.fromAsset}`;
      case 'receive': return `+${tx.toAmount} ${tx.toAsset}`;
      case 'fiat_conversion': return `₦${tx.toAmount?.toFixed(2)}`;
      default: return '';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="w-[320px] h-full flex flex-col border-l border-slate-100 bg-white/50 backdrop-blur-sm pt-6 px-6 pb-6 hidden lg:flex">
      {/* Header Profile */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {currentAccount?.address ? currentAccount.address.substring(0, 2).toUpperCase() : '0x'}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
                <span className="text-sm font-bold text-slate-800 block">
                  {currentAccount?.address 
                    ? `${currentAccount.address.substring(0, 6)}...${currentAccount.address.substring(currentAccount.address.length - 4)}`
                    : 'Not Connected'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
        <Tooltip content="Account Options" position="left">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all">
                <MoreVertical size={16} />
            </button>
        </Tooltip>
      </div>

      <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Quick Actions */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="flex justify-between gap-2">
                <QuickAction icon={<ArrowUpRight size={20} />} label="Send" color="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" />
                <QuickAction icon={<ArrowDownLeft size={20} />} label="Receive" color="bg-teal-50 text-teal-600 hover:bg-teal-100" />
                <QuickAction icon={<QrCode size={20} />} label="Scan" color="bg-slate-50 text-slate-600 hover:bg-slate-100" />
            </div>
        </div>

        {/* Exchange Rate Chart */}
        <div>
            <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SUI/NGN Rate</h3>
                 <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                   rateChange >= 0 
                     ? 'text-green-500 bg-green-50' 
                     : 'text-red-500 bg-red-50'
                 }`}>
                     {rateChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                     {rateChange >= 0 ? '+' : ''}{rateChange.toFixed(2)}%
                 </div>
            </div>
            
            <div className="h-40 w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-50 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase">Current Rate</p>
                        <p className="text-lg font-bold text-slate-800">
                          ₦{currentRate ? currentRate.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
                        </p>
                    </div>
                </div>
                {chartData.length > 0 ? (
                  <div className="absolute bottom-0 left-0 right-0 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs>
                                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3B8D85" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#3B8D85" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                                formatter={(value: any) => [`₦${parseFloat(value).toFixed(2)}`, 'Rate']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#3B8D85" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorRate)" 
                              />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 text-xs text-slate-400">
                    Loading rate data...
                  </div>
                )}
            </div>
        </div>

        {/* Recent Transactions */}
        <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h3>
            <div className="space-y-3">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => (
                    <TransactionItem 
                      key={tx.id}
                      icon={getTransactionIcon(tx.type)} 
                      title={formatTransactionTitle(tx)} 
                      subtitle={formatTransactionSubtitle(tx)} 
                      amount={formatTransactionAmount(tx)} 
                      time={getTimeAgo(tx.timestamp)}
                      type={getTransactionType(tx.type) as 'sent' | 'received' | 'neutral'}
                    />
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No recent transactions
                  </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; color: string }> = ({ icon, label, color }) => (
    <Tooltip content={`Quickly ${label.toLowerCase()} assets`}>
        <button className={`flex flex-col items-center justify-center w-full aspect-square rounded-2xl transition-all ${color} group`}>
            <div className="mb-1 group-hover:scale-110 transition-transform">{icon}</div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    </Tooltip>
);

const TransactionItem: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; amount: string; time: string; type: 'sent' | 'received' | 'neutral' }> = ({ icon, title, subtitle, amount, time, type }) => {
    const bgColors = {
        sent: 'bg-slate-100 text-slate-600',
        received: 'bg-green-50 text-green-600',
        neutral: 'bg-indigo-50 text-indigo-600'
    };

    return (
        <Tooltip content="View transaction details" position="left">
            <button className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group text-left">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColors[type]}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{title}</p>
                        <p className="text-[10px] text-slate-400">{subtitle}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-xs font-bold ${type === 'received' ? 'text-green-600' : 'text-slate-700'}`}>{amount}</p>
                    <div className="flex items-center gap-1 justify-end text-[10px] text-slate-400">
                        <Clock size={8} /> {time}
                    </div>
                </div>
            </button>
        </Tooltip>
    );
}

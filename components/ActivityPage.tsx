
import React, { useEffect, useState } from 'react';
import { MessageSquare, Clock, ArrowRight, Trash2, ArrowUpRight, ArrowDownLeft, RefreshCw, Banknote, Loader } from 'lucide-react';
import { ChatSession } from '../types';
import { TransactionHistory } from '../types/types';
import { OnChainTransactionService } from '../services/onChainTransactionService';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

interface ActivityPageProps {
  onSelectSession: (sessionId: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'transactions'>('chats');
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  useEffect(() => {
    const loadSessions = () => {
      try {
        const stored = localStorage.getItem('mylo_chat_sessions');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Sort by newest first
          const sorted = parsed.sort((a: ChatSession, b: ChatSession) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setSessions(sorted);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    };

    const loadTransactions = async () => {
      if (!currentAccount?.address) {
        setTransactions([]);
        return;
      }
      
      const packageId = import.meta.env.VITE_TRANSACTION_HISTORY_PACKAGE_ID;
      const registryId = import.meta.env.VITE_TRANSACTION_REGISTRY_ID;
      
      if (!packageId || !registryId || packageId === '0x_your_package_id_here') {
        console.warn('On-chain transaction history not configured');
        setTransactions([]);
        return;
      }
      
      setIsLoadingTransactions(true);
      try {
        const onChainService = new OnChainTransactionService(suiClient, packageId, registryId);
        const txHistory = await onChainService.getUserTransactions(currentAccount.address);
        setTransactions(txHistory);
      } catch (error) {
        console.error('Error loading transactions from blockchain:', error);
        setTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    loadSessions();
    loadTransactions();
    
    // Refresh transactions periodically (every 30 seconds for blockchain data)
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, [currentAccount, suiClient]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('mylo_chat_sessions', JSON.stringify(updated));
  };

  const handleDeleteTransaction = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // On-chain transactions are immutable and cannot be deleted
    // This function is kept for UI compatibility but does nothing
    console.warn('Cannot delete on-chain transactions - they are immutable');
  };

  const groupSessions = () => {
    const groups: { [key: string]: ChatSession[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    sessions.forEach(session => {
      const date = new Date(session.timestamp).getTime();
      if (date >= today) {
        groups['Today'].push(session);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(session);
      } else if (date >= lastWeek) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const groupTransactions = () => {
    const groups: { [key: string]: TransactionHistory[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).getTime();
      if (date >= today) {
        groups['Today'].push(tx);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(tx);
      } else if (date >= lastWeek) {
        groups['Previous 7 Days'].push(tx);
      } else {
        groups['Older'].push(tx);
      }
    });

    return groups;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap': return <RefreshCw size={20} />;
      case 'send': return <ArrowUpRight size={20} />;
      case 'receive': return <ArrowDownLeft size={20} />;
      case 'fiat_conversion': return <Banknote size={20} />;
      default: return <MessageSquare size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'swap': return 'bg-blue-50 text-blue-600';
      case 'send': return 'bg-slate-100 text-slate-600';
      case 'receive': return 'bg-green-50 text-green-600';
      case 'fiat_conversion': return 'bg-teal-50 text-teal-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const getTransactionDescription = (tx: TransactionHistory) => {
    switch (tx.type) {
      case 'swap':
        return `${tx.fromAmount} ${tx.fromAsset} → ${tx.toAmount?.toFixed(2)} ${tx.toAsset}`;
      case 'send':
        return `${tx.fromAmount} ${tx.fromAsset} to ${tx.recipient?.substring(0, 8)}...`;
      case 'receive':
        return `${tx.toAmount} ${tx.toAsset} from ${tx.sender?.substring(0, 8)}...`;
      case 'fiat_conversion':
        return `${tx.fromAmount} ${tx.fromAsset} → ₦${tx.toAmount?.toFixed(2)} (${tx.bankName})`;
      default:
        return 'Transaction';
    }
  };

  const grouped = activeTab === 'chats' ? groupSessions() : groupTransactions();

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Activity History</h1>
            <p className="text-slate-500">Resume your previous conversations and view transactions.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 font-semibold text-sm transition-all ${
              activeTab === 'chats'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Conversations ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 font-semibold text-sm transition-all ${
              activeTab === 'transactions'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Transactions ({transactions.length})
          </button>
        </div>

        {activeTab === 'chats' && sessions.length === 0 && (
           <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Clock size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-600">No activity yet</h3>
              <p className="text-slate-400">Start a conversation with the Assistant to see it here.</p>
           </div>
        )}

        {activeTab === 'transactions' && transactions.length === 0 && (
           <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Clock size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-600">No transactions yet</h3>
              <p className="text-slate-400">Your swap and transfer history will appear here.</p>
           </div>
        )}

        {/* Chats View */}
        {activeTab === 'chats' && sessions.length > 0 && (
          <div className="space-y-8">
            {Object.entries(grouped).map(([label, groupSessions]) => (
              groupSessions.length > 0 && (
                <div key={label}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">{label}</h3>
                  <div className="space-y-3">
                    {groupSessions.map((session: any) => (
                      <div 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#3B8D85] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3B8D85] group-hover:text-white transition-colors">
                              <MessageSquare size={20} />
                           </div>
                           <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate pr-4">{session.preview || 'New Conversation'}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                <span className="mx-1">•</span>
                                {session.messages.length} messages
                              </p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleDelete(e, session.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button className="p-2 text-slate-300 group-hover:text-[#3B8D85]">
                                <ArrowRight size={18} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Transactions View */}
        {activeTab === 'transactions' && transactions.length > 0 && (
          <div className="space-y-8">
            {Object.entries(grouped).map(([label, groupTransactions]) => (
              groupTransactions.length > 0 && (
                <div key={label}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">{label}</h3>
                  <div className="space-y-3">
                    {groupTransactions.map((tx: any) => (
                      <div 
                        key={tx.id}
                        className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getTransactionColor(tx.type)}`}>
                              {getTransactionIcon(tx.type)}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-800 capitalize">{tx.type.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-500 truncate">{getTransactionDescription(tx)}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                <Clock size={10} />
                                {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                <span className="mx-1">•</span>
                                <span className={`font-medium ${
                                  tx.status === 'completed' ? 'text-green-600' : 
                                  tx.status === 'pending' ? 'text-yellow-600' : 
                                  'text-red-600'
                                }`}>
                                  {tx.status}
                                </span>
                              </p>
                           </div>
                        </div>
                        
                        <button 
                            onClick={(e) => handleDeleteTransaction(e, tx.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { Message, Sender, MessageType } from '../types';
import { Button } from './Button';
import { Box, Check, Cpu, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onConfirmDraft?: (draftId: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onConfirmDraft }) => {
  const isUser = message.sender === Sender.User;

  if (message.type === MessageType.Draft && message.draft) {
    return (
      <div className="flex justify-start mb-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-50/50 p-1 max-w-lg w-full">
            <div className="bg-slate-50/50 rounded-xl p-4">
                <div className="flex items-start gap-4 mb-4">
                    {/* Draft Image Preview */}
                    <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
                        {message.draft.image ? (
                             <img src={message.draft.image} alt="NFT Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Box size={24} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#3B8D85] bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Draft</span>
                            <span className="text-xs text-slate-400">Minting NFT</span>
                        </div>
                        <h4 className="font-bold text-slate-800">{message.draft.name || 'Untitled'}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2">{message.draft.description || 'No description provided.'}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Network</span>
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            {message.draft.network || 'Sui'}
                        </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Est. Gas</span>
                        <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                            <Cpu size={10} />
                            {message.draft.gas || '0.001 SUI'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                     <Button 
                        variant="primary" 
                        size="sm" 
                        className="w-full bg-[#6C5CE7] hover:bg-[#5D4ED4] shadow-lg shadow-indigo-200"
                        onClick={() => onConfirmDraft?.(message.id)}
                    >
                        Confirm & Mint
                     </Button>
                </div>
            </div>
            {/* Optional AI sub-comment */}
             <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                Draft created based on your request.
            </div>
        </div>
      </div>
    );
  }

  // Handle transaction messages
  if (message.type === MessageType.Transaction && message.transactionData) {
    const { status, digest, gasUsed, eventsCount, timestamp } = message.transactionData;
    const explorerUrl = digest ? `https://testnet.suivision.xyz/txblock/${digest}` : '#';

    return (
      <div className={`flex justify-start mb-6 max-w-[80%]`}>
        <div className={`px-4 py-3 rounded-xl text-sm border-l-4 ${
          status === 'success'
            ? 'bg-blue-50 border-blue-500 text-blue-700'
            : status === 'failed'
              ? 'bg-red-50 border-red-500 text-red-700'
              : 'bg-gray-50 border-gray-500 text-gray-700'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {status === 'success' ? (
                <CheckCircle size={20} className="text-blue-500" />
              ) : status === 'failed' ? (
                <XCircle size={20} className="text-red-500" />
              ) : (
                <Clock size={20} className="text-gray-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{message.text}</span>
              </div>

              {digest && (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Digest:</span>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                      {digest.slice(0, 12)}...{digest.slice(-8)}
                    </code>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {gasUsed && gasUsed !== 'N/A' && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Gas:</span>
                        <span>{gasUsed}</span>
                      </div>
                    )}

                    {eventsCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Events:</span>
                        <span>{eventsCount}</span>
                      </div>
                    )}

                    {timestamp && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Time:</span>
                        <span>{timestamp.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {digest && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-current hover:underline font-medium"
                      >
                        <ExternalLink size={12} />
                        View on Explorer
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}>
      <div className={`max-w-2xl w-full flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* User Attached Image */}
        {message.image && (
          <div className="mb-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 inline-block">
             <img src={message.image} alt="User upload" className="h-32 w-auto rounded-lg object-cover" />
          </div>
        )}

        <div className={`relative px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm
          ${isUser 
            ? 'bg-white text-slate-700 rounded-tr-sm border border-slate-100' 
            : 'bg-white/80 text-slate-700 rounded-tl-sm border border-transparent shadow-none'
          }
        `}>
          {!isUser && (
              <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#3B8D85] to-teal-400 flex items-center justify-center text-white shadow-lg shadow-teal-100">
                  <span className="text-[10px] font-bold">M</span>
              </div>
          )}
          {message.text}
        </div>
        
        {/* Timestamp */}
        <span className="text-[10px] text-slate-300 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
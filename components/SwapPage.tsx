
import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowDownUp, Settings, ChevronDown, Info } from 'lucide-react';
import { Tooltip } from './Tooltip';

export const SwapPage: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
        setIsSwapping(false);
        setFromAmount('');
        setToAmount('');
        // In a real app, show success toast/modal
    }, 2000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center">
       <div className="w-full max-w-md">
           <div className="flex items-center justify-between mb-6">
               <h1 className="text-2xl font-bold text-slate-800">Swap Assets</h1>
               <Tooltip content="Slippage Settings">
                   <button className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
                       <Settings size={20} />
                   </button>
               </Tooltip>
           </div>

           <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden relative">
               
               {/* From Section */}
               <div className="p-6 pb-4">
                   <div className="flex justify-between mb-2">
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pay</label>
                       <span className="text-xs font-medium text-slate-500">Balance: 1,450.00 SUI</span>
                   </div>
                   <div className="flex items-center gap-4">
                       <input 
                           type="number" 
                           placeholder="0.0"
                           value={fromAmount}
                           onChange={(e) => setFromAmount(e.target.value)}
                           className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
                       />
                       <Tooltip content="Select Token">
                           <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors px-3 py-1.5 rounded-xl font-semibold text-slate-700 shrink-0">
                               <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                               SUI
                               <ChevronDown size={16} className="text-slate-400" />
                           </button>
                       </Tooltip>
                   </div>
                   <div className="mt-2 text-xs text-slate-400">
                       ~$0.00
                   </div>
               </div>

               {/* Divider / Switcher */}
               <div className="relative h-1 bg-slate-50">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                       <Tooltip content="Switch Direction">
                           <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm text-slate-400 cursor-pointer hover:bg-slate-50">
                                <ArrowDownUp size={16} />
                           </div>
                       </Tooltip>
                   </div>
               </div>

               {/* To Section */}
               <div className="p-6 pt-4 bg-slate-50/50">
                   <div className="flex justify-between mb-2">
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receive</label>
                       <span className="text-xs font-medium text-slate-500">Balance: 0.00 USDC</span>
                   </div>
                   <div className="flex items-center gap-4">
                       <input 
                           type="number" 
                           placeholder="0.0"
                           value={toAmount}
                           onChange={(e) => setToAmount(e.target.value)}
                           className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
                       />
                       <Tooltip content="Select Token">
                           <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors px-3 py-1.5 rounded-xl font-semibold text-slate-700 shrink-0 shadow-sm">
                               <div className="w-6 h-6 rounded-full bg-green-500"></div>
                               USDC
                               <ChevronDown size={16} className="text-slate-400" />
                           </button>
                       </Tooltip>
                   </div>
                   <div className="mt-2 text-xs text-slate-400">
                       ~$0.00
                   </div>
               </div>

               {/* Details Accordion (Simplified) */}
               <div className="px-6 py-4 border-t border-slate-100 bg-white">
                   <div className="flex justify-between text-xs text-slate-500 mb-2">
                       <span className="flex items-center gap-1">Rate <Info size={10} /></span>
                       <span className="font-medium">1 SUI ≈ 1.2 USDC</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-500">
                       <span className="flex items-center gap-1">Network Fee <Info size={10} /></span>
                       <span className="font-medium">0.0001 SUI</span>
                   </div>
               </div>

               {/* Action Button */}
               <div className="p-4">
                   <Button 
                        size="lg" 
                        className="w-full h-14 text-lg rounded-xl shadow-lg shadow-teal-500/20"
                        onClick={handleSwap}
                        disabled={isSwapping || !fromAmount}
                   >
                       {isSwapping ? 'Swapping...' : 'Review Swap'}
                   </Button>
               </div>
           </div>
           
           <p className="text-center text-xs text-slate-400 mt-6">
               Powered by Sui DEX Aggregators. <br/>Minimal slippage, maximum efficiency.
           </p>
       </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowDownUp, Settings, ChevronDown, Info, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';

interface Bank {
  id: number;
  name: string;
  code: string;
  slug: string;
}

interface AccountVerification {
  account_number: string;
  account_name: string;
}

export const SwapPage: React.FC = () => {
  const [suiAmount, setSuiAmount] = useState('');
  const [nairaAmount, setNairaAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [suiBalance, setSuiBalance] = useState<number | null>(null);
  
  // Naira swap states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [verification, setVerification] = useState<AccountVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  // Fetch user's SUI balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentAccount?.address) return;
      
      try {
        const balanceResponse = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: "0x2::sui::SUI"
        });
        
        const balanceValue = Number(balanceResponse.totalBalance) / 1_000_000_000;
        setSuiBalance(balanceValue);
      } catch (err) {
        console.error("Error fetching balance:", err);
      }
    };
    
    fetchBalance();
  }, [currentAccount, suiClient]);

  // Fetch Nigerian banks from Paystack
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
          headers: {
            'Authorization': 'Bearer sk_test_7aab64a468bed7aeac7b4d1ccafcd2e111b0fae8'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBanks(data.data);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
      }
    };

    fetchBanks();
  }, []);

  const handleSuiAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setSuiAmount(value);
      
      // Simple conversion rate for demo (1 SUI = 1000 NGN)
      if (value) {
        const nairaValue = (parseFloat(value) * 1000).toFixed(2);
        setNairaAmount(nairaValue);
      } else {
        setNairaAmount('');
      }
    }
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setAccountNumber(value);
      
      // Clear verification when account number changes
      if (verification) {
        setVerification(null);
        setVerificationError(null);
      }
    }
  };

  const verifyAccount = async () => {
    if (!selectedBank || !accountNumber) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${selectedBank.code}`,
        {
          headers: {
            'Authorization': 'Bearer sk_test_7aab64a468bed7aeac7b4d1ccafcd2e111b0fae8'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.status) {
        setVerification({
          account_number: data.data.account_number,
          account_name: data.data.account_name
        });
      } else {
        setVerificationError(data.message || 'Unable to verify account');
      }
    } catch (error) {
      setVerificationError('Network error. Please try again.');
      console.error('Error verifying account:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSwap = () => {
    const amount = parseFloat(suiAmount);
    
    // Check if user has sufficient balance
    if (suiBalance !== null && amount > suiBalance) {
      alert('Insufficient SUI balance');
      return;
    }
    
    if (!verification) {
      alert('Please verify your bank account first');
      return;
    }
    
    // Perform the swap
    setIsSwapping(true);
    
    // For demo purposes, we'll simulate the swap process
    setTimeout(() => {
      setIsSwapping(false);
      setSuiAmount('');
      setNairaAmount('');
      alert(`Successfully swapped ${suiAmount} SUI to Nigerian Naira and sent to ${verification.account_name}'s account`);
    }, 2000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Swap SUI to Naira</h1>
          <Tooltip content="Slippage Settings">
            <button className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
              <Settings size={20} />
            </button>
          </Tooltip>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden relative">
          {/* From Section - SUI */}
          <div className="p-6 pb-4">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pay</label>
              <span className="text-xs font-medium text-slate-500">
                Balance: {suiBalance !== null ? suiBalance.toFixed(4) : 'Loading...'} SUI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="text"
                placeholder="0.0"
                value={suiAmount}
                onChange={handleSuiAmountChange}
                className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
              />
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-semibold text-slate-700 shrink-0">
                <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                SUI
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              ~${suiAmount ? (parseFloat(suiAmount) * 1.85).toFixed(2) : '0.00'}
            </div>
          </div>

          {/* Divider / Switcher */}
          <div className="relative h-1 bg-slate-50">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm text-slate-400">
                <ArrowDownUp size={16} />
              </div>
            </div>
          </div>

          {/* To Section - Naira */}
          <div className="p-6 pt-4 bg-slate-50/50">
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Receive</label>
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="text"
                placeholder="0.0"
                value={nairaAmount}
                readOnly
                className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
              />
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-semibold text-slate-700 shrink-0 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-green-500"></div>
                NGN
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              ~₦{nairaAmount || '0.00'}
            </div>
          </div>

          {/* Bank Selection */}
          <div className="p-6 pt-4 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Bank
            </label>
            <div className="relative mb-4">
              <select
                value={selectedBank?.id || ''}
                onChange={(e) => {
                  const bank = banks.find(b => b.id === parseInt(e.target.value));
                  setSelectedBank(bank || null);
                  // Clear verification when bank changes
                  if (verification) {
                    setVerification(null);
                    setVerificationError(null);
                  }
                }}
                className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none"
              >
                <option value="">Select a bank</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Account Number */}
            {selectedBank && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Account Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={handleAccountNumberChange}
                    placeholder="Enter account number"
                    className="flex-1 pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <Button
                    onClick={verifyAccount}
                    disabled={!accountNumber || accountNumber.length < 10 || isVerifying || !!verification}
                    className="flex items-center justify-center gap-2 px-4"
                  >
                    {isVerifying ? (
                      <Loader size={20} className="animate-spin" />
                    ) : verification ? (
                      <CheckCircle size={20} />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                
                {verification && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Account Verified</p>
                      <p className="text-xs text-green-600">{verification.account_name}</p>
                    </div>
                  </div>
                )}
                
                {verificationError && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} className="text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Verification Failed</p>
                      <p className="text-xs text-red-600">{verificationError}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details Accordion (Simplified) */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1">Rate <Info size={10} /></span>
              <span className="font-medium">1 SUI ≈ ₦1,000</span>
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
              disabled={isSwapping || !suiAmount || !verification}
            >
              {isSwapping ? 'Swapping...' : 'Swap SUI to Naira'}
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
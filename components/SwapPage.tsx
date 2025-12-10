import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowDownUp, Settings, ChevronDown, Info, Loader, CheckCircle, AlertCircle, Share2, Download } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { useCurrentAccount, useSuiClient, useSignTransaction } from '@mysten/dapp-kit';
import { DataService } from '../services/dataService';
import { OnChainTransactionService } from '../services/onChainTransactionService';
import { TransactionHistory } from '../types/types';
import toast from 'react-hot-toast';
import { SwapProcessor } from '@/swap/swapProcessor';

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

interface ReceiptData {
  recipientName: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  transactionDate: Date;
  transactionId: string;
  reference: string;
}

export const SwapPage: React.FC = () => {
  const [suiAmount, setSuiAmount] = useState('');
  const [nairaAmount, setNairaAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [suiBalance, setSuiBalance] = useState<number | null>(null);
  
  // Exchange rates
  const [exchangeRates, setExchangeRates] = useState<{
    suiToUsd: number | null;
    usdToNgn: number | null;
  }>({
    suiToUsd: null,
    usdToNgn: null
  });
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  
  // Naira swap states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [verification, setVerification] = useState<AccountVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signTransaction } = useSignTransaction();
  

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

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const [suiPrice, usdToNgnRate] = await Promise.all([
          DataService.getSuiPrice(),
          DataService.getUsdToNgnRate()
        ]);
        
        setExchangeRates({
          suiToUsd: suiPrice,
          usdToNgn: usdToNgnRate
        });
      } catch (err) {
        console.error("Error fetching exchange rates:", err);
      }
    };

    fetchExchangeRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Nigerian banks from Paystack
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await fetch('https://api.paystack.co/bank?country=nigeria');
        
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
      
      // Calculate Naira amount using real-time exchange rates
      if (value && exchangeRates.suiToUsd && exchangeRates.usdToNgn) {
        const suiValue = parseFloat(value);
        const usdValue = suiValue * exchangeRates.suiToUsd;
        const nairaValue = usdValue * exchangeRates.usdToNgn;
        setNairaAmount(nairaValue.toFixed(2));
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
            'Authorization': `Bearer sk_test_7aab64a468bed7aeac7b4d1ccafcd2e111b0fae8`
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
        // Handle the specific limit exceeded error
        if (data.message && data.message.includes('daily limit')) {
          setVerificationError('Test mode limit exceeded. For testing, use account number "0000000000" with any bank.');
          
          // For testing purposes, we can auto-verify with mock data
          if (accountNumber === '0000000000') {
            setVerification({
              account_number: accountNumber,
              account_name: 'Test User'
            });
            setVerificationError(null);
          }
        } else {
          setVerificationError(data.message || 'Unable to verify account');
        }
      }
    } catch (error) {
      setVerificationError('Network error. Please try again.');
      console.error('Error verifying account:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSwap = async () => {
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
    
    if (!currentAccount) {
      alert('Please connect your wallet');
      return;
    }
    
    // Check if on-chain transaction history is configured
    const packageId = import.meta.env.VITE_TRANSACTION_HISTORY_PACKAGE_ID;
    const registryId = import.meta.env.VITE_TRANSACTION_REGISTRY_ID;
    
    // Perform the swap
    setIsSwapping(true);
    
    // For demo purposes, we'll simulate the swap process
    setTimeout(async () => {
      // Create mock receipt data
      const mockReceiptData: ReceiptData = {
        recipientName: verification.account_name,
        accountNumber: verification.account_number,
        bankName: selectedBank?.name || 'Unknown Bank',
        amount: parseFloat(nairaAmount),
        transactionDate: new Date(),
        transactionId: `txn_${Date.now()}`,
        reference: `ref_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Prepare transaction data
      const transaction: TransactionHistory = {
        id: mockReceiptData.transactionId,
        type: 'fiat_conversion',
        fromAsset: 'SUI',
        toAsset: 'NGN',
        fromAmount: amount,
        toAmount: parseFloat(nairaAmount),
        bankName: selectedBank?.name,
        accountNumber: verification.account_number,
        transactionId: mockReceiptData.transactionId,
        timestamp: new Date(),
        status: 'completed'
      };
      
      // Save transaction on-chain if configured
      if (packageId && registryId && packageId !== '0x_your_package_id_here') {
        try {
          const onChainService = new OnChainTransactionService(suiClient, packageId, registryId);
          const recordTx = onChainService.createRecordTransactionTx(transaction);
          
          signTransaction(
            { transaction: recordTx },
            {
              onSuccess: () => {
                toast.success('Transaction recorded on blockchain!');
                setShowSuccessModal(true);
              },
              onError: (error: Error) => {
                console.error('Failed to record transaction on-chain:', error);
                toast.error('Swap successful, but failed to record on blockchain');
              }
            }
          );
        } catch (error) {
          console.error('Error creating on-chain transaction:', error);
          toast.error('Swap successful, but failed to record on blockchain');
        }
      } else {
        console.warn('On-chain transaction history not configured. Please deploy the transaction_history module and update .env');
      }
      
      setReceiptData(mockReceiptData);
      setIsSwapping(false);
      
      // Clear form fields
      setSuiAmount('');
      setNairaAmount('');
    }, 2000);
  };

  // Calculate the current exchange rate for display
  const getCurrentExchangeRate = () => {
    if (exchangeRates.suiToUsd && exchangeRates.usdToNgn) {
      return exchangeRates.suiToUsd * exchangeRates.usdToNgn;
    }
    return 1500; // Fallback to previous hardcoded rate
  };

  // Handle sharing the receipt
  const handleShareReceipt = async () => {
    if (!receiptData) return;
    
    const text = `Transaction Receipt\n` +
      `Recipient: ${receiptData.recipientName}\n` +
      `Amount: Γéª${receiptData.amount.toFixed(2)}\n` +
      `Bank: ${receiptData.bankName}\n` +
      `Date: ${receiptData.transactionDate.toLocaleString()}\n` +
      `Transaction ID: ${receiptData.transactionId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MYLO Transaction Receipt',
          text: text
        });
      } catch (err) {
        console.log('Sharing failed', err);
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(text);
        alert('Receipt copied to clipboard!');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(text);
      alert('Receipt copied to clipboard!');
    }
  };

  // Handle downloading the receipt
  const handleDownloadReceipt = () => {
    if (!receiptData) return;
    
    const receiptText = 
      `MYLO TRANSACTION RECEIPT\n\n` +
      `Recipient: ${receiptData.recipientName}\n` +
      `Account Number: ${receiptData.accountNumber}\n` +
      `Bank: ${receiptData.bankName}\n` +
      `Amount: Γéª${receiptData.amount.toFixed(2)}\n` +
      `Transaction Date: ${receiptData.transactionDate.toLocaleString()}\n` +
      `Transaction ID: ${receiptData.transactionId}\n` +
      `Reference: ${receiptData.reference}\n\n` +
      `Thank you for using MYLO!`;
    
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mylo-receipt-${receiptData.transactionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setReceiptData(null);
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
              ~${suiAmount ? (parseFloat(suiAmount) * (exchangeRates.suiToUsd || 1.85)).toFixed(2) : '0.00'}
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
              ~Γéª{nairaAmount || '0.00'}
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
              <span className="font-medium">1 SUI Γëê Γéª{getCurrentExchangeRate().toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
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

      {/* Success Modal */}
      {showSuccessModal && receiptData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-green-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Transaction Successful!</h2>
                <p className="text-slate-500 mb-6">
                  Your SUI has been successfully converted to Nigerian Naira.
                </p>
                
                <div className="bg-slate-50 rounded-xl p-4 text-left mb-6">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-slate-500">Recipient</div>
                    <div className="font-medium text-slate-800 truncate">{receiptData.recipientName}</div>
                    
                    <div className="text-slate-500">Amount</div>
                    <div className="font-medium text-slate-800">Γéª{receiptData.amount.toFixed(2)}</div>
                    
                    <div className="text-slate-500">Bank</div>
                    <div className="font-medium text-slate-800">{receiptData.bankName}</div>
                    
                    <div className="text-slate-500">Date</div>
                    <div className="font-medium text-slate-800">{receiptData.transactionDate.toLocaleDateString()}</div>
                    
                    <div className="text-slate-500">Transaction ID</div>
                    <div className="font-medium text-slate-800 text-xs truncate">{receiptData.transactionId}</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={handleShareReceipt}
                  >
                    <Share2 size={16} />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={handleDownloadReceipt}
                  >
                    <Download size={16} />
                    Download
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-100 p-4 bg-slate-50">
              <Button 
                className="w-full"
                onClick={handleCloseModal}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

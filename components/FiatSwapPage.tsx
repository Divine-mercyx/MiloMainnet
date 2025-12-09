import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Info, CheckCircle, AlertCircle, Share2, Download } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { SwapProcessor } from '../swap/swapProcessor';
import { useSuiClient, useSignTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { DataService } from '../services/dataService';
import { OnChainTransactionService } from '../services/onChainTransactionService';
import { TransactionHistory } from '../types/types';
import toast from 'react-hot-toast';

interface BankDetails {
  accountNumber: string;
  bankCode: string;
  accountName: string;
}

interface ReceiptData {
  recipientName: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  transactionDate: Date;
  transactionId: string;
  reference: string;
  suiAmount: string;
}

export const FiatSwapPage: React.FC = () => {
  const suiClient = useSuiClient();
  const { mutate: signTransaction } = useSignTransaction();
  const currentAccount = useCurrentAccount();
  const [suiAmount, setSuiAmount] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    bankCode: '',
    accountName: ''
  });
  const [step, setStep] = useState<'form' | 'confirmation' | 'processing' | 'success' | 'error'>('form');
  const [quote, setQuote] = useState<{ ngnAmount: number; fees: number; netAmount: number; exchangeRate: number; suiPrice: number } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [suiPrice, setSuiPrice] = useState<number | null>(null);
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Initialize swap processor
  const swapProcessor = new SwapProcessor(suiClient);

  // Load supported banks
  useEffect(() => {
    // In a real implementation, this would come from the payout service
    const supportedBanks = [
      { code: '044', name: 'Access Bank' },
      { code: '023', name: 'Citibank Nigeria' },
      { code: '050', name: 'Ecobank Nigeria' },
      { code: '011', name: 'First Bank of Nigeria' },
      { code: '214', name: 'First City Monument Bank' },
      { code: '058', name: 'Guaranty Trust Bank' },
      { code: '030', name: 'Heritage Bank' },
      { code: '301', name: 'Jaiz Bank' },
      { code: '082', name: 'Keystone Bank' },
      { code: '014', name: 'MainStreet Bank' },
      { code: '076', name: 'Polaris Bank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '068', name: 'Standard Chartered Bank' },
      { code: '232', name: 'Sterling Bank' },
      { code: '032', name: 'Union Bank of Nigeria' },
      { code: '033', name: 'United Bank for Africa' },
      { code: '215', name: 'Unity Bank' },
      { code: '035', name: 'Wema Bank' },
      { code: '057', name: 'Zenith Bank' }
    ];
    setBanks(supportedBanks);
  }, []);

  // Fetch real-time exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const [usdToNgn, suiUsd] = await Promise.all([
          DataService.getUsdToNgnRate(),
          DataService.getSuiPrice()
        ]);
        setExchangeRate(usdToNgn);
        setSuiPrice(suiUsd);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
      }
    };

    fetchExchangeRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchExchangeRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGetQuote = async () => {
    if (!suiAmount || isNaN(parseFloat(suiAmount))) {
      setError('Please enter a valid amount');
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.bankCode || !bankDetails.accountName) {
      setError('Please fill in all bank details');
      return;
    }

    try {
      setError(null);
      const amount = parseFloat(suiAmount);
      
      // Get real quote for SUI to USDC conversion using Cetus SDK
      const usdcAmount = await swapProcessor.getSwapService().getSuiToUsdcQuote(amount);
      
      // Calculate fees
      const fees = swapProcessor.getFiatService().calculateFees(amount);
      
      // Calculate net USDC amount after fees
      const usdcAfterFees = usdcAmount - (fees.totalFee * 1.2); // Approximate fee conversion
      
      // Convert USDC to NGN using real-time exchange rate
      const ngnNetAmount = await swapProcessor.getFiatService().convertUsdcToNgn(usdcAfterFees);
      
      // Get exchange rate for display
      const usdToNgnRate = exchangeRate || 1500;
      const currentSuiPrice = suiPrice || 1.85;
      
      const confirmationDetails = {
        ngnAmount: ngnNetAmount,
        fees: fees.totalFee,
        netAmount: ngnNetAmount,
        exchangeRate: usdToNgnRate,
        suiPrice: currentSuiPrice
      };
      
      setQuote(confirmationDetails);
      setStep('confirmation');
    } catch (err) {
      setError('Failed to get quote. Please try again.');
      console.error('Error getting quote:', err);
    }
  };

  const handleConfirmSwap = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet to proceed with the swap.');
      return;
    }
    
    setStep('processing');
    
    try {
      const amount = parseFloat(suiAmount);
      
      // First, get the swap transaction from the swap processor
      const swapResult = await swapProcessor.getSwapService().swapSuiToUsdc(amount, currentAccount.address);
      
      // Sign and execute the swap transaction
      signTransaction(
        { transaction: swapResult.tx },
        {
          onSuccess: async ({ bytes, signature }) => {
            try {
              // Execute the signed transaction
              const response = await suiClient.executeTransactionBlock({
                transactionBlock: bytes,
                signature: signature,
                options: {
                  showEffects: true,
                  showEvents: true,
                },
              });
              
              // If swap is successful, proceed with the fiat payout
              const payoutResult = await swapProcessor.executeConfirmedSwap({
                suiAmount: amount,
                bankAccountNumber: bankDetails.accountNumber,
                bankCode: bankDetails.bankCode,
                recipientName: bankDetails.accountName,
                senderAddress: currentAccount.address
              });

              if (payoutResult.success) {
                setTransactionId(payoutResult.transactionId || '');
                setStep('success');
                
                // Get bank name for receipt
                const bank = banks.find(b => b.code === bankDetails.bankCode);
                const bankName = bank ? bank.name : 'Unknown Bank';
                
                // Set receipt data
                const receipt: ReceiptData = {
                  recipientName: bankDetails.accountName,
                  accountNumber: bankDetails.accountNumber,
                  bankName,
                  amount: quote?.netAmount || 0,
                  transactionDate: new Date(),
                  transactionId: payoutResult.transactionId || '',
                  reference: `ref_${Math.random().toString(36).substr(2, 9)}`,
                  suiAmount
                };
                
                // Save transaction to history
                const transaction: TransactionHistory = {
                  id: receipt.transactionId,
                  type: 'fiat_conversion',
                  fromAsset: 'SUI',
                  toAsset: 'NGN',
                  fromAmount: parseFloat(suiAmount),
                  toAmount: quote?.netAmount || 0,
                  bankName,
                  accountNumber: bankDetails.accountNumber,
                  transactionId: payoutResult.transactionId || '',
                  timestamp: new Date(),
                  status: 'completed'
                };
                
                // Save transaction on-chain if configured
                const packageId = import.meta.env.VITE_TRANSACTION_HISTORY_PACKAGE_ID;
                const registryId = import.meta.env.VITE_TRANSACTION_REGISTRY_ID;
                
                if (packageId && registryId && packageId !== '0x_your_package_id_here') {
                  try {
                    const onChainService = new OnChainTransactionService(suiClient, packageId, registryId);
                    const recordTx = onChainService.createRecordTransactionTx(transaction);
                    
                    signTransaction(
                      { transaction: recordTx },
                      {
                        onSuccess: () => {
                          toast.success('Transaction recorded on blockchain!');
                        },
                        onError: (error: Error) => {
                          console.error('Failed to record transaction on-chain:', error);
                          toast.error('Swap successful, but failed to record on blockchain');
                        }
                      }
                    );
                  } catch (error) {
                    console.error('Error creating on-chain transaction:', error);
                  }
                } else {
                  console.warn('On-chain transaction history not configured');
                }
                
                setReceiptData(receipt);
                setShowSuccessModal(true);
              } else {
                setError(payoutResult.errorMessage || 'Failed to process bank transfer');
                setStep('error');
              }
            } catch (err) {
              setError('Failed to execute swap transaction. Please try again.');
              setStep('error');
              console.error('Error executing swap transaction:', err);
            }
          },
          onError: (error: Error) => {
            setError(`Transaction failed: ${error.message || 'Unknown error'}`);
            setStep('error');
            console.error('Transaction signing failed:', error);
          }
        }
      );
    } catch (err) {
      setError('Failed to prepare swap transaction. Please try again.');
      setStep('error');
      console.error('Error preparing swap:', err);
    }
  };

  const handleReset = () => {
    setSuiAmount('');
    setBankDetails({
      accountNumber: '',
      bankCode: '',
      accountName: ''
    });
    setStep('form');
    setQuote(null);
    setTransactionId(null);
    setError(null);
    setShowSuccessModal(false);
    setReceiptData(null);
  };

  // Handle sharing the receipt
  const handleShareReceipt = async () => {
    if (!receiptData) return;
    
    const text = `Transaction Receipt\n` +
      `Recipient: ${receiptData.recipientName}\n` +
      `Amount: ₦${receiptData.amount.toFixed(2)}\n` +
      `SUI Amount: ${receiptData.suiAmount} SUI\n` +
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
      `SUI Amount: ${receiptData.suiAmount} SUI\n` +
      `NGN Amount: ₦${receiptData.amount.toFixed(2)}\n` +
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

  // Close modal
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setReceiptData(null);
    handleReset();
  };

  // Add a helper function to simulate account verification for testing
  const simulateAccountVerification = (accountNumber: string, bankCode: string) => {
    // In test mode, we can simulate verification for specific test account numbers
    if (accountNumber === '0000000000') {
      const bank = banks.find(b => b.code === bankCode);
      return {
        account_number: accountNumber,
        account_name: `Test User - ${bank?.name || 'Unknown Bank'}`
      };
    }
    return null;
  };

  // Verify account details
  const [selectedBank, setSelectedBank] = useState<{ code: string; name: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [verification, setVerification] = useState<{ account_number: string; account_name: string } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyAccount = async () => {
    if (!bankDetails.accountNumber || !bankDetails.bankCode) return;
    
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${bankDetails.accountNumber}&bank_code=${bankDetails.bankCode}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || 'sk_test_7aab64a468bed7aeac7b4d1ccafcd2e111b0fae8'}`
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
          const mockVerification = simulateAccountVerification(bankDetails.accountNumber, bankDetails.bankCode);
          if (mockVerification) {
            setVerification(mockVerification);
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

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Convert to Naira</h1>
        </div>

        {step === 'form' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  Amount in SUI
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={suiAmount}
                    onChange={(e) => setSuiAmount(e.target.value)}
                    className="w-full text-3xl font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent pr-12"
                  />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-semibold text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                    SUI
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Enter the amount of SUI you want to convert to Nigerian Naira
                </div>
                
                {/* Exchange Rate Display */}
                {(exchangeRate !== null && suiPrice !== null) && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-800">
                      <div>Current Rates:</div>
                      <div>1 SUI = ${suiPrice.toFixed(4)} USD</div>
                      <div>1 USD = ₦{exchangeRate.toFixed(2)} NGN</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Bank Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="0123456789"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                      Bank Name
                    </label>
                    <select
                      value={bankDetails.bankCode}
                      onChange={(e) => setBankDetails({...bankDetails, bankCode: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all appearance-none bg-white"
                    >
                      <option value="">Select your bank</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                      Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="mt-6">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-teal-500/20"
                  onClick={handleGetQuote}
                  disabled={!suiAmount || !bankDetails.accountNumber || !bankDetails.bankCode || !bankDetails.accountName}
                >
                  Get Quote
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'confirmation' && quote && (
          <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Confirm Conversion</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review the details before proceeding
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-slate-500">You're converting</div>
                  <div className="font-bold text-slate-800">{suiAmount} SUI</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-slate-500">SUI Price</div>
                  <div className="font-bold text-slate-800">${quote.suiPrice.toFixed(4)} USD</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-slate-500">Exchange rate</div>
                  <div className="font-bold text-slate-800">1 USD = ₦{quote.exchangeRate.toFixed(2)}</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-slate-500">Fees</div>
                  <div className="font-bold text-slate-800">₦{quote.fees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-slate-700 font-semibold">You'll receive</div>
                    <div className="text-2xl font-bold text-teal-600">₦{quote.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-amber-800 text-sm">
                    <p className="font-medium mb-1">Important Notice</p>
                    <p>
                      This conversion involves swapping SUI to USDC, then converting to Nigerian Naira, 
                      and finally transferring to your bank account. Please confirm all details are correct.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={() => setStep('form')}
                >
                  Edit
                </Button>
                <Button
                  size="lg"
                  className="h-12 rounded-xl shadow-lg shadow-teal-500/20"
                  onClick={handleConfirmSwap}
                >
                  Confirm & Proceed
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Processing Conversion</h2>
              <p className="text-slate-500">
                Converting {suiAmount} SUI to Nigerian Naira and sending to your bank account...
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                <CheckCircle size={32} className="text-teal-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Conversion Successful!</h2>
              <p className="text-slate-500 mb-6">
                ₦{quote?.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been sent to your bank account.
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div className="text-xs text-slate-400 mb-1">Transaction ID</div>
                <div className="font-mono text-sm text-slate-700 truncate">
                  {transactionId}
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full h-12 rounded-xl shadow-lg shadow-teal-500/20"
                onClick={handleReset}
              >
                Make Another Conversion
              </Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-slate-100 overflow-hidden">
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Conversion Failed</h2>
              <p className="text-slate-500 mb-6">
                {error || 'Something went wrong during the conversion process.'}
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={handleReset}
                >
                  Try Again
                </Button>
                <Button
                  size="lg"
                  className="h-12 rounded-xl shadow-lg shadow-teal-500/20"
                  onClick={() => setStep('form')}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          </div>
        )}
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
                    
                    <div className="text-slate-500">SUI Amount</div>
                    <div className="font-medium text-slate-800">{receiptData.suiAmount} SUI</div>
                    
                    <div className="text-slate-500">NGN Amount</div>
                    <div className="font-medium text-slate-800">₦{receiptData.amount.toFixed(2)}</div>
                    
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
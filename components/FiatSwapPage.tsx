import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { SwapProcessor } from '../swap/swapProcessor';
import { useSuiClient, useSignTransaction, useCurrentAccount } from '@mysten/dapp-kit';

interface BankDetails {
  accountNumber: string;
  bankCode: string;
  accountName: string;
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
  const [quote, setQuote] = useState<{ ngnAmount: number; fees: number; netAmount: number } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);

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
      
      // Convert USDC to NGN
      const ngnNetAmount = swapProcessor.getFiatService().convertUsdcToNgn(usdcAfterFees);
      
      const confirmationDetails = {
        ngnAmount: ngnNetAmount,
        fees: fees.totalFee,
        netAmount: ngnNetAmount
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
                  <div className="text-slate-500">Exchange rate</div>
                  <div className="font-bold text-slate-800">1 SUI ≈ ₦{quote.ngnAmount / parseFloat(suiAmount)}</div>
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-slate-500">Fees</div>
                  <div className="font-bold text-slate-800">₦{quote.fees.toLocaleString()}</div>
                </div>
                
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-slate-700 font-semibold">You'll receive</div>
                    <div className="text-2xl font-bold text-teal-600">₦{quote.netAmount.toLocaleString()}</div>
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
                ₦{quote?.netAmount.toLocaleString()} has been sent to your bank account.
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
    </div>
  );
};
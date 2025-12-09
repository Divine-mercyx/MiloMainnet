/**
 * Service for handling fiat payouts to banks using Paystack
 */
export class PayoutService {
  private paystack: any;
  
  constructor() {
    // Initialize Paystack with secret key from environment variables
    // In a real implementation, you would set PAYSTACK_SECRET_KEY in your environment
    const Paystack = require('paystack');
    this.paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key_here');
  }
  
  /**
   * Send NGN to a Nigerian bank account using Paystack
   */
  async sendToBank(accountNumber: string, bankCode: string, amount: number, recipientName: string): Promise<{
    success: boolean;
    transactionId?: string;
    reference?: string;
    errorMessage?: string;
  }> {
    try {
      // Validate inputs
      if (!accountNumber || !bankCode || amount <= 0 || !recipientName) {
        return {
          success: false,
          errorMessage: 'Invalid transfer details provided.'
        };
      }
      
      // Create a unique reference for this transfer
      const reference = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare transfer data
      const transferData = {
        source: 'balance',
        amount: Math.round(amount * 100), // Paystack expects amount in kobo (1 NGN = 100 kobo)
        recipient: {
          type: 'nuban',
          name: recipientName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN'
        },
        reason: 'MYLO Crypto to Fiat Conversion',
        reference: reference
      };
      
      // First, create a recipient
      const recipientResponse = await this.paystack.recipient.create({
        type: 'nuban',
        name: recipientName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      });
      
      if (!recipientResponse.status) {
        return {
          success: false,
          errorMessage: `Failed to create recipient: ${recipientResponse.message}`
        };
      }
      
      const recipientCode = recipientResponse.data.recipient_code;
      
      // Then initiate the transfer
      const transferResponse = await this.paystack.transfer.initiate({
        source: 'balance',
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        recipient: recipientCode,
        reason: 'MYLO Crypto to Fiat Conversion',
        reference: reference
      });
      
      if (!transferResponse.status) {
        return {
          success: false,
          errorMessage: `Transfer failed: ${transferResponse.message}`
        };
      }
      
      return {
        success: true,
        transactionId: transferResponse.data.transfer_code,
        reference: reference
      };
    } catch (error: any) {
      console.error('Paystack transfer error:', error);
      return {
        success: false,
        errorMessage: `Transfer failed: ${error.message || 'Unknown error occurred'}`
      };
    }
  }

  /**
   * Get list of supported Nigerian banks
   */
  getSupportedBanks(): Array<{ code: string; name: string }> {
    return [
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
  }
}
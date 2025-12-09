import { PayoutService } from './swap/payoutService.js';

async function testPaystackIntegration() {
  try {
    console.log('Testing Paystack integration...');
    
    // Create a PayoutService instance
    const payoutService = new PayoutService();
    
    // Test getting supported banks
    console.log('Fetching supported banks...');
    const banks = payoutService.getSupportedBanks();
    console.log(`Found ${banks.length} supported banks`);
    
    console.log('Paystack integration test completed successfully!');
    console.log('Note: Actual transfers require valid Paystack API keys in environment variables');
  } catch (error) {
    console.error('Error during Paystack integration test:', error);
  }
}

// Run the test
testPaystackIntegration();
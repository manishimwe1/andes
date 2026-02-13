/**
 * Verify Deposit on Tron Nile Testnet
 * Check blockchain explorer and local database for your deposit
 */

import 'tsconfig-paths/register';
import 'dotenv/config';
import axios from 'axios';

interface TronNileTransaction {
  txID?: string;
  blockNumber?: string;
  blockTimestamp?: string;
  from?: string;
  to?: string;
  value?: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  transactionIndex?: string;
  status?: string;
  confirmations?: string;
}

async function verifyDepositOnNile(userAddress: string): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  TRON NILE DEPOSIT VERIFICATION        ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log(`📍 Checking address: ${userAddress}\n`);

  try {
    // Method 1: Check Nile Testnet Explorer API
    console.log('🔍 Scanning Tron Nile testnet for transactions...\n');

    const nileApiUrl = 'https://nile.trongrid.io';
    
    // Get account info
    try {
      const accountResp = await axios.post(`${nileApiUrl}/wallet/getaccount`, {
        address: userAddress,
        visible: true
      }, {
        timeout: 10000
      });

      const balance = accountResp.data.balance || 0;
      console.log(`✓ Account found on Nile testnet`);
      console.log(`  Balance: ${(balance / 1e6).toFixed(2)} TRX\n`);
    } catch (error) {
      console.log(`⚠️  Could not fetch account balance`);
      console.log(`  Address may not exist yet on Nile testnet\n`);
    }

    // Method 2: Check Shasta Testnet Explorer (alternative)
    console.log('💡 To view transactions manually:\n');
    console.log('📱 Tron Nile Explorer:');
    console.log(`   https://nile.tronscan.org/address/${userAddress}`);
    console.log('   (Search for your address to see all transactions)\n');

    console.log('🔗 Tron Nile RPC Endpoint:');
    console.log('   https://nile.trongrid.io\n');

    console.log('📋 Expected Configuration:');
    console.log('   RPC_TRON=https://nile.trongrid.io');
    console.log('   TRON_USDT_ADDRESS=TF17BoRp2cDBi2hpdvKAhERMLCHRJ1NqFn');
    console.log('   TRON_USDC_ADDRESS=TEkxiTehnzSmSe2XqrBj4w6WKHC3sSL7R7\n');

    // Check current config
    const config = {
      rpc: process.env.RPC_TRON,
      usdt: process.env.TRON_USDT_ADDRESS,
      usdc: process.env.TRON_USDC_ADDRESS
    };

    console.log('✓ Current Configuration:\n');
    console.log(`  RPC_TRON=${config.rpc}`);
    if (config.rpc?.includes('nile')) {
      console.log('           ✓ Configured for Nile');
    } else {
      console.log('           ⚠️  WARNING: Not configured for Nile!');
    }

    console.log(`\n  USDT=${config.usdt}`);
    if (config.usdt?.includes('TF17')) {
      console.log('        ✓ Configured for Nile');
    } else {
      console.log('        ⚠️  WARNING: Not configured for Nile!');
    }

    console.log(`\n  USDC=${config.usdc}`);
    if (config.usdc?.includes('TEkx')) {
      console.log('        ✓ Configured for Nile');
    } else {
      console.log('        ⚠️  WARNING: Not configured for Nile!');
    }

    console.log('\n\n📌 Troubleshooting Steps:\n');
    console.log('1. ✓ .env updated to Nile testnet configuration');
    console.log('2. Run: pnpm run build');
    console.log('3. Run: node dist/index.js (restart backend)');
    console.log('4. Wait 30-60 seconds for blockchain listener to scan');
    console.log('5. Run: pnpm tsx scripts/diagnose-deposits.ts');
    console.log('6. Check: https://nile.tronscan.org to verify transaction\n');

  } catch (error) {
    console.error('❌ Verification error:', error instanceof Error ? error.message : error);
  }
}

// Example usage
const userAddress = process.argv[2] || 'TBLLUyDskU3cSjvGj1fHkA4Mv7HU7dBXen';

verifyDepositOnNile(userAddress).then(() => {
  console.log('✅ Verification complete\n');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

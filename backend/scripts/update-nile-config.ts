/**
 * Update .env for Tron Nile Testnet
 * Fixes: RPC endpoint and token addresses for Tron Nile testnet
 */

import fs from 'fs';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');

const updates: Record<string, string> = {
  // From mainnet to Nile testnet
  'RPC_TRON="https://api.tronstack.io"': 'RPC_TRON="https://nile.trongrid.io"',
  'RPC_TRON=https://api.tronstack.io': 'RPC_TRON=https://nile.trongrid.io',
  
  // From mainnet USDT to Nile testnet USDT
  'TRON_USDT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': 'TRON_USDT_ADDRESS=TF17BoRp2cDBi2hpdvKAhERMLCHRJ1NqFn',
  
  // From mainnet USDC to Nile testnet USDC
  'TRON_USDC_ADDRESS=TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9': 'TRON_USDC_ADDRESS=TEkxiTehnzSmSe2XqrBj4w6WKHC3sSL7R7'
};

function updateEnv(): void {
  try {
    console.log('🔧 Updating .env for Tron Nile Testnet...\n');

    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found at:', envPath);
      process.exit(1);
    }

    let content = fs.readFileSync(envPath, 'utf8');
    let updatesApplied = 0;

    for (const [oldValue, newValue] of Object.entries(updates)) {
      if (content.includes(oldValue)) {
        content = content.replace(oldValue, newValue);
        updatesApplied++;
        console.log(`✓ Updated: ${oldValue}`);
        console.log(`          → ${newValue}\n`);
      }
    }

    if (updatesApplied === 0) {
      console.log('ℹ️  No mainnet Tron values found in .env');
      console.log('   Your .env may already be configured for testnet or uses different format.\n');
      console.log('   Manual check required:');
      console.log('   - RPC_TRON should be: https://nile.trongrid.io');
      console.log('   - TRON_USDT_ADDRESS should be: TF17BoRp2cDBi2hpdvKAhERMLCHRJ1NqFn');
      console.log('   - TRON_USDC_ADDRESS should be: TEkxiTehnzSmSe2XqrBj4w6WKHC3sSL7R7\n');
    } else {
      fs.writeFileSync(envPath, content, 'utf8');
      console.log(`✅ ${updatesApplied} values updated in .env\n`);
    }

    console.log('📋 Next steps:');
    console.log('   1. Rebuild: pnpm run build');
    console.log('   2. Restart: node dist/index.js');
    console.log('   3. Verify: pnpm tsx scripts/diagnose-deposits.ts\n');

  } catch (error) {
    console.error('❌ Error updating .env:', error);
    process.exit(1);
  }
}

updateEnv();

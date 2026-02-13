/**
 * Diagnostic Script - Find Missing Deposits
 * Helps troubleshoot why deposits aren't showing in balance
 */

import 'tsconfig-paths/register';
import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Deposit } from '@/models';
import logger from '@/config/logger';

async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('❌ MONGODB_URI not set in .env');
    console.log('Using in-memory MongoDB from test? Make sure backend script creates it.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.log('⚠️  Could not connect to MongoDB');
    console.log('   Ensure MongoDB is running or use: node scripts/run-with-memory.js');
    return;
  }
}

async function findDeposits(): Promise<void> {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║    DEPOSIT DIAGNOSTIC TOOL             ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Check users
    const users = await User.find({});
    console.log(`📋 Total Users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users in Database:');
      for (const user of users) {
        console.log(`\n   User ID: ${user.userId}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Wallet Index: ${user.walletIndex}`);
        console.log(`   Addresses:`);
        if (user.depositAddresses) {
          const addresses = user.depositAddresses as any;
          if (addresses.erc20) console.log(`     - Ethereum: ${addresses.erc20.address}`);
          if (addresses.bep20) console.log(`     - BSC: ${addresses.bep20.address}`);
          if (addresses.polygon) console.log(`     - Polygon: ${addresses.polygon.address}`);
          if (addresses.trc20) console.log(`     - Tron: ${addresses.trc20.address}`);
        }
        console.log(`   Balances:`);
        if (user.balances) {
          const balances = user.balances as any;
          console.log(`     - Ethereum: Confirmed=${balances.ethereum?.confirmed || 0}, Pending=${balances.ethereum?.pending || 0}`);
          console.log(`     - BSC: Confirmed=${balances.bsc?.confirmed || 0}, Pending=${balances.bsc?.pending || 0}`);
          console.log(`     - Polygon: Confirmed=${balances.polygon?.confirmed || 0}, Pending=${balances.polygon?.pending || 0}`);
          console.log(`     - Tron: Confirmed=${balances.tron?.confirmed || 0}, Pending=${balances.tron?.pending || 0}`);
        }
      }
    } else {
      console.log('❌ No users found in database');
      console.log('   → Generate addresses first: POST /api/addresses/generate');
    }

    // Check deposits
    const deposits = await Deposit.find({});
    console.log(`\n\n📝 Total Deposits: ${deposits.length}`);
    
    if (deposits.length > 0) {
      console.log('\n💰 Deposits in Database:');
      for (const deposit of deposits) {
        console.log(`\n   Deposit ID: ${deposit._id}`);
        console.log(`   User: ${deposit.userId}`);
        console.log(`   Network: ${deposit.network}`);
        console.log(`   Token: ${deposit.tokenSymbol || 'UNKNOWN'}`);
        console.log(`   Amount: ${deposit.amount}`);
        console.log(`   Status: ${deposit.status}`);
        console.log(`   Confirmations: ${deposit.confirmations}/${deposit.requiredConfirmations}`);
        console.log(`   TxHash: ${deposit.txHash}`);
        console.log(`   To: ${deposit.toAddress}`);
      }
    } else {
      console.log('❌ No deposits found in database');
      console.log('\n   Possible reasons:');
      console.log('   1. Blockchain listener not running');
      console.log('   2. Deposit address not configured correctly');
      console.log('   3. Transaction not yet detected by listener');
      console.log('   4. Wrong network/token address');
    }

    // Check configuration
    console.log('\n\n⚙️  Configuration Check:\n');
    console.log(`   MASTER_MNEMONIC: ${process.env.MASTER_MNEMONIC ? '✓ Set' : '❌ Not set'}`);
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✓ Set' : '❌ Not set (using in-memory)'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   PORT: ${process.env.PORT || 3001}`);
    
    console.log('\n   Network RPC URLs:');
    console.log(`   - RPC_ETHEREUM: ${process.env.RPC_ETHEREUM ? '✓' : '❌'}`);
    console.log(`   - RPC_BSC: ${process.env.RPC_BSC ? '✓' : '❌'}`);
    console.log(`   - RPC_POLYGON: ${process.env.RPC_POLYGON ? '✓' : '❌'}`);
    console.log(`   - RPC_TRON: ${process.env.RPC_TRON ? '✓' : '❌'}`);
    
    console.log('\n   Token Addresses (Tron):');
    console.log(`   - TRON_USDT_ADDRESS: ${process.env.TRON_USDT_ADDRESS || '❌ Not set'}`);
    console.log(`   - TRON_USDC_ADDRESS: ${process.env.TRON_USDC_ADDRESS || '❌ Not set'}`);

    // Common issues
    console.log('\n\n🔍 Common Issues & Solutions:\n');
    
    if (deposits.length === 0 && users.length > 0) {
      console.log('❌ ISSUE: No deposits detected');
      console.log('\n   Solutions:');
      console.log('   1. Ensure backend is running with blockchain listener');
      console.log('   2. For Tron Nile testnet, set: RPC_TRON=https://nile.trongrid.io');
      console.log('   3. Make sure token address is correct for Tron Nile');
      console.log('   4. Check transaction on Tron Nile explorer: https://nile.tronscan.org');
      console.log('   5. Verify the recipient address matches your generated address');
    }

    if (!process.env.RPC_TRON?.includes('nile')) {
      console.log('⚠️  ISSUE: RPC_TRON is not pointing to Nile testnet');
      console.log('\n   For Tron Nile testing:');
      console.log('   Add to .env: RPC_TRON=https://nile.trongrid.io');
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

async function main(): Promise<void> {
  try {
    await connectDB();
    await findDeposits();
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

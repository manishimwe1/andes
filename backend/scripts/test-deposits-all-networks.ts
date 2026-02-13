/**
 * Test Deposit Script - Simulate deposits across all networks
 * This script tests the deposit flow without needing testnet faucets
 * 
 * For real testnet testing, see TESTNET_SETUP.md
 */

import 'tsconfig-paths/register';
import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Deposit } from '@/models';
import { DepositService } from '@/services/DepositService';
import { AddressGenerationService } from '@/services/AddressGenerationService';
import { HDWalletUtil } from '@/utils/hdWallet';
import logger from '@/config/logger';
import { Network } from '@/types';

let mongoServer: MongoMemoryServer;

async function setupDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  logger.info('Connected to in-memory MongoDB');
}

async function cleanupDatabase(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
  logger.info('Disconnected from in-memory MongoDB');
}

/**
 * Simulate a deposit by creating a fake transaction
 */
async function simulateDeposit(
  userId: string,
  userEmail: string,
  network: 'ethereum' | 'bsc' | 'polygon' | 'tron',
  amount: number,
  tokenSymbol: 'USDT' | 'USDC',
  userAddress: string
): Promise<void> {
  const depositService = new DepositService();

  // Get token address from config
  const tokenAddressMap: { [key: string]: { [key: string]: string } } = {
    ethereum: {
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      USDC: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    },
    bsc: {
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
    },
    polygon: {
      USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    },
    tron: {
      USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      USDC: 'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9'
    }
  };

  const tokenAddress = tokenAddressMap[network][tokenSymbol];

  // Create fake transaction hash
  const fakeTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

  console.log(`\n📝 Recording deposit:`);
  console.log(`   User: ${userId}`);
  console.log(`   Network: ${network.toUpperCase()}`);
  console.log(`   Token: ${tokenSymbol}`);
  console.log(`   Amount: ${amount}`);
  console.log(`   Address: ${userAddress}`);
  console.log(`   TxHash: ${fakeTxHash}`);

  // Create transfer object
  const transfer = {
    from: '0x0000000000000000000000000000000000000000',
    to: userAddress.toLowerCase(),
    value: BigInt(amount * 1e6), // USDT/USDC typically 6 decimals
    amount: amount,  // ← Add this field
    tokenAddress: tokenAddress,
    transactionHash: fakeTxHash,
    blockNumber: 1000000,
    blockHash: '0x' + Math.random().toString(16).substring(2),
    txHash: fakeTxHash,
    logIndex: 0
  };

  // Record the deposit
  const result = await depositService.recordDeposit(
    userId,
    userEmail,
    network as any,
    transfer as any,
    amount,
    1 // requiredConfirmations = 1 for testing
  );

  if (result.success) {
    console.log(`   ✓ Deposit recorded`);
    return;
  }

  throw new Error(`Failed to record deposit: ${result.error}`);
}

/**
 * Test Ethereum deposit
 */
async function testEthereumDeposit(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     ETHEREUM DEPOSIT TEST              ║');
  console.log('╚════════════════════════════════════════╝');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  );

  const addressService = new AddressGenerationService(hdWallet);

  // Create user
  const userId = 'ethereum_test_user';
  const result = await addressService.generateUserDepositAddresses(
    userId,
    'ethereum@test.com',
    [Network.ETHEREUM]
  );

  if (!result.success || !result.data) {
    throw new Error('Failed to generate address');
  }

  const ethAddress = result.data.addresses[0].address;
  console.log(`Generated address: ${ethAddress}`);

  // Simulate USDT deposit
  await simulateDeposit(userId, 'ethereum@test.com', 'ethereum', 100, 'USDT', ethAddress);

  // Simulate USDC deposit
  await simulateDeposit(userId, 'ethereum@test.com', 'ethereum', 50, 'USDC', ethAddress);

  // Check balance
  const user = await User.findOne({ userId });
  console.log(`\nUser balance after deposits:`);
  console.log(`   Confirmed USDT: ${user?.balances?.ethereum?.confirmed || 0}`);
  console.log(`   Pending: ${user?.balances?.ethereum?.pending || 0}`);
}

/**
 * Test BSC deposit
 */
async function testBSCDeposit(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     BSC DEPOSIT TEST                   ║');
  console.log('╚════════════════════════════════════════╝');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  );

  const addressService = new AddressGenerationService(hdWallet);

  // Create user with unique ID
  const userId = 'bsc_test_user';
  const result = await addressService.generateUserDepositAddresses(
    userId,
    'bsc@test.com',
    [Network.BSC]
  );

  if (!result.success || !result.data) {
    throw new Error('Failed to generate address');
  }

  const bscAddress = result.data.addresses[0].address;
  console.log(`Generated address: ${bscAddress}`);

  // Simulate USDT deposit
  await simulateDeposit(userId, 'bsc@test.com', 'bsc', 200, 'USDT', bscAddress);

  // Simulate USDC deposit
  await simulateDeposit(userId, 'bsc@test.com', 'bsc', 75, 'USDC', bscAddress);

  // Check balance
  const user = await User.findOne({ userId });
  console.log(`\nUser balance after deposits:`);
  console.log(`   Confirmed USDT: ${user?.balances?.bsc?.confirmed || 0}`);
  console.log(`   Pending: ${user?.balances?.bsc?.pending || 0}`);
}

/**
 * Test Polygon deposit
 */
async function testPolygonDeposit(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     POLYGON DEPOSIT TEST               ║');
  console.log('╚════════════════════════════════════════╝');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  );

  const addressService = new AddressGenerationService(hdWallet);

  // Create user
  const userId = 'polygon_test_user';
  const result = await addressService.generateUserDepositAddresses(
    userId,
    'polygon@test.com',
    [Network.POLYGON]
  );

  if (!result.success || !result.data) {
    throw new Error('Failed to generate address');
  }

  const polygonAddress = result.data.addresses[0].address;
  console.log(`Generated address: ${polygonAddress}`);

  // Simulate USDT deposit
  await simulateDeposit(userId, 'polygon@test.com', 'polygon', 300, 'USDT', polygonAddress);

  // Simulate USDC deposit
  await simulateDeposit(userId, 'polygon@test.com', 'polygon', 125, 'USDC', polygonAddress);

  // Check balance
  const user = await User.findOne({ userId });
  console.log(`\nUser balance after deposits:`);
  console.log(`   Confirmed USDT: ${user?.balances?.polygon?.confirmed || 0}`);
  console.log(`   Pending: ${user?.balances?.polygon?.pending || 0}`);
}

/**
 * Test Tron deposit
 */
async function testTronDeposit(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     TRON DEPOSIT TEST                  ║');
  console.log('╚════════════════════════════════════════╝');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  );

  const addressService = new AddressGenerationService(hdWallet);

  // Create user
  const userId = 'tron_test_user';
  const result = await addressService.generateUserDepositAddresses(
    userId,
    'tron@test.com',
    [Network.TRON]
  );

  if (!result.success || !result.data) {
    throw new Error('Failed to generate address');
  }

  const tronAddress = result.data.addresses[0].address;
  console.log(`Generated address: ${tronAddress}`);

  // Simulate USDT deposit
  await simulateDeposit(userId, 'tron@test.com', 'tron', 150, 'USDT', tronAddress);

  // Simulate USDC deposit
  await simulateDeposit(userId, 'tron@test.com', 'tron', 60, 'USDC', tronAddress);

  // Check balance
  const user = await User.findOne({ userId });
  console.log(`\nUser balance after deposits:`);
  console.log(`   Confirmed USDT: ${user?.balances?.tron?.confirmed || 0}`);
  console.log(`   Pending: ${user?.balances?.tron?.pending || 0}`);
}

/**
 * Test multi-network user
 */
async function testMultiNetworkUser(): Promise<void> {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     MULTI-NETWORK USER TEST           ║');
  console.log('╚════════════════════════════════════════╝');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  );

  const addressService = new AddressGenerationService(hdWallet);

  // Create user with all networks
  const userId = 'multi_network_user';
  const result = await addressService.generateUserDepositAddresses(
    userId,
    'multi@test.com',
    [Network.ETHEREUM, Network.BSC, Network.POLYGON, Network.TRON]
  );

  if (!result.success || !result.data) {
    throw new Error('Failed to generate addresses');
  }

  // Get addresses by network
  const addresses: { [key: string]: string } = {};
  for (const addr of result.data.addresses) {
    addresses[addr.network] = addr.address;
  }

  console.log('Generated addresses:');
  console.log(`   Ethereum: ${addresses.ethereum}`);
  console.log(`   BSC:      ${addresses.bsc}`);
  console.log(`   Polygon:  ${addresses.polygon}`);
  console.log(`   Tron:     ${addresses.tron}`);

  // Deposit to each network
  console.log('\nSimulating deposits to all networks...');
  await simulateDeposit(userId, 'multi@test.com', 'ethereum', 100, 'USDT', addresses.ethereum);
  await simulateDeposit(userId, 'multi@test.com', 'bsc', 100, 'USDT', addresses.bsc);
  await simulateDeposit(userId, 'multi@test.com', 'polygon', 100, 'USDT', addresses.polygon);
  await simulateDeposit(userId, 'multi@test.com', 'tron', 100, 'USDT', addresses.tron);

  // Check consolidated balances
  const user = await User.findOne({ userId });
  console.log('\n📊 Consolidated Balances:');
  console.log(`   Ethereum: ${user?.balances?.ethereum?.confirmed || 0} USDT`);
  console.log(`   BSC:      ${user?.balances?.bsc?.confirmed || 0} USDT`);
  console.log(`   Polygon:  ${user?.balances?.polygon?.confirmed || 0} USDT`);
  console.log(`   Tron:     ${user?.balances?.tron?.confirmed || 0} USDT`);

  // Show all deposits
  const deposits = await Deposit.find({ userId });
  console.log(`\n📝 Total deposits recorded: ${deposits.length}`);
  console.log(
    `   By network: ETH=${deposits.filter((d) => d.network === 'ethereum').length}, BSC=${deposits.filter((d) => d.network === 'bsc').length}, POLYGON=${deposits.filter((d) => d.network === 'polygon').length}, TRON=${deposits.filter((d) => d.network === 'tron').length}`
  );
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║    DEPOSIT TESTING SUITE - ALL NETS    ║');
    console.log('╚════════════════════════════════════════╝');

    await setupDatabase();

    await testEthereumDeposit();
    await testBSCDeposit();
    await testPolygonDeposit();
    await testTronDeposit();
    await testMultiNetworkUser();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✓ ALL DEPOSIT TESTS COMPLETED         ║');
    console.log('╚════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await cleanupDatabase();
  }
}

runAllTests();

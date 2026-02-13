/**
 * Test script to verify each user gets unique deposit addresses
 * Tests address generation for multiple users across all networks
 */

import 'tsconfig-paths/register';
import 'dotenv/config';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '@/models';
import { HDWalletUtil } from '@/utils/hdWallet';
import { AddressGenerationService } from '@/services/AddressGenerationService';
import logger from '@/config/logger';
import { Network } from '@/types';

let mongoServer: MongoMemoryServer;

/**
 * Initialize in-memory MongoDB
 */
async function setupDatabase(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  logger.info('Connected to in-memory MongoDB');
}

/**
 * Cleanup database and connection
 */
async function cleanupDatabase(): Promise<void> {
  await mongoose.disconnect();
  await mongoServer.stop();
  logger.info('Disconnected from in-memory MongoDB');
}

/**
 * Test 1: Verify each user gets unique addresses
 */
async function testUniqueAddressesPerUser(): Promise<void> {
  console.log('\n========================================');
  console.log('TEST 1: Unique Addresses Per User');
  console.log('========================================\n');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'test mnemonic with enough words to be valid for testing purposes',
    process.env.MASTER_PASSPHRASE
  );

  const addressService = new AddressGenerationService(hdWallet);
  const networks = [Network.ETHEREUM, Network.BSC, Network.POLYGON, Network.TRON];

  // Create 3 users and generate addresses
  const users = [
    { userId: 'user_001', email: 'user1@example.com' },
    { userId: 'user_002', email: 'user2@example.com' },
    { userId: 'user_003', email: 'user3@example.com' }
  ];

  const generatedAddresses: Map<string, Map<string, Map<string, string>>> = new Map();

  // Generate addresses for each user
  for (const user of users) {
    console.log(`\nGenerating addresses for ${user.userId}...`);

    const result = await addressService.generateUserDepositAddresses(
      user.userId,
      user.email,
      networks
    );

    if (!result.success || !result.data) {
      console.error(`❌ Failed to generate addresses for ${user.userId}:`, result.error);
      throw new Error(`Address generation failed for ${user.userId}`);
    }

    // Store generated addresses
    const userAddresses: Map<string, Map<string, string>> = new Map();

    for (const addressResponse of result.data.addresses) {
      console.log(
        `  ✓ ${addressResponse.network.toUpperCase()}: ${addressResponse.address}`
      );

      if (!userAddresses.has(addressResponse.network)) {
        userAddresses.set(addressResponse.network, new Map());
      }
      userAddresses
        .get(addressResponse.network)!
        .set('address', addressResponse.address);
      userAddresses
        .get(addressResponse.network)!
        .set('derivationIndex', addressResponse.derivationIndex.toString());
    }

    generatedAddresses.set(user.userId, userAddresses);
  }

  // Verify all addresses are unique WITHIN THE SAME NETWORK
  // (Note: EVM networks share the same derivation path, so same address is expected across ETH/BSC/Polygon)
  console.log('\n✓ Verifying address uniqueness across users (per network)...\n');

  const addresssByNetwork: Map<string, Set<string>> = new Map();

  for (const [userId, userAddresses] of generatedAddresses) {
    for (const [network, addressData] of userAddresses) {
      const address = addressData.get('address');
      
      if (!addresssByNetwork.has(network)) {
        addresssByNetwork.set(network, new Set());
      }
      
      const networkSet = addresssByNetwork.get(network)!;
      if (networkSet.has(address!)) {
        console.error(
          `❌ DUPLICATE FOUND on ${network}: Address ${address} generated for multiple users!`
        );
        throw new Error(`Duplicate addresses on network ${network}`);
      }
      networkSet.add(address!);
    }
  }

  console.log('✓ All addresses are UNIQUE per network:');
  for (const [network, addresses] of addresssByNetwork) {
    console.log(`  ${network.toUpperCase()}: ${addresses.size} unique addresses ✓`);
  }
  console.log('\n✓ Each user received distinct addresses on all networks\n');
}

/**
 * Test 2: Verify address retrieval consistency
 */
async function testAddressRetrievalConsistency(): Promise<void> {
  console.log('\n========================================');
  console.log('TEST 2: Address Retrieval Consistency');
  console.log('========================================\n');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'test mnemonic with enough words to be valid for testing purposes',
    process.env.MASTER_PASSPHRASE
  );

  const addressService = new AddressGenerationService(hdWallet);
  const userId = 'user_consistency_test';
  const email = 'consistency@example.com';
  const networks = [Network.ETHEREUM, Network.BSC];

  // Generate initial addresses
  const genResult = await addressService.generateUserDepositAddresses(
    userId,
    email,
    networks
  );

  if (!genResult.success || !genResult.data) {
    throw new Error('Failed to generate initial addresses');
  }

  const initialAddresses = new Map<string, string>();
  for (const addr of genResult.data.addresses) {
    initialAddresses.set(addr.network, addr.address);
    console.log(`Generated ${addr.network}: ${addr.address}`);
  }

  // Retrieve addresses one by one and verify they match
  console.log('\nRetrieving addresses individually...\n');

  for (const network of networks) {
    const retrieveResult = await addressService.getUserDepositAddress(userId, network);

    if (!retrieveResult.success || !retrieveResult.data) {
      throw new Error(`Failed to retrieve address for ${network}`);
    }

    const storedAddress = initialAddresses.get(network);
    const retrievedAddress = retrieveResult.data.address;

    if (storedAddress === retrievedAddress) {
      console.log(`✓ ${network}: Address matches (${retrievedAddress})`);
    } else {
      console.error(
        `❌ ${network}: Address mismatch!\n  Generated: ${storedAddress}\n  Retrieved: ${retrievedAddress}`
      );
      throw new Error('Address consistency check failed');
    }
  }

  console.log('\n✓ All retrieved addresses match generated addresses\n');
}

/**
 * Test 3: Verify wallet index progression
 */
async function testWalletIndexProgression(): Promise<void> {
  console.log('\n========================================');
  console.log('TEST 3: Wallet Index Progression');
  console.log('========================================\n');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'test mnemonic with enough words to be valid for testing purposes',
    process.env.MASTER_PASSPHRASE
  );

  const addressService = new AddressGenerationService(hdWallet);
  const networks = [Network.ETHEREUM];

  // Create user and check initial wallet index
  const userId = 'user_index_test';
  const email = 'indextest@example.com';

  const result1 = await addressService.generateUserDepositAddresses(
    userId,
    email,
    networks
  );

  if (!result1.success || !result1.data) {
    throw new Error('Failed to generate initial addresses');
  }

  const initialIndex1 = result1.data.addresses[0].derivationIndex;
  console.log(`User created with initial derivation index: ${initialIndex1}`);

  // Retrieve user from DB and verify walletIndex
  const user = await User.findOne({ userId });
  console.log(`Stored wallet index in DB: ${user?.walletIndex}`);

  if (user?.walletIndex !== initialIndex1) {
    console.error(
      `❌ Wallet index mismatch: stored=${user?.walletIndex}, used=${initialIndex1}`
    );
    throw new Error('Wallet index mismatch');
  }

  console.log('✓ Wallet index correctly stored and used for derivation\n');
}

/**
 * Test 4: Verify address ownership verification
 */
async function testAddressOwnershipVerification(): Promise<void> {
  console.log('\n========================================');
  console.log('TEST 4: Address Ownership Verification');
  console.log('========================================\n');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'test mnemonic with enough words to be valid for testing purposes',
    process.env.MASTER_PASSPHRASE
  );

  const addressService = new AddressGenerationService(hdWallet);
  const networks = [Network.ETHEREUM, Network.BSC];

  const userId = 'user_ownership_test';
  const email = 'ownership@example.com';

  // Generate addresses
  const genResult = await addressService.generateUserDepositAddresses(
    userId,
    email,
    networks
  );

  if (!genResult.success || !genResult.data) {
    throw new Error('Failed to generate addresses');
  }

  // Test ownership verification
  const ethAddress = genResult.data.addresses.find((a) => a.network === Network.ETHEREUM);

  if (!ethAddress) {
    throw new Error('Ethereum address not generated');
  }

  console.log(`Testing ownership of: ${ethAddress.address}`);

  // Verify ownership
  const verifyResult = await addressService.verifyAddressOwnership(
    ethAddress.address,
    userId,
    Network.ETHEREUM
  );

  if (!verifyResult.success) {
    throw new Error('Address verification failed');
  }

  if (verifyResult.data === true) {
    console.log('✓ Address verified as belonging to user\n');
  } else {
    console.error('❌ Address ownership verification failed\n');
    throw new Error('Ownership verification returned false');
  }

  // Test false ownership (address from different user)
  const otherResult = await addressService.verifyAddressOwnership(
    ethAddress.address,
    'different_user',
    Network.ETHEREUM
  );

  if (otherResult.data === false) {
    console.log('✓ Correctly rejected ownership claim from different user\n');
  } else {
    console.error('❌ Ownership verification incorrectly accepted different user\n');
    throw new Error('Ownership verification security issue');
  }
}

/**
 * Test 5: Find user by deposit address
 */
async function testFindUserByAddress(): Promise<void> {
  console.log('\n========================================');
  console.log('TEST 5: Find User By Address');
  console.log('========================================\n');

  const hdWallet = new HDWalletUtil(
    process.env.MASTER_MNEMONIC || 'test mnemonic with enough words to be valid for testing purposes',
    process.env.MASTER_PASSPHRASE
  );

  const addressService = new AddressGenerationService(hdWallet);
  const userId = 'user_lookup_test';
  const email = 'lookup@example.com';

  // Generate addresses
  const genResult = await addressService.generateUserDepositAddresses(
    userId,
    email,
    [Network.ETHEREUM, Network.POLYGON]
  );

  if (!genResult.success || !genResult.data) {
    throw new Error('Failed to generate addresses');
  }

  // Find user by one of the generated addresses
  const polygonAddress = genResult.data.addresses.find((a) => a.network === Network.POLYGON);

  if (!polygonAddress) {
    throw new Error('Polygon address not generated');
  }

  console.log(`Looking up user by address: ${polygonAddress.address}`);

  const lookupResult = await addressService.findUserByDepositAddress(
    polygonAddress.address,
    Network.POLYGON
  );

  if (!lookupResult.success || !lookupResult.data) {
    console.error('❌ Address lookup failed');
    throw new Error('User lookup failed');
  }

  if (lookupResult.data.userId === userId) {
    console.log(`✓ Successfully found user: ${lookupResult.data.userId}`);
    console.log(`✓ Email: ${lookupResult.data.email}\n`);
  } else {
    console.error(
      `❌ Wrong user found: ${lookupResult.data.userId} (expected ${userId})\n`
    );
    throw new Error('Wrong user returned from address lookup');
  }
}

/**
 * Main test runner
 */
async function runAllTests(): Promise<void> {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  UNIQUE ADDRESS GENERATION TEST SUITE  ║');
    console.log('╚════════════════════════════════════════╝');

    await setupDatabase();

    // Run all tests
    await testUniqueAddressesPerUser();
    await testAddressRetrievalConsistency();
    await testWalletIndexProgression();
    await testAddressOwnershipVerification();
    await testFindUserByAddress();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  ✓ ALL TESTS PASSED SUCCESSFULLY!      ║');
    console.log('╚════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n╔════════════════════════════════════════╗');
    console.error('║  ❌ TEST FAILED                         ║');
    console.error('╚════════════════════════════════════════╝\n');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await cleanupDatabase();
  }
}

runAllTests();

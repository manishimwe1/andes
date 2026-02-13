# Crypto Deposit Backend - Complete Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  (Web App, Mobile App, Admin Dashboard)                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                        HTTP/HTTPS
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    MIDDLEWARE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│ • API Key Authentication                                        │
│ • Request ID Tracking                                           │
│ • Request Logging                                               │
│ • Rate Limiting (100 req/15min, 10 addr/hr, 30 deposits/min)  │
│ • Input Validation (Joi schemas)                                │
│ • CORS, Helmet security                                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    ROUTER LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│ • /api/health               - Health checks                     │
│ • /api/addresses/*          - Address generation & lookup       │
│ • /api/deposits/*           - Deposit management & tracking     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   CONTROLLER LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│ • AddressController         - Handle address requests            │
│ • DepositController         - Handle deposit requests            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    SERVICE LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ AddressGenerationService                                 │    │
│ │ • Generate HD wallet addresses (BIP39)                   │    │
│ │ • Store user deposit addresses                           │    │
│ │ • Verify address ownership                               │    │
│ │ • Support: Ethereum, BSC, Polygon, Tron                 │    │
│ └──────────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ DepositService                                           │    │
│ │ • Record deposits from blockchain                        │    │
│ │ • Manage deposit status lifecycle                        │    │
│ │ • Update user balances                                   │    │
│ │ • Query deposit history                                  │    │
│ │ • Generate statistics                                    │    │
│ └──────────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ BlockchainListenerService                                │    │
│ │ • Real-time event listeners for each network             │    │
│ │ • Scan blocks for token transfers                        │    │
│ │ • Match transfers to registered addresses                │    │
│ │ • Prevent double-counting (unique txHash)                │    │
│ └──────────────────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────┐    │
│ │ ConfirmationService                                      │    │
│ │ • Poll RPC for transaction confirmations                 │    │
│ │ • Update confirmation counts                             │    │
│ │ • Credit balance when threshold reached                  │    │
│ │ • Handle transaction failures                            │    │
│ └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐  ┌──────────▼─────────┐  ┌───────▼────────┐
│  UTILS LAYER   │  │  DATA LAYER         │  │ BLOCKCHAIN     │
├────────────────┤  ├─────────────────────┤  ├────────────────┤
│ • HDWallet     │  │ • User Model        │  │ • ethers.js    │
│ • Blockchain   │  │ • Deposit Model     │  │ • TronWeb      │
│ • Helpers      │  │ • Schemas           │  │ • Web3         │
│ • Validation   │  │ • Indexes           │  │ • RPC          │
└────────────────┘  │ • Migrations        │  └────────────────┘
                    └─────────────────────┘
                            │
                     ┌──────▼──────┐
                     │  MONGODB    │
                     │  • Users    │
                     │  • Deposits │
                     └─────────────┘
```

## Data Flow

### User Deposit Flow

```
1. User Generates Address
   ├─ POST /api/addresses/generate
   │  └─ AddressGenerationService.generateUserDepositAddresses()
   │     ├─ Create User record
   │     ├─ Derive address using HD wallet (BIP39 mnemonic)
   │     ├─ Store in User.depositAddresses
   │     └─ Return address to client
   └─ User receives: 0x1234...

2. User Sends Tokens
   ├─ User transfers USDT to 0x1234... on blockchain
   └─ Transaction broadcast to network

3. Blockchain Listener Detects Transfer
   ├─ BlockchainListenerService polls every 30 seconds
   │  ├─ Scans latest blocks
   │  ├─ Checks Transfer events to registered addresses
   │  └─ Finds: from: 0xabcd, to: 0x1234, amount: 1000000000000000000, txHash: 0x5678
   └─ Deposit detected

4. Deposit Recorded
   ├─ DepositService.recordDeposit()
   │  ├─ Check duplicate (txHash index)
   │  ├─ Create Deposit record
   │  │  └─ status: PENDING, confirmations: 0
   │  └─ Save to MongoDB
   └─ Deposit created with ID

5. Confirmation Tracking
   ├─ Cron job runs every 1 minute
   │  └─ ConfirmationService.checkPendingDepositsConfirmations()
   │     ├─ Get all PENDING deposits
   │     └─ For each deposit:
   │        ├─ Call RPC to get transaction receipt
   │        ├─ Calculate confirmations = currentBlock - txBlock
   │        ├─ Update Deposit.confirmations
   │        └─ If confirmations >= required (12 for Ethereum):
   │           ├─ Change status: PENDING → CONFIRMED
   │           ├─ Call DepositService.creditUserBalance()
   │           │  └─ Update User.balances[network].confirmed
   │           └─ Set confirmedAt timestamp
   └─ Balance credited to user account

6. User Checks Balance
   ├─ GET /api/deposits/:userId
   └─ Returns all deposits with final balances
```

## HD Wallet Derivation

```
┌─────────────────────────────────────────┐
│   MASTER MNEMONIC (BIP39)               │
│   "word1 word2 ... word12"              │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   Master Seed       │
        │   (512 bits)        │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────────────────┐
        │        Master Key (m)                   │
        │        Private: 256 bits                │
        │        Public: 256 bits (compressed)   │
        └──────────┬──────────────────────────────┘
                   │
        ┌──────────▼──────────────────────────────┐
        │  Derivation Path per Network            │
        ├──────────────────────────────────────────┤
        │                                          │
        │  Ethereum/BSC/Polygon:                  │
        │  m/44'/60'/0'/0/0                       │
        │  m/44'/60'/0'/0/1                       │
        │  m/44'/60'/0'/0/2                       │
        │  ...                                     │
        │                                          │
        │  Tron:                                  │
        │  m/44'/60'/0'/0/0   (same curve)       │
        │  Different address encoding             │
        │                                          │
        └──────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        │                     │                  │
   ┌────▼────┐         ┌─────▼────┐      ┌──────▼────┐
   │Ethereum │         │   BSC    │      │ Polygon   │
   │Address  │         │ Address  │      │ Address   │
   │0x1234..│         │0x5678.. │      │0x9abc..  │
   └─────────┘         └──────────┘      └───────────┘
```

### Address Derivation Example

```typescript
// Master Mnemonic
const mnemonic = "abandon ability able about above absolute absorb abstract abstract...";

// Generate Master Seed
const seed = bip39.mnemonicToSeedSync(mnemonic);

// Create HD Key
const hdkey = HDKey.fromMasterSeed(seed);

// Derive Path: m/44'/60'/0'/0/0 (First Ethereum address)
const derived = hdkey.derive("m/44'/60'/0'/0/0");

// Get keys
const privateKey = derived.privateKey;  // 32 bytes
const publicKey = derived.publicKey;    // 33 bytes (compressed)

// Create Ethereum address (last 20 bytes of keccak256(publicKey))
const address = ethers.getAddress(publicPrivateKey);  // 0x1234...

// Store in User.depositAddresses.erc20
{
  address: "0x1234...",
  publicKey: "0x5678...",
  derivationIndex: 0,
  createdAt: "2024-01-15T10:00:00Z"
}
```

## Confirmation Process

```
Block Timeline:
├─ Block 1000000 - Transaction mined (0 confirmations)
├─ Block 1000001 - 1 confirmation
├─ Block 1000002 - 2 confirmations
├─ ...
├─ Block 1000011 - 11 confirmations
├─ Block 1000012 - 12 confirmations ✅ CONFIRMED
│  └─ Balance credited
└─ Block 1000013+ - Additional security (13+)

Polling Timeline:
├─ 0:00 - Deposit created (confirmations: 0) → PENDING
├─ 1:00 - Check: 3 confirmations → Update DB
├─ 2:00 - Check: 6 confirmations → Update DB
├─ 3:00 - Check: 9 confirmations → Update DB
├─ 4:00 - Check: 12 confirmations → UPDATE DB
│         Status: PENDING → CONFIRMED ✅
│         Action: Balance credited
└─ 5:00+ - Keep checking (finality)
```

## Service Interactions

```
AddressGenerationService
├─ generateUserDepositAddresses()
│  └─ Uses: HDWalletUtil.deriveWallet()
├─ getUserDepositAddress()
├─ getAllUserDepositAddresses()
├─ verifyAddressOwnership()
├─ findUserByDepositAddress()
└─ incrementWalletIndex()

DepositService
├─ recordDeposit()
│  ├─ Check duplicate txHash
│  └─ Create Deposit + Credit balance
├─ updateDepositConfirmation()
│  └─ Update confirmations + Credit if threshold
├─ markDepositAsFailed()
├─ getUserDeposits()
├─ getRecentDeposits()
├─ getPendingDeposits()
├─ findDepositByTxHash()
├─ getDepositStatistics()
├─ incrementRetryCount()
└─ creditUserBalance()

BlockchainListenerService
├─ startListening()
│  ├─ Start Ethereum listener
│  ├─ Start BSC listener
│  ├─ Start Polygon listener
│  └─ Start Tron listener
├─ stopListening()
├─ pollNetworkForTransfers()
├─ scanBlockRangeForTransfers()
│  └─ Uses: getEVMProvider()
├─ processTransferLog()
│  └─ Uses: DepositService.recordDeposit()
├─ getListenerState()
└─ getAllListenerStates()

ConfirmationService
├─ checkPendingDepositsConfirmations()
│  └─ For each PENDING deposit
│     └─ checkDepositConfirmation()
├─ checkDepositConfirmation()
│  ├─ Uses: getTransactionReceiptWithRetries()
│  └─ Uses: DepositService.updateDepositConfirmation()
├─ checkDepositsWithStatus()
├─ getCurrentBlockNumber()
└─ estimateConfirmationTime()
```

## Error Handling Flow

```
Error Occurs
├─ Blockchain RPC error
│  ├─ Retry with exponential backoff (max 5 retries)
│  ├─ Log error with context
│  └─ Return: "Transaction receipt not found"
│
├─ Duplicate transaction detected
│  ├─ Check unique txHash index
│  └─ Return existing deposit instead of creating new
│
├─ User not found
│  ├─ Log warning
│  └─ Return: 404 NOT_FOUND
│
├─ Invalid input
│  ├─ Validate with Joi schema
│  ├─ Return validation errors
│  └─ Log validation failure
│
├─ Rate limit exceeded
│  ├─ Count requests per window
│  ├─ Return 429 TOO_MANY_REQUESTS
│  └─ Include Retry-After header
│
└─ Database error
   ├─ Retry transaction
   └─ Log error + stack trace
```

## Scheduled Tasks (Cron)

```
┌─────────────────────────────────────────────────────┐
│           CRON SCHEDULE                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Every 1 Minute:                                     │
│ └─ checkPendingDepositsConfirmations()             │
│    ├─ Get PENDING deposits (retryCount < 5)        │
│    ├─ For each deposit:                            │
│    │  ├─ Get transaction receipt                   │
│    │  ├─ Calculate confirmations                   │
│    │  ├─ Update deposit.confirmations              │
│    │  └─ If confirmations >= required:             │
│    │     ├─ Set status = CONFIRMED                 │
│    │     ├─ Credit balance                         │
│    │     └─ Set confirmedAt                        │
│    └─ Log results                                  │
│                                                     │
│ Every 30 Seconds:                                   │
│ └─ BlockchainListenerService.pollNetworkForTransfers()
│    ├─ For each network (ETH, BSC, MATIC, TRON)    │
│    │  ├─ Get current block                        │
│    │  ├─ Scan blocks since last check              │
│    │  ├─ Find Transfer events to registered addrs │
│    │  └─ If found:                                 │
│    │     ├─ Process transfer log                   │
│    │     └─ Record deposit                         │
│    └─ Update listener state                        │
│                                                     │
│ Every 5 Minutes:                                    │
│ └─ Listener health sync                            │
│    ├─ Get all listener states                      │
│    ├─ Log: network, status, lastBlock, uptime      │
│    └─ Alert if listener is stalled (status=error) │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────┐
│        SECURITY LAYERS                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. HTTPS/TLS                                    │
│    └─ Encrypted transport layer                 │
│                                                 │
│ 2. API Key Authentication                       │
│    ├─ x-api-key header required                 │
│    ├─ Compare against process.env.API_KEY       │
│    └─ Log failed attempts                       │
│                                                 │
│ 3. Rate Limiting                                │
│    ├─ General: 100 req/15min per IP             │
│    ├─ Address Gen: 10 req/hr per user           │
│    ├─ Deposit Check: 30 req/min global          │
│    └─ Login: 5 attempts/15min                   │
│                                                 │
│ 4. Input Validation                             │
│    ├─ Joi schema validation                     │
│    ├─ Type checking                             │
│    ├─ Length limits                             │
│    └─ Format validation (addresses, emails)     │
│                                                 │
│ 5. Database Security                            │
│    ├─ Unique index on txHash (prevent double)   │
│    ├─ Indexed queries for fast lookup            │
│    ├─ MongoDB authentication                    │
│    └─ Encrypted connection strings              │
│                                                 │
│ 6. Private Key Management                       │
│    ├─ Master mnemonic in env var ONLY           │
│    ├─ Never logged or exposed                   │
│    ├─ HD wallet derivation (no private keys)    │
│    └─ Private keys only in memory               │
│                                                 │
│ 7. Transaction Verification                     │
│    ├─ Verify receipt.status (true/false)        │
│    ├─ Check receipt exists                      │
│    ├─ Validate confirmations before crediting   │
│    └─ Prevent replay attacks (unique txHash)    │
│                                                 │
│ 8. Logging & Monitoring                         │
│    ├─ All transactions logged                   │
│    ├─ Error logs isolated                       │
│    ├─ No sensitive data in logs                 │
│    └─ Winston rotating file appenders           │
│                                                 │
│ 9. Environment Isolation                        │
│    ├─ Separate configs per environment          │
│    ├─ Production mode disables detailed errors  │
│    └─ Development console logging only          │
│                                                 │
│ 10. Error Handling                              │
│    ├─ Graceful error recovery                   │
│    ├─ No stack traces to client (production)    │
│    ├─ Retry logic with backoff                  │
│    └─ Circuit breaker pattern for RPC           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Performance Optimization

```
Database Indexing:
├─ User
│  ├─ userId (unique)
│  ├─ email (unique)
│  ├─ depositAddresses.*.address
│  └─ createdAt
│
├─ Deposit
│  ├─ txHash (unique, sparse)
│  ├─ userId
│  ├─ status
│  ├─ network
│  ├─ toAddress
│  ├─ createdAt
│  ├─ Compound: userId + network
│  ├─ Compound: userId + status
│  └─ Compound: status + createdAt

Caching Opportunities:
├─ User deposit addresses (Redis)
├─ Recent deposits (10 min TTL)
├─ Confirmation counts (2 min TTL)
├─ Network stats (5 min TTL)
└─ Token prices (1 hour TTL)

Query Optimization:
├─ Pagination (limit/skip)
├─ Field selection (only needed fields)
├─ Lean queries (no Mongoose wrappers)
└─ Aggregate pipelines for stats

Resource Management:
├─ Connection pooling (MongoDB)
├─ RPC provider rate limiting
├─ Memory management (large result sets)
└─ Concurrent request handling
```

## Deployment Strategies

### Development
```bash
npm run dev
→ Hot reload with ts-node-dev
→ Console logging
→ Detailed error messages
```

### Staging
```bash
npm run build
node dist/index.js
→ Full TypeScript compilation
→ File logging
→ Rate limiting enabled
```

### Production
```bash
pm2 start dist/index.js --name crypto-deposits
→ Process manager with auto-restart
→ File logging with rotation
→ Minimal logging (info level)
→ No stack traces to clients
```

---

**System Design v1.0**
Complete, scalable, production-ready crypto deposit backend

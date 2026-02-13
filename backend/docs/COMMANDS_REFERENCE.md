# Quick Commands Reference

## Test Deposits Across All Networks

```bash
# Fastest way to test deposits
cd c:\Users\USER\Documents\builds\andes\backend
npx ts-node --project tsconfig.json scripts/test-deposits-all-networks.ts
```

**Result**: Tests all 4 networks (Ethereum, BSC, Polygon, Tron) with USDT + USDC

---

## Test Unique Addresses (Verify Each User Gets Own Address)

```bash
cd c:\Users\USER\Documents\builds\andes\backend
npx ts-node --project tsconfig.json scripts/test-unique-addresses.ts
```

**Result**: Confirms 3 users get completely different addresses across networks

---

## Build Backend

```bash
cd c:\Users\USER\Documents\builds\andes\backend
pnpm run build
```

**Creates**: `dist/` folder with compiled JavaScript

---

## Start Backend with In-Memory Database

```bash
cd c:\Users\USER\Documents\builds\andes\backend
node scripts/run-with-memory.js
```

**Starts**: Backend on http://localhost:3001 with MongoDB in RAM (no setup needed)

---

## Check Backend Health

```bash
curl http://localhost:3001/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Backend is healthy",
  "database": "connected"
}
```

---

## Generate Deposit Address via API

```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key" \
  -d '{
    "userId": "user_123",
    "email": "user@example.com",
    "networks": ["ethereum", "bsc", "polygon", "tron"]
  }'
```

**Result**: Returns unique addresses for user on all 4 networks

---

## Get User Addresses

```bash
curl http://localhost:3001/api/addresses/user_123 \
  -H "X-API-Key: your_api_key"
```

**Result**: All addresses for user_123 across all networks

---

## Setup Testnet (Real Testing)

Follow [TESTNET_SETUP.md](./docs/TESTNET_SETUP.md) for:
- Getting testnet coins (free)
- Deploying test tokens
- Configuring testnet RPC
- Sending real test transactions

---

## Documentation Files

| File | Purpose |
|------|---------|
| [QUICK_START_ADDRESSES.md](docs/QUICK_START_ADDRESSES.md) | 30-second address setup guide |
| [UNIQUE_ADDRESS_GENERATION.md](docs/UNIQUE_ADDRESS_GENERATION.md) | Complete architecture details |
| [ADDRESS_API.md](docs/ADDRESS_API.md) | REST API reference |
| [TESTNET_SETUP.md](docs/TESTNET_SETUP.md) | How to test on real testnets |
| [TEST_DEPOSITS_GUIDE.md](docs/TEST_DEPOSITS_GUIDE.md) | Deposit testing walkthrough |

---

## Supported Networks

- **Ethereum** (Mainnet: Chain ID 1, Sepolia: 11155111)
- **BSC** (Mainnet: Chain ID 56, Testnet: 97)
- **Polygon** (Mainnet: Chain ID 137, Mumbai: 80001)
- **Tron** (Mainnet, Shasta Testnet)

---

## Tokens

Both networks support:
- **USDT** (Tether)
- **USDC** (USD Coin)

---

## Environment Setup

### Required Variables

```bash
# Master seed for HD wallet (generates all addresses)
MASTER_MNEMONIC="your 12+ word bip39 phrase"

# API keys for blockchain explorers (optional for mainnet)
ETHERSCAN_API_KEY="your_key"
BSCSCAN_API_KEY="your_key"
POLYGONSCAN_API_KEY="your_key"

# RPC endpoints (optional, uses defaults)
RPC_ETHEREUM="https://..."
RPC_BSC="https://..."
RPC_POLYGON="https://..."
RPC_TRON="https://..."
```

### Optional Variables

```bash
# MongoDB (defaults to in-memory for testing)
MONGODB_URI="mongodb://localhost:27017/andes"

# Server
PORT=3001
NODE_ENV="development"

# API Key
API_KEY="your_secret_key"
```

---

## Test Files

Run individual test suites:

```bash
# Test 1: Address uniqueness
npx ts-node --project tsconfig.json scripts/test-unique-addresses.ts

# Test 2: Deposit functionality (simulated)
npx ts-node --project tsconfig.json scripts/test-deposits-all-networks.ts
```

Both use in-memory MongoDB, no external setup needed.

---

## Project Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── AddressGenerationService.ts  ← Address creation
│   │   ├── DepositService.ts            ← Deposit recording
│   │   ├── BlockchainListenerService.ts ← Monitor blockchain
│   │   └── ConfirmationService.ts       ← Confirm deposits
│   ├── models/
│   │   ├── User.ts
│   │   └── Deposit.ts
│   ├── routes/
│   │   ├── addresses.ts                 ← Address endpoints
│   │   └── deposits.ts                  ← Deposit endpoints
│   └── utils/
│       └── hdWallet.ts                  ← HD wallet derivation
├── scripts/
│   ├── test-unique-addresses.ts
│   ├── test-deposits-all-networks.ts    ← THE KEY TEST
│   └── run-with-memory.js               ← Start with in-memory DB
├── docs/
│   ├── QUICK_START_ADDRESSES.md
│   ├── UNIQUE_ADDRESS_GENERATION.md
│   ├── ADDRESS_API.md
│   ├── TESTNET_SETUP.md
│   └── TEST_DEPOSITS_GUIDE.md
└── package.json

```

---

## Key Features

✓ **Per-user unique addresses** on all networks  
✓ **HD wallet** (BIP-32/BIP-44) deterministic address generation  
✓ **Multi-token support** (USDT + USDC)  
✓ **Multi-network** (Ethereum, BSC, Polygon, Tron)  
✓ **Deposit recording** with transaction tracking  
✓ **Balance management** (confirmed/pending)  
✓ **Blockchain listener** (automatic deposit detection)  
✓ **Confirmation tracking** (blocks until confirmed)  
✓ **Test suite** (no external dependencies)  

---

## Common Workflows

### 1. Test Everything (Recommended First Step)

```bash
# Build
cd backend && pnpm run build

# Test unique addresses
npx ts-node --project tsconfig.json scripts/test-unique-addresses.ts

# Test deposits on all networks
npx ts-node --project tsconfig.json scripts/test-deposits-all-networks.ts

# Start backend
node scripts/run-with-memory.js

# In another terminal, test API
curl http://localhost:3001/api/health
```

### 2. Test on Testnet (Real Blockchain)

```bash
# Follow TESTNET_SETUP.md
# 1. Get testnet coins from faucets
# 2. Update .env with testnet RPC
# 3. Start backend
node dist/index.js
# 4. Send tokens to user's address
# 5. Watch logs for deposit detection
```

### 3. Deploy to Production

```bash
# Use mainnet configuration in .env
# Replace RPC_* with production endpoints
# Update token addresses if different
# Start backend
node dist/index.js
```

---

## Support

- Check logs: `tail -f logs/app.log`
- Test suite errors: Review test output for specific failures
- Blockchain issues: Verify RPC endpoints are reachable
- Database issues: Ensure MongoDB is running (if not using in-memory)

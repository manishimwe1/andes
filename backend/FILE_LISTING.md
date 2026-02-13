# Backend Project File Listing

## Root Files
- `package.json` - NPM dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules
- `Dockerfile` - Docker image definition
- `README.md` - Project overview
- `SETUP.md` - Detailed setup and configuration guide
- `QUICKSTART.md` - Quick start guide
- `ARCHITECTURE.md` - System architecture and design
- `BUILD_SUMMARY.md` - Build completion summary

## Source Files (src/)

### /src/index.ts
- Main application entry point
- Express app initialization
- Service setup
- Scheduled tasks registration
- Graceful shutdown handling

### /src/config/
- `logger.ts` - Winston logging configuration
- `database.ts` - MongoDB connection setup
- `blockchain.ts` - Blockchain network configurations
- `index.ts` - Config exports

### /src/types/
- `index.ts` - 25+ TypeScript interfaces and types
  - Network enums
  - User and Deposit interfaces
  - Service response types
  - Error types
  - HD Wallet types

### /src/models/
- `User.ts` - User MongoDB schema
  - userId, email
  - walletIndex
  - depositAddresses (erc20, bep20, polygon, trc20)
  - balances (ethereum, bsc, polygon, tron)
  - Virtual fields and methods

- `Deposit.ts` - Deposit MongoDB schema
  - userId, userEmail
  - network, tokenAddress, txHash
  - amount, amountUSD
  - confirmations tracking
  - status lifecycle
  - Transaction receipt storage
  - Indexes for fast queries

- `index.ts` - Model exports

### /src/services/
- `AddressGenerationService.ts`
  - Generate deposit addresses via HD wallet
  - Retrieve user addresses
  - Verify address ownership
  - Find user by address

- `DepositService.ts`
  - Record deposits
  - Update confirmations
  - Mark deposits as failed/confirmed
  - Get user deposits
  - Generate statistics
  - Credit user balance

- `ConfirmationService.ts`
  - Check pending deposit confirmations
  - Poll RPC for receipts
  - Update confirmation counts
  - Handle transaction failures
  - Retry logic

- `BlockchainListenerService.ts`
  - Listen for blockchain transfers
  - Scan smart contract events
  - Match transfers to user addresses
  - Record deposits automatically
  - Track listener health

- `index.ts` - Service exports and factories

### /src/controllers/
- `AddressController.ts`
  - POST /addresses/generate
  - GET /addresses/:userId/:network
  - GET /addresses/:userId
  - POST /addresses/verify
  - GET /addresses/lookup/:address/:network

- `DepositController.ts`
  - GET /deposits/:userId
  - GET /deposits/tx/:txHash
  - POST /deposits/check-confirmation
  - GET /deposits/stats
  - GET /deposits/recent/:network
  - GET /deposits/pending

- `index.ts` - Controller exports

### /src/middleware/
- `authMiddleware.ts`
  - API key authentication
  - Request ID generation
  - Request logging
  - Error handler
  - 404 handler

- `rateLimitMiddleware.ts`
  - General API rate limiter
  - Address generation limiter
  - Deposit check limiter
  - Login attempt limiter

- `validationMiddleware.ts`
  - Joi schema validation
  - Input sanitization
  - Error detail reporting

- `index.ts` - Middleware exports

### /src/routes/
- `addresses.ts`
  - Address generation routes
  - Address retrieval routes
  - Address verification routes
  - Rate limiting applied
  - API key auth applied

- `deposits.ts`
  - Deposit query routes
  - Confirmation check routes
  - Statistics routes
  - Rate limiting applied

- `health.ts`
  - Health check endpoint
  - Readiness probe

- `index.ts` - Route exports

### /src/utils/
- `hdWallet.ts`
  - HD wallet utilities
  - BIP39 mnemonic handling
  - Address derivation
  - Public/private key extraction
  - Batch wallet generation

- `blockchain.ts`
  - RPC provider initialization
  - Address validation
  - Transaction receipt fetching
  - Confirmation waiting
  - Gas price estimation

- `helpers.ts`
  - Response formatting
  - Wei/token conversion
  - Email/UUID validation
  - Retry logic
  - Environment parsing

### /src/listeners/
- (Directory for future listener plugins)

---

## Complete File Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── logger.ts
│   │   ├── database.ts
│   │   ├── blockchain.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Deposit.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── AddressGenerationService.ts
│   │   ├── DepositService.ts
│   │   ├── ConfirmationService.ts
│   │   ├── BlockchainListenerService.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── AddressController.ts
│   │   ├── DepositController.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── rateLimitMiddleware.ts
│   │   ├── validationMiddleware.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── addresses.ts
│   │   ├── deposits.ts
│   │   ├── health.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── hdWallet.ts
│   │   ├── blockchain.ts
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   ├── listeners/
│   └── index.ts
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── .gitignore
├── README.md
├── SETUP.md
├── QUICKSTART.md
├── ARCHITECTURE.md
├── BUILD_SUMMARY.md
└── FILE_LISTING.md (this file)
```

## Development Workflow

### Starting Development
```bash
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Deployment
```bash
# Option 1: Direct Node
npm run build
node dist/index.js

# Option 2: PM2
pm2 start dist/index.js

# Option 3: Docker
docker build -t crypto-deposits .
docker run crypto-deposits
```

---

## File Overview

### Configuration Files (3)
- **tsconfig.json**: TypeScript compiler options
- **package.json**: Dependencies and scripts
- **.env.example**: Environment template

### Source Code (25+ files)
- **Models**: 2 files
- **Services**: 4 main files + 1 index
- **Controllers**: 2 files + 1 index
- **Middleware**: 3 files + 1 index
- **Routes**: 3 files + 1 index
- **Utils**: 3 files
- **Types**: 1 file
- **Main**: 1 file (index.ts)

### Documentation (5 files)
- README.md
- SETUP.md
- QUICKSTART.md
- ARCHITECTURE.md
- BUILD_SUMMARY.md

### Docker & Deploy (2 files)
- Dockerfile
- .gitignore

---

## Total Statistics

- **Source Files**: 25+
- **Lines of Code**: 3000+
- **TypeScript Interfaces**: 25+
- **API Endpoints**: 12+
- **Database Collections**: 2
- **Services**: 4
- **Middleware Functions**: 10+
- **Documentation Pages**: 5

---

## Key API Endpoints

```
POST   /api/addresses/generate
GET    /api/addresses/:userId/:network
GET    /api/addresses/:userId
POST   /api/addresses/verify
GET    /api/addresses/lookup/:address/:network

GET    /api/deposits/:userId
GET    /api/deposits/tx/:txHash
POST   /api/deposits/check-confirmation
GET    /api/deposits/stats
GET    /api/deposits/recent/:network
GET    /api/deposits/pending

GET    /api/health
GET    /api/ready
```

---

**Generated**: January 15, 2024
**Status**: ✅ Complete and Production-Ready
**Version**: 1.0.0

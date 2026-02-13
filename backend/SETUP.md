# Crypto Deposit Backend - Setup & Installation Guide

## Overview

This is a production-ready cryptocurrency deposit backend system built with Node.js, Express, TypeScript, and MongoDB. It handles incoming crypto transfers across multiple blockchain networks (Ethereum, BSC, Polygon, Tron) and maintains accurate user balances.

## Key Features

✅ **Multi-Network Support**: Ethereum, BSC, Polygon, Tron
✅ **HD Wallet Derivation**: Generate unique deposit addresses per user using BIP39 mnemonic
✅ **Automatic Confirmation Tracking**: Monitor blockchain confirmations for transactions
✅ **Real-time Listeners**: Detect incoming token transfers automatically
✅ **Balance Management**: Atomic balance updates for confirmed deposits
✅ **Security**: API key authentication, rate limiting, input validation
✅ **Scalable**: Modular service-based architecture
✅ **Logging**: Comprehensive logging with Winston
✅ **Error Handling**: Proper error handling and recovery mechanisms

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── logger.ts        # Winston logger setup
│   │   ├── database.ts      # MongoDB connection
│   │   └── blockchain.ts    # Blockchain configs
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # User model
│   │   └── Deposit.ts       # Deposit model
│   ├── services/            # Business logic
│   │   ├── AddressGenerationService.ts
│   │   ├── DepositService.ts
│   │   ├── ConfirmationService.ts
│   │   └── BlockchainListenerService.ts
│   ├── controllers/         # Request handlers
│   │   ├── AddressController.ts
│   │   └── DepositController.ts
│   ├── middleware/          # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── rateLimitMiddleware.ts
│   │   └── validationMiddleware.ts
│   ├── routes/              # API routes
│   │   ├── addresses.ts
│   │   ├── deposits.ts
│   │   └── health.ts
│   ├── utils/               # Utility functions
│   │   ├── hdWallet.ts      # HD wallet derivation
│   │   ├── blockchain.ts    # Blockchain helpers
│   │   └── helpers.ts       # General helpers
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   └── index.ts             # Main application file
├── package.json
├── tsconfig.json
└── .env.example
```

## Prerequisites

- **Node.js**: v16+ (v18+ recommended)
- **MongoDB**: v4.4+ (local or cloud)
- **npm** or **pnpm**: Package manager

## Installation

### 1. Clone or Copy the Backend

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Generate BIP39 Mnemonic

You need a secure BIP39 mnemonic for HD wallet derivation:

1. Visit: https://iancoleman.io/bip39/
2. Click "Generate" to create a new mnemonic
3. Copy the 12 or 24-word mnemonic
4. Add it to `.env` as `MASTER_MNEMONIC`

⚠️ **IMPORTANT**: Never commit the actual mnemonic to Git. Use environment variables or secrets management.

### 5. Configure Networks

Update the `.env` file with your RPC endpoints and token addresses:

```env
# Ethereum
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ETHEREUM_TOKEN_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7

# BSC
BSC_RPC_URL=https://bsc-dataseed1.binance.org:8545
BSC_TOKEN_ADDRESS=0x55d398326f99059ff775485246999027b3197955

# Polygon
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_TOKEN_ADDRESS=0xc2132d05d31c914a87c6611c10748aeb04b58e8f

# Tron
TRON_RPC_URL=https://api.tronstack.io
TRON_TOKEN_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

### 6. Setup MongoDB

```bash
# Option 1: Local MongoDB
mongod

# Option 2: Docker
docker run -d -p 27017:27017 --name crypto-deposits-mongodb mongo:latest

# Option 3: MongoDB Atlas (Cloud)
# Create a cluster and get connection string
# Update MONGODB_URI in .env
```

### 7. Generate API Key

```bash
# Generate a strong random API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this to your `.env` as `API_KEY`.

## Development

### Build TypeScript

```bash
npm run build
```

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
npm run lint:fix
```

## Production Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Start Server

```bash
npm start
```

### 3. Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "crypto-deposit-backend"

# View logs
pm2 logs crypto-deposit-backend

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### 4. Using Docker

```bash
# Build Docker image
docker build -t crypto-deposit-backend .

# Run container
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name crypto-deposit \
  crypto-deposit-backend

# View logs
docker logs -f crypto-deposit
```

### 5. Environment-Specific Configuration

```bash
# Production
NODE_ENV=production

# Staging
NODE_ENV=staging

# Development
NODE_ENV=development
```

## API Documentation

### Authentication

All API endpoints require an `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key" http://localhost:3001/api/health
```

### Health Check

```bash
GET /api/health

Response:
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

### Generate Deposit Addresses

```bash
POST /api/addresses/generate

Request:
{
  "userId": "user-123",
  "email": "user@example.com",
  "networks": ["ethereum", "bsc", "polygon"]
}

Response:
{
  "success": true,
  "data": {
    "addresses": [
      {
        "network": "ethereum",
        "address": "0x1234...",
        "publicKey": "0x5678...",
        "derivationIndex": 0
      }
    ],
    "user": { ... }
  }
}
```

### Get User Deposit Address

```bash
GET /api/addresses/user-123/ethereum

Response:
{
  "success": true,
  "data": {
    "network": "ethereum",
    "address": "0x1234...",
    "publicKey": "0x5678...",
    "derivationIndex": 0
  }
}
```

### Get All User Addresses

```bash
GET /api/addresses/user-123

Response:
{
  "success": true,
  "data": {
    "ethereum": { ... },
    "bsc": { ... },
    "polygon": { ... }
  }
}
```

### Verify Address Ownership

```bash
POST /api/addresses/verify

Request:
{
  "address": "0x1234...",
  "userId": "user-123",
  "network": "ethereum"
}

Response:
{
  "success": true,
  "data": true
}
```

### Get User Deposits

```bash
GET /api/deposits/user-123?network=ethereum&limit=50&skip=0

Response:
{
  "success": true,
  "data": {
    "deposits": [ ... ],
    "total": 10
  }
}
```

### Get Deposit by Transaction Hash

```bash
GET /api/deposits/tx/0xabcd...

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "user-123",
    "txHash": "0xabcd...",
    "amount": "1000000000000000000",
    "status": "confirmed",
    "confirmations": 15,
    ...
  }
}
```

### Check Confirmation Status

```bash
POST /api/deposits/check-confirmation

Request:
{
  "depositId": "...",
  "txHash": "0xabcd...",
  "network": "ethereum"
}

Response:
{
  "success": true,
  "data": {
    "confirmations": 15,
    "depositId": "..."
  }
}
```

### Get Deposit Statistics

```bash
GET /api/deposits/stats?startDate=2024-01-01&endDate=2024-01-31

Response:
{
  "success": true,
  "data": {
    "totalDeposits": 150,
    "totalAmount": "500000000000000000000",
    "byNetwork": {
      "ethereum": { "count": 50, "amount": "200000..." },
      "bsc": { "count": 100, "amount": "300000..." }
    },
    "byStatus": {
      "confirmed": { "count": 145, "amount": "490000..." },
      "pending": { "count": 5, "amount": "10000..." }
    }
  }
}
```

## Database Models

### User Model

```typescript
{
  _id: ObjectId,
  userId: string,              // Unique identifier
  email: string,               // User email
  walletIndex: number,         // Current derivation index
  depositAddresses: {
    erc20?: {
      address: string,
      publicKey: string,
      derivationIndex: number,
      createdAt: Date
    },
    bep20?: { ... },
    polygon?: { ... },
    trc20?: { ... }
  },
  balances: {
    ethereum?: {
      confirmed: number,       // Wei/smallest unit
      pending: number,
      total: number
    },
    bsc?: { ... },
    polygon?: { ... },
    tron?: { ... }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Deposit Model

```typescript
{
  _id: ObjectId,
  userId: string,
  userEmail: string,
  network: string,             // ethereum, bsc, polygon, tron
  tokenAddress: string,
  tokenSymbol: string,
  tokenDecimals: number,
  txHash: string,              // UNIQUE
  amount: string,              // Wei
  amountUSD: number,
  toAddress: string,
  fromAddress: string,
  confirmations: number,
  requiredConfirmations: number,
  status: string,              // pending, confirmed, failed
  transactionReceipt?: object,
  errorMessage?: string,
  retryCount: number,
  lastRetryAt?: Date,
  createdAt: Date,
  updatedAt: Date,
  confirmedAt?: Date
}
```

## Blockchain Listener Flow

1. **Service Initialization**: Blockchain listener starts when app boots
2. **Block Polling**: Every 30 seconds, check for new blocks
3. **Transfer Detection**: Scan logs for token transfers to registered addresses
4. **Deposit Recording**: Create deposit record for detected transfers
5. **Confirmation Tracking**: Every minute, check confirmations via RPC
6. **Balance Credit**: Once confirmation threshold reached, credit user balance
7. **Storage**: All data persisted in MongoDB

## Confirmation Requirements

- **Ethereum**: 12 confirmations (≈3 minutes)
- **BSC**: 12 confirmations (≈1 minute)
- **Polygon**: 128 confirmations (≈5 minutes)
- **Tron**: 19 confirmations (≈1 minute)

These are configurable via environment variables.

## Security Considerations

### 1. Never Expose Mnemonic

```javascript
// ❌ WRONG: Never do this
const mnemonic = "word1 word2 word3 ..."; // Exposed in code

// ✅ CORRECT: Use environment variables
const mnemonic = process.env.MASTER_MNEMONIC;
```

### 2. Secure Environment Variables

```bash
# Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
# Or use .env files with proper access controls
chmod 600 .env
```

### 3. API Key Management

```bash
# Generate strong API keys
openssl rand -hex 32

# Rotate keys regularly
# Implement key versioning
```

### 4. Rate Limiting

- General endpoints: 100 requests per 15 minutes per IP
- Address generation: 10 requests per hour per user
- Deposit checking: 30 requests per minute

### 5. Input Validation

All inputs are validated using Joi schemas before processing.

### 6. Transaction Verification

- Validate receipt status
- Check transaction didn't revert
- Confirm confirmations before crediting balance
- Prevent double-spending with unique txHash index

## Monitoring & Logging

### Log Files

```
logs/
├── error.log      # Error logs
└── combined.log   # All logs
```

### View Logs

```bash
# Development
npm run dev  # Logs to console and file

# Production
pm2 logs crypto-deposit-backend
```

### Key Log Levels

- `error`: Critical errors requiring attention
- `warn`: Warnings about edge cases
- `info`: General information flow
- `debug`: Detailed debugging information

## Error Handling

All errors follow a consistent response format:

```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "details": [ ... ]
}
```

Common error codes:
- `INVALID_INPUT`: Input validation failed
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_API_KEY`: API key authentication failed
- `SERVICE_ERROR`: Internal service error

## Scheduled Tasks

### 1. Confirmation Checker (Every 1 minute)

```
Checks all pending deposits
Updates confirmation counts
Credits balances when threshold reached
```

### 2. Listener Sync (Every 5 minutes)

```
Synchronizes blockchain listener states
Logs listener health status
Detects stalled listeners
```

## Troubleshooting

### Issue: "MASTER_MNEMONIC not set"

**Solution**: Add `MASTER_MNEMONIC` to `.env` file with a BIP39 mnemonic

### Issue: "Failed to connect to MongoDB"

**Solution**: 
- Check MongoDB is running
- Verify `MONGODB_URI` is correct
- Test connection: `mongo MONGODB_URI`

### Issue: "Invalid RPC response"

**Solution**:
- Verify RPC URL is accessible
- Check rate limits on RPC provider
- Try alternative RPC endpoint

### Issue: Addresses not detecting deposits

**Solution**:
- Ensure user has deposit addresses generated
- Check blockchain listener is running: `GET /api/health`
- Verify token address matches configured address
- Check logs for listener errors

### Issue: High confirmation times

**Solution**:
- Check blockchain network congestion
- Verify `*_CONFIRMATIONS` settings match network
- Monitor gas prices

## Performance Optimization

### 1. Database Indexing

All important fields have indexes:
- `userId`, `email` (User model)
- `txHash` (Deposit model, UNIQUE)
- `network`, `status`, `createdAt` (Deposit model)

### 2. Rate Limiting

Prevents abuse and DDoS attacks.

### 3. Caching

Consider implementing Redis for:
- Address lookups
- Balance caching
- Price feeds

### 4. Batch Processing

For large-scale deployments:
- Batch deposit confirmations
- Batch address generation
- Aggregate statistics queries

## Scaling Considerations

### For High Volume

1. **Database Sharding**: Shard by user ID
2. **Read Replicas**: For analytics queries
3. **Message Queues**: Use RabbitMQ/Kafka for async processing
4. **Caching Layer**: Redis for hot data
5. **Microservices**: Split into separate services per network
6. **Load Balancing**: Multiple API instances with load balancer

### For Multiple Networks

1. **Separate Listeners**: One per network
2. **Network-Specific Configs**: Separate RPC endpoints
3. **Price Feeds**: Network-specific token prices
4. **Gas Strategies**: Network-specific gas optimization

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

Test against testnet:

```bash
# Update .env with testnet RPC URLs
ETHEREUM_RPC_URL=https://goerli.infura.io/v3/...
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 -H "x-api-key: YOUR_KEY" http://localhost:3001/api/health
```

## Support & Documentation

- **TypeScript**: https://www.typescriptlang.org/docs
- **Express**: https://expressjs.com/
- **MongoDB**: https://docs.mongodb.com/
- **ethers.js**: https://docs.ethers.org/
- **TronWeb**: https://developers.tron.network/docs

## License

MIT

## Changelog

### v1.0.0 (2024-01-15)

- Initial release
- Multi-network support
- HD wallet derivation
- Automatic confirmation tracking
- Real-time blockchain listeners
- Comprehensive logging
- API key authentication
- Rate limiting
- Input validation

---

Built with ❤️ for the Andes platform

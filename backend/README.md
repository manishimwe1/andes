# Crypto Deposit Backend README

A **production-ready cryptocurrency deposit system** built with Node.js, Express, TypeScript, and MongoDB. Handles multi-chain deposits across Ethereum, BSC, Polygon, and Tron networks with automatic confirmation tracking and balance management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev

# Server runs on http://localhost:3001
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔗 **Multi-Chain** | Support for Ethereum, BSC, Polygon, Tron |
| 🔑 **HD Wallet** | BIP39 mnemonic-based address derivation |
| 📡 **Auto-Detection** | Real-time transfer detection via event listeners |
| ✅ **Confirmations** | Automatic confirmation tracking and balance crediting |
| 🔒 **Security** | API key auth, rate limiting, input validation |
| 📊 **Logging** | Comprehensive Winston logging system |
| 🎯 **Scalable** | Modular service-based architecture |
| 🛡️ **Error Handling** | Graceful error handling and recovery |

## 📋 Requirements

- **Node.js**: v16+ (v18+ recommended)
- **MongoDB**: v4.4+ (local or cloud)
- **npm/pnpm**: Package manager

## 📦 Installation

### 1. Clone Repository

```bash
git clone <repo-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
- `MASTER_MNEMONIC`: BIP39 mnemonic (generate at https://iancoleman.io/bip39/)
- `API_KEY`: Strong random key
- Network RPC URLs and token addresses
- MongoDB connection string

### 4. Start Server

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## 🏗️ Architecture

```
Request → Middleware → Controller → Service → Model → Database
  ↓         ↓              ↓           ↓        ↓        ↓
Auth    Validation    Business     HD Wallet  Schema  MongoDB
RateLimit Logging      Logic        Blockchain
```

### Key Components

**Services** (Business Logic)
- `AddressGenerationService`: Generate deposit addresses via HD wallet
- `DepositService`: Manage deposit records and balance updates
- `ConfirmationService`: Track transaction confirmations
- `BlockchainListenerService`: Detect incoming transfers

**Models**
- `User`: Stores user deposit addresses and balances
- `Deposit`: Records all deposit transactions

**Controllers**
- `AddressController`: Handle address generation requests
- `DepositController`: Handle deposit queries and status checks

## 🔌 API Endpoints

### Authentication

All endpoints require `x-api-key` header:

```bash
curl -H "x-api-key: your-api-key" http://localhost:3001/api/health
```

### Endpoints

#### Health Check
```
GET /api/health
```

#### Generate Addresses
```
POST /api/addresses/generate
Body: {
  "userId": "user-123",
  "email": "user@example.com",
  "networks": ["ethereum", "bsc", "polygon", "tron"]
}
```

#### Get Address
```
GET /api/addresses/:userId/:network
```

#### Get All Addresses
```
GET /api/addresses/:userId
```

#### Verify Address
```
POST /api/addresses/verify
Body: {
  "address": "0x...",
  "userId": "user-123",
  "network": "ethereum"
}
```

#### Get User Deposits
```
GET /api/deposits/:userId?network=ethereum&limit=50&skip=0
```

#### Get Deposit by Tx Hash
```
GET /api/deposits/tx/:txHash
```

#### Check Confirmation Status
```
POST /api/deposits/check-confirmation
Body: {
  "depositId": "...",
  "txHash": "0x...",
  "network": "ethereum"
}
```

#### Get Statistics
```
GET /api/deposits/stats?startDate=2024-01-01&endDate=2024-01-31
```

#### Get Recent Deposits
```
GET /api/deposits/recent/:network?limit=100
```

#### Get Pending Deposits
```
GET /api/deposits/pending
```

## 📊 Data Models

### User Schema

```typescript
{
  userId: string,              // Unique identifier
  email: string,               // User email
  walletIndex: number,         // Current derivation index
  depositAddresses: {
    erc20?: DepositAddress,
    bep20?: DepositAddress,
    polygon?: DepositAddress,
    trc20?: DepositAddress
  },
  balances: {
    ethereum?: NetworkBalance,
    bsc?: NetworkBalance,
    polygon?: NetworkBalance,
    tron?: NetworkBalance
  }
}
```

### Deposit Schema

```typescript
{
  userId: string,
  userEmail: string,
  network: 'ethereum' | 'bsc' | 'polygon' | 'tron',
  tokenAddress: string,
  txHash: string,              // UNIQUE
  amount: string,              // Wei
  amountUSD: number,
  toAddress: string,
  fromAddress: string,
  confirmations: number,
  requiredConfirmations: number,
  status: 'pending' | 'confirmed' | 'failed',
  transactionReceipt?: object,
  errorMessage?: string,
  retryCount: number
}
```

## 🔐 Security

### Key Practices

1. **Never expose mnemonic in code** - Use environment variables
2. **Secure .env file** - `chmod 600 .env`
3. **Strong API keys** - Use `openssl rand -hex 32`
4. **Rate limiting** - Prevent abuse and DDoS
5. **Input validation** - Joi schema validation
6. **Transaction verification** - Check receipt status before crediting

### Configuration

```env
# Never commit actual values to Git!
MASTER_MNEMONIC=your-mnemonic-here
API_KEY=your-api-key-here
```

## 📝 Development

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
npm run lint:fix
```

### Watch Mode
```bash
npm run dev
```

## 🚀 Production

### Using PM2

```bash
npm run build
pm2 start dist/index.js --name "crypto-deposits"
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t crypto-deposits .
docker run -d -p 3001:3001 --env-file .env crypto-deposits
```

### Environment

```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

## 📈 Monitoring

### Logs

```
logs/
├── error.log      # Errors only
└── combined.log   # All logs
```

### Health Status

```
GET /api/health
→ {
  "success": true,
  "status": "ok",
  "uptime": 3600
}
```

### Listener Status

Monitor blockchain listeners every 5 minutes via cron jobs.

## 🔄 Workflow Example

### User Deposits USDT on Ethereum

1. **User calls**: `POST /api/addresses/generate`
   - Creates user in DB
   - Derives unique address using HD wallet
   - Returns address to user

2. **User sends USDT to address**
   - Transaction broadcast to Ethereum

3. **Listener detects transfer**
   - BlockchainListenerService scans blocks
   - Finds transfer to user's address
   - Creates Deposit record with status=PENDING

4. **Confirmation tracking starts**
   - ConfirmationService checks every minute
   - Updates confirmation count
   - Once threshold (12) reached:
     - Status → CONFIRMED
     - Credits user balance
     - Sets confirmedAt timestamp

5. **User checks balance**
   - Available via `GET /api/deposits/:userId`
   - Balance updated in User.balances.ethereum

## 🔧 Configuration

### Network Confirmation Times

| Network | Confirmations | Time |
|---------|--------------|------|
| Ethereum | 12 | ~3 min |
| BSC | 12 | ~1 min |
| Polygon | 128 | ~5 min |
| Tron | 19 | ~1 min |

### RPC Providers

```env
# Alchemy (Ethereum)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# BSC (Binance node)
BSC_RPC_URL=https://bsc-dataseed1.binance.org:8545

# Polygon (Official)
POLYGON_RPC_URL=https://polygon-rpc.com

# Tron
TRON_RPC_URL=https://api.tronstack.io
```

## 🐛 Troubleshooting

### Server won't start

```bash
# Check logs
npm run dev

# Common issues:
# 1. MongoDB not running
# 2. MASTER_MNEMONIC not set
# 3. Port 3001 already in use
```

### Addresses not detecting deposits

```bash
# 1. Check listener is running
GET /api/health

# 2. Verify token address matches config
# 3. Check blockchain logs
tail -f logs/combined.log | grep listener

# 4. Test address is registered
GET /api/addresses/:userId
```

### Slow confirmation tracking

```bash
# 1. Check MongoDB connection
# 2. Verify RPC provider isn't rate-limited
# 3. Increase CONFIRMATION_CHECK_INTERVAL
```

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed installation and configuration
- [API Reference](./API.md) - Complete API documentation
- [Architecture](./ARCHITECTURE.md) - System design and flow

## 🧪 Testing

### Test Address Generation

```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "email": "test@example.com",
    "networks": ["ethereum", "bsc"]
  }'
```

### Test Health Check

```bash
curl http://localhost:3001/api/health
```

## 📞 Support

For issues or questions:
1. Check logs: `logs/combined.log`
2. Review [SETUP.md](./SETUP.md)
3. Check environment variables
4. Verify MongoDB connection

## 📄 License

MIT

## 🤝 Contributing

1. Create feature branch
2. Write tests
3. Commit changes
4. Push and create PR

---

**Built with ❤️ for the Andes platform**

Version: 1.0.0
Last Updated: 2024-01-15

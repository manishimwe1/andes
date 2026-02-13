# Quick Start Guide - Crypto Deposit Backend

## ⚡ 5-Minute Setup

### 1. Prerequisites
```bash
# Install Node.js v18+
node -v  # Should show v18+

# Install MongoDB (locally or use Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or if MongoDB is already running
mongod
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env
```

Open `.env` and update:
- `MASTER_MNEMONIC`: Get from https://iancoleman.io/bip39/ → Generate
- `API_KEY`: Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- RPC URLs: Use provided public endpoints or your own

### 4. Start Server
```bash
npm run dev
```

Server runs on `http://localhost:3001`

## 🧪 Test It

### Test Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3.5
}
```

### Test Address Generation
```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: your-api-key-from-.env" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "email": "test@example.com",
    "networks": ["ethereum", "bsc", "polygon"]
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "network": "ethereum",
        "address": "0x1234...",
        "publicKey": "0x5678...",
        "derivationIndex": 0
      },
      {
        "network": "bsc",
        "address": "0xabcd...",
        "publicKey": "0xef01...",
        "derivationIndex": 0
      },
      {
        "network": "polygon",
        "address": "0x2345...",
        "publicKey": "0x6789...",
        "derivationIndex": 0
      }
    ],
    "user": { ... }
  }
}
```

### Test Get Address
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3001/api/addresses/test-user-123/ethereum
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration
│   ├── models/              # MongoDB schemas
│   ├── services/            # Business logic (HD wallet, deposits, confirmations)
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, rate limiting, validation
│   ├── routes/              # API endpoints
│   ├── utils/               # Helper functions
│   ├── types/               # TypeScript interfaces
│   └── index.ts             # Main server
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
├── README.md
├── SETUP.md                 # Detailed setup guide
└── ARCHITECTURE.md          # System design
```

## 🔑 Environment Variables

Required:
```env
MASTER_MNEMONIC=word1 word2 word3 ... word12/24
API_KEY=your-random-key-here
MONGODB_URI=mongodb://localhost:27017/crypto-deposits

ETHEREUM_RPC_URL=...
BSC_RPC_URL=...
POLYGON_RPC_URL=...
TRON_RPC_URL=...

ETHEREUM_TOKEN_ADDRESS=...
BSC_TOKEN_ADDRESS=...
POLYGON_TOKEN_ADDRESS=...
TRON_TOKEN_ADDRESS=...
```

Optional:
```env
NODE_ENV=development (or production)
PORT=3001
LOG_LEVEL=info
MASTER_PASSPHRASE=optional-security-passphrase
```

## 🚀 Production Deployment

### Option 1: PM2 (Node.js Process Manager)
```bash
npm run build
npm install -g pm2
pm2 start dist/index.js --name "crypto-deposits"
pm2 save
pm2 startup
```

### Option 2: Docker
```bash
docker build -t crypto-deposits .
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name crypto-deposits \
  crypto-deposits
```

### Option 3: Systemd Service
```bash
# Create /etc/systemd/system/crypto-deposits.service
[Unit]
Description=Crypto Deposit Backend
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/crypto-deposits
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable crypto-deposits
sudo systemctl start crypto-deposits
sudo systemctl status crypto-deposits
```

## 📊 Key Features

✅ **Multi-Chain Support**
- Ethereum, BSC, Polygon, Tron

✅ **HD Wallet Derivation**
- BIP39 mnemonic-based
- Unique address per user per network

✅ **Real-Time Detection**
- Blockchain listeners detect deposits
- Automatic recording in database

✅ **Confirmation Tracking**
- Polls for confirmations every minute
- Configurable confirmation requirements
- Auto-credits balance once confirmed

✅ **Security**
- API key authentication
- Rate limiting
- Input validation
- Mnemonic never exposed

✅ **Production Ready**
- Comprehensive logging (Winston)
- Error handling and recovery
- Proper shutdown handling
- Docker support

## 📚 Documentation

- **README.md**: Overview and features
- **SETUP.md**: Detailed installation and configuration
- **ARCHITECTURE.md**: System design and data flow
- **API.md** (if included): Complete API reference

## 🐛 Troubleshooting

### "MASTER_MNEMONIC not set"
```bash
# Add to .env:
MASTER_MNEMONIC=your-12-or-24-word-mnemonic
```

### "Failed to connect to MongoDB"
```bash
# Check MongoDB is running
mongo --eval "db.version()"

# Or start with Docker
docker run -d -p 27017:27017 mongo:latest
```

### Addresses can't detect deposits
1. Ensure user has generated addresses: `GET /api/addresses/:userId`
2. Check token address in `.env` matches contract
3. Verify network RPC URL is working
4. Test with testnet

### Server won't start
```bash
# Check logs
npm run dev

# Common issues:
# 1. Port 3001 already in use: export PORT=3002
# 2. MongoDB not running: start MongoDB
# 3. Missing .env: cp .env.example .env
```

## 💡 Example Workflow

### Step 1: Generate Address for User
```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "email": "user@example.com",
    "networks": ["ethereum"]
  }'

# Response: {"data": {"addresses": [{"address": "0x1234..."}]}}
```

### Step 2: User Sends USDT to Address (Off-chain)
```
User transfers 100 USDT to 0x1234... on Ethereum
Transaction Hash: 0xabcd1234...
```

### Step 3: System Detects Deposit
```
Blockchain Listener finds transfer
Creates Deposit record with status=PENDING
Starts polling for confirmations
```

### Step 4: Check Status
```bash
curl -H "x-api-key: your-key" \
  http://localhost:3001/api/deposits/user_001

# Response: {
#   success: true,
#   data: {
#     deposits: [{
#       status: "pending/confirmed",
#       confirmations: 5/12,
#       amount: "100000000000000000000"
#     }]
#   }
# }
```

### Step 5: Balance Updated After Confirmations
```
After 12 confirmations (Ethereum):
- Deposit status → CONFIRMED
- User balance credited
- confirmAt timestamp set
```

## 🎯 Next Steps

1. **Review**: Check README.md and SETUP.md
2. **Configure**: Update .env with your keys and RPC URLs
3. **Test**: Run the test commands above
4. **Deploy**: Choose deployment option (PM2, Docker, or Systemd)
5. **Monitor**: Watch logs at `logs/combined.log`

## 📞 Support

- Check logs: `tail -f logs/combined.log`
- Read SETUP.md for detailed configuration
- Review ARCHITECTURE.md for system design
- Test health endpoint: `/api/health`

---

**You're ready to go! 🚀**

Next: Follow the detailed SETUP.md for production configuration.

# Production Server Startup Guide

## ✅ Build Status: COMPLETE

Your crypto deposit backend has been successfully compiled and is ready to run!

## 🚀 Starting the Server

### Step 1: Configure Environment Variables

Edit `.env` file with your actual configuration:

```bash
# Critical Variables (MUST be configured)
MASTER_MNEMONIC="your 12-word bip39 mnemonic"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/db"
RPC_ETHEREUM="https://eth-rpc-url"
RPC_BSC="https://bsc-rpc-url"
RPC_POLYGON="https://polygon-rpc-url"
RPC_TRON="https://tron-rpc-url"
```

### Step 2: Start MongoDB

**Option A: Use MongoDB Atlas (Cloud)** - Recommended
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string (replace `username:password` in .env)
4. Whitelist your IP address

**Option B: Local MongoDB**
```bash
# Windows - Install MongoDB Community:
# https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/

# Start MongoDB
mongod

# Or with Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 3: Start the Server

```bash
# From backend directory
cd c:\Users\USER\Documents\builds\andes\backend

# Start the server
node dist/index.js

# Or with npm
npm start
```

#### Expected Output:
```
[info]: Database connected successfully
[info]: Server listening on port 3001
[info]: Blockchain listeners initialized
[info]: Cron tasks scheduled
```

### Step 4: Test the Server

```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
# {"success":true,"status":"ok","timestamp":"2026-02-11T13:45:00Z"}
```

## 📋 API Endpoints

### Health Check
```
GET /api/health
Response: { success: true, status: "ok" }
```

### Address Generation
```
POST /api/addresses/generate
Headers: { "x-api-key": "your_api_key" }
Body: {
  "userId": "user123",
  "email": "user@example.com",
  "networks": ["ethereum", "bsc", "polygon", "tron"]
}
```

### Get Deposit Addresses
```
GET /api/addresses/:userId
Headers: { "x-api-key": "your_api_key" }
```

### Submit Deposit for Confirmation
```
POST /api/deposits/submit
Headers: { "x-api-key": "your_api_key" }
Body: {
  "userId": "user123",
  "network": "ethereum",
  "transactionHash": "0x...",
  "amount": "1.5"
}
```

## 🔧 Development Server

For development with auto-restart on file changes:

```bash
pnpm run dev
# Requires ts-node-dev (already installed)
```

## 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t andes-backend:latest .

# Run container
docker run -p 3001:3001 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e MASTER_MNEMONIC="..." \
  andes-backend:latest
```

## 📊 Database

MongoDB collections created automatically:
- `users` - User wallet tracking
- `deposits` - Deposit transactions
- `confirmations` - Transaction confirmations
- `audit_logs` - System audit trail

## 🔐 Security Checklist

Before production deployment:

- [ ] Generate secure master mnemonic (BIP39)
- [ ] Store MASTER_MNEMONIC in secure vault/HSM
- [ ] Enable MongoDB authentication
- [ ] Configure CORS properly
- [ ] Set up HTTPS/SSL
- [ ] Use strong API keys
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging
- [ ] Test with testnet first

## 📈 Monitoring

View logs:
```bash
# Check log file
tail -f logs/andes-backend.log

# Or check MongoDB logs
```

## 🆘 Troubleshooting

### Server won't start

**Error: Cannot find module**
```
Solution: Run: pnpm install
```

**Error: MongoDB connection refused**
```
Solution: Start MongoDB on port 27017 or update MONGODB_URI in .env
```

**Error: Port 3001 already in use**
```
Solution: PORT=3002 node dist/index.js
```

### Logs show module errors

```bash
# Rebuild with path alias resolution
pnpm run build
```

## 📞 Support

For issues or questions:
1. Check the error logs displayed in console
2. Verify all .env variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test RPC endpoints are responding

## ✨ Next Steps

1. **Test locally** - Use Testnet addresses first
2. **Monitor** - Set up logging and alerts
3. **Deploy** - Use Docker, Kubernetes, or VM
4. **Scale** - Add load balancing for production
5. **Backup** - Configure MongoDB backups

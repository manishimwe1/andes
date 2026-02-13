# Getting Started: Zero to Production

**Your complete roadmap from nothing to running production crypto deposits**

**Total time: ~2 hours from zero to live**

---

## 📍 Your Journey

```
Phase 1: Understand (15 min)
   ↓
Phase 2: Prepare (20 min)
   ↓
Phase 3: Setup (20 min)
   ↓
Phase 4: Test (15 min)
   ↓
Phase 5: Deploy (30 min)
   ↓
Phase 6: Monitor (10 min)
```

---

## Phase 1: Understand (15 minutes)

### What You're Building

A backend that:
- Generates unique wallet addresses for users
- Detects when users send USDT to those addresses
- Tracks blockchain confirmations
- Credits user balances when confirmed

### The Big Picture

```
User Account
   ↓
Address Generated (0x123...)
   ↓
User Sends USDT
   ↓
Backend Detects (auto, every 30 sec)
   ↓
Balance Pending (tracked)
   ↓
Confirmations Received (checked every 1 min)
   ↓
Balance Confirmed
   ↓
Ready to Withdraw
```

### Key Technology Stack

- **Node.js** - Server runtime
- **Express** - HTTP server
- **MongoDB** - Database
- **ethers.js & TronWeb** - Blockchain interaction
- **TypeScript** - Code safety

### Security Model

- Your seed phrase stored in environment only
- Each user gets unique addresses (via HD wallet)
- Blockchain prevents double-spending
- Database transactions prevent double-crediting
- API keys control access

---

## Phase 2: Prepare (20 minutes)

### Step 1: Prerequisites (5 min)

Check you have installed:

```bash
# Node.js (need v16 or higher)
node -v

# npm (comes with Node)
npm -v

# MongoDB (local or use cloud)
mongo --version
# OR skip this, use MongoDB Atlas (cloud)
```

**Don't have them?**
- Node.js: https://nodejs.org (get LTS)
- MongoDB: https://www.mongodb.com/try/download/community
- OR MongoDB Atlas (free cloud): https://www.mongodb.com/cloud/atlas

### Step 2: Secure Environment Setup (10 min)

#### 2a: BIP39 Seed Phrase

Go to: https://iancoleman.io/bip39/

1. Click "Generate" button
2. You'll get a random 12-word phrase
3. **DO NOT share this**
4. **Save it in password manager** (1Password, LastPass, Bitwarden)
5. Example phrase (don't use this!):
   ```
   abandon ability able about above abuse access accident account accuse achieve acid
   ```

#### 2b: API Key

Run this command in terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (looks like `a1b2c3d4e5f6...`).

**Save it in password manager** alongside your seed.

### Step 3: Credentials File (5 min)

Create a file called `credentials.txt` (keep safe):

```
MASTER_MNEMONIC: [Your 12 word phrase]
API_KEY: [Your random string from above]
MONGODB_URI: mongodb://localhost:27017/crypto-deposits
  OR
MONGODB_ATLAS_URI: mongodb+srv://user:pass@cluster.mongodb.net/crypto-deposits
```

**NEVER commit this to Git!**

---

## Phase 3: Setup (20 minutes)

### Step 1: Get the Code

If you don't have it yet:

```bash
# Clone or download the project
cd c:\Users\USER\Documents\builds\andes\backend
```

### Step 2: Install Dependencies (5 min)

```bash
npm install
```

This downloads all required packages. Takes 2-5 minutes depending on internet.

### Step 3: Create Environment File (5 min)

```bash
# Copy template
cp .env.example .env

# Open and edit
nano .env
# or on Windows: notepad .env
```

Fill in these REQUIRED values:

```env
# Paste your seed phrase
MASTER_MNEMONIC=word1 word2 word3 ... word12

# Paste your API key
API_KEY=your-random-32-byte-string

# Your database
MONGODB_URI=mongodb://localhost:27017/crypto-deposits
# or if using MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crypto-deposits

# At least ONE RPC URL (Ethereum minimum):
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
# or https://mainnet.infura.io/v3/YOUR_INFURA_KEY
# or https://rpc.quicknode.pro/solana
```

Optional (good defaults exist):
```env
# These have defaults, only change if needed:
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
```

### Step 4: Verify Configuration (5 min)

```bash
# Test that MongoDB is accessible
mongo --eval "db.version()"

# or if using Atlas, skip this, we'll test it in Phase 4
```

---

## Phase 4: Test (15 minutes)

### Step 1: Start Server (2 min)

```bash
npm run dev
```

You should see:
```
📦 Loading environment variables...
🔗 Connecting to MongoDB...
✅ Connected to MongoDB!
🚀 Server running on port 3001
🎧 Listening for address generation requests...
🔍 Blockchain listeners started
✅ Confirmation checker started
```

**If you see errors**: Go to [Troubleshooting](#troubleshooting-guide) below.

### Step 2: Health Check (2 min)

Open new terminal tab/window:

```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{"success":true,"status":"ok",...}
```

### Step 3: Generate Test Address (5 min)

```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-001",
    "email": "test@example.com",
    "networks": ["ethereum"]
  }'
```

Replace `YOUR_API_KEY` with the key from your .env file.

You should get back:
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "network": "ethereum",
        "address": "0x7a5c3476...",
        ...
      }
    ]
  }
}
```

**Save that address!** This is where test deposits go.

### Step 4: Verify in Database (3 min)

```bash
mongo crypto-deposits
```

In the shell:
```js
db.users.findOne({userId: "test-user-001"})
```

Should show your user with address generated.

### Step 5: Check Logs (3 min)

```bash
tail logs/combined.log
```

Should show:
```
[INFO] Server running on port 3001
[INFO] Connected to MongoDB
[INFO] Starting blockchain listeners...
[INFO] User test-user-001 created
[INFO] Address generated for ethereum
```

---

## Phase 5: Deploy (30 minutes)

### Pick One Deployment Method

#### Option A: Docker (Recommended - 10 min)

```bash
# Build image
docker build -t crypto-deposits:1.0.0 .

# Run
docker run -d \
  -p 3001:3001 \
  --name crypto-deposits \
  --env-file .env \
  crypto-deposits:1.0.0

# Check it's running
docker logs crypto-deposits

# Test health
curl http://localhost:3001/api/health
```

#### Option B: PM2 (Simple - 5 min)

```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start
pm2 start dist/index.js --instances 2 --name crypto-deposits

# View status
pm2 status

# Auto-start on reboot
pm2 startup
pm2 save

# View logs
pm2 logs crypto-deposits
```

#### Option C: Simple Node (2 min)

```bash
npm run build
node dist/index.js
```

### On Production Server

1. **Setup server** (Linux recommended)
   - Ubuntu 20.04 LTS or similar
   - 2+ CPU cores
   - 2+ GB RAM
   - 20+ GB disk

2. **Install Node**
   ```bash
   curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install nodejs
   ```

3. **Install MongoDB** (or use Atlas)
   ```bash
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   ```

4. **Deploy application**
   ```bash
   git clone your-repo
   cd crypto-deposits
   npm install
   cp .env.example .env
   # Edit .env with production values
   npm run build
   # Use PM2, Docker, or Systemd
   ```

5. **Setup HTTPS** (required for production)
   - Use Nginx as reverse proxy
   - Get SSL from Let's Encrypt
   - Route traffic through Nginx to localhost:3001

---

## Phase 6: Monitor (10 minutes)

### Setup Daily Monitoring

**Morning checklist** (5 min):

```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Check logs for errors
tail -50 logs/error.log

# 3. Count deposits
mongo crypto-deposits -e "db.deposits.count()"

# 4. Check for hung listeners
grep "Polling network" logs/combined.log | tail -5
```

**If service down**:

```bash
# Restart
npm run dev  # or pm2 restart crypto-deposits

# Check logs
tail -f logs/error.log
```

### Alerts to Setup

Configure alerts for:
- Service not responding (check every 5 min)
- Error rate > 1% (check every hour)
- Database connection lost
- RPC provider rate limited

Example alert (with Healthchecks.io):

```bash
# Add to crontab (runs every 5 minutes)
*/5 * * * * curl -f http://localhost:3001/api/health || curl https://hc-ping.com/YOUR_UUID
```

---

## 📊 Real Deposit Flow

After deployment, here's what happens:

### User deposits 100 USDT:

```
1. Application generates address: 0x7a5c...
   └─ User gets address displayed

2. User sends USDT to 0x7a5c... (on blockchain)
   └─ Transaction broadcast

3. Backend listener detects (every 30 seconds)
   └─ Records deposit with status: pending

4. Application queries: GET /api/deposits/user-001
   └─ Shows pending deposit, 0 confirmations

5. Backend confirms (every 1 minute)
   └─ Checks blockchain for confirmations

6. After 12 confirmations (Ethereum)
   └─ Status changes to: confirmed
   └─ Balance credited
   └─ User can withdraw

Total time: 2-3 minutes (depends on network)
```

---

## <a name="troubleshooting-guide"></a>🐛 Troubleshooting Guide

### Problem: "Cannot find module 'express'"

**Solution**:
```bash
# npm install didn't complete?
rm -rf node_modules package-lock.json
npm install
```

### Problem: "MASTER_MNEMONIC not found"

**Solution**:
```bash
# Check .env exists
ls -la .env

# Check it has value
grep MASTER_MNEMONIC .env

# If empty, edit it
nano .env
# Add your 12-word seed
```

### Problem: "Cannot connect to MongoDB"

**Solution**:
```bash
# If local, check MongoDB is running
mongo --eval "db.version()"

# If using Atlas, check connection string has password
grep MONGODB_URI .env
# Should look like:
# mongodb+srv://user:PASSWORD@cluster.mongodb.net/db

# Test connection
mongo "mongodb+srv://user:password@cluster.mongodb.net/db"
```

### Problem: Server starts but endpoints return 404

**Solution**:
```bash
# Rebuild TypeScript
npm run build

# Check dist/ folder exists
ls -la dist/

# Restart server
npm run dev
```

### Problem: Health check fails after 5 minutes

**Solution**:
```bash
# Database connection lost?
tail -f logs/error.log

# Restart MongoDB
sudo systemctl restart mongodb

# Restart app
npm run dev
```

### Problem: "Request rate limited"

**Solution**:
- You're making >100 requests per 15 minutes
- This is by design (security)
- Spread requests over time

### Problem: "RPC URL failed"

**Solution**:
```bash
# Test RPC directly
curl https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Use different RPC provider
# Alchemy: alchemy.com
# Infura: infura.io
# QuickNode: quicknode.com
```

### Problem: "No deposits detected"

**Solution**:

Check blockchain listener is running:
```bash
grep "Polling network" logs/combined.log | tail -5
```

Should see updates every 30 seconds.

If not:
```bash
# Restart app
npm run dev

# Check listener started
sleep 30
grep "started" logs/combined.log
```

---

## ✅ Completion Checklist

You're done when:

- [ ] Seed phrase generated and backed up
- [ ] API key generated and saved
- [ ] .env file created with all values
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Test address generated successfully
- [ ] Address visible in MongoDB
- [ ] Server logs show no errors
- [ ] Decided on deployment method
- [ ] Application deployed
- [ ] Health check working on deployed server
- [ ] Monitoring setup
- [ ] Team trained
- [ ] Ready for users!

---

## 📚 Next Steps

1. **Read [QUICKSTART.md](./QUICKSTART.md)** for detailed 5-minute guide
2. **Read [API_REFERENCE.md](./API_REFERENCE.md)** to integrate in your app
3. **Read [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** before going live
4. **Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** for deployment details

---

## 🎓 Learning Resources

| Topic | Resource | Time |
|-------|----------|------|
| Node.js | https://nodejs.org/docs/ | 1 hour |
| MongoDB | https://docs.mongodb.com/manual/ | 2 hours |
| Express | https://expressjs.com/ | 1 hour |
| Blockchain | https://ethereum.org/developers | 2 hours |
| Our System | [ARCHITECTURE.md](./ARCHITECTURE.md) | 30 min |

---

## 💡 Pro Tips

1. **Always have 2 terminals open**
   - Terminal 1: `npm run dev` (server)
   - Terminal 2: For running tests/commands

2. **Check logs first on any issue**
   ```bash
   tail -f logs/error.log
   ```

3. **Keep .env file secure**
   - Never commit to Git
   - Only share credentials via secure channel
   - Use password manager

4. **Test everything before production**
   - Generate addresses
   - Send test deposits
   - Verify confirmations work
   - Check database has records

5. **Monitor continuously**
   - Check health endpoint
   - Watch error logs
   - Monitor database size
   - Check RPC provider status

---

## 🆘 Get Help

1. **Read docs**: Start with [QUICKSTART.md](./QUICKSTART.md)
2. **Check logs**: `tail logs/error.log`
3. **Verify config**: `echo $MASTER_MNEMONIC` should show words
4. **Test health**: `curl http://localhost:3001/api/health`
5. **Ask for help**: Include error message + what you did

---

## 🎉 Congratulations!

You've deployed a production-ready cryptocurrency deposit backend!

What you can now do:
- ✅ Accept deposits on 4 major blockchains
- ✅ Generate infinite unique addresses
- ✅ Automatically detect deposits
- ✅ Track confirmations
- ✅ Credit user balances
- ✅ Scale to thousands of users

**Next milestone**: Integrate with your main application!

See [API_REFERENCE.md](./API_REFERENCE.md) for complete API docs.

---

**Status**: ✅ Complete  
**Version**: 1.0.0  
**Last Updated**: February 11, 2026

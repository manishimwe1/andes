# Quick Reference Card

**Print this and keep it handy!**

---

## 🚀 Start Server (Development)

```bash
npm install        # Install dependencies (first time only)
npm run dev        # Start development server
```

Open browser: http://localhost:3001/api/health

---

## 🧪 Test Endpoints (Copy & Paste)

Replace `YOUR_API_KEY` with your actual API key from .env

### Health Check (No Auth)
```bash
curl http://localhost:3001/api/health
```

### Generate Addresses
```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "email": "test@example.com", "networks": ["ethereum"]}'
```

### Get All Addresses
```bash
curl http://localhost:3001/api/addresses/test-user \
  -H "x-api-key: YOUR_API_KEY"
```

### Get Deposits
```bash
curl "http://localhost:3001/api/deposits/test-user?limit=10" \
  -H "x-api-key: YOUR_API_KEY"
```

### Get Statistics
```bash
curl http://localhost:3001/api/deposits/stats \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 🗝️ Key Configuration Values

**In .env file**:
```env
# REQUIRED - Do not skip
MASTER_MNEMONIC=word1 word2 word3 ... word12
API_KEY=your-32-byte-random-key

# REQUIRED - At least one (Ethereum is minimum)
ETHEREUM_RPC_URL=https://...
BSC_RPC_URL=https://...
POLYGON_RPC_URL=https://...
TRON_RPC_URL=https://...

# Database
MONGODB_URI=mongodb://localhost:27017/crypto-deposits

# Optional - defaults fine for dev
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
```

---

## 📊 Generate Random Values

### Generate BIP39 Mnemonic (Pick a wallet)
Visit: https://iancoleman.io/bip39/#english

### Generate 32-byte API Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📁 File Locations & Logs

```bash
# View logs (most important)
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Clear logs
rm logs/*.log

# Source code
src/index.ts                      # Main server
src/services/*.ts                 # Business logic
src/controllers/*.ts              # HTTP handlers
src/utils/*.ts                    # Helper functions
```

---

## 🔍 Database Queries

```bash
# Connect to MongoDB
mongo crypto-deposits

# View collections
show collections

# View users
db.users.find().pretty()

# View deposits
db.deposits.find().pretty()

# Check specific user
db.users.findOne({userId: "test-user"})

# Count deposits
db.deposits.count()

# Find pending deposits
db.deposits.find({status: "pending"})

# View indexes
db.deposits.getIndexes()
```

---

## 🚢 Deployment (3 Easy Ways)

### Option 1: Docker
```bash
docker build -t crypto-deposits .
docker run -d -p 3001:3001 --env-file .env crypto-deposits
```

### Option 2: PM2
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --instances 2
```

### Option 3: Node (Simple)
```bash
npm install
npm run build
node dist/index.js
```

---

## 🐛 Debug Checklist

If something breaks:

1. **Check logs first**
   ```bash
   tail -f logs/error.log
   ```

2. **Verify .env file**
   ```bash
   echo $MASTER_MNEMONIC        # Should have 12 words
   echo $API_KEY                # Should exist
   echo $MONGODB_URI            # Should be set
   ```

3. **Test MongoDB**
   ```bash
   mongo --eval "db.version()"  # Should show version
   ```

4. **Test RPC URL**
   ```bash
   curl https://your-rpc-url -X POST \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

5. **Restart server**
   ```bash
   npm run dev      # Ctrl+C to stop, then restart
   ```

---

## 📈 Monitoring (Watch These!)

**Health Endpoint** (should be 200 OK)
```bash
watch -n 5 'curl -s http://localhost:3001/api/health | jq .'
```

**Error Rate** (should be ~0)
```bash
tail -f logs/error.log | grep "ERROR"
```

**Deposits Created** (monitor in real-time)
```bash
watch -n 10 'mongo crypto-deposits -e "db.deposits.count()"'
```

**Listener Status** (check polling)
```bash
tail -f logs/combined.log | grep "Polling network"
```

---

## ⚡ Common Commands

```bash
# Build TypeScript
npm run build

# Run TypeScript compiler check (no emit)
npx tsc --noEmit

# Clean build artifacts
rm -rf dist/

# Check for security issues
npm audit

# Install specific version
npm install express@4.18.2

# See what's installed
npm ls

# View package info
npm info express

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

---

## 🔑 Environment Variables Reference

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| MASTER_MNEMONIC | word1 word2 ... | ✅ | BIP39 12 or 24 words |
| API_KEY | abc123def456... | ✅ | 32+ bytes random |
| MONGODB_URI | mongodb://localhost | ✅ | Local or Atlas |
| ETHEREUM_RPC_URL | https://eth-mainnet... | ⚠️ | At least one RPC |
| NODE_ENV | development | ⭕ | Default: development |
| PORT | 3001 | ⭕ | Default: 3001 |
| LOG_LEVEL | info | ⭕ | Default: info |

✅ = Required  
⚠️ = At least one required  
⭕ = Optional (has default)

---

## 🌐 Blockchain Networks Supported

| Network | Token Type | Confirmations | Block Time | Status |
|---------|-----------|----------------|-----------|--------|
| Ethereum | ERC20 | 12 | ~12s | ✅ Supported |
| BSC | BEP20 | 12 | ~3s | ✅ Supported |
| Polygon | ERC20 | 128 | ~2s | ✅ Supported |
| Tron | TRC20 | 19 | ~3s | ✅ Supported |

---

## 📞 Quick Links

| Need | Link | Read Time |
|------|------|-----------|
| Get Running in 5 min | [QUICKSTART.md](./QUICKSTART.md) | 5 min |
| Full Configuration | [SETUP.md](./SETUP.md) | 40 min |
| Deploy to Production | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | 20 min |
| API Documentation | [API_REFERENCE.md](./API_REFERENCE.md) | 20 min |
| System Architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) | 25 min |
| Pre-Launch Checklist | [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | 30 min |
| All Files Listed | [FILE_LISTING.md](./FILE_LISTING.md) | 5 min |

---

## ✅ Deployment Checklist (TL;DR)

- [ ] .env file filled with all required values
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Test address generates successfully
- [ ] MongoDB has users and deposits collections
- [ ] Logs show no errors
- [ ] Rate limiting tested
- [ ] Ready for production!

---

## 🎁 Useful Resources (External)

- BIP39 Tool: https://iancoleman.io/bip39/
- Ethereum Explorer: https://etherscan.io/
- BSC Explorer: https://bscscan.com/
- Polygon Explorer: https://polygonscan.com/
- Tron Explorer: https://tronscan.org/
- ethers.js Docs: https://docs.ethers.org/
- Express Docs: https://expressjs.com/
- MongoDB Shell: https://www.mongodb.com/docs/mongodb-shell/

---

## 💡 Pro Tips

1. **Always load .env before running**
   ```bash
   source .env  # On Mac/Linux
   set /p <.env  # On Windows
   ```

2. **Use proper RPC providers**
   - Alchemy (alchemy.com)
   - Infura (infura.io)
   - QuickNode (quicknode.com)
   - Prevents rate limiting

3. **Monitor RPC rate limits**
   - Most free tiers: 100-300 req/sec
   - At scale, consider premium

4. **Keep backups of**
   - MASTER_MNEMONIC
   - API_KEY
   - MongoDB database (daily)

5. **Never commit .env file**
   - It's already in .gitignore
   - Double-check before pushing

---

## 🆘 Emergency Commands

**Server crashed? Restart:**
```bash
npm run dev
```

**MongoDB not responding? Check:**
```bash
mongo --eval "db.version()"
```

**Port already in use? Kill it:**
```bash
# Find process on port 3001
lsof -i :3001
# Kill it
kill -9 <PID>
```

**Out of disk space?**
```bash
# Check usage
df -h
# Clean old logs
rm logs/*.log
```

---

## 📋 Daily Operations

**Morning: Check Health**
```bash
curl http://localhost:3001/api/health
```

**Mid-day: Monitor Deposits**
```bash
mongo crypto-deposits -e "db.deposits.count()"
```

**Evening: Review Errors**
```bash
tail logs/error.log | wc -l
```

**Weekly: Backup Database**
```bash
mongodump --uri "mongodb://localhost:27017/crypto-deposits" --out ./backup-$(date +%Y-%m-%d)
```

---

## Version Info

```bash
# Check Node version (need 16+)
node -v

# Check npm version
npm -v

# Check MongoDB version
mongo --version

# Check Docker version
docker --version
```

---

**Print this page and save it!** →

Refer to full docs when you need more details.

Updated: February 11, 2026  
Version: 1.0.0

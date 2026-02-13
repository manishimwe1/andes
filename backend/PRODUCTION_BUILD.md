# 🚀 Production Build & Deployment Guide

**Crypto Deposit Backend - Build to Production in 30 Minutes**

**Status**: ✅ Ready to Build  
**Version**: 1.0.0  
**Date**: February 11, 2026

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd c:\Users\USER\Documents\builds\andes\backend
npm install
```

**What happens**: Downloads and installs all 40+ packages (takes 2-5 minutes)

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
# CRITICAL - MUST HAVE
MASTER_MNEMONIC=word1 word2 word3 ... word12
API_KEY=your-32-byte-random-key
MONGODB_URI=mongodb://localhost:27017/crypto-deposits

# At least one RPC (Ethereum is minimum)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Step 3: Build for Production

```bash
npm run build
```

**Result**: `dist/` folder with compiled JavaScript

### Step 4: Verify Build

```bash
ls -la dist/
# Should show: index.js and other compiled files
```

---

## 🔨 Build Pipeline

### Development Build
```bash
npm run build
# Compiles TypeScript to JavaScript in dist/
# Sourcemaps included for debugging
```

### Production Build (Optimized)
```bash
npm run build
# Same as above - TypeScript does tree-shaking
# Ready for production immediately
```

### Watch Mode (During Development)
```bash
npm run watch
# Automatically rebuilds when files change
```

---

## ✅ Pre-Build Checklist

Before building, verify:

- [ ] **Node.js 16+** installed (`node -v`)
- [ ] **npm** available (`npm -v`)
- [ ] **.env file** created with all required values
- [ ] **MASTER_MNEMONIC** is valid 12-24 word phrase
- [ ] **API_KEY** is 32+ byte random string
- [ ] **MONGODB_URI** is correct

### Verify Prerequisites

```bash
# Check Node.js version
node -v         # Must be v16+

# Check npm version
npm -v          # Any recent version

# Check .env exists
test -f .env && echo "✓ .env exists" || echo "✗ .env missing"

# Check MASTER_MNEMONIC is set
grep MASTER_MNEMONIC .env | head -c 50
```

---

## 📦 Complete Build Process

### 1. Clean (Optional)
```bash
# Remove previous build artifacts
npm run clean
# or manually
rm -rf dist/
```

### 2. Install Dependencies
```bash
npm install
# or update existing
npm install --save
```

### 3. Verify TypeScript
```bash
# Check for TypeScript errors without compiling
npx tsc --noEmit
```

### 4. Build
```bash
npm run build
# Compiles src/ → dist/
```

### 5. Verify Build Output
```bash
# Check dist folder
ls -la dist/

# Verify main file exists
test -f dist/index.js && echo "✓ Build successful" || echo "✗ Build failed"

# Check file size (should be ~1-2MB)
wc -c dist/index.js
```

### 6. Test Compilation
```bash
# Verify it's valid JavaScript
node -c dist/index.js
```

---

## 🚀 Run Production Server

### Option 1: Node (Direct)
```bash
# Start production server
node dist/index.js
```

### Option 2: PM2 (Recommended)
```bash
# Install PM2 globally (once)
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "crypto-deposits" --instances 2

# View status
pm2 status

# View logs
pm2 logs crypto-deposits

# Stop
pm2 stop crypto-deposits

# Restart
pm2 restart crypto-deposits
```

### Option 3: Docker
```bash
# Build Docker image
docker build -t crypto-deposits:1.0.0 .

# Run container
docker run -d \
  -p 3001:3001 \
  --name crypto-deposits \
  --env-file .env \
  crypto-deposits:1.0.0

# View logs
docker logs -f crypto-deposits

# Stop
docker stop crypto-deposits
```

---

## 🔍 Verify Production Build

After starting the server:

### Health Check
```bash
curl http://localhost:3001/api/health
```

**Expected response**:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-02-11T...",
  "uptime": 3.45
}
```

### Check Server Logs
```bash
# If running in terminal
# Should show: "Server running on port 3001"

# If using PM2
pm2 logs crypto-deposits

# If using Docker
docker logs crypto-deposits

# Check local log files
tail logs/combined.log
tail logs/error.log
```

### Test API Endpoint
```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "email": "test@example.com",
    "networks": ["ethereum"]
  }'
```

---

## 📋 Build Troubleshooting

### Problem: "Cannot find module 'express'"

**Solution**: Dependencies not installed
```bash
npm install
npm run build
```

### Problem: "TypeScript compilation error"

**Solution**: Check TypeScript errors
```bash
npx tsc --noEmit
# Shows all errors before building
```

### Problem: "Permission denied" (on Linux/Mac)

**Solution**: Grant execute permission
```bash
chmod +x dist/index.js
```

### Problem: "Port 3001 already in use"

**Solution**: Kill existing process
```bash
# Find process
lsof -i :3001

# Kill it
kill -9 <PID>

# Or use different port
PORT=3002 node dist/index.js
```

### Problem: "Cannot read MONGODB_URI"

**Solution**: Environment variable not loaded
```bash
# Verify .env exists
cat .env | grep MONGODB_URI

# Make sure it's not quoted
# ✓ MONGODB_URI=mongodb://...
# ✗ MONGODB_URI="mongodb://..."
```

---

## 📊 Build Output Structure

After successful build, you'll have:

```
dist/
├── index.js                        # Main application (compiled)
├── config/
│   ├── logger.js
│   ├── database.js
│   ├── blockchain.js
│   └── index.js
├── models/
│   ├── User.js
│   ├── Deposit.js
│   └── index.js
├── services/
│   ├── AddressGenerationService.js
│   ├── DepositService.js
│   ├── ConfirmationService.js
│   ├── BlockchainListenerService.js
│   └── index.js
├── controllers/
│   ├── AddressController.js
│   ├── DepositController.js
│   └── index.js
├── middleware/
│   ├── authMiddleware.js
│   ├── rateLimitMiddleware.js
│   ├── validationMiddleware.js
│   └── index.js
├── routes/
│   ├── addresses.js
│   ├── deposits.js
│   ├── health.js
│   └── index.js
├── types/
│   ├── index.js
│   ├── api.js
│   ├── transaction.js
│   ├── user.js
│   └── network.js
└── utils/
    ├── hdWallet.js
    ├── blockchain.js
    ├── helpers.js
    └── index.js
```

---

## 🔐 Production Best Practices

### Before Deploying

- [ ] `.env` file is NOT in Git (check .gitignore)
- [ ] All required env variables are set
- [ ] MASTER_MNEMONIC is backed up securely
- [ ] API_KEY is strong (32+ bytes)
- [ ] MongoDB backups are enabled
- [ ] HTTPS/SSL is configured (reverse proxy)
- [ ] Firewall restricts to necessary ports only

### After Building

- [ ] Verify health endpoint works
- [ ] Check logs for errors
- [ ] Test with sample API call
- [ ] Monitor memory usage
- [ ] Monitor error logs
- [ ] Setup alerting

### Security Checklist

- [ ] Mnemonic never logged
- [ ] API key never logged
- [ ] Database password not exposed
- [ ] RPC URLs not in logs
- [ ] Error messages don't expose internals
- [ ] All endpoints require authentication
- [ ] Rate limiting is active

---

## 📈 Performance Tuning

### Environment Variables for Performance

```env
# Increase Node.js memory (if needed)
NODE_OPTIONS=--max-old-space-size=2048

# Optimize logging
LOG_LEVEL=warn  # Reduce logs in production

# Tune confirmation checking
CONFIRMATION_CHECK_INTERVAL=60000  # 1 minute

# Tune blockchain listener
BLOCKCHAIN_LISTENER_INTERVAL=30000  # 30 seconds
```

### PM2 Optimization

```bash
pm2 start dist/index.js \
  --name "crypto-deposits" \
  --instances 4 \
  --exec-mode cluster \
  --max-memory-restart 1G \
  --watch /path/to/src
```

---

## 🔄 Continuous Deployment

### Simple CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v2
        with:
          name: dist
          path: dist/
```

---

## 📝 Build Command Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript |
| `npm run dev` | Start in development mode |
| `npm run start` | Run compiled JavaScript |
| `npm run watch` | Watch for changes (dev) |
| `npm run clean` | Remove build artifacts |

---

## ✅ Final Checklist Before Production

### Pre-Build
- [ ] All required env variables set
- [ ] MongoDB running and accessible
- [ ] RPC URLs working
- [ ] Node.js 16+ installed

### Build
- [ ] `npm install` completed
- [ ] `npm run build` succeeded
- [ ] No TypeScript errors
- [ ] `dist/` folder created

### Post-Build
- [ ] Health endpoint responds
- [ ] API endpoints work
- [ ] Logs look clean
- [ ] Memory usage acceptable
- [ ] No error messages

### Pre-Launch
- [ ] Complete [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
- [ ] All checkboxes verified
- [ ] Ready to serve traffic

---

## 🚀 Deploy to Production

Once build is verified:

### Option 1: Docker (Recommended)
```bash
docker build -t crypto-deposits:1.0.0 .
docker run -d -p 3001:3001 --env-file .env crypto-deposits:1.0.0
```

### Option 2: PM2
```bash
pm2 start dist/index.js --instances 2
pm2 startup
pm2 save
```

### Option 3: Manual
```bash
nohup node dist/index.js > server.log 2>&1 &
```

---

## 📊 Monitoring Production Build

### Check Health
```bash
curl http://localhost:3001/api/health
```

### Monitor Logs
```bash
# Combined log
tail -f logs/combined.log

# Errors only
tail -f logs/error.log

# Count errors
grep -c ERROR logs/error.log
```

### Monitor Database
```bash
mongo crypto-deposits -e "db.deposits.count()"
```

### Monitor Process
```bash
# CPU and memory usage
ps aux | grep node

# With PM2
pm2 monit
```

---

## 🎉 You're Ready!

**Your production build is ready to deploy.**

**Next steps:**

1. ✅ Run: `npm install` 
2. ✅ Run: `npm run build`
3. ✅ Choose deployment option (Docker/PM2/Direct)
4. ✅ Start server
5. ✅ Verify health endpoint
6. ✅ Monitor logs

---

## 📞 Quick Help

**Build failed?** → Check errors: `npx tsc --noEmit`

**Server won't start?** → Check logs: `tail logs/error.log`

**Port in use?** → Kill process: `lsof -i :3001; kill -9 PID`

**Database error?** → Verify connection: `mongo --eval "db.version()"`

---

**Status**: ✅ Ready to Build  
**Time to Production**: 30 minutes  
**Difficulty**: Easy  

**Now build it:** `npm install && npm run build` 🚀

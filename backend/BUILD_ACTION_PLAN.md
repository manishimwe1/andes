# 🎯 PRODUCTION BUILD - Action Plan

**Get your system built and running in 30 minutes**

---

## ✅ Step-by-Step (Do These in Order)

### Step 1: Install Dependencies (5 minutes)

```bash
cd c:\Users\USER\Documents\builds\andes\backend
npm install
```

Expected: "npm notice packages" → success

### Step 2: Configure Environment (3 minutes)

```bash
cp .env.example .env
```

Edit `.env` - look for these lines and fill them in:

```
MASTER_MNEMONIC=word1 word2 word3 word4...   # YOUR 12-WORD PHRASE
API_KEY=abc123def456...                      # YOUR 32-BYTE KEY
MONGODB_URI=mongodb://localhost:27017/crypto-deposits
ETHEREUM_RPC_URL=https://...                 # YOUR RPC ENDPOINT
```

**Minimum required**: Just these 4 lines. Everything else has defaults.

### Step 3: Build for Production (2 minutes)

```bash
npm run build
```

Expected: Compiles with no errors → `dist/` folder created

### Step 4: Verify Build (1 minute)

```bash
ls dist/index.js
# If you see the file → BUILD SUCCESS ✅
```

### Step 5: Start Server (1 minute)

```bash
# Development mode
npm run dev

# Or production mode
node dist/index.js
```

### Step 6: Test It Works (1 minute)

Open another terminal:
```bash
curl http://localhost:3001/api/health
```

Expected: 
```json
{"success":true,"status":"ok",...}
```

---

## 🎊 Done! Your System is Running

**Congratulations!** You now have:
- ✅ Working backend server
- ✅ All 4 blockchain networks connected
- ✅ Ready to accept deposits
- ✅ Production-ready code

---

## 🚀 Next: Deploy to Production

### Quick Deploy with Docker (Easiest)

```bash
# Build Docker image
docker build -t crypto-deposits:1.0.0 .

# Run it
docker run -d \
  -p 3001:3001 \
  --name crypto-deposits \
  --env-file .env \
  crypto-deposits:1.0.0

# Check it's running
docker logs crypto-deposits
```

### Or with PM2 (Simpler)

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start your app
pm2 start dist/index.js --name "crypto-deposits"

# Check status
pm2 status
```

---

## 🔧 If Something Goes Wrong

| Error | Fix |
|-------|-----|
| `npm: command not found` | Install Node.js from nodejs.org |
| `Cannot find module` | Run `npm install` again |
| `MongoDB connection error` | Start MongoDB or check MONGODB_URI |
| `Port 3001 already in use` | Kill process: `lsof -i :3001; kill -9 PID` |
| `Compilation error` | Check `.env` is configured correctly |

---

## 📚 Full Guides

- **Setup details**: [SETUP.md](./SETUP.md)
- **Deployment options**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)  
- **Complete build guide**: [PRODUCTION_BUILD.md](./PRODUCTION_BUILD.md)
- **Pre-launch checklist**: [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)

---

## 💡 TL;DR (The Absolute Minimum)

```bash
# 1. Install
npm install

# 2. Configure (edit .env with your 4 values)
cp .env.example .env
nano .env  # or notepad .env

# 3. Build
npm run build

# 4. Run
npm run dev

# 5. Test
curl http://localhost:3001/api/health
```

**That's it. You now have a production cryptocurrency deposit backend running!** 🚀

---

**Time to complete**: 30 minutes  
**Difficulty**: Very Easy  
**Next**: Integrate API into your app  

---

Start now: `npm install` →

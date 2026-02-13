# Production Deployment Guide

## System Status: ✅ READY FOR DEPLOYMENT

Your crypto deposit backend is fully compiled, optimized, and ready for production deployment.

## Quick Start (5 minutes)

### Using Docker (Recommended)

```bash
# 1. Navigate to backend directory
cd c:\Users\USER\Documents\builds\andes\backend

# 2. Create .env (or copy template)
cp .env.example .env

# 3. Edit .env with your values
# Set: MASTER_MNEMONIC, RPC URLs, API keys

# 4. Start with Docker Compose (includes MongoDB)
docker-compose up -d

# 5. Verify
curl http://localhost:3001/api/health
```

### Traditional Node.js Deployment

```bash
# 1. Install MongoDB locally or use Atlas

# 2. Update .env with database URI
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# 3. Start server
node dist/index.js

# 4. Verify
curl http://localhost:3001/api/health
```

## ⚙️ Configuration

### Required Environment Variables

```env
# Blockchain
MASTER_MNEMONIC=your-12-24-word-bip39-phrase
RPC_ETHEREUM=https://eth-mainnet.infura.io/v3/YOUR_KEY
RPC_BSC=https://bsc-dataseed.binance.org:8545
RPC_POLYGON=https://polygon-rpc.com
RPC_TRON=https://api.tronstack.io

# Database (choose one)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
# OR (local)
MONGODB_URI=mongodb://localhost:27017/andes-deposits

# API Security
API_KEY=your_secure_api_key_here

# Optional
PORT=3001
NODE_ENV=production
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│            Express.js Server (3001)              │
├─────────────────────────────────────────────────┤
│  Routes (Addresses, Deposits, Health)           │
├─────────────────────────────────────────────────┤
│  Services (4 core services)                     │
│  - AddressGenerationService (HD Wallet)         │
│  - DepositService (Transaction tracking)        │
│  - ConfirmationService (Block confirmations)    │
│  - BlockchainListenerService (Real-time sync)   │
├─────────────────────────────────────────────────┤
│  Blockchain Integration                         │
│  - Ethereum (ethers.js)                         │
│  - BSC, Polygon (ethers.js)                     │
│  - Tron (TronWeb)                               │
├─────────────────────────────────────────────────┤
│  MongoDB (Data Persistence)                     │
│  - Users (addresses, balances)                  │
│  - Deposits (transactions, status)              │
│  - Confirmations (blockchain confirmations)     │
└─────────────────────────────────────────────────┘
```

## 🚀 Deployment Options

### Option 1: Docker (Recommended)

**Pros:** Easy, reproducible, includes MongoDB
**Cons:** Requires Docker install

```bash
docker-compose up -d
docker logs -f andes-backend
```

### Option 2: PM2 (Process Manager)

**Pros:** Production-grade, auto-restart, monitoring
**Cons:** Requires manual MongoDB setup

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "andes-backend"

# Monitor
pm2 monit

# View logs
pm2 logs andes-backend

# Restart on reboot
pm2 startup
pm2 save
```

### Option 3: systemd (Linux)

**Pros:** Native Linux integration
**Cons:** Linux only

```bash
# Create service file
sudo nano /etc/systemd/system/andes-backend.service

[Unit]
Description=Andes Crypto Deposit Backend
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/path/to/andes/backend
ExecStart=/usr/bin/node /path/to/andes/backend/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable andes-backend
sudo systemctl start andes-backend
```

### Option 4: Kubernetes

**Pros:** Enterprise-grade, auto-scaling
**Cons:** Complex setup

```yaml
# See example K8s manifest in docs/
kubectl apply -f k8s-deployment.yaml
```

## 🔒 Security Deployment Checklist

- [ ] Store `MASTER_MNEMONIC` in secure vault (HashiCorp Vault, AWS Secrets Manager)
- [ ] Use MongoDB authentication with strong passwords
- [ ] Enable HTTPS/TLS termination
- [ ] Configure firewall rules (only allow traffic from trusted sources)
- [ ] Set up API key rotation policy
- [ ] Enable MongoDB encryption at rest
- [ ] Configure regular database backups
- [ ] Set up monitoring/alerting
- [ ] Use health checks for auto-recovery
- [ ] Implement rate limiting
- [ ] Enable CORS only for allowed origins
- [ ] Set up Web Application Firewall (WAF)
- [ ] Regular security audits
- [ ] Implement DDoS protection

## 📊 Performance Tuning

### Node.js Optimization

```bash
# Increase file descriptors for production
ulimit -n 65536

# Use cluster mode for multi-core
# (optional - implement in code)
```

### MongoDB Optimization

```javascript
// Recommended indexes (created automatically)
db.users.createIndex({ "userId": 1 }, { unique: true })
db.deposits.createIndex({ "userId": 1, "status": 1 })
db.confirmations.createIndex({ "transactionHash": 1 })
```

### Load Balancing

```nginx
# Nginx example
upstream andes_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.andes.com;
    
    location / {
        proxy_pass http://andes_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Monitoring & Logging

### Application Monitoring

```bash
# View real-time logs
docker logs -f andes-backend
pm2 logs andes-backend
tail -f logs/andes-backend.log

# Performance metrics
docker stats andes-backend
pm2 monit
```

### Health Checks

```bash
# Automated health endpoint
curl http://localhost:3001/api/health

# Response:
# {
#   "success": true,
#   "status": "ok",
#   "blockchain": {
#     "ethereum": "connected",
#     "bsc": "listening",
#     "polygon": "listening",
#     "tron": "listening"
#   }
# }
```

### Alerting Setup

Configure alerts for:
- Server down/unreachable
- High memory/CPU usage
- Failed database connections
- Failed blockchain connections
- Unusual transaction activity
- Authentication failures

## 🔄 Updates & Maintenance

### Updating the Server

```bash
# Pull latest code
git pull origin main

# Rebuild
pnpm run build

# Restart service
pm2 restart andes-backend
# OR with Docker
docker-compose up -d --build
```

### Database Backups

```bash
# MongoDB Atlas - Automatic backups enabled

# Self-hosted backups
mongodump --uri="mongodb://..." --out=/backups

# Schedule with cron
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### Disaster Recovery

1. **Backup Strategy:** Daily automated backups
2. **Recovery Testing:** Monthly restore drills
3. **Redundancy:** Multi-region database replication
4. **Monitoring:** 24/7 uptime monitoring

## 📞 Support & Troubleshooting

### Common Issues

#### Server won't start
```bash
# Check port is free
lsof -i :3001

# Check logs for MongoDB connection
docker logs andes-backend

# Verify .env is set
cat .env | grep MONGODB_URI
```

#### High memory usage
```bash
# Restart server
docker-compose restart backend
pm2 restart andes-backend

# Check for memory leaks
node --inspect dist/index.js
```

#### Slow transactions
```bash
# Check RPC endpoint status
curl -X POST RPC_URL -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check MongoDB indexes
db.deposits.getIndexes()
```

## 📝 Operational Runbooks

See additional documentation:
- [STARTUP.md](./STARTUP.md) - Server startup guide
- [MONITORING.md](./docs/MONITORING.md) - Monitoring setup
- [SECURITY.md](./docs/SECURITY.md) - Security hardening
- [API_REFERENCE.md](./docs/API_REFERENCE.md) - API documentation

## 📞 Contact & Support

For production deployment assistance or issues:
1. Check application logs
2. Review error documentation
3. Contact infrastructure team
4. Submit support ticket with logs

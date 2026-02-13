# Testnet Setup Guide

## Overview

This guide helps you test deposits on actual testnets (Sepolia Ethereum, BSC Testnet, Polygon Mumbai, Tron Shasta).

## Quick Choice

**Choose your approach:**

1. **Simulated Deposits** (Fastest) - No faucet needed
   ```bash
   npx ts-node --project tsconfig.json scripts/test-deposits-all-networks.ts
   ```

2. **Real Testnet** (Most realistic) - Requires testnet coins from faucets

---

## Option 1: Simulated Deposits (Recommended for Quick Testing)

Simulates deposits without needing actual testnet coins.

```bash
# Build backend
pnpm run build

# Run deposit test (uses in-memory MongoDB)
npx ts-node --project tsconfig.json scripts/test-deposits-all-networks.ts
```

**Output shows:**
- ✓ Addresses generated per network
- ✓ Deposits recorded per network/token
- ✓ Balances updated correctly
- ✓ Multi-network deposits aggregated

No setup required, no testnet coins needed.

---

## Option 2: Real Testnet Deposits

### Step 1: Get Testnet RPC URLs and API Keys

**Ethereum Sepolia:**
- Faucet: https://sepoliafaucet.com or https://alchemy.com/faucets/ethereum-sepolia
- RPC: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
- Explorer: https://sepolia.etherscan.io

**BSC Testnet:**
- Faucet: https://testnet.binance.org/faucet-smart
- RPC: `https://data-seed-prebsc-1-a.binance.org:8545`
- Explorer: https://testnet.bscscan.com

**Polygon Mumbai:**
- Faucet: https://faucet.polygon.technology/
- RPC: `https://rpc-mumbai.maticvigil.com`
- Explorer: https://mumbai.polygonscan.com

**Tron Shasta:**
- Faucet: https://www.tronlink.org/ (create account, request testnet TRX)
- RPC: `https://api.shasta.trongrid.io`
- Explorer: https://shasta.tronscan.org

### Step 2: Update `.env` for Testnets

Create `.env.testnet`:

```dotenv
# TESTNET CONFIGURATION

# Sepolia (Ethereum Testnet)
RPC_ETHEREUM="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY"

# BSC Testnet
RPC_BSC="https://data-seed-prebsc-1-a.binance.org:8545"
BSCSCAN_API_KEY="YOUR_BSCSCAN_API_KEY"

# Polygon Mumbai
RPC_POLYGON="https://rpc-mumbai.maticvigil.com"
POLYGON_RPC_URL="https://rpc-mumbai.maticvigil.com"
POLYGONSCAN_API_KEY="YOUR_POLYGONSCAN_API_KEY"

# Tron Shasta
RPC_TRON="https://api.shasta.trongrid.io"

# Testnet Token Addresses (Sepolia/Mumbai/Shasta)
ETHEREUM_USDT_ADDRESS="0xF1f50213C1d2e255e4B2bAD430F8A38EEF8D718E"  # Mock USDT on Sepolia
ETHEREUM_USDC_ADDRESS="0xd8dAEBAFe504591d4a76562EE00d3D1d9D20E5C8"  # Mock USDC on Sepolia

BSC_USDT_ADDRESS="0x7ef95a0FEE0Dd31b22626595a8ab6a92Cb91CA0d"  # Mock USDT on BSC testnet
BSC_USDC_ADDRESS="0x64544969ed7EBf5f083679233325356EbE738930"  # Mock USDC on BSC testnet

POLYGON_USDT_ADDRESS="0x1e4c6c71f64bC5e9A976e3c61A93ba28F7988d39"  # Mock USDT on Mumbai
POLYGON_USDC_ADDRESS="0x0FA8781a83E46826621b3BC32C3449C42e8917abc"  # Mock USDC on Mumbai

# MongoDB for testnet
MONGODB_URI="mongodb://localhost:27017/andes-deposits-testnet"

# Keep same master mnemonic for consistent addresses
MASTER_MNEMONIC="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
```

### Step 3: Get Testnet Coins

**Sepolia ETH:**
```bash
# Visit https://sepoliafaucet.com
# Paste your address and claim 0.5 ETH
# Wait ~minutes
```

**BSC Testnet BNB:**
```bash
# Visit https://testnet.binance.org/faucet-smart
# Paste your address, click "Give me BNB"
```

**Mumbai MATIC:**
```bash
# Visit https://faucet.polygon.technology/
# Select "Mumbai" and "MATIC"
# Paste your address and claim
```

**Shasta TRX:**
```bash
# Can't use standard faucet
# Create TronLink wallet and request Shasta testnet coins via Discord
# Or use online faucets like https://tron.fan/
```

### Step 4: Deploy Test ERC-20 Tokens (Optional)

For realistic testing with actual token transfers, deploy mock USDT/USDC on each testnet.

Use Remix IDE (https://remix.ethereum.org):

```solidity
// Simple Mock ERC-20
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }

    function faucet(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
```

1. Paste code in Remix
2. Compile and deploy to testnet
3. Receive mock tokens in transaction
4. Update `.env.testnet` with token addresses

### Step 5: Run Backend with Testnet

```bash
# Use testnet environment
export $(cat .env.testnet | xargs)

# Or on Windows PowerShell:
Get-Content .env.testnet | ForEach-Object { 
    if ($_ -match '=') { 
        $parts = $_ -split '=', 2
        Set-Item -Path "env:$($parts[0])" -Value $parts[1]
    }
}

# Start backend
cd backend
pnpm run build
node dist/index.js
```

### Step 6: Send Testnet Deposit

Using MetaMask or Web3.js:

```javascript
// Get user's address from backend
const response = await fetch('http://localhost:3001/api/addresses/user_123/sepolia', {
  headers: { 'X-API-Key': 'your_api_key' }
});
const { data } = await response.json();
const depositAddress = data.address;

// Send test token from your wallet to this address
// Using MetaMask:
// 1. Switch to Sepolia network
// 2. Custom token address (your deployed USDT)
// 3. Send to depositAddress
```

### Step 7: Monitor Blockchain Listener

Backend logs show incoming deposits:

```
[info] Detected transfer on ethereum network
[info] Recipient: 0x6fac4d18c912343bf86fa7049364dd4e424ab9c0
[info] Amount: 100 USDT (0xF1f50213C1d2e255e4B2bAD430F8A38EEF8D718E)
[info] Status: pending

[info] Deposit confirmed after 12 blocks
[info] User balance updated: 100 USDT confirmed
```

---

## Common Issues & Solutions

### "Cannot find RPC URL"
**Problem:** RPC URLs in `.env` are placeholders  
**Solution:** Get actual URLs from Alchemy, Infura, or public RPC lists

### "No faucet token"
**Problem:** Testnet faucet down or rate-limited  
**Solution:** Try alternative faucets or ask in Discord communities

### "Transaction fails with 'insufficient balance'"
**Problem:** Didn't receive testnet coins or sent wrong amount  
**Solution:** Check block explorer for your address's balance

### "Deposit not detected"
**Problem:** Blockchain listener not running or watching wrong addresses  
**Solution:** 
```bash
# Check logs
tail -f logs/app.log | grep "listener"

# Ensure RPC is reachable
curl "https://sepolia.infura.io/v3/YOUR_KEY" -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## Verify Testnet Integration

Check everything is working:

```bash
# 1. Backend running
curl http://localhost:3001/api/health

# 2. Generate testnet address
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testnet_user",
    "email": "test@example.com",
    "networks": ["ethereum"]
  }'

# 3. Check blockchain listener is running (in logs)
# Look for: "Started listener for ethereum network"

# 4. Send test token to the address via blockchain explorer or wallet

# 5. Monitor deposits
curl http://localhost:3001/api/deposits/user/testnet_user \
  -H "X-API-Key: your_api_key"
```

---

## Summary

- **Fastest testing**: Use simulated deposits (`test-deposits-all-networks.ts`)
- **Most realistic**: Set up testnet with faucets + wallet transfers
- **Production**: Switch to mainnet RPC URLs in `.env`

Both approaches exercise the same code paths, so simulated testing is sufficient for development.

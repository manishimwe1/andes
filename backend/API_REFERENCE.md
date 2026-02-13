# API Reference - Complete Endpoint Documentation

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: February 11, 2026

---

## 🔑 Authentication

All endpoints (except `/health`) require API key authentication via header:

```
x-api-key: YOUR_API_KEY
```

**Example**:
```bash
curl http://localhost:3001/api/deposits/stats \
  -H "x-api-key: your-32-byte-random-string"
```

---

## ✅ Health & Status Endpoints

### Health Check

**Endpoint**: `GET /api/health`  
**Auth**: ❌ Not required  
**Rate Limit**: None  
**Description**: Check if service is running and healthy

**Request**:
```bash
curl http://localhost:3001/api/health
```

**Response** (200 OK):
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-02-11T10:30:45.123Z",
  "uptime": 3661.234,
  "version": "1.0.0"
}
```

**Error Response** (503 Service Unavailable):
```json
{
  "success": false,
  "status": "database_unavailable",
  "timestamp": "2026-02-11T10:30:45.123Z"
}
```

---

### Ready Check

**Endpoint**: `GET /api/ready`  
**Auth**: ❌ Not required  
**Rate Limit**: None  
**Description**: Check if service is ready for traffic (all dependencies healthy)

**Request**:
```bash
curl http://localhost:3001/api/ready
```

**Response** (200 OK):
```json
{
  "success": true,
  "ready": true,
  "databases": {
    "mongodb": "connected",
    "blockchain_listeners": "running"
  },
  "listeners": [
    {
      "network": "ethereum",
      "state": "polling",
      "lastBlockChecked": 19420100,
      "lastCheckTime": "2026-02-11T10:30:40.000Z"
    },
    {
      "network": "bsc",
      "state": "polling",
      "lastBlockChecked": 38450200,
      "lastCheckTime": "2026-02-11T10:30:40.000Z"
    },
    {
      "network": "polygon",
      "state": "polling",
      "lastBlockChecked": 52100300,
      "lastCheckTime": "2026-02-11T10:30:40.000Z"
    },
    {
      "network": "tron",
      "state": "polling",
      "lastBlockChecked": 67430500,
      "lastCheckTime": "2026-02-11T10:30:40.000Z"
    }
  ]
}
```

---

## 👤 Address Management Endpoints

### Generate Deposit Addresses

**Endpoint**: `POST /api/addresses/generate`  
**Auth**: ✅ Required (x-api-key)  
**Rate Limit**: 10 requests/hour per userId  
**Description**: Generate unique deposit addresses for a user across multiple networks

**Request**:
```bash
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "email": "user@example.com",
    "networks": ["ethereum", "bsc", "polygon", "tron"]
  }'
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | string | Yes | Unique user identifier |
| email | string | Yes | Valid email address |
| networks | array | Yes | List of networks: `ethereum`, `bsc`, `polygon`, `tron` |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "network": "ethereum",
        "address": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
        "publicKey": "0x02a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        "derivationIndex": 0,
        "createdAt": "2026-02-11T10:30:45.123Z"
      },
      {
        "network": "bsc",
        "address": "0x8b6d4587543e6c3c9e4b5a7f8d9e0f1a2b3c4d5",
        "publicKey": "0x03b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        "derivationIndex": 0,
        "createdAt": "2026-02-11T10:30:45.123Z"
      },
      {
        "network": "polygon",
        "address": "0x9c7e5698654f7d4d0f5c6b8g9h0a1b2c3d4e5f6",
        "publicKey": "0x04c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        "derivationIndex": 0,
        "createdAt": "2026-02-11T10:30:45.123Z"
      },
      {
        "network": "tron",
        "address": "TQP5xm2fCVHp7t8u9n0m1l2k3j4i5h6g7f8e",
        "publicKey": "0x05d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
        "derivationIndex": 0,
        "createdAt": "2026-02-11T10:30:45.123Z"
      }
    ],
    "user": {
      "userId": "user-001",
      "email": "user@example.com",
      "walletIndex": 0,
      "depositAddresses": {
        "ethereum": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
        "bsc": "0x8b6d4587543e6c3c9e4b5a7f8d9e0f1a2b3c4d5",
        "polygon": "0x9c7e5698654f7d4d0f5c6b8g9h0a1b2c3d4e5f6",
        "tron": "TQP5xm2fCVHp7t8u9n0m1l2k3j4i5h6g7f8e"
      },
      "balances": {
        "ethereum": { "confirmed": "0", "pending": "0", "total": "0" },
        "bsc": { "confirmed": "0", "pending": "0", "total": "0" },
        "polygon": { "confirmed": "0", "pending": "0", "total": "0" },
        "tron": { "confirmed": "0", "pending": "0", "total": "0" }
      },
      "totalBalance": "0",
      "createdAt": "2026-02-11T10:30:45.123Z",
      "updatedAt": "2026-02-11T10:30:45.123Z"
    }
  }
}
```

**Error Response** (400 Bad Request - Invalid network):
```json
{
  "success": false,
  "error": "Invalid network: Bitcoin. Valid networks are: ethereum, bsc, polygon, tron"
}
```

---

### Get User's Deposit Address

**Endpoint**: `GET /api/addresses/:userId/:network`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Description**: Retrieve a specific deposit address for a user on a network

**Request**:
```bash
curl http://localhost:3001/api/addresses/user-001/ethereum \
  -H "x-api-key: YOUR_API_KEY"
```

**Parameters**:
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| userId | string | path | Yes | User ID |
| network | string | path | Yes | Network: `ethereum`, `bsc`, `polygon`, `tron` |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "address": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
    "network": "ethereum",
    "derivationIndex": 0,
    "createdAt": "2026-02-11T10:30:45.123Z"
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### Get All User Addresses

**Endpoint**: `GET /api/addresses/:userId`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Description**: Retrieve all deposit addresses for a user across all networks

**Request**:
```bash
curl http://localhost:3001/api/addresses/user-001 \
  -H "x-api-key: YOUR_API_KEY"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "addresses": {
      "ethereum": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
      "bsc": "0x8b6d4587543e6c3c9e4b5a7f8d9e0f1a2b3c4d5",
      "polygon": "0x9c7e5698654f7d4d0f5c6b8g9h0a1b2c3d4e5f6",
      "tron": "TQP5xm2fCVHp7t8u9n0m1l2k3j4i5h6g7f8e"
    },
    "balances": {
      "ethereum": { "confirmed": "1000000000000000000", "pending": "0", "total": "1000000000000000000" },
      "bsc": { "confirmed": "0", "pending": "0", "total": "0" },
      "polygon": { "confirmed": "0", "pending": "0", "total": "0" },
      "tron": { "confirmed": "0", "pending": "0", "total": "0" }
    }
  }
}
```

---

### Verify Address Ownership

**Endpoint**: `POST /api/addresses/verify`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Description**: Verify that a deposit address belongs to a user (security check)

**Request**:
```bash
curl -X POST http://localhost:3001/api/addresses/verify \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "address": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
    "network": "ethereum"
  }'
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| userId | string | Yes | User ID |
| address | string | Yes | Address to verify |
| network | string | Yes | Network of address |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "isOwner": true,
    "address": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
    "userId": "user-001",
    "network": "ethereum"
  }
}
```

---

### Lookup User by Address

**Endpoint**: `GET /api/addresses/lookup/:address/:network`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Description**: Find which user owns a specific address

**Request**:
```bash
curl http://localhost:3001/api/addresses/lookup/0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6/ethereum \
  -H "x-api-key: YOUR_API_KEY"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "user-001",
    "email": "user@example.com",
    "address": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
    "network": "ethereum"
  }
}
```

---

## 💳 Deposit Endpoints

### Get User Deposits

**Endpoint**: `GET /api/deposits/:userId`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Querystring**: `?page=1&limit=20&status=confirmed&network=ethereum`  
**Description**: Retrieve deposits for a user with pagination

**Request**:
```bash
curl "http://localhost:3001/api/deposits/user-001?page=1&limit=20&status=confirmed" \
  -H "x-api-key: YOUR_API_KEY"
```

**Query Parameters**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 20 | Results per page (max 100) |
| status | string | - | Filter by status: `pending`, `confirmed`, `failed`, `cancelled` |
| network | string | - | Filter by network: `ethereum`, `bsc`, `polygon`, `tron` |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deposits": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "user-001",
        "network": "ethereum",
        "txHash": "0xabc123def456...",
        "toAddress": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
        "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
        "amount": "1000000000000000000",
        "amountUSD": "1000",
        "status": "confirmed",
        "confirmations": 12,
        "requiredConfirmations": 12,
        "processingFee": "1000000000000000",
        "net": "999000000000000000",
        "detectedAt": "2026-02-11T10:20:00.000Z",
        "confirmedAt": "2026-02-11T10:22:30.000Z",
        "createdAt": "2026-02-11T10:20:00.000Z",
        "updatedAt": "2026-02-11T10:22:30.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### Get Deposit by Transaction Hash

**Endpoint**: `GET /api/deposits/tx/:txHash`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Description**: Retrieve deposit details by transaction hash

**Request**:
```bash
curl http://localhost:3001/api/deposits/tx/0xabc123def456abc123def456abc123def456abc \
  -H "x-api-key: YOUR_API_KEY"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "user-001",
    "network": "ethereum",
    "txHash": "0xabc123def456abc123def456abc123def456abc",
    "toAddress": "0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6",
    "fromAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": "1000000000000000000",
    "amountUSD": "1000",
    "status": "confirmed",
    "confirmations": 12,
    "requiredConfirmations": 12,
    "confirmedAt": "2026-02-11T10:22:30.000Z",
    "createdAt": "2026-02-11T10:20:00.000Z"
  }
}
```

---

### Check Deposit Confirmation

**Endpoint**: `POST /api/deposits/check-confirmation`  
**Auth**: ✅ Required  
**Rate Limit**: 30 requests/minute (global)  
**Description**: Manually check confirmation status of a pending deposit

**Request**:
```bash
curl -X POST http://localhost:3001/api/deposits/check-confirmation \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0xabc123def456abc123def456abc123def456abc",
    "network": "ethereum"
  }'
```

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| txHash | string | Yes | Transaction hash |
| network | string | Yes | Network: `ethereum`, `bsc`, `polygon`, `tron` |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "txHash": "0xabc123def456abc123def456abc123def456abc",
    "confirmations": 5,
    "requiredConfirmations": 12,
    "status": "pending",
    "confirmed": false,
    "estimatedConfirmationTime": "90 seconds"
  }
}
```

---

### Get Deposit Statistics

**Endpoint**: `GET /api/deposits/stats`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Querystring**: `?startDate=2026-02-01&endDate=2026-02-11&network=ethereum`  
**Description**: Get aggregated statistics across all deposits

**Request**:
```bash
curl "http://localhost:3001/api/deposits/stats?startDate=2026-02-01&endDate=2026-02-11" \
  -H "x-api-key: YOUR_API_KEY"
```

**Query Parameters**:
| Name | Type | Format | Description |
|------|------|--------|-------------|
| startDate | string | YYYY-MM-DD | Start date for statistics |
| endDate | string | YYYY-MM-DD | End date for statistics |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalDeposits": 42,
      "totalAmount": "42000000000000000000",
      "totalAmountUSD": "42000",
      "confirmedDeposits": 38,
      "pendingDeposits": 3,
      "failedDeposits": 1,
      "averageAmount": "1000000000000000000",
      "averageAmountUSD": "1000"
    },
    "byNetwork": {
      "ethereum": {
        "total": 15,
        "confirmed": 14,
        "pending": 1,
        "failed": 0,
        "totalAmount": "15000000000000000000",
        "totalAmountUSD": "15000"
      },
      "bsc": {
        "total": 12,
        "confirmed": 12,
        "pending": 0,
        "failed": 0,
        "totalAmount": "12000000000000000000",
        "totalAmountUSD": "12000"
      },
      "polygon": {
        "total": 10,
        "confirmed": 8,
        "pending": 2,
        "failed": 0,
        "totalAmount": "10000000000000000000",
        "totalAmountUSD": "10000"
      },
      "tron": {
        "total": 5,
        "confirmed": 4,
        "pending": 0,
        "failed": 1,
        "totalAmount": "5000000000000000000",
        "totalAmountUSD": "5000"
      }
    },
    "byStatus": {
      "confirmed": {
        "count": 38,
        "totalAmount": "38000000000000000000",
        "totalAmountUSD": "38000"
      },
      "pending": {
        "count": 3,
        "totalAmount": "3000000000000000000",
        "totalAmountUSD": "3000"
      },
      "failed": {
        "count": 1,
        "totalAmount": "1000000000000000000",
        "totalAmountUSD": "1000"
      }
    },
    "dateRange": {
      "startDate": "2026-02-01",
      "endDate": "2026-02-11",
      "days": 11
    }
  }
}
```

---

### Get Recent Deposits

**Endpoint**: `GET /api/deposits/recent/:network`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Querystring**: `?limit=10`  
**Description**: Get most recent deposits on a specific network

**Request**:
```bash
curl "http://localhost:3001/api/deposits/recent/ethereum?limit=10" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "network": "ethereum",
    "deposits": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "user-001",
        "txHash": "0xabc123def456...",
        "amount": "1000000000000000000",
        "amountUSD": "1000",
        "status": "confirmed",
        "confirmations": 12,
        "createdAt": "2026-02-11T10:20:00.000Z"
      }
    ]
  }
}
```

---

### Get Pending Deposits

**Endpoint**: `GET /api/deposits/pending`  
**Auth**: ✅ Required  
**Rate Limit**: 100 requests/15 min per IP  
**Querystring**: `?network=ethereum&limit=20`  
**Description**: Get all pending (unconfirmed) deposits

**Request**:
```bash
curl "http://localhost:3001/api/deposits/pending?network=ethereum" \
  -H "x-api-key: YOUR_API_KEY"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "pendingDeposits": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "user-002",
        "network": "ethereum",
        "txHash": "0xdef456abc789...",
        "amount": "500000000000000000",
        "amountUSD": "500",
        "status": "pending",
        "confirmations": 3,
        "requiredConfirmations": 12,
        "detectedAt": "2026-02-11T10:25:00.000Z",
        "createdAt": "2026-02-11T10:25:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

## ⚠️ Error Responses

### All endpoints return error in this format:

**400 Bad Request** (Invalid input):
```json
{
  "success": false,
  "error": "Invalid network: Bitcoin. Valid networks are: ethereum, bsc, polygon, tron"
}
```

**401 Unauthorized** (Missing/invalid API key):
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing API key"
}
```

**404 Not Found** (Resource not found):
```json
{
  "success": false,
  "error": "User not found"
}
```

**429 Too Many Requests** (Rate limit exceeded):
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

**500 Internal Server Error** (Server error):
```json
{
  "success": false,
  "error": "Internal server error",
  "requestId": "req-12345-abcde"
}
```

---

## 🔄 Network Specifications

### Ethereum
- **Chain ID**: 1
- **Confirmations Required**: 12
- **Block Time**: ~12 seconds
- **Confirmation Time**: ~2-3 minutes
- **Token Standard**: ERC20
- **Explorer**: https://etherscan.io

### BSC (Binance Smart Chain)
- **Chain ID**: 56
- **Confirmations Required**: 12
- **Block Time**: ~3 seconds
- **Confirmation Time**: ~36-45 seconds
- **Token Standard**: BEP20 (ERC20 compatible)
- **Explorer**: https://bscscan.com

### Polygon
- **Chain ID**: 137
- **Confirmations Required**: 128
- **Block Time**: ~2 seconds
- **Confirmation Time**: ~4 minutes
- **Token Standard**: ERC20
- **Explorer**: https://polygonscan.com

### Tron
- **Chain ID**: 1
- **Confirmations Required**: 19
- **Block Time**: ~3 seconds
- **Confirmation Time**: ~57 seconds
- **Token Standard**: TRC20
- **Explorer**: https://tronscan.org

---

## 📊 Data Types & Formats

### Address Format

| Network | Format | Example |
|---------|--------|---------|
| Ethereum | Hex (42 chars) | `0x7a5c3476432c5b2b8d9e3a4f6c8b1e2d3a4f5c6` |
| BSC | Hex (42 chars) | `0x8b6d4587543e6c3c9e4b5a7f8d9e0f1a2b3c4d5` |
| Polygon | Hex (42 chars) | `0x9c7e5698654f7d4d0f5c6b8g9h0a1b2c3d4e5f6` |
| Tron | Base58 (34 chars) | `TQP5xm2fCVHp7t8u9n0m1l2k3j4i5h6g7f8e` |

### Amount Format

All amounts are in **smallest unit** (wei for ERC20/USDT):
- 1 USDT = `1000000` (6 decimals)
- Returned as string to preserve precision
- Use `formatWeiToToken()` utility to convert

### Status Values

- `pending` - Detected but needs more confirmations
- `confirmed` - Has required confirmations, balance credited
- `failed` - Transaction failed or revert
- `cancelled` - Manually cancelled

---

## 🔐 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Most endpoints | 100 | 15 minutes per IP |
| Address generation | 10 | 1 hour per userId |
| Confirmation check | 30 | 1 minute globally |
| Health/Ready | Unlimited | - |

Responses include rate limit headers:
```
x-ratelimit-limit: 100
x-ratelimit-remaining: 87
x-ratelimit-reset: 1644556800
```

---

## 📝 Integration Example

```bash
#!/bin/bash

API_KEY="your-32-byte-api-key"
BASE_URL="http://localhost:3001/api"

# 1. Create user and generate addresses
echo "Step 1: Generating addresses..."
RESPONSE=$(curl -s -X POST $BASE_URL/addresses/generate \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "integration-test",
    "email": "test@integration.com",
    "networks": ["ethereum", "bsc"]
  }')

ETH_ADDRESS=$(echo $RESPONSE | jq -r '.data.addresses[0].address')
echo "Created Ethereum address: $ETH_ADDRESS"

# 2. Get user's all addresses
echo "Step 2: Retrieving all addresses..."
curl -s $BASE_URL/addresses/integration-test \
  -H "x-api-key: $API_KEY" | jq .

# 3. User sends deposit (external, off-chain)
echo "Step 3: Waiting for deposit detection..."
echo "Send USDT to: $ETH_ADDRESS"
sleep 60

# 4. Query deposits
echo "Step 4: Checking deposits..."
curl -s "$BASE_URL/deposits/integration-test?status=pending" \
  -H "x-api-key: $API_KEY" | jq .

# 5. Get statistics
echo "Step 5: Getting statistics..."
curl -s "$BASE_URL/deposits/stats" \
  -H "x-api-key: $API_KEY" | jq .
```

---

## ✅ Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Feb 11, 2026 | Initial production release |

---

**Documentation Status**: ✅ Complete  
**Last Updated**: February 11, 2026  
**API Version**: 1.0.0

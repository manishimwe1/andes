# Address Generation API - Quick Reference

## Endpoints

All endpoints require `X-API-Key` header for authentication.

### Generate Deposit Addresses
**POST** `/api/addresses/generate`

Create or retrieve unique deposit addresses for a user across all networks.

**Request:**
```json
{
  "userId": "user_001",
  "email": "user@example.com",
  "networks": ["ethereum", "bsc", "polygon", "tron"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "addresses": [
      {
        "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
        "publicKey": "0x0339fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
        "derivationIndex": 1,
        "network": "ethereum"
      },
      {
        "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
        "publicKey": "0x0339fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
        "derivationIndex": 1,
        "network": "bsc"
      },
      {
        "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
        "publicKey": "0x0339fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
        "derivationIndex": 1,
        "network": "polygon"
      },
      {
        "address": "0x039fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
        "publicKey": "0x0339fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
        "derivationIndex": 1,
        "network": "tron"
      }
    ],
    "user": {
      "userId": "user_001",
      "email": "user@example.com",
      "walletIndex": 1,
      "depositAddresses": { /* ... */ },
      "balances": { /* ... */ },
      "createdAt": "2026-02-11T14:57:53.000Z",
      "updatedAt": "2026-02-11T14:57:53.000Z"
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing/invalid fields
- `500` - Server error

---

### Get Address for Specific Network
**GET** `/api/addresses/:userId/:network`

Retrieve the deposit address for a user on a specific network.

**Parameters:**
- `userId` - User ID (string)
- `network` - Network name: `ethereum`, `bsc`, `polygon`, `tron`

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
    "publicKey": "0x0339fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
    "derivationIndex": 1,
    "network": "ethereum"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - User or address not found
- `500` - Server error

---

### Get All Addresses for User
**GET** `/api/addresses/:userId`

Retrieve all deposit addresses for a user across all networks.

**Response:**
```json
{
  "success": true,
  "data": {
    "ethereum": {
      "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
      "publicKey": "0x03...",
      "derivationIndex": 1,
      "network": "ethereum"
    },
    "bsc": {
      "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
      "publicKey": "0x03...",
      "derivationIndex": 1,
      "network": "bsc"
    },
    "polygon": {
      "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
      "publicKey": "0x03...",
      "derivationIndex": 1,
      "network": "polygon"
    },
    "tron": {
      "address": "0x039fd0991d0222b4e1339c1a1a5b5f6d9f6a96672a3247b638ee6156d9ea877a2f",
      "publicKey": "0x03...",
      "derivationIndex": 1,
      "network": "tron"
    }
  }
}
```

---

### Verify Address Ownership
**POST** `/api/addresses/verify`

Verify that an address belongs to a specific user.

**Request:**
```json
{
  "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
  "userId": "user_001",
  "network": "ethereum"
}
```

**Response (Owner):**
```json
{
  "success": true,
  "data": true
}
```

**Response (Not Owner):**
```json
{
  "success": true,
  "data": false
}
```

---

### Find User by Deposit Address
**GET** `/api/addresses/lookup/:address/:network`

Reverse lookup: Given an address and network, find the user who owns it.

**Parameters:**
- `address` - Deposit address (case-insensitive)
- `network` - Network name: `ethereum`, `bsc`, `polygon`, `tron`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_001",
    "email": "user@example.com",
    "walletIndex": 1,
    "depositAddresses": { /* ... */ },
    "balances": { /* ... */ },
    "createdAt": "2026-02-11T14:57:53.000Z",
    "updatedAt": "2026-02-11T14:57:53.000Z"
  }
}
```

**Status Codes:**
- `200` - Found
- `404` - User not found
- `500` - Server error

---

## Usage Examples

### cURL

```bash
# Generate addresses
curl -X POST http://localhost:3001/api/addresses/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "userId": "user_001",
    "email": "user@example.com",
    "networks": ["ethereum", "bsc", "polygon", "tron"]
  }'

# Get all addresses
curl -X GET http://localhost:3001/api/addresses/user_001 \
  -H "X-API-Key: your-api-key"

# Get Ethereum address only
curl -X GET http://localhost:3001/api/addresses/user_001/ethereum \
  -H "X-API-Key: your-api-key"

# Verify ownership
curl -X POST http://localhost:3001/api/addresses/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "address": "0x6fac4d18c912343bf86fa7049364dd4e424ab9c0",
    "userId": "user_001",
    "network": "ethereum"
  }'

# Find user by address
curl -X GET "http://localhost:3001/api/addresses/lookup/0x6fac4d18c912343bf86fa7049364dd4e424ab9c0/ethereum" \
  -H "X-API-Key: your-api-key"
```

### Node.js/Fetch

```javascript
// Generate addresses
const response = await fetch('http://localhost:3001/api/addresses/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    userId: 'user_001',
    email: 'user@example.com',
    networks: ['ethereum', 'bsc', 'polygon', 'tron']
  })
});

const data = await response.json();
console.log(data.data.addresses);
// Output:
// [
//   { address: '0x...', network: 'ethereum', ... },
//   { address: '0x...', network: 'bsc', ... },
//   ...
// ]
```

### Python

```python
import requests

# Generate addresses
response = requests.post(
    'http://localhost:3001/api/addresses/generate',
    headers={'X-API-Key': 'your-api-key'},
    json={
        'userId': 'user_001',
        'email': 'user@example.com',
        'networks': ['ethereum', 'bsc', 'polygon', 'tron']
    }
)

addresses = response.json()['data']['addresses']
for addr in addresses:
    print(f"{addr['network']}: {addr['address']}")
```

---

## Integration Patterns

### Pattern 1: Signup Flow
```
User signs up
  ↓
POST /api/addresses/generate (auto-create)
  ↓
Return addresses to user
  ↓
Display "Send crypto to: 0x..."
```

### Pattern 2: Display Deposit Addresses
```
User views account
  ↓
GET /api/addresses/:userId
  ↓
Display all addresses by network
```

### Pattern 3: Validate Incoming Transfer
```
Blockchain listener detects transfer
  ↓
Extract recipient address
  ↓
GET /api/addresses/lookup/:address/:network
  ↓
Find user, credit balance
```

### Pattern 4: Security Check
```
User wants to withdraw
  ↓
Retrieve user's addresses
  ↓
Verify withdrawal address matches one of their deposit addresses (for safety)
  ↓
Process withdrawal if verified
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "User not found",
  "statusCode": 404,
  "code": "USER_NOT_FOUND"
}
```

**Common Error Codes:**
- `INVALID_INPUT` - Missing or invalid request fields
- `USER_NOT_FOUND` - User doesn't exist
- `ADDRESS_NOT_FOUND` - Address not found for user
- `ADDRESS_GENERATION_FAILED` - Failed to derive address
- `SERVICE_ERROR` - Internal server error

---

## Rate Limiting

Endpoint rate limits (per API key):
- `/api/addresses/generate` - 10 requests/minute
- Other endpoints - 100 requests/minute

Exceeding limits returns `429 Too Many Requests`.

---

## Best Practices

1. **Generate on Signup**: Call `POST /api/addresses/generate` immediately when user registers
2. **Cache Addresses**: Store returned addresses in your frontend/backend cache (immutable)
3. **Case-Insensitive Matching**: Always compare addresses case-insensitively
4. **Tron Format**: Tron addresses are in hex public key format (not base58)
5. **No Private Keys**: Never expose private keys; they're only derived temporarily
6. **Retry Logic**: Implement retry with exponential backoff (max 3 attempts)
7. **Monitoring**: Log address generation for audit trails

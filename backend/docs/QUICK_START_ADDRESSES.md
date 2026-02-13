# Per-User Address Generation - Developer Quick Start

## TL;DR

**Every user gets their own unique crypto deposit addresses** across Ethereum, BSC, Polygon, and Tron. Addresses are derived deterministically from a master seed phrase using wallet indices 0, 1, 2, ...

## 30-Second Example

```typescript
// When user signs up:
const result = await addressService.generateUserDepositAddresses(
  'user_123',           // unique user ID
  'user@example.com',   // user email
  ['ethereum', 'bsc', 'polygon', 'tron']
);

// Each user gets unique addresses:
console.log(result.data.addresses);
// [
//   { address: '0x6fac...', network: 'ethereum', derivationIndex: 1 },
//   { address: '0x6fac...', network: 'bsc',      derivationIndex: 1 },  ← Same address (same derivation path)
//   { address: '0x6fac...', network: 'polygon',  derivationIndex: 1 },  ← Same address (same derivation path)
//   { address: '0x039f...', network: 'tron',     derivationIndex: 1 }   ← Different (different curve)
// ]

// User 2 gets different addresses:
// derivationIndex: 2 → all different addresses ✓
```

## Why Sequential Indices?

Each user is assigned a **sequential wallet index** (0, 1, 2, 3...) when they register. This ensures:

```
User 1 (index 0) → Address A
User 2 (index 1) → Address B  ← Different!
User 3 (index 2) → Address C  ← Different!
```

**No duplicates, no collisions, fully deterministic**.

## Key Differences from Single-Address Systems

| Aspect | Before | After |
|--------|--------|-------|
| Users per address | Many → security risk | 1 → safe |
| Address generation | Random, stored | Deterministic, derived |
| Address persistence | Database | Derivation + index |
| Private key storage | Risky | Never stored |

## The Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Registration                       │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ POST /api/addresses/generate                               │
│ { userId, email, networks }                                │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Check if user exists in database                        │
│ 2. If new: Get user count → assign walletIndex             │
│ 3. For each network:                                       │
│    └─ Derive address using HD wallet                       │
│ 4. Save addresses to database                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Response: { addresses: [{ address, network, ... }] }       │
│ Display to user: "Send USDT to: 0x6fac..." (Ethereum)      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ User sends USDT to their address on blockchain             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ BlockchainListenerService detects transfer                 │
│ Matches recipient address to user                          │
│ Updates user balance ✓                                     │
└─────────────────────────────────────────────────────────────┘
```

## Database Impact

When you call `generateUserDepositAddresses()`, a new user is created:

```typescript
{
  userId: "user_123",
  email: "user@example.com",
  walletIndex: 5,  // ← Sequential index for NEXT user is 6
  depositAddresses: {
    erc20: {
      address: "0x...",
      publicKey: "0x...",
      derivationIndex: 5,  // ← Same as walletIndex
      createdAt: ISODate
    },
    bep20: { ... },  // Same address (EVM)
    polygon: { ... },  // Same address (EVM)
    trc20: {
      address: "0x...",  // Different (Tron uses different curve)
      publicKey: "0x...",
      derivationIndex: 5,
      createdAt: ISODate
    }
  },
  balances: {
    ethereum: { confirmed: 0, pending: 0, total: 0 },
    bsc: { ... },
    polygon: { ... },
    tron: { ... }
  }
}
```

## Testing Proof

Run the test suite to verify uniqueness:

```bash
npm run type-check  # TypeScript check
npm run build       # Compile
npx ts-node --project tsconfig.json scripts/test-unique-addresses.ts
```

**Expected Output**:
```
✓ Test 1: Unique Addresses Per User
  ETHEREUM: 3 unique addresses
  BSC: 3 unique addresses
  POLYGON: 3 unique addresses
  TRON: 3 unique addresses

✓ Test 2: Address Retrieval Consistency
✓ Test 3: Wallet Index Progression
✓ Test 4: Address Ownership Verification
✓ Test 5: Find User By Address

✓ ALL TESTS PASSED SUCCESSFULLY!
```

## Integration Checklist

- [ ] Set `MASTER_MNEMONIC` in `.env` (12+ word BIP39 seed)
- [ ] Optionally set `MASTER_PASSPHRASE` for extra security
- [ ] Initialize `AddressGenerationService` with `HDWalletUtil`
- [ ] Call `generateUserDepositAddresses()` on user signup
- [ ] Display returned addresses to user in UI
- [ ] Store API key for `/api/addresses` endpoint calls
- [ ] Run test suite: `npm run test:addresses`
- [ ] Monitor blockchain for incoming transfers (already done!)

## FAQ

**Q: Why do Ethereum, BSC, and Polygon have the same address?**  
A: They all use the same BIP-44 derivation path (`m/44'/60'/0'/0/...`). One keypair can receive tokens on multiple EVM chains. This is efficient and safe.

**Q: Can I get a different Ethereum address for each network?**  
A: Not without separate walletIndices. Each index produces one address per network type. Best practice is to reuse EVM addresses (cheaper, simpler).

**Q: What if a wallet index is reused across restarts?**  
A: The service counts existing users and assigns the next index. No collision possible with MongoDB (atomic operations).

**Q: Can private keys be recovered?**  
A: Only if MASTER_MNEMONIC is compromised. Private keys are never stored, only derived temporarily. Protect your `.env` file!

**Q: What happens if blockchain listener misses a transaction?**  
A: Every 1 minute, the confirmation service checks pending deposits again. Every 5 minutes, listener state is synced. Missed transactions are detected on next sweep.

**Q: How many users can the system support?**  
A: Unlimited. Wallet indices can go up to `2^31 - 1` (2.1 billion). With sequential assignment, you'll never run out.

**Q: Is this secure against address reuse?**  
A: Yes. Sequential indices guarantee uniqueness. Each user (by registration order) gets a unique address.

## Next Steps

1. **For Developers**: Review [UNIQUE_ADDRESS_GENERATION.md](./UNIQUE_ADDRESS_GENERATION.md)
2. **For API Consumers**: Check [ADDRESS_API.md](./ADDRESS_API.md)
3. **For Backend Integration**: Ensure `POST /api/addresses/generate` is called on signup
4. **For Frontend**: Display deposit addresses from response, grouped by network
5. **For Monitoring**: Set up alerts when blockchain listener detects new transfers

## Code References

- **Service**: [src/services/AddressGenerationService.ts](../src/services/AddressGenerationService.ts)
- **HD Wallet**: [src/utils/hdWallet.ts](../src/utils/hdWallet.ts)
- **Routes**: [src/routes/addresses.ts](../src/routes/addresses.ts)
- **Controller**: [src/controllers/AddressController.ts](../src/controllers/AddressController.ts)
- **Model**: [src/models/User.ts](../src/models/User.ts)
- **Tests**: [scripts/test-unique-addresses.ts](../scripts/test-unique-addresses.ts)

## Support

For issues or questions:
1. Check test output: `npm run test:addresses`
2. Review logs: `cat logs/app.log`
3. Verify `.env` configuration
4. Ensure MongoDB is running: `mongodb://localhost:27017`

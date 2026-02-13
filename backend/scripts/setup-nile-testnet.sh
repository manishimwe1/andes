#!/bin/bash
# Tron Nile Testnet Configuration Helper

echo "╔════════════════════════════════════════╗"
echo "║  TRON NILE TESTNET SETUP               ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo "Current Configuration (MAINNET):"
echo "  RPC_TRON=https://api.tronstack.io"
echo "  TRON_USDT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
echo ""

echo "Tron Nile Testnet Configuration (REQUIRED):"
echo "  RPC_TRON=https://nile.trongrid.io"
echo "  TRON_USDT_ADDRESS=TF17BoRp2cDBi2hpdvKAhERMLCHRJ1NqFn"
echo "  TRON_USDC_ADDRESS=TEkxiTehnzSmSe2XqrBj4w6WKHC3sSL7R7"
echo ""

echo "Steps to fix:"
echo ""
echo "1. Open .env file"
echo "2. Find the line: RPC_TRON=https://api.tronstack.io"
echo "3. Replace with: RPC_TRON=https://nile.trongrid.io"
echo ""
echo "4. Find: TRON_USDT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
echo "5. Replace with: TRON_USDT_ADDRESS=TF17BoRp2cDBi2hpdvKAhERMLCHRJ1NqFn"
echo ""
echo "6. Find: TRON_USDC_ADDRESS=TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9"
echo "7. Replace with: TRON_USDC_ADDRESS=TEkxiTehnzSmSe2XqrBj4w6WKHC3sSL7R7"
echo ""
echo "8. Save the .env file"
echo "9. Rebuild: pnpm run build"
echo "10. Restart: node dist/index.js"
echo ""
echo "Then run diagnostic: pnpm tsx scripts/diagnose-deposits.ts"
echo ""

# Optional: Auto-update .env if running on Linux/Mac
if [ -f .env ] && [ "$1" == "auto" ]; then
  echo "⚠️  Auto-updating .env for Tron Nile..."
  sed -i 's|RPC_TRON="https://api.tronstack.io"|RPC_TRON="https://nile.trongrid.io"|g' .env
  sed -i 's|TRON_USDT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t|TRON_USDT_ADDRESS=TF17BoRp2cDBi2hpdvKAhERMLCHRJ1NqFn|g' .env
  sed -i 's|TRON_USDC_ADDRESS=TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9|TRON_USDC_ADDRESS=TEkxiTehnzSmSe2XqrBj4w6WKHC3sSL7R7|g' .env
  echo "✓ .env updated"
else
  echo "📝 On Windows, update manually or run:"
  echo "   pnpm tsx scripts/update-nile-config.ts"
fi

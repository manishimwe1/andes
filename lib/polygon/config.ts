// lib/polygon/config.ts

export const POLYGON_CONFIG = {
  // 🧪 Polygon Amoy Testnet (development)
  TESTNET: {
    rpcUrl: "https://rpc-amoy.polygon.technology",
    chainId: 80002,
    network: "testnet",
    explorer: "https://amoy.polygonscan.com",
    apiUrl: "https://api.etherscan.io/v2/api",
  },

  // 🚀 Polygon Mainnet (production)
  MAINNET: {
    rpcUrl: "https://polygon-rpc.com",
    chainId: 137,
    network: "mainnet",
    explorer: "https://polygonscan.com",
    apiUrl: "https://api.etherscan.io/v2/api",
  },
} as const;

// 🔁 Auto-switch network
export const ACTIVE_POLYGON_NETWORK =
  process.env.NODE_ENV === "production"
    ? POLYGON_CONFIG.MAINNET
    : POLYGON_CONFIG.TESTNET;

// ✅ ERC20 Token Contracts on Polygon
export const POLYGON_USDT_CONTRACT = {
  // Amoy Testnet: no official Circle USDT exists — using USDC as a stand-in for testing.
  // For real USDT testing, deploy your own mock ERC20 on Amoy.
  // Circle's official testnet USDC on Amoy (6 decimals):
  TESTNET: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  // Mainnet USDT (PoS) — correct EIP-55 checksum:
  MAINNET: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
} as const;

export const POLYGON_USDC_CONTRACT = {
  // Amoy Testnet: Circle's official testnet USDC — correct EIP-55 checksum:
  TESTNET: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
  // Mainnet Native USDC — correct EIP-55 checksum:
  MAINNET: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
} as const;

// 🎯 Active token contracts
export const ACTIVE_POLYGON_USDT =
  process.env.NODE_ENV === "production"
    ? POLYGON_USDT_CONTRACT.MAINNET
    : POLYGON_USDT_CONTRACT.TESTNET;

export const ACTIVE_POLYGON_USDC =
  process.env.NODE_ENV === "production"
    ? POLYGON_USDC_CONTRACT.MAINNET
    : POLYGON_USDC_CONTRACT.TESTNET;

// 🔑 PolygonScan API key (now using Etherscan V2 unified key)
export const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

// 💰 Minimum deposit thresholds
export const POLYGON_MIN_DEPOSIT = {
  POLYGON: 1, // MATIC/POL
  USDT: 10,
  USDC: 10,
};

// ⏱ Confirmations required
export const POLYGON_REQUIRED_CONFIRMATIONS = 64;
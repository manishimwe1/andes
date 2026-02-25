export const BSC_CONFIG = {
  TESTNET: {
    rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    network: "testnet",
    explorer: "https://testnet.bscscan.com",
    apiUrl: "https://api.etherscan.io/v2/api", 
  },
  MAINNET: {
    rpcUrl: "https://bsc-dataseed.binance.org/",
    chainId: 56,
    network: "mainnet",
    explorer: "https://bscscan.com",
    apiUrl: "https://api.etherscan.io/v2/api",
  },
} as const;

export const ACTIVE_BSC_NETWORK =
  process.env.NODE_ENV === "production"
    ? BSC_CONFIG.MAINNET
    : BSC_CONFIG.TESTNET;

export const BSC_USDT_CONTRACT = {
  TESTNET: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
  MAINNET: "0x55d398326f99059fF775485246999027B3197955",
} as const;

export const BSC_USDC_CONTRACT = {
  TESTNET: "0x64544969ed7EBf5f083679233325356EbE738930",
  MAINNET: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
} as const;

export const ACTIVE_BSC_USDT =
  process.env.NODE_ENV === "production"
    ? BSC_USDT_CONTRACT.MAINNET
    : BSC_USDT_CONTRACT.TESTNET;

export const ACTIVE_BSC_USDC =
  process.env.NODE_ENV === "production"
    ? BSC_USDC_CONTRACT.MAINNET
    : BSC_USDC_CONTRACT.TESTNET;

export const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";

export const BSC_MIN_DEPOSIT = {
  BNB: 0.01,
  USDT: 10,
  USDC: 10,
};

export const BSC_REQUIRED_CONFIRMATIONS = 15;
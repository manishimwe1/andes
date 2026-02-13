import { BlockchainConfig, Network } from '@/types';

function envAny(...keys: string[]) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && v.length) return v;
  }
  return undefined;
}

const blockchainConfig: BlockchainConfig = {
  ethereum: {
    rpcUrl: envAny('ETHEREUM_RPC_URL', 'RPC_ETHEREUM', 'RPC_ETHEREUM_URL') || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    chainId: 1,
    tokenAddress: envAny('ETHEREUM_TOKEN_ADDRESS', 'TOKEN_ETHEREUM') || envAny('ETHEREUM_USDT_ADDRESS') || '',
    tokenAddresses: {
      USDT: envAny('ETHEREUM_USDT_ADDRESS', 'ETHEREUM_TOKEN_ADDRESS', 'ETH_USDT') || '',
      USDC: envAny('ETHEREUM_USDC_ADDRESS', 'ETHEREUM_USDC', 'ETH_USDC') || ''
    },
    requiredConfirmations: parseInt(envAny('ETHEREUM_CONFIRMATIONS', 'CONFIRMATIONS_ETHEREUM') || '12', 10)
  },
  bsc: {
    rpcUrl: envAny('BSC_RPC_URL', 'RPC_BSC', 'RPC_BSC_URL') || 'https://bsc-dataseed1.binance.org:8545',
    chainId: 56,
    tokenAddress: envAny('BSC_TOKEN_ADDRESS', 'TOKEN_BSC') || envAny('BSC_USDT_ADDRESS') || '',
    tokenAddresses: {
      USDT: envAny('BSC_USDT_ADDRESS', 'BSC_TOKEN_ADDRESS', 'BSC_USDT') || '',
      USDC: envAny('BSC_USDC_ADDRESS', 'BSC_USDC', 'BSC_USDC_ADDRESS') || ''
    },
    requiredConfirmations: parseInt(envAny('BSC_CONFIRMATIONS', 'CONFIRMATIONS_BSC') || '12', 10)
  },
  polygon: {
    rpcUrl: envAny('POLYGON_RPC_URL', 'RPC_POLYGON', 'RPC_POLYGON_URL') || 'https://polygon-rpc.com',
    chainId: 137,
    tokenAddress: envAny('POLYGON_TOKEN_ADDRESS', 'TOKEN_POLYGON') || envAny('POLYGON_USDT_ADDRESS') || '',
    tokenAddresses: {
      USDT: envAny('POLYGON_USDT_ADDRESS', 'POLYGON_TOKEN_ADDRESS', 'POLYGON_USDT') || '',
      USDC: envAny('POLYGON_USDC_ADDRESS', 'POLYGON_USDC', 'POLYGON_USDC_ADDRESS') || ''
    },
    requiredConfirmations: parseInt(envAny('POLYGON_CONFIRMATIONS', 'CONFIRMATIONS_POLYGON') || '128', 10)
  },
  tron: {
    rpcUrl: envAny('TRON_RPC_URL', 'RPC_TRON', 'RPC_TRON_URL') || 'https://api.tronstack.io',
    chainId: 0,
    tokenAddress: envAny('TRON_TOKEN_ADDRESS', 'TOKEN_TRON') || envAny('TRON_USDT_ADDRESS') || '',
    tokenAddresses: {
      USDT: envAny('TRON_USDT_ADDRESS', 'TRON_TOKEN_ADDRESS', 'TRON_USDT') || '',
      USDC: envAny('TRON_USDC_ADDRESS', 'TRON_USDC', 'TRON_USDC_ADDRESS') || ''
    },
    requiredConfirmations: parseInt(envAny('TRON_CONFIRMATIONS', 'CONFIRMATIONS_TRON') || '19', 10)
  }
};

const hdWalletConfig = {
  masterMnemonic: process.env.MASTER_MNEMONIC || '',
  passphrase: process.env.MASTER_PASSPHRASE
};

const appConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || '',
  tokenPriceFeedUrl: process.env.TOKEN_PRICE_FEED_URL || 'https://api.coingecko.com/api/v3',
  blockchainListenerInterval: parseInt(envAny('BLOCKCHAIN_LISTENER_INTERVAL', 'LISTENER_INTERVAL') || '30000', 10), // 30 seconds
  confirmationCheckInterval: parseInt(envAny('CONFIRMATION_CHECK_INTERVAL', 'CONFIRMATION_INTERVAL') || '60000', 10) // 1 minute
};

export { blockchainConfig, hdWalletConfig, appConfig };

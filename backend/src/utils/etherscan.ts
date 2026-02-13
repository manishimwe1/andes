import { SupportedNetwork } from '@/types';

const EXPLORER_BASE: { [key: string]: any } = {
  ethereum: {
    mainnet: 'https://api.etherscan.io/api',
    sepolia: 'https://api-sepolia.etherscan.io/api',
    goerli: 'https://api-goerli.etherscan.io/api'
  },
  polygon: {
    mainnet: 'https://api.polygonscan.com/api',
    mumbai: 'https://api-testnet.polygonscan.com/api'
  },
  bsc: {
    mainnet: 'https://api.bscscan.com/api',
    testnet: 'https://api-testnet.bscscan.com/api'
  }
};

function getExplorerBase(network: SupportedNetwork): string {
  // Allow optional env override for test/main selection
  if (network === 'polygon') {
    const net = (process.env.POLYGON_NETWORK || 'mainnet').toLowerCase();
    return EXPLORER_BASE.polygon[net] || EXPLORER_BASE.polygon.mainnet;
  }
  if (network === 'bsc') {
    const net = (process.env.BSC_NETWORK || 'mainnet').toLowerCase();
    return EXPLORER_BASE.bsc[net] || EXPLORER_BASE.bsc.mainnet;
  }
  // default to sepolia for ethereum if not specified
  const ethNet = (process.env.ETHEREUM_NETWORK || 'sepolia').toLowerCase();
  return EXPLORER_BASE.ethereum[ethNet] || EXPLORER_BASE.ethereum.sepolia;
}

function apiKeyFor(network: SupportedNetwork): string | undefined {
  switch (network) {
    case 'polygon':
      return process.env.POLYGONSCAN_API_KEY || process.env.POLYGONSCAN_API;
    case 'bsc':
      return process.env.BSCSCAN_API_KEY || process.env.BSCSCAN_API;
    case 'ethereum':
    default:
      return process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_API;
  }
}

export async function getLogsByTokenAndAddresses(
  network: SupportedNetwork,
  tokenAddress: string,
  fromBlock: number,
  toBlock: number,
  toAddresses: string[]
): Promise<any[]> {
  const base = getExplorerBase(network);
  const apikey = apiKeyFor(network);
  if (!apikey) throw new Error(`${network.toUpperCase()} explorer API key not configured`);

  // topic0 = Transfer event signature
  const topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  const results: any[] = [];
  for (const addr of toAddresses) {
    const topic2 = '0x' + addr.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const url = `${base}?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${tokenAddress}&topic0=${topic0}&topic2=${topic2}&apikey=${apikey}`;

    const res = await fetch(url);
    const json: any = await res.json();
    if (json && (json.status === '1' || json.status === 1) && Array.isArray(json.result)) {
      results.push(...json.result);
    }
  }

  return results;
}

export async function getTransactionReceiptViaExplorer(network: SupportedNetwork, txHash: string): Promise<any> {
  const base = getExplorerBase(network);
  const apikey = apiKeyFor(network);
  if (!apikey) throw new Error(`${network.toUpperCase()} explorer API key not configured`);

  const url = `${base}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${apikey}`;
  const res = await fetch(url);
  const json: any = await res.json();
  return json.result || null;
}

export default {
  getLogsByTokenAndAddresses,
  getTransactionReceiptViaExplorer
};

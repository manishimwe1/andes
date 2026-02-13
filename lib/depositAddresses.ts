/**
 * Platform deposit addresses for each supported network
 * These are the addresses where users send their funds for deposits
 */

const TRON_DEPOSIT_ADDRESS = process.env.NEXT_PUBLIC_TRON_DEPOSIT_ADDRESS || "TATMGTZSvXfGE5b1FzUSQiXvU9k2h3PqR7wYzA4LmN";

export const PLATFORM_DEPOSIT_ADDRESSES = {
  // Tron Network - TRC20 USDT
  trc20: {
    address: TRON_DEPOSIT_ADDRESS,
    token: "USDT",
    network: "Tron (TRC20)",
    minDeposit: 50,
    networkFee: "~0.1 TRX",
  },
  
  // BNB Smart Chain - BEP20 USDT
  bep20: {
    address: "0x55d398326f99059fF775485246999027B3197955", // USDT on BSC
    token: "USDT",
    network: "BNB Smart Chain (BEP20)",
    minDeposit: 1,
    networkFee: "~$0.50",
  },
  
  // Ethereum - ERC20 USDT
  erc20: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
    token: "USDT",
    network: "Ethereum (ERC20)",
    minDeposit: 10,
    networkFee: "Variable (~$5-50)",
  },
  
  // Polygon - ERC20 USDT
  polygon: {
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
    token: "USDT",
    network: "Polygon (ERC20)",
    minDeposit: 1,
    networkFee: "~$0.01",
  },
};

export type SupportedNetwork = keyof typeof PLATFORM_DEPOSIT_ADDRESSES;

/**
 * Get deposit details for a specific network
 */
export function getDepositAddress(network: SupportedNetwork) {
  return PLATFORM_DEPOSIT_ADDRESSES[network];
}

/**
 * Get all available networks
 */
export function getAvailableNetworks() {
  return Object.entries(PLATFORM_DEPOSIT_ADDRESSES).map(([key, value]) => ({
    id: key,
    label: value.network,
    token: value.token,
    minDeposit: value.minDeposit,
    fee: value.networkFee,
  }));
}

/**
 * Format address for display (shortened version)
 */
export function formatAddressForDisplay(address: string, chars: number = 6): string {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validate if an address looks correct for a network
 */
export function validateAddressFormat(address: string, network: SupportedNetwork): boolean {
  switch (network) {
    case "trc20":
      // Tron addresses start with T and are 34 chars
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    case "bep20":
    case "erc20":
    case "polygon":
      // Ethereum-based addresses are 0x hex strings
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    default:
      return false;
  }
}

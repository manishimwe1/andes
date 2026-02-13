// Minimal Etherscan helper for ERC20 transfer queries and validation
// Uses ETHERSCAN API to fetch token transfers for an address

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "CBYS4BWC7GNNNRD7XWY7MN2G17QH2FV823";
const ETHERSCAN_API_URL = process.env.ETHERSCAN_API_URL || "https://api.etherscan.io/api";

export interface ERC20Event {
  blockNumber: number;
  timeStamp: number;
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  value: string; // raw token value (no decimals applied)
  tokenDecimal: string;
  tokenSymbol: string;
}

export async function getERC20Transfers(
  address: string,
  contractAddress: string,
  page: number = 1,
  offset: number = 100
): Promise<ERC20Event[]> {
  try {
    const url = `${ETHERSCAN_API_URL}?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&page=${page}&offset=${offset}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== "1" || !Array.isArray(data.result)) return [];
    return data.result as ERC20Event[];
  } catch (err) {
    console.error('Error fetching ERC20 transfers:', err);
    return [];
  }
}

export async function validateERC20Transfer(
  toAddress: string,
  fromAddress: string,
  expectedAmountRaw: string, // raw token amount (no decimals applied)
  transactionHash: string,
  contractAddress: string
): Promise<boolean> {
  try {
    // Fetch the single transaction via Etherscan (txlist internal? we will fetch tokentx and search)
    const events = await getERC20Transfers(toAddress, contractAddress, 1, 200);
    const tx = events.find((e) => e.hash.toLowerCase() === transactionHash.toLowerCase());
    if (!tx) return false;
    if (tx.from.toLowerCase() !== fromAddress.toLowerCase()) return false;
    // Compare raw value strings (caller must supply same units)
    return tx.value === expectedAmountRaw;
  } catch (err) {
    console.error('Error validating ERC20 transfer:', err);
    return false;
  }
}

// lib/polygon/utils.ts
// Polygon blockchain utility functions
// Uses pure HTTP/axios calls + PolygonScan API

import axios from "axios";
import { ethers } from "ethers";
import {
  ACTIVE_POLYGON_NETWORK,
  ACTIVE_POLYGON_USDT,
  ACTIVE_POLYGON_USDC,
  POLYGONSCAN_API_KEY,
} from "./config";

// ─── EVM address generation (pure Node.js) ─────────────────

/**
 * Generate a new Polygon/EVM address
 * Uses ethers.js for standard compliance.
 */
export async function generatePolygonAddress(): Promise<{
  address: string;
  privateKey: string;
}> {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Validate a Polygon/EVM address format
 */
export function isValidPolygonAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// ─── Balance queries via JSON-RPC ────────────────────────────────────────────

async function rpcCall(method: string, params: any[]): Promise<any> {
  const rpcUrl =
    process.env.POLYGON_RPC_URL || ACTIVE_POLYGON_NETWORK.rpcUrl;

  const { data } = await axios.post(rpcUrl, {
    jsonrpc: "2.0",
    id: 1,
    method,
    params,
  });

  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`);
  }
  return data.result;
}

async function getPolygonBalance(address: string): Promise<number> {
  const result = await rpcCall("eth_getBalance", [address, "latest"]);
  return parseInt(result, 16) / 1e18;
}

async function getTokenBalance(
  tokenContract: string,
  walletAddress: string,
  decimals: number = 18
): Promise<number> {
  const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
  const data = "0x70a08231" + paddedAddress;

  const result = await rpcCall("eth_call", [
    { to: tokenContract, data },
    "latest",
  ]);

  return parseInt(result, 16) / Math.pow(10, decimals);
}

export async function getAccountBalance(address: string) {
  try {
    const [polygon, usdt, usdc] = await Promise.all([
      getPolygonBalance(address),
      getTokenBalance(ACTIVE_POLYGON_USDT, address, 18),
      getTokenBalance(ACTIVE_POLYGON_USDC, address, 18),
    ]);

    return { polygon, usdt, usdc, address };
  } catch (error) {
    console.error("Error fetching Polygon balance:", error);
    throw error;
  }
}

// ─── Transaction scanning via PolygonScan API ────────────────────────────────────

export interface PolygonTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  value: string;
  tokenDecimal: string;
  tokenSymbol: string;
  confirmations: string;
}

/**
 * Fetch token transfers for an address using eth_getLogs (RPC-based fallback)
 */
async function getLogsBasedTransfers(
  address: string,
  contractAddress: string,
  fromBlockOffset: number = 5000
): Promise<PolygonTokenTransfer[]> {
  const rpcUrl = process.env.POLYGON_RPC_URL || ACTIVE_POLYGON_NETWORK.rpcUrl;
  const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const paddedAddress = "0x" + address.toLowerCase().replace("0x", "").padStart(64, "0");

  try {
    const { data: blockData } = await axios.post(rpcUrl, {
      jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: []
    });
    const latestBlock = parseInt(blockData.result, 16);
    const fromBlock = "0x" + (latestBlock - fromBlockOffset).toString(16);

    const { data: logData } = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: 2,
      method: "eth_getLogs",
      params: [{
        fromBlock,
        toBlock: "latest",
        address: contractAddress,
        topics: [topicFilter, null, paddedAddress]
      }]
    });

    if (logData.error || !Array.isArray(logData.result)) {
      return [];
    }

    const now = Math.floor(Date.now() / 1000).toString();
    return logData.result.map((log: any) => ({
      hash: log.transactionHash,
      from: "0x" + log.topics[1].slice(26).toLowerCase(),
      to: address,
      contractAddress: contractAddress,
      value: BigInt(log.data).toString(),
      timeStamp: now,
      blockNumber: parseInt(log.blockNumber, 16).toString(),
      tokenDecimal: "6",
      tokenSymbol: contractAddress === ACTIVE_POLYGON_USDT ? "USDT" : "USDC",
      confirmations: (latestBlock - parseInt(log.blockNumber, 16)).toString()
    }));
  } catch (error: any) {
    console.error("[Polygon] RPC Logs Transfer fetch failed:", error.message);
    return [];
  }
}

async function getTokenTransfers(
  address: string,
  contractAddress: string,
  startBlock: number = 0
): Promise<PolygonTokenTransfer[]> {
  const apiKey = POLYGONSCAN_API_KEY;
  const apiUrl = ACTIVE_POLYGON_NETWORK.apiUrl;
  const chainId = ACTIVE_POLYGON_NETWORK.chainId;

  const url = `${apiUrl}?chainid=${chainId}&module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&startblock=${startBlock}&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;

  try {
    const { data } = await axios.get(url);
    if (data.status !== "1" || !Array.isArray(data.result)) {
      return [];
    }
    return data.result;
  } catch (error) {
    console.error("Error fetching PolygonScan token transfers:", error);
    return [];
  }
}

async function getNativeTransfers(
  address: string,
  startBlock: number = 0
): Promise<any[]> {
  const apiKey = POLYGONSCAN_API_KEY;
  const apiUrl = ACTIVE_POLYGON_NETWORK.apiUrl;
  const chainId = ACTIVE_POLYGON_NETWORK.chainId;

  const url = `${apiUrl}?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;

  try {
    const { data } = await axios.get(url);
    if (data.status !== "1" || !Array.isArray(data.result)) {
      return [];
    }
    return data.result;
  } catch (error) {
    console.error("Error fetching PolygonScan native transfers:", error);
    return [];
  }
}

export async function getNewTransactions(
  address: string,
  lastCheckTimestamp: number = 0
) {
  try {
    let [usdtTransfers, usdcTransfers, nativeTransfers] = await Promise.all([
      getTokenTransfers(address, ACTIVE_POLYGON_USDT),
      getTokenTransfers(address, ACTIVE_POLYGON_USDC),
      getNativeTransfers(address),
    ]);

    // Fallback if PolygonScan is failing
    if (usdtTransfers.length === 0) {
      usdtTransfers = await getLogsBasedTransfers(address, ACTIVE_POLYGON_USDT);
    }
    if (usdcTransfers.length === 0) {
      usdcTransfers = await getLogsBasedTransfers(address, ACTIVE_POLYGON_USDC);
    }

    const parsed: any[] = [];
    const minConfirmations = 15;

    // Parse USDT transfers
    for (const tx of usdtTransfers) {
      const timestamp = parseInt(tx.timeStamp) * 1000;
      if (timestamp <= lastCheckTimestamp) continue;
      if (tx.to.toLowerCase() !== address.toLowerCase()) continue;

      const decimals = parseInt(tx.tokenDecimal) || 18;
      const amount = parseInt(tx.value) / Math.pow(10, decimals);

      parsed.push({
        txHash: tx.hash,
        timestamp,
        type: "USDT",
        from: tx.from,
        to: tx.to,
        amount,
        confirmed: parseInt(tx.confirmations) >= minConfirmations,
      });
    }

    // Parse USDC transfers
    for (const tx of usdcTransfers) {
      const timestamp = parseInt(tx.timeStamp) * 1000;
      if (timestamp <= lastCheckTimestamp) continue;
      if (tx.to.toLowerCase() !== address.toLowerCase()) continue;

      const decimals = parseInt(tx.tokenDecimal) || 18;
      const amount = parseInt(tx.value) / Math.pow(10, decimals);

      parsed.push({
        txHash: tx.hash,
        timestamp,
        type: "USDC",
        from: tx.from,
        to: tx.to,
        amount,
        confirmed: parseInt(tx.confirmations) >= minConfirmations,
      });
    }

    // Parse native transfers (Incoming only)
    for (const tx of nativeTransfers) {
      const timestamp = parseInt(tx.timeStamp) * 1000;
      if (timestamp <= lastCheckTimestamp) continue;
      if (tx.to.toLowerCase() !== address.toLowerCase()) continue;
      if (tx.isError === "1") continue;

      const amount = parseInt(tx.value) / 1e18;
      if (amount <= 0) continue;

      parsed.push({
        txHash: tx.hash,
        timestamp,
        type: "POLYGON",
        from: tx.from,
        to: tx.to,
        amount,
        confirmed: parseInt(tx.confirmations) >= minConfirmations,
      });
    }

    const seen = new Set<string>();
    const unique = parsed.filter((tx) => {
      const key = tx.txHash + tx.type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique;
  } catch (error) {
    console.error("Error scanning Polygon transactions:", error);
    return [];
  }
}

/**
 * Normalize any EVM address to its correct EIP-55 checksum form.
 * ethers.js v6 strictly validates checksums on BOTH the `to` address
 * AND the contract address passed to ethers.Contract — so we must
 * checksum everything before use.
 */
function toChecksumAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch {
    throw new Error(`Invalid EVM address: ${address}`);
  }
}

/**
 * Send MATIC or ERC20 tokens on Polygon
 */
export async function sendPolygonTransaction(
  to: string,
  amount: number,
  type: "POLYGON" | "USDT" | "USDC"
): Promise<string> {
  const privateKey = process.env.POLYGON_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Missing POLYGON_PRIVATE_KEY");
  }

  // Normalize recipient address — fixes bad checksum errors regardless of
  // how the address was stored or entered (all-lowercase, wrong mixed-case, etc.)
  const toAddress = toChecksumAddress(to);

  const rpcUrl = process.env.POLYGON_RPC_URL || ACTIVE_POLYGON_NETWORK.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  if (type === "POLYGON") {
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: ethers.parseEther(amount.toString()),
    });
    return tx.hash;
  } else {
    // Normalize the contract address too — ethers.Contract validates it as well
    const contractAddress = toChecksumAddress(
      type === "USDT" ? ACTIVE_POLYGON_USDT : ACTIVE_POLYGON_USDC
    );

    const decimals = 6;

    const abi = ["function transfer(address to, uint256 amount) public returns (bool)"];
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    const amountInUnits = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(toAddress, amountInUnits);
    return tx.hash;
  }
}
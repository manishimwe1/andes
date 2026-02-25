// lib/bsc/utils.ts
// BSC blockchain utility functions — mirrors lib/tron/utils.ts
// Uses pure HTTP/axios calls + BscScan API (no ethers.js dependency)

import axios from "axios";
import { ethers } from "ethers";
import {
  ACTIVE_BSC_NETWORK,
  ACTIVE_BSC_USDT,
  ACTIVE_BSC_USDC,
  BSCSCAN_API_KEY,
} from "./config";

// ─── EVM address generation (pure Node.js, no ethers needed) ─────────────────

/**
 * Generate a new BSC/EVM address
 * Uses ethers.js for standard compliance.
 *
 * Returns: { address: string, privateKey: string }
 */
export async function generateBscAddress(): Promise<{
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
 * Validate a BSC/EVM address format
 */
export function isValidBscAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// ─── Balance queries via JSON-RPC ────────────────────────────────────────────

/**
 * Make a JSON-RPC call to BSC node
 */
async function rpcCall(method: string, params: any[]): Promise<any> {
  const rpcUrl =
    process.env.BSC_RPC_URL || ACTIVE_BSC_NETWORK.rpcUrl;

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

/**
 * Get BNB balance for an address
 */
async function getBnbBalance(address: string): Promise<number> {
  const result = await rpcCall("eth_getBalance", [address, "latest"]);
  // result is hex wei → convert to BNB (18 decimals)
  return parseInt(result, 16) / 1e18;
}

/**
 * Get BEP20 token balance for an address
 * Uses eth_call with the balanceOf(address) selector
 */
async function getTokenBalance(
  tokenContract: string,
  walletAddress: string,
  decimals: number = 18
): Promise<number> {
  // balanceOf(address) selector = 0x70a08231
  const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
  const data = "0x70a08231" + paddedAddress;

  const result = await rpcCall("eth_call", [
    { to: tokenContract, data },
    "latest",
  ]);

  return parseInt(result, 16) / Math.pow(10, decimals);
}

/**
 * Get account balance (BNB + USDT + USDC)
 */
export async function getAccountBalance(address: string) {
  try {
    const [bnb, usdt, usdc] = await Promise.all([
      getBnbBalance(address),
      getTokenBalance(ACTIVE_BSC_USDT, address, 18), // BSC USDT = 18 decimals
      getTokenBalance(ACTIVE_BSC_USDC, address, 18), // BSC USDC = 18 decimals
    ]);

    return { bnb, usdt, usdc, address };
  } catch (error) {
    console.error("Error fetching BSC balance:", error);
    throw error;
  }
}

// ─── Transaction scanning via BscScan API ────────────────────────────────────

export interface BscTokenTransfer {
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
 * Fetch BEP20 token transfers for an address using eth_getLogs (RPC-based fallback)
 */
async function getLogsBasedTransfers(
  address: string,
  contractAddress: string,
  fromBlockOffset: number = 1000 // ← reduced from 5000 to stay within public RPC limits
): Promise<BscTokenTransfer[]> {
  // ... rest unchanged

  const rpcUrl = process.env.BSC_RPC_URL || ACTIVE_BSC_NETWORK.rpcUrl;
  const topicFilter = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const paddedAddress = "0x" + address.toLowerCase().replace("0x", "").padStart(64, "0");

  try {
    // 1. Get current block number
    const { data: blockData } = await axios.post(rpcUrl, {
      jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: []
    });
    const latestBlock = parseInt(blockData.result, 16);
    const fromBlock = "0x" + (latestBlock - fromBlockOffset).toString(16);

    // 2. Fetch logs
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
      console.warn(`[BSC] RPC getLogs failed: ${logData.error?.message || 'Unknown error'}`);
      return [];
    }

    // 3. Map logs to BscTokenTransfer-like format
    const now = Math.floor(Date.now() / 1000).toString();
    return logData.result.map((log: any) => ({
      hash: log.transactionHash,
      from: "0x" + log.topics[1].slice(26).toLowerCase(), // recover from address from topic
      to: address,
      contractAddress: contractAddress,
      value: BigInt(log.data).toString(),
      timeStamp: now, // use current time as estimate
      blockNumber: parseInt(log.blockNumber, 16).toString(),
      tokenDecimal: "18", // Assume 18 for BSC USDT/USC
      tokenSymbol: contractAddress === ACTIVE_BSC_USDT ? "USDT" : "USDC",
      confirmations: (latestBlock - parseInt(log.blockNumber, 16)).toString()
    }));
  } catch (error: any) {
    console.error("[BSC] RPC Logs Transfer fetch failed:", error.message);
    return [];
  }
}

/**
 * Get new incoming transactions since lastCheckTimestamp
 * Mirrors getNewTransactions() from lib/tron/utils.ts
 */
export async function getNewTransactions(
  address: string,
  lastCheckTimestamp: number = 0
) {
  try {

    // Fetch both USDT and USDC token transfers + native BNB transfers
    console.log("address", address);

    let [usdtTransfers, usdcTransfers, nativeTransfers] = await Promise.all([
      getTokenTransfers(address, ACTIVE_BSC_USDT),
      getTokenTransfers(address, ACTIVE_BSC_USDC),
      getNativeTransfers(address),
    ]);

    // Fallback if BscScan is failing (deprecated/paid)
    if (usdtTransfers.length === 0) {
      console.log(`ℹ️ [BSC] USDT BscScan failed, trying RPC fallback...`);
      usdtTransfers = await getLogsBasedTransfers(address, ACTIVE_BSC_USDT);
    }
    if (usdcTransfers.length === 0) {
      console.log(`ℹ️ [BSC] USDC BscScan failed, trying RPC fallback...`);
      usdcTransfers = await getLogsBasedTransfers(address, ACTIVE_BSC_USDC);
    }

    console.log("usdtTransfers", usdtTransfers);
    console.log("usdcTransfers", usdcTransfers);
    console.log("nativeTransfers", nativeTransfers);

    const lastCheckSeconds = Math.floor(lastCheckTimestamp / 1000);
    const parsed: any[] = [];

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
        confirmed: parseInt(tx.confirmations) >= 15,
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
        confirmed: parseInt(tx.confirmations) >= 15,
      });
    }

    // Parse native BNB transfers (incoming only)
    for (const tx of nativeTransfers) {
      const timestamp = parseInt(tx.timeStamp) * 1000;
      if (timestamp <= lastCheckTimestamp) continue;
      if (tx.to.toLowerCase() !== address.toLowerCase()) continue;
      if (tx.isError === "1") continue; // skip failed txs

      const amount = parseInt(tx.value) / 1e18; // BNB has 18 decimals
      if (amount <= 0) continue;

      parsed.push({
        txHash: tx.hash,
        timestamp,
        type: "BNB",
        from: tx.from,
        to: tx.to,
        amount,
        confirmed: parseInt(tx.confirmations) >= 15,
      });
    }

    // De-duplicate by txHash (a tx could appear in multiple queries)
    const seen = new Set<string>();
    const unique = parsed.filter((tx) => {
      const key = tx.txHash + tx.type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique;
  } catch (error) {
    console.error("Error scanning BSC transactions:", error);
    return [];
  }
}

/**
 * Send BNB or BEP20 tokens on BSC
 */
export async function sendBscTransaction(
  to: string,
  amount: number,
  type: "BNB" | "USDT" | "USDC"
): Promise<string> {
  const privateKey = process.env.BSC_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Missing BSC_PRIVATE_KEY");
  }

  const rpcUrl = process.env.BSC_RPC_URL || ACTIVE_BSC_NETWORK.rpcUrl;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  if (type === "BNB") {
    // Send Native BNB
    const tx = await wallet.sendTransaction({
      to: ethers.getAddress(to),
      value: ethers.parseEther(amount.toString()),
    });
    return tx.hash;
  } else {
    // Send BEP20 (USDT or USDC)
    const contractAddress =
      type === "USDT" ? ACTIVE_BSC_USDT : ACTIVE_BSC_USDC;

    // USDT/USDC on BSC typically have 18 decimals (unlike Ethereum/Polygon Mainnet which use 6)
    // But let's check decimals dynamically if possible, or use standard for BSC.
    // Our getTokenBalance uses 18 for BSC USDT/USDC.
    const decimals = 18;

    const abi = ["function transfer(address to, uint256 amount) public returns (bool)"];
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    const amountInUnits = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(ethers.getAddress(to), amountInUnits);
    return tx.hash;
  }
}


async function getTokenTransfers(
  address: string,
  contractAddress: string,
  startBlock: number = 0
): Promise<BscTokenTransfer[]> {
  const apiKey = BSCSCAN_API_KEY;
  const apiUrl = ACTIVE_BSC_NETWORK.apiUrl;
  const chainId = ACTIVE_BSC_NETWORK.chainId;

  // V2 API requires chainid parameter
  const url = `${apiUrl}?chainid=${chainId}&module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&startblock=${startBlock}&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;

  console.log(`[BSC] tokentx URL: ${url}`);

  try {
    const { data } = await axios.get(url);
    if (data.status !== "1") {
      console.log(`⚠️ [BSC] BscScan API (tokentx) returned status ${data.status} for ${address}: ${data.message || 'No message'}. Error: ${JSON.stringify(data.result)}`);
      return [];
    }
    return data.result;
  } catch (error: any) {
    console.error("Error fetching BscScan token transfers:", error.message);
    return [];
  }
}



async function getNativeTransfers(
  address: string,
  startBlock: number = 0
): Promise<any[]> {
  const apiKey = BSCSCAN_API_KEY;
  const apiUrl = ACTIVE_BSC_NETWORK.apiUrl;
  const chainId = ACTIVE_BSC_NETWORK.chainId;

  // V2 API requires chainid parameter
  const url = `${apiUrl}?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;

  console.log(`[BSC] txlist URL: ${url}`);

  try {
    const { data } = await axios.get(url);
    if (data.status !== "1") {
      console.log(`⚠️ [BSC] BscScan API (txlist) returned status ${data.status} for ${address}: ${data.message || 'No message'}. Error: ${JSON.stringify(data.result)}`);
      return [];
    }
    return data.result;
  } catch (error: any) {
    console.error("Error fetching BscScan native transfers:", error.message);
    return [];
  }
}
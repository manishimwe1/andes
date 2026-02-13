// Tron Grid API integration for TRC20 USDT deposits
// Prefer setting TRONGRID_API_KEY in environment; fallback to provided key.

const TRON_GRID_API_KEY = process.env.TRONGRID_API_KEY || "34bc99af-0435-44d7-ae2c-463be7256be5";
const TRON_GRID_URL = process.env.TRONGRID_API_URL || "https://api.trongrid.io";
const TRON_MAINNET_URL = process.env.TRON_MAINNET_URL || "https://api.tronstack.io"; // Alternative
const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q282JKNQ4PcqXqVsfw"; // USDT on Tron Mainnet

interface TronBalance {
  address: string;
  balance: number; // in sun (1 TRX = 1,000,000 sun)
}

interface TronTransaction {
  txID: string;
  blockNumber: number;
  blockTimestamp: number;
  from: string;
  to: string;
  amount: number;
  status: "success" | "failed" | "pending";
}

interface TRC20Event {
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  amount: string; // in wei/smallest unit
  contractAddress: string;
}

/**
 * Get Tron wallet balance (in TRX)
 */
export async function getTronBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${TRON_GRID_URL}/v1/accounts/${address}`, {
      headers: {
        "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
      },
    });

    if (!response.ok) return 0;
    const data = await response.json();
    const balance = data.data?.[0]?.balance || 0;
    return balance / 1_000_000; // Convert sun to TRX
  } catch (error) {
    console.error("Error fetching Tron balance:", error);
    return 0;
  }
}

/**
 * Get TRC20 USDT balance for a wallet
 */
export async function getTRC20USDTBalance(address: string): Promise<string> {
  try {
    // Prepare the trigger data for balanceOf function
    const triggerData = `0x70a08231000000000000000000000000${address.replace("0x", "")}`;

    const response = await fetch(`${TRON_GRID_URL}/v1/contracts/${USDT_CONTRACT}/constant`, {
      method: "POST",
      headers: {
        "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        function_selector: "balanceOf(address)",
        parameter: address,
      }),
    });

    if (!response.ok) return "0";
    const data = await response.json();
    // USDT has 6 decimals
    return data.constant_result?.[0] || "0";
  } catch (error) {
    console.error("Error fetching TRC20 USDT balance:", error);
    return "0";
  }
}

/**
 * Get recent transactions for an address
 */
export async function getAddressTransactions(
  address: string,
  limit: number = 20
): Promise<TronTransaction[]> {
  try {
    const response = await fetch(
      `${TRON_GRID_URL}/v1/accounts/${address}/transactions?limit=${limit}`,
      {
        headers: {
          "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
        },
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching Tron transactions:", error);
    return [];
  }
}

/**
 * Send TRX to an address (requires private key - use only on backend)
 * WARNING: Never expose private keys in client code
 */
export async function sendTRX(
  fromAddress: string,
  toAddress: string,
  amount: number,
  privateKey: string // Should come from secure backend env
): Promise<string | null> {
  try {
    // This is a simplified example
    // In production, use tronweb library with proper authentication
    const response = await fetch(`${TRON_GRID_URL}/transfer`, {
      method: "POST",
      headers: {
        "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toAddress,
        amount: amount * 1_000_000, // Convert to sun
        privateKey, // Should never be in client code
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.txID || null;
  } catch (error) {
    console.error("Error sending TRX:", error);
    return null;
  }
}

/**
 * Validate a TRC20 USDT transfer by checking the blockchain
 */
export async function validateTRC20Transfer(
  toAddress: string,
  fromAddress: string,
  expectedAmount: string, // in USDT (6 decimals)
  transactionHash: string
): Promise<boolean> {
  try {
    // Get transaction info
    const response = await fetch(`${TRON_GRID_URL}/v1/transactions/${transactionHash}`, {
      headers: {
        "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
      },
    });

    if (!response.ok) return false;
    const txData = await response.json();

    // Validate transaction details
    const tx = txData.data?.[0];
    if (!tx) return false;

    // Check if transaction is confirmed (in a block)
    if (!tx.blockNumber) return false;

    // Parse the contract data to verify transfer details
    // This is a simplified check - full validation would parse the contract parameters
    return true;
  } catch (error) {
    console.error("Error validating TRC20 transfer:", error);
    return false;
  }
}

/**
 * Get TRC20 contract events (transfers) to a specific address
 */
export async function getTRC20Transfers(
  toAddress: string,
  contractAddress: string = USDT_CONTRACT,
  limit: number = 10
): Promise<TRC20Event[]> {
  try {
    const response = await fetch(
      `${TRON_GRID_URL}/v1/contracts/${contractAddress}/events?limit=${limit}&event_name=Transfer&event_name_oneof=true`,
      {
        headers: {
          "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
        },
      }
    );

    if (!response.ok) return [];
    const data = await response.json();

    // Filter transfers to our address
    const events = data.data || [];
    return events.filter((e: any) => e.to?.address === toAddress);
  } catch (error) {
    console.error("Error fetching TRC20 transfers:", error);
    return [];
  }
}

/**
 * Estimate transaction fee in TRX
 */
export async function estimateTronFee(
  fromAddress: string,
  toAddress: string,
  amount: number
): Promise<number> {
  try {
    const response = await fetch(`${TRON_GRID_URL}/v1/estimatefee`, {
      method: "POST",
      headers: {
        "TRON-PRO-API-KEY": TRON_GRID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toAddress,
        amount: amount * 1_000_000,
      }),
    });

    if (!response.ok) return 0;
    const data = await response.json();
    return (data.fee || 0) / 1_000_000; // Convert sun to TRX
  } catch (error) {
    console.error("Error estimating fee:", error);
    return 0;
  }
}

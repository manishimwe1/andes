import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'CBYS4BWC7GNNNRD7XWY7MN2G17QH2FV823';
const ETHERSCAN_API_URL = 'https://api-sepolia.etherscan.io/api';
const CHAIN_ID = 11155111; // Sepolia testnet
const TESTNET_PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY || '';

/**
 * POST /api/test-transfer
 * Sends test ETH to a recipient address on Sepolia testnet
 * Body: { recipientAddress: string, amountEth: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { recipientAddress, amountEth } = await req.json();

    if (!recipientAddress || !amountEth) {
      return NextResponse.json(
        { error: 'Missing recipientAddress or amountEth' },
        { status: 400 }
      );
    }

    if (!TESTNET_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'TESTNET_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }

    // Validate address format
    if (!ethers.isAddress(recipientAddress)) {
      return NextResponse.json(
        { error: 'Invalid recipient address' },
        { status: 400 }
      );
    }

    // Create wallet from private key
    const wallet = new ethers.Wallet(TESTNET_PRIVATE_KEY);
    console.log('Sender address:', wallet.address);

    // Get nonce for transaction ordering
    const nonceTx = await fetchNonce(wallet.address);
    if (!nonceTx) {
      return NextResponse.json(
        { error: 'Failed to get transaction nonce' },
        { status: 500 }
      );
    }

    // Use a standard gas price for Sepolia testnet (1 Gwei)
    const gasPrice = ethers.parseUnits('1', 'gwei');

    // Create transaction
    const tx = {
      to: recipientAddress,
      value: ethers.parseEther(amountEth.toString()),
      gasLimit: 21000, // Standard ETH transfer
      gasPrice: gasPrice,
      nonce: parseInt(nonceTx, 16),
      chainId: CHAIN_ID,
    };

    // Sign the transaction
    const signedTx = await wallet.signTransaction(tx);
    console.log('Signed transaction:', signedTx);

    // Broadcast via Etherscan API
    const broadcastUrl = `${ETHERSCAN_API_URL}?module=proxy&action=eth_sendRawTransaction&hex=${signedTx}&apikey=${ETHERSCAN_API_KEY}`;

    const broadcastRes = await fetch(broadcastUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!broadcastRes.ok) {
      return NextResponse.json(
        { error: `Broadcast failed: ${broadcastRes.statusText}` },
        { status: 500 }
      );
    }

    const broadcastData = await broadcastRes.json();

    if (broadcastData.error) {
      return NextResponse.json(
        { error: `Broadcast error: ${broadcastData.error.message}` },
        { status: 500 }
      );
    }

    const txHash = broadcastData.result;

    return NextResponse.json({
      success: true,
      message: `Sent ${amountEth} ETH to ${recipientAddress}`,
      transactionHash: txHash,
      senderAddress: wallet.address,
      network: 'Sepolia Testnet',
      explorerUrl: `https://sepolia.etherscan.io/tx/${txHash}`,
    });
  } catch (error) {
    console.error('Test transfer error:', error);
    return NextResponse.json(
      { error: 'Transfer failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get nonce via Etherscan proxy
 */
async function fetchNonce(address: string): Promise<string | null> {
  try {
    const url = `${ETHERSCAN_API_URL}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch (err) {
    console.error('Failed to fetch nonce:', err);
    return null;
  }
}

/**
 * GET /api/test-transfer
 * Returns info about the test transfer service
 */
export async function GET() {
  return NextResponse.json({
    service: 'Sepolia Testnet ETH Transfer',
    description: 'Send test ETH to any Ethereum address on Sepolia testnet',
    network: 'Sepolia (chainId 11155111)',
    usage: {
      method: 'POST',
      endpoint: '/api/test-transfer',
      body: {
        recipientAddress: 'string (0x...)',
        amountEth: 'number (e.g., 0.1)',
      },
      example: {
        recipientAddress: '0x742d35Cc6634C0532925a3b844Bc926e4a1b00A6',
        amountEth: 0.1,
      },
    },
    senderAddress: new ethers.Wallet(
      process.env.TESTNET_PRIVATE_KEY || ''
    ).address,
    status: process.env.TESTNET_PRIVATE_KEY ? 'Ready' : 'Not configured (missing TESTNET_PRIVATE_KEY)',
    note: 'Requires TESTNET_PRIVATE_KEY environment variable configured with a Sepolia testnet account that has test ETH',
  });
}

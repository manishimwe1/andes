import { ethers } from 'ethers';
import TronWeb from 'tronweb';
import logger from '@/config/logger';
import { Network, SupportedNetwork, TokenPrice } from '@/types';
import { blockchainConfig } from '@/config';

/**
 * Utilities for blockchain interactions
 */

/**
 * Get provider for EVM networks
 */
export function getEVMProvider(network: SupportedNetwork): ethers.JsonRpcProvider {
  const config = blockchainConfig[network.toLowerCase() as keyof typeof blockchainConfig];
  if (!config) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  return provider;
}

/**
 * Get Tron Web instance
 */
export function getTronWeb(): TronWeb {
  const tronWeb = new TronWeb({
    fullHost: blockchainConfig.tron.rpcUrl,
    headers: { 'ALLO': 'test' },
    privateKey: process.env.TRON_PRIVATE_KEY // For signing transactions if needed
  });

  return tronWeb;
}

/**
 * Check if address is valid for network
 */
export function isValidAddress(address: string, network: SupportedNetwork): boolean {
  try {
    if (network === Network.TRON) {
      return TronWeb.isAddress(address);
    } else {
      return ethers.isAddress(address);
    }
  } catch {
    return false;
  }
}

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address: string, network: SupportedNetwork): string {
  if (!isValidAddress(address, network)) {
    throw new Error(`Invalid ${network} address: ${address}`);
  }
  return address.toLowerCase();
}

/**
 * Get transaction receipt with retries
 */
export async function getTransactionReceiptWithRetries(
  txHash: string,
  network: SupportedNetwork,
  maxRetries: number = 5,
  delayMs: number = 2000
): Promise<ethers.TransactionReceipt | null> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const provider = getEVMProvider(network);
      const receipt = await provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  logger.warn('Failed to get transaction receipt after retries', {
    txHash,
    network,
    error: lastError?.message
  });

  return null;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransactionConfirmation(
  txHash: string,
  network: SupportedNetwork,
  requiredConfirmations: number = 12,
  timeoutMs: number = 600000 // 10 minutes default
): Promise<ethers.TransactionReceipt | null> {
  const startTime = Date.now();
  const provider = getEVMProvider(network);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);

      if (receipt) {
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt.blockNumber;

        if (confirmations >= requiredConfirmations) {
          return receipt;
        }
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
    } catch (error) {
      logger.warn('Error checking confirmation status', {
        txHash,
        network,
        error: error instanceof Error ? error.message : String(error)
      });

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  logger.error('Transaction confirmation timeout', {
    txHash,
    network,
    timeout: timeoutMs
  });

  return null;
}

/**
 * Get balance of address for ERC20 token
 */
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string,
  network: SupportedNetwork,
  decimals: number = 18
): Promise<string> {
  try {
    const provider = getEVMProvider(network);

    const ERC20_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)'
    ];

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(userAddress);

    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    logger.error('Failed to get token balance', error, {
      tokenAddress,
      userAddress,
      network
    });
    throw error;
  }
}

/**
 * Get current gas price for network
 */
export async function getGasPrice(network: SupportedNetwork): Promise<string> {
  try {
    const provider = getEVMProvider(network);
    const feeData = await provider.getFeeData();

    if (feeData.gasPrice) {
      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    }

    throw new Error('Unable to fetch gas price');
  } catch (error) {
    logger.error('Failed to get gas price', error, { network });
    throw error;
  }
}

/**
 * Estimate token transfer gas
 */
export async function estimateTokenTransferGas(
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  network: SupportedNetwork,
  decimals: number = 18
): Promise<string> {
  try {
    const provider = getEVMProvider(network);

    const ERC20_ABI = [
      'function transfer(address to, uint256 amount) public returns (bool)'
    ];

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const amountBN = ethers.parseUnits(amount, decimals);

    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountBN, {
      from: fromAddress
    });

    return gasEstimate.toString();
  } catch (error) {
    logger.error('Failed to estimate gas', error, {
      tokenAddress,
      amount,
      network
    });

    // Return default estimate on error
    return '100000';
  }
}

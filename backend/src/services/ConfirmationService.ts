import logger, { logError } from '@/config/logger';
import { Deposit } from '@/models';
import { DepositService } from './DepositService';
import { SupportedNetwork, DepositStatus } from '@/types';
import {
  getTransactionReceiptWithRetries,
  getEVMProvider
} from '@/utils/blockchain';
import { getTronWeb } from '@/utils/blockchain';
import etherscan from '@/utils/etherscan';
import { blockchainConfig } from '@/config';

/**
 * Service for checking and updating deposit confirmations
 */
export class ConfirmationService {
  private depositService: DepositService;

  constructor(depositService: DepositService) {
    this.depositService = depositService;
  }

  /**
   * Check confirmations for pending deposits
   */
  async checkPendingDepositsConfirmations(): Promise<void> {
    try {
      // Get all pending deposits
      const pendingResult = await this.depositService.getPendingDeposits();

      if (!pendingResult.success || !pendingResult.data) {
        logger.warn('Failed to get pending deposits for confirmation check');
        return;
      }

      const deposits = pendingResult.data;

      logger.info('Checking confirmations for pending deposits', {
        count: deposits.length
      });

      // Process each deposit
      for (const deposit of deposits) {
        try {
          await this.checkDepositConfirmation(deposit._id, deposit.network, deposit.txHash);
        } catch (error) {
          logError('Error checking deposit confirmation', error, {
            depositId: deposit._id,
            txHash: deposit.txHash
          });
        }
      }
    } catch (error) {
      logError('Failed to check pending deposits', error);
    }
  }

  /**
   * Check confirmation status for a specific deposit
   */
  async checkDepositConfirmation(
    depositId: string,
    network: SupportedNetwork,
    txHash: string
  ): Promise<number> {
    try {
      // Handle Tron separately (TronWeb)
      if (network === 'tron') {
        try {
          const tronWeb = getTronWeb();
          const info: any = await tronWeb.trx.getTransactionInfo(txHash);

          if (!info || !info.blockNumber) {
            // increment retry or mark failed later
            const deposit = await Deposit.findById(depositId);
            if (deposit && deposit.retryCount > 10) {
              await this.depositService.markDepositAsFailed(
                depositId,
                'Tron transaction not found after multiple retries'
              );
              await this.depositService.incrementRetryCount(depositId);
            } else {
              await this.depositService.incrementRetryCount(depositId);
            }

            return 0;
          }

          const txStatus = Array.isArray(info.ret) ? (info.ret[0].contractRet === 'SUCCESS') : (info.receipt && info.receipt.result === 'SUCCESS');

          if (!txStatus) {
            await this.depositService.markDepositAsFailed(depositId, 'Tron transaction execution reverted');
            return 0;
          }

          // For Tron, approximate confirmations by assuming confirmed when present on chain
          const confirmations = info.confirmations || blockchainConfig.tron.requiredConfirmations || 1;

          await this.depositService.updateDepositConfirmation(depositId, confirmations, info);

          return confirmations;
        } catch (err) {
          logError('Tron receipt fetch failed', err, { txHash, depositId });
          await this.depositService.incrementRetryCount(depositId);
          return 0;
        }
      }

      const provider = getEVMProvider(network);

      // Get transaction receipt (provider)
      let receipt: any = await getTransactionReceiptWithRetries(txHash, network);

      // Fallback to Etherscan if provider couldn't fetch receipt (useful for testnets/providers)
      if (!receipt) {
        try {
          const esReceipt = await etherscan.getTransactionReceiptViaExplorer(network, txHash);
          if (esReceipt) {
            // Normalize Etherscan receipt fields to match ethers.TransactionReceipt shape
            receipt = {
              transactionHash: esReceipt.transactionHash || txHash,
              blockNumber: typeof esReceipt.blockNumber === 'string' && esReceipt.blockNumber.startsWith('0x') ? parseInt(esReceipt.blockNumber, 16) : Number(esReceipt.blockNumber),
              status: esReceipt.status === '0x1' || esReceipt.status === 1 || esReceipt.status === '1',
              logs: esReceipt.logs || [],
              gasUsed: esReceipt.gasUsed,
              contractAddress: esReceipt.contractAddress
            } as any;
          }
        } catch (esErr) {
          // ignore and continue handling null receipt
        }
      }

      if (!receipt) {
        logger.debug('Transaction receipt not found, might not be confirmed', {
          txHash,
          network
        });

        // If receipt not found but transaction is old, might have failed
        const deposit = await Deposit.findById(depositId);
        if (deposit && deposit.retryCount > 10) {
          await this.depositService.markDepositAsFailed(
            depositId,
            'Transaction receipt not found after multiple retries'
          );
          await this.depositService.incrementRetryCount(depositId);
        } else {
          await this.depositService.incrementRetryCount(depositId);
        }

        return 0;
      }

      // Check transaction status
      const txStatus = typeof receipt.status === 'string' ? (receipt.status === '0x1' || receipt.status === '1') : Boolean(receipt.status);
      if (!txStatus) {
        logger.warn('Transaction failed', {
          txHash,
          network,
          depositId
        });

        await this.depositService.markDepositAsFailed(
          depositId,
          'Transaction execution reverted'
        );

        return 0;
      }

      // Calculate confirmations
      const currentBlockNumber = await provider.getBlockNumber();
      const receiptBlockNumber = typeof receipt.blockNumber === 'string' ? (receipt.blockNumber.startsWith('0x') ? parseInt(receipt.blockNumber, 16) : parseInt(receipt.blockNumber, 10)) : receipt.blockNumber;
      const confirmations = currentBlockNumber - receiptBlockNumber;

      logger.debug('Transaction confirmations updated', {
        depositId,
        txHash,
        confirmations,
        requiredConfirmations: (await Deposit.findById(depositId))?.requiredConfirmations
      });

      // Update deposit in database
      await this.depositService.updateDepositConfirmation(depositId, confirmations, receipt);

      return confirmations;
    } catch (error) {
      logError('Failed to check deposit confirmation', error, {
        depositId,
        txHash,
        network
      });

      await this.depositService.incrementRetryCount(depositId);

      return 0;
    }
  }

  /**
   * Check confirmations for all deposits of a specific status
   */
  async checkDepositsWithStatus(status: DepositStatus): Promise<number> {
    try {
      const deposits = await Deposit.find({ status, retryCount: { $lt: 5 } });

      if (deposits.length === 0) {
        return 0;
      }

      logger.info('Checking confirmations for deposits with status', {
        status,
        count: deposits.length
      });

      let updated = 0;

      for (const deposit of deposits) {
        try {
          const confirmations = await this.checkDepositConfirmation(
            deposit._id.toString(),
            deposit.network,
            deposit.txHash
          );

          if (confirmations > 0) {
            updated++;
          }
        } catch (error) {
          logError('Error updating deposit status', error, {
            depositId: deposit._id,
            txHash: deposit.txHash
          });
        }
      }

      logger.info('Completed confirmation check', {
        status,
        checkedCount: deposits.length,
        updatedCount: updated
      });

      return updated;
    } catch (error) {
      logError('Failed to check deposits with status', error, { status });
      return 0;
    }
  }

  /**
   * Get current block number for a network
   */
  async getCurrentBlockNumber(network: SupportedNetwork): Promise<number> {
    try {
      const provider = getEVMProvider(network);
      const blockNumber = await provider.getBlockNumber();
      return blockNumber;
    } catch (error) {
      logError('Failed to get current block number', error, { network });
      throw error;
    }
  }

  /**
   * Estimate time until confirmation based on block time
   */
  estimateConfirmationTime(
    currentConfirmations: number,
    requiredConfirmations: number,
    network: SupportedNetwork
  ): number {
    const blockTimes: { [key in SupportedNetwork]: number } = {
      ethereum: 12000, // ~12 seconds
      bsc: 3000, // ~3 seconds
      polygon: 2000, // ~2 seconds
      tron: 3000 // ~3 seconds
    };

    const blockTime = blockTimes[network];
    const remainingConfirmations = Math.max(0, requiredConfirmations - currentConfirmations);

    return remainingConfirmations * blockTime; // milliseconds
  }
}

/**
 * Factory function to create service
 */
export function createConfirmationService(depositService: DepositService): ConfirmationService {
  return new ConfirmationService(depositService);
}

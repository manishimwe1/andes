import { Deposit, User } from '@/models';
import logger, { logError } from '@/config/logger';
import {
  ServiceResponse,
  DepositProcessingResponse,
  IDeposit,
  SupportedNetwork,
  DepositStatus,
  TokenTransfer
} from '@/types';
import { formatSuccessResponse, formatErrorResponse, formatWeiToToken } from '@/utils/helpers';
import { getTokenBalance } from '@/utils/blockchain';
import { blockchainConfig } from '@/config';

/**
 * Service for processing and managing deposits
 */
export class DepositService {
  /**
   * Record a deposit transaction
   */
  async recordDeposit(
    userId: string,
    userEmail: string,
    network: SupportedNetwork,
    transfer: TokenTransfer,
    amountUSD: number,
    requiredConfirmations: number
  ): Promise<ServiceResponse<IDeposit>> {
    try {
      // Check if deposit already exists (prevent double-credit)
      const existing = await Deposit.findOne({ txHash: transfer.txHash });
      if (existing) {
        logger.warn('Duplicate deposit attempt', {
          userId,
          txHash: transfer.txHash,
          network
        });

        return formatSuccessResponse(existing.toObject() as IDeposit);
      }

      // Get token config
      const networkConfig = blockchainConfig[network.toLowerCase() as keyof typeof blockchainConfig];
      if (!networkConfig) {
        return formatErrorResponse(`Unsupported network: ${network}`, 400, 'INVALID_NETWORK');
      }

      // Create deposit record
      const deposit = new Deposit({
        userId,
        userEmail,
        network,
        tokenAddress: transfer.tokenAddress.toLowerCase(),
        tokenSymbol: this.getTokenSymbolForAddress(network, transfer.tokenAddress),
        tokenDecimals: 18, // Default, should be fetched from token contract
        txHash: transfer.txHash.toLowerCase(),
        amount: transfer.amount,
        amountUSD,
        toAddress: transfer.to.toLowerCase(),
        fromAddress: transfer.from.toLowerCase(),
        confirmations: 0,
        requiredConfirmations,
        status: DepositStatus.PENDING,
        retryCount: 0
      });

      await deposit.save();

      logger.info('Deposit recorded', {
        depositId: deposit._id,
        userId,
        network,
        txHash: transfer.txHash,
        amount: transfer.amount
      });

      return formatSuccessResponse(deposit.toObject() as IDeposit);
    } catch (error) {
      logError('Failed to record deposit', error, {
        userId,
        network,
        txHash: transfer.txHash
      });

      return formatErrorResponse('Failed to record deposit', 500, 'DEPOSIT_RECORDING_FAILED');
    }
  }

  /**
   * Update deposit with transaction receipt and confirmation count
   */
  async updateDepositConfirmation(
    depositId: string,
    confirmations: number,
    transactionReceipt?: any
  ): Promise<ServiceResponse<IDeposit>> {
    try {
      const deposit = await Deposit.findById(depositId);

      if (!deposit) {
        return formatErrorResponse('Deposit not found', 404, 'DEPOSIT_NOT_FOUND');
      }

      // Update confirmations
      deposit.confirmations = confirmations;

      if (transactionReceipt) {
        deposit.transactionReceipt = transactionReceipt;
      }

      // Check if confirmation threshold reached
      if (confirmations >= deposit.requiredConfirmations && deposit.status === DepositStatus.PENDING) {
        deposit.status = DepositStatus.CONFIRMED;
        deposit.confirmedAt = new Date();

        // Update user balance
        await this.creditUserBalance(deposit.userId, deposit.network, deposit.amount);

        logger.info('Deposit confirmed', {
          depositId,
          userId: deposit.userId,
          network: deposit.network,
          confirmations,
          amount: deposit.amount
        });
      }

      await deposit.save();

      return formatSuccessResponse(deposit.toObject() as IDeposit);
    } catch (error) {
      logError('Failed to update deposit confirmation', error, {
        depositId
      });

      return formatErrorResponse('Failed to update deposit', 500, 'UPDATE_FAILED');
    }
  }

  /**
   * Mark deposit as failed
   */
  async markDepositAsFailed(
    depositId: string,
    errorMessage: string
  ): Promise<ServiceResponse<IDeposit>> {
    try {
      const deposit = await Deposit.findByIdAndUpdate(
        depositId,
        {
          status: DepositStatus.FAILED,
          errorMessage,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!deposit) {
        return formatErrorResponse('Deposit not found', 404, 'DEPOSIT_NOT_FOUND');
      }

      logger.warn('Deposit marked as failed', {
        depositId,
        userId: deposit.userId,
        error: errorMessage
      });

      return formatSuccessResponse(deposit.toObject() as IDeposit);
    } catch (error) {
      logError('Failed to mark deposit as failed', error, { depositId });
      return formatErrorResponse('Failed to mark deposit', 500, 'UPDATE_FAILED');
    }
  }

  /**
   * Get user deposits
   */
  async getUserDeposits(
    userId: string,
    network?: SupportedNetwork,
    limit: number = 50,
    skip: number = 0
  ): Promise<ServiceResponse<{ deposits: IDeposit[]; total: number }>> {
    try {
      const query: any = { userId };

      if (network) {
        query.network = network;
      }

      const deposits = await Deposit.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Deposit.countDocuments(query);

      return formatSuccessResponse({
        deposits: deposits.map(d => d.toObject() as IDeposit),
        total
      });
    } catch (error) {
      logError('Failed to get user deposits', error, { userId, network });
      return formatErrorResponse('Failed to retrieve deposits', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Get recent deposits for a network
   */
  async getRecentDeposits(
    network: SupportedNetwork,
    limit: number = 100
  ): Promise<ServiceResponse<IDeposit[]>> {
    try {
      const deposits = await Deposit.find({ network })
        .sort({ createdAt: -1 })
        .limit(limit);

      return formatSuccessResponse(deposits.map(d => d.toObject() as IDeposit));
    } catch (error) {
      logError('Failed to get recent deposits', error, { network });
      return formatErrorResponse('Failed to retrieve recent deposits', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Get pending deposits (not yet confirmed)
   */
  async getPendingDeposits(): Promise<ServiceResponse<IDeposit[]>> {
    try {
      const deposits = await Deposit.find({
        status: DepositStatus.PENDING,
        retryCount: { $lt: 5 }
      }).sort({ createdAt: 1 });

      return formatSuccessResponse(deposits.map(d => d.toObject() as IDeposit));
    } catch (error) {
      logError('Failed to get pending deposits', error);
      return formatErrorResponse('Failed to retrieve pending deposits', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Find deposit by transaction hash
   */
  async findDepositByTxHash(txHash: string): Promise<ServiceResponse<IDeposit>> {
    try {
      const deposit = await Deposit.findOne({ txHash: txHash.toLowerCase() });

      if (!deposit) {
        return formatErrorResponse('Deposit not found', 404, 'DEPOSIT_NOT_FOUND');
      }

      return formatSuccessResponse(deposit.toObject() as IDeposit);
    } catch (error) {
      logError('Failed to find deposit by txHash', error, { txHash });
      return formatErrorResponse('Failed to find deposit', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Get deposit statistics
   */
  async getDepositStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<
    ServiceResponse<{
      totalDeposits: number;
      totalAmount: string;
      byNetwork: { [key: string]: { count: number; amount: string } };
      byStatus: { [key: string]: { count: number; amount: string } };
    }>
  > {
    try {
      const query: any = { status: DepositStatus.CONFIRMED };

      if (startDate || endDate) {
        query.confirmedAt = {};
        if (startDate) query.confirmedAt.$gte = startDate;
        if (endDate) query.confirmedAt.$lte = endDate;
      }

      const deposits = await Deposit.find(query);

      let totalAmount = 0n;
      const byNetwork: { [key: string]: { count: number; amount: bigint } } = {};
      const byStatus: { [key: string]: { count: number; amount: bigint } } = {};

      for (const deposit of deposits) {
        const amount = BigInt(deposit.amount);
        totalAmount += amount;

        // By network
        if (!byNetwork[deposit.network]) {
          byNetwork[deposit.network] = { count: 0, amount: 0n };
        }
        byNetwork[deposit.network].count++;
        byNetwork[deposit.network].amount += amount;

        // By status
        if (!byStatus[deposit.status]) {
          byStatus[deposit.status] = { count: 0, amount: 0n };
        }
        byStatus[deposit.status].count++;
        byStatus[deposit.status].amount += amount;
      }

      // Convert bigint back to string
      const result = {
        totalDeposits: deposits.length,
        totalAmount: totalAmount.toString(),
        byNetwork: Object.entries(byNetwork).reduce((acc, [key, val]) => {
          acc[key] = { count: val.count, amount: val.amount.toString() };
          return acc;
        }, {} as { [key: string]: { count: number; amount: string } }),
        byStatus: Object.entries(byStatus).reduce((acc, [key, val]) => {
          acc[key] = { count: val.count, amount: val.amount.toString() };
          return acc;
        }, {} as { [key: string]: { count: number; amount: string } })
      };

      return formatSuccessResponse(result);
    } catch (error) {
      logError('Failed to get deposit statistics', error);
      return formatErrorResponse('Failed to get statistics', 500, 'QUERY_FAILED');
    }
  }

  /**
   * Increment retry count for a deposit
   */
  async incrementRetryCount(depositId: string): Promise<void> {
    try {
      await Deposit.findByIdAndUpdate(
        depositId,
        {
          $inc: { retryCount: 1 },
          lastRetryAt: new Date()
        }
      );
    } catch (error) {
      logError('Failed to increment retry count', error, { depositId });
    }
  }

  /**
   * Credit user balance after confirmed deposit
   */
  private async creditUserBalance(
    userId: string,
    network: SupportedNetwork,
    amountWei: string
  ): Promise<void> {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        logger.warn('User not found for balance credit', { userId });
        return;
      }

      // Initialize balances if not exists
      if (!user.balances) {
        user.balances = {};
      }

      // Get or create network balance
      const balanceKey = network.toLowerCase();
      const balances = user.balances as any;
      if (!balances[balanceKey]) {
        balances[balanceKey] = { confirmed: 0, pending: 0, total: 0 };
      }

      // Add to confirmed balance
      const amountNum = parseInt(amountWei, 10) || 0;
      balances[balanceKey].confirmed += amountNum;
      balances[balanceKey].total = 
        balances[balanceKey].confirmed + balances[balanceKey].pending;

      await user.save();

      logger.info('User balance credited', {
        userId,
        network,
        amount: amountWei,
        newBalance: balances[balanceKey].confirmed
      });
    } catch (error) {
      logError('Failed to credit user balance', error, {
        userId,
        network
      });
    }
  }

  /**
   * Get token symbol for network
   */
  private getTokenSymbolForAddress(network: SupportedNetwork, tokenAddress: string): string {
    const cfg = blockchainConfig[network.toLowerCase() as keyof typeof blockchainConfig];
    const addr = (tokenAddress || '').toLowerCase();

    if (cfg.tokenAddresses) {
      for (const [symbol, a] of Object.entries(cfg.tokenAddresses)) {
        if (!a) continue;
        if (a.toLowerCase() === addr) return symbol;
      }
    }

    // Fallback: compare legacy tokenAddress
    if (cfg.tokenAddress && cfg.tokenAddress.toLowerCase() === addr) {
      return 'USDT';
    }

    // Unknown token
    return 'UNKNOWN';
  }
}

/**
 * Factory function to create service
 */
export function createDepositService(): DepositService {
  return new DepositService();
}

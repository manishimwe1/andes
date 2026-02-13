import { Request, Response } from 'express';
import { DepositService } from '@/services/DepositService';
import { ConfirmationService } from '@/services/ConfirmationService';
import logger from '@/config/logger';

/**
 * Controller for deposit endpoints
 */
export class DepositController {
  constructor(
    private depositService: DepositService,
    private confirmationService: ConfirmationService
  ) {}

  /**
   * Get user's deposits
   * GET /api/deposits/:userId
   */
  async getUserDeposits(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { network, limit = 50, skip = 0 } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing userId'
        });
        return;
      }

      const result = await this.depositService.getUserDeposits(
        userId,
        network as any,
        parseInt(limit as string, 10),
        parseInt(skip as string, 10)
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving user deposits', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve deposits'
      });
    }
  }

  /**
   * Get deposit by transaction hash
   * GET /api/deposits/tx/:txHash
   */
  async getDepositByTxHash(req: Request, res: Response): Promise<void> {
    try {
      const { txHash } = req.params;

      if (!txHash) {
        res.status(400).json({
          success: false,
          error: 'Missing txHash'
        });
        return;
      }

      const result = await this.depositService.findDepositByTxHash(txHash);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving deposit', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve deposit'
      });
    }
  }

  /**
   * Check deposit confirmation status
   * POST /api/deposits/check-confirmation
   */
  async checkConfirmation(req: Request, res: Response): Promise<void> {
    try {
      const { depositId, txHash, network } = req.body;

      if (!depositId || !txHash || !network) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      const confirmations = await this.confirmationService.checkDepositConfirmation(
        depositId,
        network,
        txHash
      );

      res.status(200).json({
        success: true,
        data: {
          confirmations,
          depositId
        }
      });
    } catch (error) {
      logger.error('Error checking confirmation', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check confirmation'
      });
    }
  }

  /**
   * Get deposit statistics
   * GET /api/deposits/stats
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const result = await this.depositService.getDepositStatistics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving statistics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * Get recent deposits
   * GET /api/deposits/recent/:network
   */
  async getRecentDeposits(req: Request, res: Response): Promise<void> {
    try {
      const { network } = req.params;
      const { limit = 100 } = req.query;

      if (!network) {
        res.status(400).json({
          success: false,
          error: 'Missing network'
        });
        return;
      }

      const result = await this.depositService.getRecentDeposits(
        network as any,
        parseInt(limit as string, 10)
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving recent deposits', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve deposits'
      });
    }
  }

  /**
   * Get all pending deposits
   * GET /api/deposits/pending
   */
  async getPendingDeposits(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.depositService.getPendingDeposits();

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving pending deposits', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve pending deposits'
      });
    }
  }
}

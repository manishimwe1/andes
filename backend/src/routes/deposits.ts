import { Router } from 'express';
import { DepositController } from '@/controllers/DepositController';
import { DepositService } from '@/services/DepositService';
import { ConfirmationService } from '@/services/ConfirmationService';
import { apiKeyAuth, depositCheckLimiter, validateConfirmationCheck } from '@/middleware';

/**
 * Create deposit routes
 */
export function createDepositRoutes(): Router {
  const router = Router();
  const depositService = new DepositService();
  const confirmationService = new ConfirmationService(depositService);
  const controller = new DepositController(depositService, confirmationService);

  // Apply API key auth to all routes
  router.use(apiKeyAuth);

  /**
   * Get user deposits
   * GET /api/deposits/:userId
   */
  router.get('/:userId', (req, res) => controller.getUserDeposits(req, res));

  /**
   * Get deposit by transaction hash
   * GET /api/deposits/tx/:txHash
   */
  router.get('/tx/:txHash', (req, res) => controller.getDepositByTxHash(req, res));

  /**
   * Check deposit confirmation status
   * POST /api/deposits/check-confirmation
   */
  router.post(
    '/check-confirmation',
    depositCheckLimiter,
    validateConfirmationCheck,
    (req, res) => controller.checkConfirmation(req, res)
  );

  /**
   * Get deposit statistics
   * GET /api/deposits/stats
   */
  router.get('/stats', (req, res) => controller.getStatistics(req, res));

  /**
   * Get recent deposits
   * GET /api/deposits/recent/:network
   */
  router.get('/recent/:network', (req, res) => controller.getRecentDeposits(req, res));

  /**
   * Get pending deposits
   * GET /api/deposits/pending
   */
  router.get('/pending', (req, res) => controller.getPendingDeposits(req, res));

  /**
   * Submit a simulated deposit (testing only)
   * POST /api/deposits/submit
   * Body: { userId, userEmail, network, transfer: { from,to,amount,tokenAddress,txHash,blockNumber,blockTimestamp }, amountUSD, requiredConfirmations }
   */
  router.post('/submit', depositCheckLimiter, async (req, res) => {
    try {
      const { userId, userEmail, network, transfer, amountUSD, requiredConfirmations } = req.body;

      if (!userId || !network || !transfer || !transfer.txHash) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      const result = await depositService.recordDeposit(
        userId,
        userEmail || '',
        network,
        transfer,
        amountUSD || 0,
        requiredConfirmations || 12
      );

      if (!result.success) {
        res.status(500).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to submit deposit' });
    }
  });

  return router;
}

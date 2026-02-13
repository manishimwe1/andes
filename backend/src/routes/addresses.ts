import { Router } from 'express';
import { AddressController } from '@/controllers/AddressController';
import { AddressGenerationService } from '@/services/AddressGenerationService';
import { HDWalletUtil } from '@/utils/hdWallet';
import {
  apiKeyAuth,
  addressGenerationLimiter,
  validateAddressGeneration,
  validateAddressVerification
} from '@/middleware';

/**
 * Create address routes
 */
export function createAddressRoutes(hdWallet: HDWalletUtil): Router {
  const router = Router();
  const addressService = new AddressGenerationService(hdWallet);
  const controller = new AddressController(addressService);

  // Apply API key auth to all routes
  router.use(apiKeyAuth);

  /**
   * Generate deposit addresses
   * POST /api/addresses/generate
   */
  router.post(
    '/generate',
    addressGenerationLimiter,
    validateAddressGeneration,
    (req, res) => controller.generateAddresses(req, res)
  );

  /**
   * Get address for user and network
   * GET /api/addresses/:userId/:network
   */
  router.get('/:userId/:network', (req, res) => controller.getAddress(req, res));

  /**
   * Get all addresses for user
   * GET /api/addresses/:userId
   */
  router.get('/:userId', (req, res) => controller.getAllAddresses(req, res));

  /**
   * Verify address ownership
   * POST /api/addresses/verify
   */
  router.post(
    '/verify',
    validateAddressVerification,
    (req, res) => controller.verifyAddress(req, res)
  );

  /**
   * Find user by deposit address
   * GET /api/addresses/lookup/:address/:network
   */
  router.get('/lookup/:address/:network', (req, res) =>
    controller.findUserByAddress(req, res)
  );

  return router;
}

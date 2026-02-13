import { Request, Response } from 'express';
import { AddressGenerationService } from '@/services/AddressGenerationService';
import logger from '@/config/logger';
import { validateNetworks } from '@/utils/helpers';

/**
 * Controller for deposit address generation endpoints
 */
export class AddressController {
  constructor(private addressService: AddressGenerationService) {}

  /**
   * Generate new deposit addresses for user
   * POST /api/addresses/generate
   */
  async generateAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { userId, email, networks } = req.body;

      // Validation
      if (!userId || !email || !networks) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, email, networks'
        });
        return;
      }

      if (!validateNetworks(networks)) {
        res.status(400).json({
          success: false,
          error: 'Invalid networks. Must be one of: ethereum, bsc, polygon, tron'
        });
        return;
      }

      const result = await this.addressService.generateUserDepositAddresses(
        userId,
        email,
        networks
      );

      if (!result.success) {
        res.status(result.data ? 200 : 400).json(result);
        return;
      }

      logger.info('Deposit addresses generated successfully', {
        userId,
        networks: networks.join(', ')
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error generating addresses', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate addresses'
      });
    }
  }

  /**
   * Get user's deposit address for specific network
   * GET /api/addresses/:userId/:network
   */
  async getAddress(req: Request, res: Response): Promise<void> {
    try {
      const { userId, network } = req.params;

      if (!userId || !network) {
        res.status(400).json({
          success: false,
          error: 'Missing userId or network'
        });
        return;
      }

      const result = await this.addressService.getUserDepositAddress(
        userId,
        network as any
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving address', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve address'
      });
    }
  }

  /**
   * Get all deposit addresses for user
   * GET /api/addresses/:userId
   */
  async getAllAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'Missing userId'
        });
        return;
      }

      const result = await this.addressService.getAllUserDepositAddresses(userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error retrieving all addresses', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve addresses'
      });
    }
  }

  /**
   * Verify if address belongs to user
   * POST /api/addresses/verify
   */
  async verifyAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address, userId, network } = req.body;

      if (!address || !userId || !network) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      const result = await this.addressService.verifyAddressOwnership(
        address,
        userId,
        network
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error verifying address', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify address'
      });
    }
  }

  /**
   * Find user by deposit address
   * GET /api/addresses/lookup/:address/:network
   */
  async findUserByAddress(req: Request, res: Response): Promise<void> {
    try {
      const { address, network } = req.params;

      if (!address || !network) {
        res.status(400).json({
          success: false,
          error: 'Missing address or network'
        });
        return;
      }

      const result = await this.addressService.findUserByDepositAddress(
        address,
        network as any
      );

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error finding user', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find user'
      });
    }
  }
}

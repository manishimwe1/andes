import { User } from '@/models';
import { HDWalletUtil } from '@/utils/hdWallet';
import logger, { logError } from '@/config/logger';
import {
  ServiceResponse,
  AddressGenerationResponse,
  IUser,
  SupportedNetwork,
  Network,
  DepositBackendError
} from '@/types';
import { formatSuccessResponse, formatErrorResponse } from '@/utils/helpers';

/**
 * Service for generating unique deposit addresses per user
 * Uses HD wallet derivation from master mnemonic
 */
export class AddressGenerationService {
  private hdWallet: HDWalletUtil;

  constructor(hdWallet: HDWalletUtil) {
    this.hdWallet = hdWallet;
  }

  /**
   * Generate or retrieve deposit addresses for a user
   */
  async generateUserDepositAddresses(
    userId: string,
    email: string,
    networks: SupportedNetwork[]
  ): Promise<ServiceResponse<{ addresses: AddressGenerationResponse[]; user: IUser }>> {
    try {
      // Validate input
      if (!userId || !email) {
        return { success: false, error: 'User ID and email are required', statusCode: 400, code: 'INVALID_INPUT' } as any;
      }

      if (networks.length === 0) {
        return { success: false, error: 'At least one network must be specified', statusCode: 400, code: 'INVALID_INPUT' } as any;
      }

      // Find or create user
      let user = await User.findOne({ userId });

      if (!user) {
        // Get the next wallet index from the total user count
        // This ensures each user gets a unique index
        const userCount = await User.countDocuments();
        const nextWalletIndex = userCount; // Use total count as next index

        // Create new user
        user = new User({
          userId,
          email,
          walletIndex: nextWalletIndex,
          depositAddresses: {},
          balances: {
            ethereum: { confirmed: 0, pending: 0, total: 0 },
            bsc: { confirmed: 0, pending: 0, total: 0 },
            polygon: { confirmed: 0, pending: 0, total: 0 },
            tron: { confirmed: 0, pending: 0, total: 0 }
          }
        });

        logger.info('Created new user for deposit', {
          userId,
          email,
          networks: networks.join(', '),
          walletIndex: nextWalletIndex
        });
      }

      const addresses: AddressGenerationResponse[] = [];
      const addressMap: { [key: string]: any } = {
        erc20: 'ethereum',
        bep20: 'bsc',
        polygon: 'polygon',
        trc20: 'tron'
      };

      // Generate addresses for requested networks
      for (const network of networks) {
        try {
          const key = this.getAddressKey(network);
          const addressIndex = user.walletIndex;

          // Derive wallet using HD wallet
          const derivedWallet = this.hdWallet.deriveWallet(network, addressIndex);

          // Update user's deposit address
          if (!user.depositAddresses) {
            user.depositAddresses = {};
          }

          (user.depositAddresses as any)[key] = {
            address: this.normalizeAddressForNetwork(derivedWallet.address, network),
            publicKey: derivedWallet.publicKey,
            derivationIndex: derivedWallet.index,
            createdAt: new Date()
          };

          addresses.push({
            address: this.normalizeAddressForNetwork(derivedWallet.address, network),
            publicKey: derivedWallet.publicKey,
            derivationIndex: derivedWallet.index,
            network
          });

          logger.info('Generated deposit address', {
            userId,
            network,
            address: derivedWallet.address,
            derivationIndex: addressIndex
          });
        } catch (error) {
          logError('Failed to generate address for network', error, {
            userId,
            network
          });

          return formatErrorResponse(
            `Failed to generate address for ${network}`,
            500,
            'ADDRESS_GENERATION_FAILED'
          );
        }
      }

      // Save user with new addresses
      await user.save();

      logger.info('Successfully generated deposit addresses', {
        userId,
        networks,
        addressCount: addresses.length
      });

      return formatSuccessResponse({
        addresses,
        user: user.toObject() as IUser
      });
    } catch (error) {
      logError('Address generation service error', error, { userId });
      return formatErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        'SERVICE_ERROR'
      );
    }
  }

  /**
   * Get an existing user's deposit address for specific network
   */
  async getUserDepositAddress(
    userId: string,
    network: SupportedNetwork
  ): Promise<ServiceResponse<AddressGenerationResponse>> {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        return formatErrorResponse('User not found', 404, 'USER_NOT_FOUND');
      }

      const key = this.getAddressKey(network);
      const depositAddress = (user.depositAddresses as any)?.[key];

      if (!depositAddress) {
        return formatErrorResponse(
          `No deposit address found for ${network}`,
          404,
          'ADDRESS_NOT_FOUND'
        );
      }

      return formatSuccessResponse({
        address: depositAddress.address,
        publicKey: depositAddress.publicKey,
        derivationIndex: depositAddress.derivationIndex,
        network
      });
    } catch (error) {
      logError('Failed to get user deposit address', error, { userId, network });
      return formatErrorResponse('Failed to retrieve address', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get all deposit addresses for a user
   */
  async getAllUserDepositAddresses(
    userId: string
  ): Promise<ServiceResponse<{ [key: string]: AddressGenerationResponse }>> {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        return formatErrorResponse('User not found', 404, 'USER_NOT_FOUND');
      }

      const addresses: { [key: string]: AddressGenerationResponse } = {};

      const networks = [
        { key: 'erc20', network: Network.ETHEREUM },
        { key: 'bep20', network: Network.BSC },
        { key: 'polygon', network: Network.POLYGON },
        { key: 'trc20', network: Network.TRON }
      ];

      for (const { key, network } of networks) {
        const depositAddress = (user.depositAddresses as any)?.[key];
        if (depositAddress) {
          addresses[network] = {
            address: depositAddress.address,
            publicKey: depositAddress.publicKey,
            derivationIndex: depositAddress.derivationIndex,
            network
          };
        }
      }

      return formatSuccessResponse(addresses);
    } catch (error) {
      logError('Failed to get all deposit addresses', error, { userId });
      return formatErrorResponse('Failed to retrieve addresses', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Verify if an address belongs to a user
   */
  async verifyAddressOwnership(
    address: string,
    userId: string,
    network: SupportedNetwork
  ): Promise<ServiceResponse<boolean>> {
    try {
      const user = await User.findOne({ userId });

      if (!user) {
        return formatSuccessResponse(false);
      }

      const key = this.getAddressKey(network);
      const depositAddress = (user.depositAddresses as any)?.[key];

      if (!depositAddress) {
        return formatSuccessResponse(false);
      }

      const isOwner = depositAddress.address.toLowerCase() === address.toLowerCase();
      return formatSuccessResponse(isOwner);
    } catch (error) {
      logError('Failed to verify address ownership', error, { address, userId, network });
      return formatErrorResponse('Verification failed', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Find user by deposit address
   */
  async findUserByDepositAddress(
    address: string,
    network: SupportedNetwork
  ): Promise<ServiceResponse<IUser>> {
    try {
      const key = this.getAddressKey(network);
      const normalizedAddress = address.toLowerCase();

      const query: any = {};
      query[`depositAddresses.${key}.address`] = normalizedAddress;

      const user = await User.findOne(query);

      if (!user) {
        return formatErrorResponse('User not found', 404, 'USER_NOT_FOUND');
      }

      return formatSuccessResponse(user.toObject() as IUser);
    } catch (error) {
      logError('Failed to find user by address', error, { address, network });
      return formatErrorResponse('User lookup failed', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Increment wallet index for next address generation
   */
  async incrementWalletIndex(userId: string): Promise<ServiceResponse<number>> {
    try {
      const user = await User.findOneAndUpdate(
        { userId },
        { $inc: { walletIndex: 1 } },
        { new: true }
      );

      if (!user) {
        return formatErrorResponse('User not found', 404, 'USER_NOT_FOUND');
      }

      return formatSuccessResponse(user.walletIndex);
    } catch (error) {
      logError('Failed to increment wallet index', error, { userId });
      return formatErrorResponse('Failed to increment wallet index', 500, 'SERVICE_ERROR');
    }
  }

  /**
   * Get address key for network in deposit addresses object
   */
  private getAddressKey(network: SupportedNetwork): string {
    const keyMap: { [key in SupportedNetwork]: string } = {
      [Network.ETHEREUM]: 'erc20',
      [Network.BSC]: 'bep20',
      [Network.POLYGON]: 'polygon',
      [Network.TRON]: 'trc20'
    };

    return keyMap[network];
  }

  /**
   * Normalize address format for specific network
   */
  private normalizeAddressForNetwork(address: string, network: SupportedNetwork): string {
    if (network === Network.TRON) {
      // For Tron, keep original format as it should be base58
      return address;
    }

    // For EVM networks, return lowercase
    return address.toLowerCase();
  }
}

/**
 * Factory function to create service with HD wallet
 */
export function createAddressGenerationService(hdWallet: HDWalletUtil): AddressGenerationService {
  return new AddressGenerationService(hdWallet);
}

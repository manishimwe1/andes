import logger, { logError } from '@/config/logger';
import { Deposit, User } from '@/models';
import { DepositService } from './DepositService';
import { AddressGenerationService } from './AddressGenerationService';
import { Network, SupportedNetwork, TokenTransfer, ListenerState } from '@/types';
import { ethers } from 'ethers';
import { getEVMProvider } from '@/utils/blockchain';
import etherscan from '@/utils/etherscan';
import { blockchainConfig } from '@/config';

/**
 * Service for listening to blockchain events and detecting incoming transfers
 */
export class BlockchainListenerService {
  private depositService: DepositService;
  private addressGenerationService: AddressGenerationService;
  private listenerStates: Map<SupportedNetwork, ListenerState>;
  private isRunning: boolean = false;

  constructor(
    depositService: DepositService,
    addressGenerationService: AddressGenerationService
  ) {
    this.depositService = depositService;
    this.addressGenerationService = addressGenerationService;

    // Initialize listener states
    this.listenerStates = new Map([
      [Network.ETHEREUM, this.createListenerState(Network.ETHEREUM)],
      [Network.BSC, this.createListenerState(Network.BSC)],
      [Network.POLYGON, this.createListenerState(Network.POLYGON)],
      [Network.TRON, this.createListenerState(Network.TRON)]
    ]);
  }

  /**
   * Start listening to blockchain events
   */
  async startListening(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Blockchain listener is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting blockchain listener service');

    // Start listeners for each network
    this.startNetworkListener(Network.ETHEREUM);
    this.startNetworkListener(Network.BSC);
    this.startNetworkListener(Network.POLYGON);
    // Note: TRON listener would need separate implementation with TronWeb
  }

  /**
   * Stop listening to blockchain events
   */
  async stopListening(): Promise<void> {
    this.isRunning = false;
    logger.info('Stopping blockchain listener service');

    // Update listener states
    for (const [network, state] of this.listenerStates) {
      state.isRunning = false;
      state.status = 'idle';
    }
  }

  /**
   * Start listening to a specific network
   */
  private startNetworkListener(network: SupportedNetwork): void {
    if (!this.isRunning) return;

    const state = this.listenerStates.get(network);
    if (!state) return;

    state.isRunning = true;
    state.status = 'running';

    logger.info(`Started listener for ${network} network`);

    // Start polling for new blocks
    this.pollNetworkForTransfers(network);
  }

  /**
   * Poll network for token transfers
   */
  private async pollNetworkForTransfers(network: SupportedNetwork): Promise<void> {
    const state = this.listenerStates.get(network);
    if (!state) return;

    try {
      const provider = getEVMProvider(network);
      const networkConfig = blockchainConfig[network.toLowerCase() as keyof typeof blockchainConfig];

      // Get starting block
      let lastBlockProcessed = state.lastBlockProcessed;
      if (lastBlockProcessed === 0) {
        lastBlockProcessed = (await provider.getBlockNumber()) - 100; // Start from 100 blocks ago
      }

      // Poll for transfers
      setInterval(async () => {
        if (!this.isRunning || !state.isRunning) return;

        try {
          const currentBlock = await provider.getBlockNumber();

              if (currentBlock > lastBlockProcessed) {
                // Support scanning multiple token addresses per network
                const tokenAddrs: string[] = networkConfig.tokenAddresses ? Object.values(networkConfig.tokenAddresses).filter(Boolean) : (networkConfig.tokenAddress ? [networkConfig.tokenAddress] : []);

                for (const taddr of tokenAddrs) {
                  await this.scanBlockRangeForTransfers(
                    network,
                    lastBlockProcessed + 1,
                    currentBlock,
                    taddr
                  );
                }

                lastBlockProcessed = currentBlock;
                state.lastBlockProcessed = currentBlock;
                state.lastUpdate = new Date();
              }
        } catch (error) {
          logError('Error polling network', error, { network });
          state.status = 'error';
          state.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        }
      }, 30000); // Poll every 30 seconds
    } catch (error) {
      logError('Failed to start polling for network', error, { network });
      state.status = 'error';
      state.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Scan block range for token transfers
   */
  private async scanBlockRangeForTransfers(
    network: SupportedNetwork,
    fromBlock: number,
    toBlock: number,
    tokenAddress: string
  ): Promise<void> {
    try {
      const provider = getEVMProvider(network);

      // ERC20 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
      const transferEventSignature = 'Transfer(address indexed from, address indexed to, uint256 value)';
      const transferEventTopic = ethers.id(transferEventSignature);

      // Get all users' deposit addresses for this network
      const users = await this.getAllActiveUsers();
      const deposits = new Map<string, any>();

      for (const user of users) {
        const addressKey = this.getAddressKeyForNetwork(network);
        const depositAddress = user.depositAddresses?.[addressKey];

        if (depositAddress) {
          deposits.set(depositAddress.address.toLowerCase(), user);
        }
      }

      if (deposits.size === 0) {
        logger.debug('No active deposit addresses found', { network });
        return;
      }

      // Create filter for transfers to our addresses
      const filter = {
        address: tokenAddress.toLowerCase(),
        topics: [transferEventTopic, null, ethers.AbiCoder.defaultAbiCoder().encode(['address'], [...deposits.keys()])],
        fromBlock,
        toBlock
      };

      let logs: ethers.Log[] = [];
      try {
        logs = await provider.getLogs(filter);
      } catch (err) {
        // Fallback to Etherscan API for testnets or providers that don't support getLogs
        try {
          const toAddrs = Array.from(deposits.keys());
          const raw = await etherscan.getLogsByTokenAndAddresses(network, tokenAddress, fromBlock, toBlock, toAddrs);
          // Convert etherscan logs shape to ethers.Log-like objects
          logs = raw.map((l: any) => ({
            address: l.address,
            topics: l.topics,
            data: l.data,
            blockNumber: parseInt(l.blockNumber, 16) || parseInt(l.blockNumber, 10),
            transactionHash: l.transactionHash,
            transactionIndex: l.transactionIndex ? parseInt(l.transactionIndex, 16) : undefined,
            logIndex: l.logIndex ? parseInt(l.logIndex, 16) : undefined
          } as any));
        } catch (esErr) {
          throw esErr;
        }
      }

      logger.debug('Scanned block range for transfers', {
        network,
        fromBlock,
        toBlock,
        foundTransfers: logs.length
      });

      // Process each transfer
      for (const log of logs) {
        await this.processTransferLog(network, log, deposits);
      }
    } catch (error) {
      logError('Error scanning block range', error, {
        network,
        fromBlock,
        toBlock
      });
    }
  }

  /**
   * Process a transfer log event
   */
  private async processTransferLog(
    network: SupportedNetwork,
    log: ethers.Log,
    deposits: Map<string, any>
  ): Promise<void> {
    try {
      const provider = getEVMProvider(network);

      // Decode log data
      const iface = new ethers.Interface([
        'event Transfer(address indexed from, address indexed to, uint256 value)'
      ]);

      const decoded = iface.parseLog(log);
      if (!decoded) return;

      const from = decoded.args[0] as string;
      const to = decoded.args[1] as string;
      const value = decoded.args[2] as bigint;

      const toNormalized = to.toLowerCase();

      // Check if recipient is a registered user
      const user = deposits.get(toNormalized);
      if (!user) {
        return;
      }

      const txHash = log.transactionHash;

      // Check for duplicate
      const existingDeposit = await Deposit.findOne({ txHash });
      if (existingDeposit) {
        logger.debug('Duplicate transfer detected', { txHash });
        return;
      }

      logger.info('Detected incoming token transfer', {
        network,
        from,
        to: toNormalized,
        amount: value.toString(),
        txHash,
        userId: user.userId
      });

      // Create transfer object
      const transfer: TokenTransfer = {
        from,
        to: toNormalized,
        amount: value.toString(),
        tokenAddress: log.address,
        txHash,
        blockNumber: log.blockNumber,
        blockTimestamp: (await provider.getBlock(log.blockNumber))?.timestamp || Date.now() / 1000,
        network
      };

      // Record deposit (amount is in wei, so amountUSD would need price feed)
      const amountUSD = parseFloat(ethers.formatUnits(value, 18)) * 1; // Would fetch actual price
      const networkConfig = blockchainConfig[network.toLowerCase() as keyof typeof blockchainConfig];

      await this.depositService.recordDeposit(
        user.userId,
        user.email,
        network,
        transfer,
        amountUSD,
        networkConfig.requiredConfirmations
      );
    } catch (error) {
      logError('Error processing transfer log', error, {
        network,
        txHash: log.transactionHash
      });
    }
  }

  /**
   * Get listener state for network
   */
  getListenerState(network: SupportedNetwork): ListenerState | undefined {
    return this.listenerStates.get(network);
  }

  /**
   * Get all listener states
   */
  getAllListenerStates(): Map<SupportedNetwork, ListenerState> {
    return this.listenerStates;
  }

  /**
   * Get all active users
   */
  private async getAllActiveUsers(): Promise<any[]> {
    try {
      return await User.find({
        $or: [
          { 'depositAddresses.erc20': { $exists: true } },
          { 'depositAddresses.bep20': { $exists: true } },
          { 'depositAddresses.polygon': { $exists: true } },
          { 'depositAddresses.trc20': { $exists: true } }
        ]
      });
    } catch (error) {
      logError('Failed to get active users', error);
      return [];
    }
  }

  /**
   * Create initial listener state
   */
  private createListenerState(network: SupportedNetwork): ListenerState {
    return {
      network,
      lastBlockProcessed: 0,
      isRunning: false,
      lastUpdate: new Date(),
      status: 'idle'
    };
  }

  /**
   * Get address key for network
   */
  private getAddressKeyForNetwork(network: SupportedNetwork): string {
    const keyMap: { [key in SupportedNetwork]: string } = {
      [Network.ETHEREUM]: 'erc20',
      [Network.BSC]: 'bep20',
      [Network.POLYGON]: 'polygon',
      [Network.TRON]: 'trc20'
    };

    return keyMap[network];
  }
}

/**
 * Factory function to create service
 */
export function createBlockchainListenerService(
  depositService: DepositService,
  addressGenerationService: AddressGenerationService
): BlockchainListenerService {
  return new BlockchainListenerService(depositService, addressGenerationService);
}

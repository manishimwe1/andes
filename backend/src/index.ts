// Register path aliases before any other imports
import 'tsconfig-paths/register';

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import logger, { logInfo, logError } from '@/config/logger';
import { connectToDatabase, disconnectFromDatabase, appConfig } from '@/config';
import { HDWalletUtil } from '@/utils/hdWallet';
import {
  createAddressGenerationService,
  createDepositService,
  createConfirmationService,
  createBlockchainListenerService
} from '@/services';
import { createAddressRoutes, createDepositRoutes, createHealthRoutes } from '@/routes';
import {
  apiKeyAuth,
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorHandler,
  notFoundHandler,
  apiLimiter
} from '@/middleware';

/**
 * Application setup and initialization
 */
async function initializeApp(): Promise<Express> {
  const app = express();

  // Middleware setup
  app.use(helmet()); // Security headers
  app.use(cors()); // CORS support
  app.use(express.json({ limit: '10mb' })); // JSON body parser
  app.use(express.urlencoded({ limit: '10mb', extended: true })); // URL-encoded body parser

  // Custom middleware
  app.use(requestIdMiddleware); // Request ID tracking
  app.use(requestLoggerMiddleware); // Request logging
  app.use(apiLimiter); // Rate limiting

  // Initialize database connection
  await connectToDatabase();
  logInfo('Database connected successfully');

  // Initialize HD wallet from mnemonic
  let hdWallet: HDWalletUtil;
  try {
    hdWallet = new HDWalletUtil(
      process.env.MASTER_MNEMONIC || '',
      process.env.MASTER_PASSPHRASE
    );
    logInfo('HD Wallet initialized successfully');
  } catch (error) {
    logError('Failed to initialize HD Wallet', error);
    throw error;
  }

  // Initialize services
  const addressGenerationService = createAddressGenerationService(hdWallet);
  const depositService = createDepositService();
  const confirmationService = createConfirmationService(depositService);
  const blockchainListenerService = createBlockchainListenerService(
    depositService,
    addressGenerationService
  );

  logInfo('Services initialized successfully');

  // API Routes
  app.use('/api/health', createHealthRoutes());
  app.use('/api/addresses', createAddressRoutes(hdWallet));
  app.use('/api/deposits', createDepositRoutes());

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Crypto Deposit Backend API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        addresses: '/api/addresses',
        deposits: '/api/deposits'
      }
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(error, req, res, next);
  });

  // Start blockchain listeners
  logInfo('Starting blockchain listeners');
  await blockchainListenerService.startListening();

  // Setup scheduled tasks
  setupScheduledTasks(confirmationService, depositService, blockchainListenerService);

  return app;
}

/**
 * Setup scheduled tasks using cron
 */
function setupScheduledTasks(
  confirmationService: any,
  depositService: any,
  blockchainListenerService: any
): void {
  // Check pending deposit confirmations every minute
  cron.schedule('* * * * *', async () => {
    try {
      await confirmationService.checkPendingDepositsConfirmations();
    } catch (error) {
      logError('Error in confirmation check task', error);
    }
  });

  logInfo('Confirmation check task scheduled (every 1 minute)');

  // Sync blockchain listener state every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    try {
      const states = blockchainListenerService.getAllListenerStates();
      logInfo('Blockchain listener states', {
        states: Array.from(states.entries()).map(([network, state]: any) => ({
          network,
          status: state.status,
          lastBlockProcessed: state.lastBlockProcessed,
          lastUpdate: state.lastUpdate
        }))
      });
    } catch (error) {
      logError('Error in listener sync task', error);
    }
  });

  logInfo('Listener sync task scheduled (every 5 minutes)');
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate environment variables
    if (!process.env.MASTER_MNEMONIC) {
      throw new Error('MASTER_MNEMONIC environment variable is required');
    }

    if (!process.env.API_KEY) {
      throw new Error('API_KEY environment variable is required');
    }

    if (!process.env.MONGODB_URI) {
      logger.warn('MONGODB_URI not set, using default: mongodb://localhost:27017/crypto-deposits');
    }

    const app = await initializeApp();

    // Start listening
    const port = appConfig.port;
    app.listen(port, () => {
      logInfo('Server started', {
        port,
        environment: appConfig.nodeEnv,
        url: `http://localhost:${port}`
      });
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(): Promise<void> {
  logInfo('Initiating graceful shutdown');

  try {
    await disconnectFromDatabase();
    logInfo('Application shutdown complete');
    process.exit(0);
  } catch (error) {
    logError('Error during shutdown', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logError('Uncaught exception', error);
  gracefulShutdown();
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logError('Unhandled rejection', new Error(String(reason)), {
    promise
  });
  gracefulShutdown();
});

// Start the server
startServer();

export default startServer;

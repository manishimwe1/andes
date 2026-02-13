import mongoose from 'mongoose';
import logger from './logger';

const connectToDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-deposits';

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      family: 4 // Use IPv4
    });

    logger.info('Successfully connected to MongoDB', {
      database: mongoUri.split('/').pop()?.split('?')[0]
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Successfully disconnected from MongoDB');
  } catch (error) {
    logger.error('Failed to disconnect from MongoDB', error);
    process.exit(1);
  }
};

export { connectToDatabase, disconnectFromDatabase };

import mongoose, { Schema, Document } from 'mongoose';
import { IDeposit, DepositStatus, TransactionReceipt } from '@/types';

interface IDepositDocument extends Omit<IDeposit, '_id'>, Document {}

// Define the TransactionReceipt schema
const transactionReceiptSchema = new Schema<TransactionReceipt>(
  {
    transactionHash: {
      type: String,
      required: true
    },
    blockNumber: {
      type: Number,
      required: true
    },
    confirmations: {
      type: Number,
      default: 0
    },
    status: {
      type: Boolean,
      required: true
    },
    gasUsed: String,
    contractAddress: String,
    from: {
      type: String,
      required: true,
      lowercase: true
    },
    to: {
      type: String,
      required: true,
      lowercase: true
    },
    value: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

// Define the Deposit schema
const depositSchema = new Schema<IDepositDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    network: {
      type: String,
      enum: ['ethereum', 'bsc', 'polygon', 'tron'],
      required: true,
      index: true
    },
    tokenAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    tokenSymbol: {
      type: String,
      required: true
    },
    tokenDecimals: {
      type: Number,
      required: true,
      default: 18
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true
    },
    amount: {
      type: String,
      required: true
    },
    amountUSD: {
      type: Number,
      required: true,
      default: 0
    },
    toAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    fromAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    confirmations: {
      type: Number,
      default: 0,
      min: 0
    },
    requiredConfirmations: {
      type: Number,
      required: true,
      default: 12
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'cancelled'],
      default: DepositStatus.PENDING,
      index: true
    },
    transactionReceipt: transactionReceiptSchema,
    errorMessage: String,
    retryCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastRetryAt: Date,
    createdAt: {
      type: Date,
      default: () => new Date(),
      index: true
    },
    updatedAt: {
      type: Date,
      default: () => new Date()
    },
    confirmedAt: Date
  },
  {
    timestamps: true,
    collection: 'deposits'
  }
);

// Create compound indexes for common queries
depositSchema.index({ userId: 1, network: 1 });
depositSchema.index({ userId: 1, status: 1 });
depositSchema.index({ toAddress: 1, network: 1 });
depositSchema.index({ status: 1, createdAt: -1 });
depositSchema.index({ network: 1, createdAt: -1 });

// Pre-save middleware to update updatedAt
depositSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Post-save hook to handle confirmed deposits
depositSchema.post('save', async function (doc) {
  // Logic to update user balance if needed (handled in service layer)
  if (doc.status === 'confirmed' && !doc.confirmedAt) {
    doc.confirmedAt = new Date();
  }
});

// Static method to find deposits by address
depositSchema.statics.findByAddress = function (address: string, network: string) {
  return this.find({
    toAddress: address.toLowerCase(),
    network: network
  });
};

// Static method to find deposit by transaction hash
depositSchema.statics.findByTxHash = function (txHash: string) {
  return this.findOne({
    txHash: txHash.toLowerCase()
  });
};

// Instance method to is pending
depositSchema.methods.isPending = function () {
  return this.status === DepositStatus.PENDING;
};

// Instance method to is confirmed
depositSchema.methods.isConfirmed = function () {
  return this.status === DepositStatus.CONFIRMED;
};

export const Deposit = mongoose.model<IDepositDocument>('Deposit', depositSchema);
export default Deposit;

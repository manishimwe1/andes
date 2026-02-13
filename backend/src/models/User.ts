import mongoose, { Schema, Document } from 'mongoose';
import { IUser, DepositAddress, NetworkBalance, UserBalances } from '@/types';

interface IUserDocument extends Omit<IUser, '_id'>, Document {}

// Define the DepositAddress schema
const depositAddressSchema = new Schema<DepositAddress>(
  {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    publicKey: {
      type: String
    },
    derivationIndex: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: () => new Date()
    }
  },
  { _id: false }
);

// Define the NetworkBalance schema
const networkBalanceSchema = new Schema<NetworkBalance>(
  {
    confirmed: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

// Define the User schema
const userSchema = new Schema<IUserDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      match: /.+\@.+\..+/
    },
    walletIndex: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    depositAddresses: {
      erc20: depositAddressSchema,
      bep20: depositAddressSchema,
      polygon: depositAddressSchema,
      trc20: depositAddressSchema
    },
    balances: {
      ethereum: networkBalanceSchema,
      bsc: networkBalanceSchema,
      polygon: networkBalanceSchema,
      tron: networkBalanceSchema
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
      index: true
    },
    updatedAt: {
      type: Date,
      default: () => new Date()
    }
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create indexes for faster queries
userSchema.index({ userId: 1, email: 1 });
userSchema.index({ 'depositAddresses.erc20.address': 1 });
userSchema.index({ 'depositAddresses.bep20.address': 1 });
userSchema.index({ 'depositAddresses.polygon.address': 1 });
userSchema.index({ 'depositAddresses.trc20.address': 1 });

// Add virtual for total balance across all networks
userSchema.virtual('totalBalance').get(function () {
  const balances = this.balances || {};
  return (
    (balances.ethereum?.total || 0) +
    (balances.bsc?.total || 0) +
    (balances.polygon?.total || 0) +
    (balances.tron?.total || 0)
  );
});

// Add method to get balance for specific network
userSchema.methods.getNetworkBalance = function (network: string) {
  return this.balances[network] || { confirmed: 0, pending: 0, total: 0 };
};

// Add method to get deposit address for network
userSchema.methods.getDepositAddress = function (network: string) {
  const networkMap: { [key: string]: string } = {
    ethereum: 'erc20',
    bsc: 'bep20',
    polygon: 'polygon',
    tron: 'trc20'
  };
  const key = networkMap[network];
  return this.depositAddresses[key];
};

// Pre-save middleware to update updatedAt
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
export default User;

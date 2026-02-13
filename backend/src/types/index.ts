/**
 * Type definitions for Crypto Deposit Backend
 */

// ============================================
// NETWORK TYPES
// ============================================

export enum Network {
  ETHEREUM = 'ethereum',
  BSC = 'bsc',
  POLYGON = 'polygon',
  TRON = 'tron'
}

export type SupportedNetwork = Network.ETHEREUM | Network.BSC | Network.POLYGON | Network.TRON;

// ============================================
// USER TYPES
// ============================================

export interface DepositAddress {
  address: string;
  publicKey?: string;
  derivationIndex: number;
  createdAt: Date;
}

export interface NetworkBalance {
  confirmed: number;
  pending: number;
  total: number;
}

export interface UserBalances {
  ethereum?: NetworkBalance;
  bsc?: NetworkBalance;
  polygon?: NetworkBalance;
  tron?: NetworkBalance;
}

export interface IUser {
  _id: string;
  userId: string; // UUID or similar unique identifier
  email: string;
  walletIndex: number;
  depositAddresses: {
    erc20?: DepositAddress;
    bep20?: DepositAddress;
    polygon?: DepositAddress;
    trc20?: DepositAddress;
  };
  balances: UserBalances;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEPOSIT TYPES
// ============================================

export enum DepositStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  confirmations: number;
  status: boolean;
  gasUsed?: string;
  contractAddress?: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
}

export interface IDeposit {
  _id: string;
  userId: string;
  userEmail: string;
  network: SupportedNetwork;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  txHash: string; // UNIQUE
  amount: string; // In wei/smallest unit
  amountUSD: number;
  toAddress: string;
  fromAddress: string;
  confirmations: number;
  requiredConfirmations: number;
  status: DepositStatus;
  transactionReceipt?: TransactionReceipt;
  errorMessage?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
}

// ============================================
// BLOCKCHAIN LISTENER TYPES
// ============================================

export interface BlockchainEventFilter {
  network: SupportedNetwork;
  tokenAddress: string;
  fromBlock: number;
  toBlock: number;
}

export interface TokenTransfer {
  from: string;
  to: string;
  amount: string;
  tokenAddress: string;
  txHash: string;
  blockNumber: number;
  blockTimestamp: number;
  network: SupportedNetwork;
}

// ============================================
// SERVICE RESPONSE TYPES
// ============================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

export interface AddressGenerationResponse {
  address: string;
  publicKey?: string;
  derivationIndex: number;
  network: SupportedNetwork;
}

export interface DepositProcessingResponse {
  depositId: string;
  txHash: string;
  status: DepositStatus;
  confirmations: number;
  amountUSD: number;
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  tokenAddress?: string;
  tokenAddresses?: { [symbol: string]: string };
  requiredConfirmations: number;
  gasPrice?: string;
}

export interface BlockchainConfig {
  ethereum: NetworkConfig;
  bsc: NetworkConfig;
  polygon: NetworkConfig;
  tron: NetworkConfig;
}

// ============================================
// ERROR TYPES
// ============================================

export class DepositBackendError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'DepositBackendError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CreateDepositAddressRequest {
  userId: string;
  email: string;
  networks: SupportedNetwork[];
}

export interface GetUserDepositsRequest {
  userId: string;
  network?: SupportedNetwork;
  limit?: number;
  skip?: number;
}

export interface CheckDepositStatusRequest {
  depositId: string;
  txHash?: string;
}

export interface TransactionHistoryRequest {
  userId: string;
  network?: SupportedNetwork;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

// ============================================
// LOGGER TYPES
// ============================================

export interface LogContext {
  userId?: string;
  txHash?: string;
  depositId?: string;
  network?: SupportedNetwork;
  [key: string]: any;
}

// ============================================
// LISTENER STATE TYPES
// ============================================

export interface ListenerState {
  network: SupportedNetwork;
  lastBlockProcessed: number;
  isRunning: boolean;
  lastUpdate: Date;
  status: 'idle' | 'running' | 'error';
  errorMessage?: string;
}

// ============================================
// HD WALLET TYPES
// ============================================

export interface HDWalletConfig {
  masterMnemonic: string;
  passphrase?: string;
}

export interface DerivedWalletInfo {
  address: string;
  publicKey: string;
  privateKey: string; // Should only be used in secure context
  path: string;
  index: number;
}

// ============================================
// PRICE FEED TYPES
// ============================================

export interface TokenPrice {
  tokenAddress: string;
  network: SupportedNetwork;
  priceUSD: number;
  lastUpdate: Date;
}

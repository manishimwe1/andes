// Transaction-related types
export type TransactionType = 'deposit' | 'withdraw' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositRequest {
  amount: number;
  method: 'bank' | 'card' | 'wallet';
}

export interface WithdrawalRequest {
  amount: number;
  destination: string;
  method: 'bank' | 'wallet';
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
}

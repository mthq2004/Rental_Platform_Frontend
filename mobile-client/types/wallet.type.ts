export type WalletTransactionType =
  | 'topup'
  | 'withdraw'
  | 'payment'
  | 'refund'
  | 'commission'
  | 'transfer'
  | 'rental_payment'
  | 'deposit';

export type WalletTransactionStatus = 'pending' | 'success' | 'failed';
export type WalletTopupMethod = 'momo' | 'vnpay' | 'bank_transfer' | 'zalopay';

export interface WalletOverview {
  walletId: string;
  userId: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  description: string | null;
  transactionRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  status: WithdrawalStatus;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  reason: string | null;
  transactionRef: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  processedBy: string | null;
}

export interface WalletTopupResult {
  transactionId: string;
  method: WalletTopupMethod;
  status: WalletTransactionStatus;
  amount: number;
  paymentUrl: string | null;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch: string;
    content: string;
  } | null;
}

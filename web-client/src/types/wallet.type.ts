export type WalletTransactionType =
  | 'deposit'
  | 'withdraw'
  | 'pay_rent'
  | 'receive_rent'
  | 'hold_deposit'
  | 'refund'
  | 'fee';

export type WalletTransactionStatus = 'pending' | 'success' | 'failed';
export type WalletTopupMethod = 'momo' | 'vnpay' | ' ' | ' ';
export type WithdrawalStatus = 'pending' | 'processing' | 'success' | 'rejected';

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
  referenceId?: string;
  description?: string;
  paymentId?: string;
  createdAt: string;
  payment?: {
    paymentId: string;
    paymentCode: string;
    paymentType: string;
    rentalId: string;
    status: string;
    contract?: {
      contractCode?: string;
    };
  };
}

export interface WalletTopupResult {
  transactionId: string;
  method: WalletTopupMethod;
  status: WalletTransactionStatus;
  amount: number;
  gateway?: string;
  paymentUrl?: string | null;
  qrCodeUrl?: string | null;
  deeplink?: string | null;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transferContent: string;
  };
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: WithdrawalStatus;
  adminNote?: string;
  evidenceUrl?: string;
  createdAt: string;
  processedAt?: string;
}

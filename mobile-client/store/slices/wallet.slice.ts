import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/utils/api';
import type {
  WalletOverview,
  WalletTopupMethod,
  WalletTopupResult,
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
  WithdrawalRequest,
  WithdrawalStatus,
} from '@/types/wallet.type';

interface WalletState {
  overview: WalletOverview | null;
  transactions: WalletTransaction[];
  transactionsMeta: { page: number; limit: number; total: number; totalPages: number } | null;
  withdrawals: WithdrawalRequest[];
  withdrawalsMeta: { page: number; limit: number; total: number; totalPages: number } | null;
  latestTopupResult: WalletTopupResult | null;
  overviewLoading: boolean;
  transactionsLoading: boolean;
  withdrawalsLoading: boolean;
  topupLoading: boolean;
  withdrawActionLoading: boolean;
}

const initialState: WalletState = {
  overview: null,
  transactions: [],
  transactionsMeta: null,
  withdrawals: [],
  withdrawalsMeta: null,
  latestTopupResult: null,
  overviewLoading: false,
  transactionsLoading: false,
  withdrawalsLoading: false,
  topupLoading: false,
  withdrawActionLoading: false,
};

const parseNumberSafe = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeWalletOverview = (item: any): WalletOverview => {
  const availableBalance = parseNumberSafe(item?.availableBalance);
  const pendingBalance = parseNumberSafe(item?.pendingBalance);
  const totalBalance = parseNumberSafe(item?.totalBalance);

  const derivedAvailable = Number.isFinite(totalBalance) && Number.isFinite(pendingBalance)
    ? totalBalance - pendingBalance
    : availableBalance;
  const useDerived = Number.isFinite(derivedAvailable)
    && Math.abs(derivedAvailable - availableBalance) > 0.01;

  return {
    walletId: item?.walletId,
    userId: item?.userId,
    currency: item?.currency ?? 'VND',
    availableBalance: useDerived ? derivedAvailable : availableBalance,
    pendingBalance,
    totalBalance,
    updatedAt: item?.updatedAt,
  };
};

const normalizeTransaction = (item: any): WalletTransaction => ({
  ...item,
  amount: parseNumberSafe(item?.amount),
});

const normalizeTopupResult = (item: any): WalletTopupResult => ({
  transactionId: item?.transactionId,
  method: item?.method,
  status: item?.status,
  amount: parseNumberSafe(item?.amount),
  paymentUrl: item?.paymentUrl ?? null,
  bankInfo: item?.bankInfo,
});

const normalizeWithdrawal = (item: any): WithdrawalRequest => ({
  ...item,
  amount: parseNumberSafe(item?.amount),
});

export const getWalletOverview = createAsyncThunk(
  'wallet/getWalletOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/contract/wallet/balance');
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Không thể tải thông tin ví');
    }
  }
);

export const getWalletTransactions = createAsyncThunk(
  'wallet/getWalletTransactions',
  async (
    params: { page?: number; limit?: number; type?: WalletTransactionType; status?: WalletTransactionStatus } | void,
    { rejectWithValue }
  ) => {
    try {
      let url = '/contract/wallet/transactions';
      const qs = [];
      if (params?.page) qs.push(`page=${params.page}`);
      if (params?.limit) qs.push(`limit=${params.limit}`);
      if (params?.type) qs.push(`type=${params.type}`);
      if (params?.status) qs.push(`status=${params.status}`);
      if (qs.length > 0) url += `?${qs.join('&')}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Không thể tải lịch sử giao dịch ví');
    }
  }
);

export const initiateWalletTopup = createAsyncThunk(
  'wallet/initiateWalletTopup',
  async (
    payload: { amount: number; method: WalletTopupMethod },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/contract/wallet/topup', payload);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Không thể khởi tạo nạp tiền');
    }
  }
);

export const confirmWalletTopup = createAsyncThunk(
  'wallet/confirmWalletTopup',
  async (
    payload: { transactionId: string; paidAmount?: number; transactionRef?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(`/contract/wallet/topup/${payload.transactionId}/confirm`, {
        paidAmount: payload.paidAmount,
        transactionRef: payload.transactionRef,
      });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Xác nhận nạp tiền thất bại');
    }
  }
);

export const getTopupStatus = createAsyncThunk(
  'wallet/getTopupStatus',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/contract/wallet/topup/${transactionId}/status`);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Không thể kiểm tra trạng thái nạp tiền');
    }
  }
);

export const createWithdrawalRequest = createAsyncThunk(
  'wallet/createWithdrawalRequest',
  async (
    payload: { amount: number; bankCode: string; accountNumber: string; accountName: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/contract/wallet/withdrawals', payload);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Không thể tạo yêu cầu rút tiền');
    }
  }
);

export const getWithdrawalRequests = createAsyncThunk(
  'wallet/getWithdrawalRequests',
  async (
    params: { page?: number; limit?: number; status?: WithdrawalStatus } | void,
    { rejectWithValue }
  ) => {
    try {
      let url = '/contract/wallet/withdrawals';
      const qs = [];
      if (params?.page) qs.push(`page=${params.page}`);
      if (params?.limit) qs.push(`limit=${params.limit}`);
      if (params?.status) qs.push(`status=${params.status}`);
      if (qs.length > 0) url += `?${qs.join('&')}`;

      const response = await apiClient.get(url);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || e?.message || 'Không thể tải danh sách rút tiền');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearLatestTopupResult: (state) => {
      state.latestTopupResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getWalletOverview.pending, (state) => {
        state.overviewLoading = true;
      })
      .addCase(getWalletOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        const raw = action.payload?.data ?? action.payload;
        state.overview = raw ? normalizeWalletOverview(raw) : null;
      })
      .addCase(getWalletOverview.rejected, (state) => {
        state.overviewLoading = false;
      });

    builder
      .addCase(getWalletTransactions.pending, (state) => {
        state.transactionsLoading = true;
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        const items = Array.isArray(action.payload?.data?.items)
          ? action.payload.data.items
          : Array.isArray(action.payload?.items)
            ? action.payload.items
            : [];
        state.transactions = items.map(normalizeTransaction);
        state.transactionsMeta = action.payload?.data?.meta ?? action.payload?.meta ?? null;
      })
      .addCase(getWalletTransactions.rejected, (state) => {
        state.transactionsLoading = false;
      });

    builder
      .addCase(initiateWalletTopup.pending, (state) => {
        state.topupLoading = true;
      })
      .addCase(initiateWalletTopup.fulfilled, (state, action) => {
        state.topupLoading = false;
        const raw = action.payload?.data ?? action.payload;
        state.latestTopupResult = raw ? normalizeTopupResult(raw) : null;
      })
      .addCase(initiateWalletTopup.rejected, (state) => {
        state.topupLoading = false;
      });

    builder
      .addCase(confirmWalletTopup.pending, (state) => {
        state.topupLoading = true;
      })
      .addCase(confirmWalletTopup.fulfilled, (state) => {
        state.topupLoading = false;
      })
      .addCase(confirmWalletTopup.rejected, (state) => {
        state.topupLoading = false;
      });

    builder
      .addCase(getTopupStatus.pending, (state) => {
        state.topupLoading = true;
      })
      .addCase(getTopupStatus.fulfilled, (state, action) => {
        state.topupLoading = false;
        const data = action.payload?.data ?? action.payload;
        if (state.latestTopupResult && data?.transactionId === state.latestTopupResult.transactionId) {
          state.latestTopupResult = {
            ...state.latestTopupResult,
            status: data.status,
          };
        }
      })
      .addCase(getTopupStatus.rejected, (state) => {
        state.topupLoading = false;
      });

    builder
      .addCase(createWithdrawalRequest.pending, (state) => {
        state.withdrawActionLoading = true;
      })
      .addCase(createWithdrawalRequest.fulfilled, (state) => {
        state.withdrawActionLoading = false;
      })
      .addCase(createWithdrawalRequest.rejected, (state) => {
        state.withdrawActionLoading = false;
      });

    builder
      .addCase(getWithdrawalRequests.pending, (state) => {
        state.withdrawalsLoading = true;
      })
      .addCase(getWithdrawalRequests.fulfilled, (state, action) => {
        state.withdrawalsLoading = false;
        const items = Array.isArray(action.payload?.data?.items)
          ? action.payload.data.items
          : Array.isArray(action.payload?.items)
            ? action.payload.items
            : [];
        state.withdrawals = items.map(normalizeWithdrawal);
        state.withdrawalsMeta = action.payload?.data?.meta ?? action.payload?.meta ?? null;
      })
      .addCase(getWithdrawalRequests.rejected, (state) => {
        state.withdrawalsLoading = false;
      });
  },
});

export const { clearLatestTopupResult } = walletSlice.actions;
export default walletSlice.reducer;

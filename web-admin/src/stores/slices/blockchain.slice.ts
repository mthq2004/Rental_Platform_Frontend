import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";

export interface BlockchainStats {
  totalTransactions: number;
  totalContracts: number;
  totalPayments: number;
  latestBlockNumber: number | null;
  latestRecordedAt: string | null;
}

export interface ContractBlockchainRecord {
  rentalId: string;
  contractCode: string;
  contractHash: string | null;
  blockchainTxHash: string | null;
  blockchainNetwork: string | null;
  blockchainRecordedAt: string | null;
  status: string;
  lastVerifiedAt: string | null;
  verificationStatus: string | null;
}

export interface PaymentBlockchainProof {
  id: string;
  paymentId: string;
  payloadHash: string;
  txHash: string;
  blockNumber: number;
  chainId: number;
  recordedAt: string;
  lastVerifiedAt: string | null;
  verificationStatus: string | null;
  payment: {
    paymentId: string;
    paymentCode: string;
    amount: number;
    status: string;
    contractId: string;
    contract?: {
      contractCode: string;
    };
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BlockchainState {
  stats: BlockchainStats;
  statsLoading: boolean;
  
  contracts: ContractBlockchainRecord[];
  contractsPagination: Pagination;
  contractsLoading: boolean;
  contractSearch: string;

  payments: PaymentBlockchainProof[];
  paymentsPagination: Pagination;
  paymentsLoading: boolean;
  paymentSearch: string;

  detailData: any | null;
  detailType: "contract" | "payment";
  detailModalOpen: boolean;
  verifying: boolean;
}

const initialState: BlockchainState = {
  stats: {
    totalTransactions: 0,
    totalContracts: 0,
    totalPayments: 0,
    latestBlockNumber: null,
    latestRecordedAt: null,
  },
  statsLoading: false,

  contracts: [],
  contractsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  contractsLoading: false,
  contractSearch: "",

  payments: [],
  paymentsPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  paymentsLoading: false,
  paymentSearch: "",

  detailData: null,
  detailType: "contract",
  detailModalOpen: false,
  verifying: false,
};

// ─── Async Thunks ──────────────────────────────────────────

export const fetchBlockchainStats = createAsyncThunk(
  "blockchain/fetchStats",
  async () => {
    const res = await http.get("/contract/blockchain/stats");
    return res.data as BlockchainStats;
  }
);

export const fetchBlockchainContracts = createAsyncThunk(
  "blockchain/fetchContracts",
  async ({ page = 1, search = "" }: { page?: number; search?: string }) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (search) params.set("search", search);
    const res = await http.get(`/contract/blockchain/contracts?${params.toString()}`);
    return res.data as { items: ContractBlockchainRecord[]; pagination: Pagination };
  }
);

export const fetchBlockchainPayments = createAsyncThunk(
  "blockchain/fetchPayments",
  async ({ page = 1, search = "" }: { page?: number; search?: string }) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (search) params.set("search", search);
    const res = await http.get(`/contract/blockchain/payments?${params.toString()}`);
    return res.data as { items: PaymentBlockchainProof[]; pagination: Pagination };
  }
);

export const fetchContractBlockchainDetail = createAsyncThunk(
  "blockchain/fetchContractDetail",
  async (rentalId: string) => {
    const res = await http.get(`/contract/blockchain/contract/${rentalId}`);
    return res.data;
  }
);

export const fetchPaymentBlockchainDetail = createAsyncThunk(
  "blockchain/fetchPaymentDetail",
  async (paymentId: string) => {
    const res = await http.get(`/contract/blockchain/payment/${paymentId}`);
    return res.data;
  }
);

export const verifyContractOnChain = createAsyncThunk(
  "blockchain/verifyContract",
  async (rentalId: string) => {
    const res = await http.post(`/contract/blockchain/verify/${rentalId}`);
    return { rentalId, data: res.data };
  }
);

export const verifyPaymentOnChain = createAsyncThunk(
  "blockchain/verifyPayment",
  async (paymentId: string) => {
    const res = await http.post(`/contract/blockchain/verify-payment/${paymentId}`);
    return { paymentId, data: res.data };
  }
);

// ─── Slice ─────────────────────────────────────────────────

export const blockchainSlice = createSlice({
  name: "blockchain",
  initialState,
  reducers: {
    setContractSearch: (state, action) => {
      state.contractSearch = action.payload;
    },
    setPaymentSearch: (state, action) => {
      state.paymentSearch = action.payload;
    },
    setDetailModalOpen: (state, action) => {
      state.detailModalOpen = action.payload;
    },
    setDetailType: (state, action) => {
      state.detailType = action.payload;
    },
    clearDetailData: (state) => {
      state.detailData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // stats
      .addCase(fetchBlockchainStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchBlockchainStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchBlockchainStats.rejected, (state) => {
        state.statsLoading = false;
      })
      // contracts
      .addCase(fetchBlockchainContracts.pending, (state) => {
        state.contractsLoading = true;
      })
      .addCase(fetchBlockchainContracts.fulfilled, (state, action) => {
        state.contractsLoading = false;
        state.contracts = action.payload.items;
        state.contractsPagination = action.payload.pagination;
      })
      .addCase(fetchBlockchainContracts.rejected, (state) => {
        state.contractsLoading = false;
        state.contracts = [];
      })
      // payments
      .addCase(fetchBlockchainPayments.pending, (state) => {
        state.paymentsLoading = true;
      })
      .addCase(fetchBlockchainPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false;
        state.payments = action.payload.items;
        state.paymentsPagination = action.payload.pagination;
      })
      .addCase(fetchBlockchainPayments.rejected, (state) => {
        state.paymentsLoading = false;
        state.payments = [];
      })
      // contract detail
      .addCase(fetchContractBlockchainDetail.fulfilled, (state, action) => {
        state.detailData = action.payload;
        state.detailType = "contract";
        state.detailModalOpen = true;
      })
      // payment detail
      .addCase(fetchPaymentBlockchainDetail.fulfilled, (state, action) => {
        state.detailData = action.payload;
        state.detailType = "payment";
        state.detailModalOpen = true;
      })
      // verify contract
      .addCase(verifyContractOnChain.pending, (state) => {
        state.verifying = true;
      })
      .addCase(verifyContractOnChain.fulfilled, (state, action) => {
        state.verifying = false;
        if (state.detailData && state.detailType === "contract") {
          state.detailData.verificationStatus = action.payload.data.verificationStatus || "verified";
          state.detailData.lastVerifiedAt = action.payload.data.verifiedAt;
        }
      })
      .addCase(verifyContractOnChain.rejected, (state) => {
        state.verifying = false;
      })
      // verify payment
      .addCase(verifyPaymentOnChain.pending, (state) => {
        state.verifying = true;
      })
      .addCase(verifyPaymentOnChain.fulfilled, (state, action) => {
        state.verifying = false;
        if (state.detailData && state.detailType === "payment") {
          state.detailData.verificationStatus = action.payload.data.verificationStatus || "verified";
          state.detailData.lastVerifiedAt = action.payload.data.verifiedAt;
        }
      })
      .addCase(verifyPaymentOnChain.rejected, (state) => {
        state.verifying = false;
      });
  },
});

export const {
  setContractSearch,
  setPaymentSearch,
  setDetailModalOpen,
  setDetailType,
  clearDetailData,
} = blockchainSlice.actions;

export default blockchainSlice.reducer;

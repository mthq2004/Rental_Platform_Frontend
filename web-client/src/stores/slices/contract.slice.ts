import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type {
  RentalRequest,
  RentalContract,
  Payment,
  StatusCount,
  CreateContractPayload,
} from "../../types/contract.type";

interface ContractState {
  // Rental Requests
  myRequests: RentalRequest[];
  ownerRequests: RentalRequest[];
  requestsLoading: boolean;

  // Contracts
  contracts: RentalContract[];
  contractDetail: RentalContract | null;
  contractStatusCounts: StatusCount[];
  contractsLoading: boolean;
  contractsMeta: { page: number; limit: number; total: number; totalPages: number } | null;

  // Payments
  payments: Payment[];
  paymentsLoading: boolean;

  // General
  actionLoading: boolean;
}

const initialState: ContractState = {
  myRequests: [],
  ownerRequests: [],
  requestsLoading: false,

  contracts: [],
  contractDetail: null,
  contractStatusCounts: [],
  contractsLoading: false,
  contractsMeta: null,

  payments: [],
  paymentsLoading: false,

  actionLoading: false,
};

const normalizeRentMagnitude = (value: number): number => {
  // Guard against micro-unit values accidentally returned by some serializers.
  if (value >= 1e11) {
    return value / 1e6;
  }
  return value;
};

const parseNumberSafe = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? normalizeRentMagnitude(value) : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dotGrouped = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed);
    const normalized = dotGrouped
      ? trimmed.replace(/\./g, "").replace(/,/g, ".")
      : trimmed.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? normalizeRentMagnitude(parsed) : 0;
  }

  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number((value as { toString: () => string }).toString());
    return Number.isFinite(parsed) ? normalizeRentMagnitude(parsed) : 0;
  }

  return 0;
};

const normalizeRentalRequest = (request: any): RentalRequest => {
  const proposedRentRaw =
    request?.proposedRent ??
    request?.proposed_rent ??
    request?.proposedPrice ??
    request?.suggestedRent;

  return {
    ...request,
    proposedRent: parseNumberSafe(proposedRentRaw),
  } as RentalRequest;
};

// ─── Rental Request Actions ──────────────────────────────────────

export const createRentalRequest = createAsyncThunk(
  "contract/createRentalRequest",
  async (data: {
    propertyId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    proposedRent: number;
    message?: string;
  }, { rejectWithValue }) => {
    try {
      return await http.post("/contract/rental-requests", data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const getMyRequests = createAsyncThunk("contract/getMyRequests", async () => {
  return await http.get("/contract/rental-requests/my");
});

export const getOwnerRequests = createAsyncThunk(
  "contract/getOwnerRequests",
  async (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return await http.get(`/contract/rental-requests/owner${query}`);
  }
);

export const reviewRequest = createAsyncThunk(
  "contract/reviewRequest",
  async ({ requestId, data }: { requestId: string; data: { status: string; rejectionReason?: string; landlordNotes?: string } }, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-requests/${requestId}/review`, data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const cancelRequest = createAsyncThunk(
  "contract/cancelRequest",
  async (requestId: string, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-requests/${requestId}/cancel`);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

// ─── Contract Actions ────────────────────────────────────────────

export const getMyContracts = createAsyncThunk(
  "contract/getMyContracts",
  async (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return await http.get(`/contract/rental-contracts/my${qs ? `?${qs}` : ""}`);
  }
);

export const getContractDetail = createAsyncThunk(
  "contract/getContractDetail",
  async (contractId: string) => {
    return await http.get(`/contract/rental-contracts/${contractId}`);
  }
);

export const getContractStatusCounts = createAsyncThunk(
  "contract/getContractStatusCounts",
  async () => {
    return await http.get("/contract/rental-contracts/status-count");
  }
);

export const sendContractToTenant = createAsyncThunk(
  "contract/sendToTenant",
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-contracts/${contractId}/send`);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const updateContract = createAsyncThunk(
  "contract/updateContract",
  async ({ contractId, data }: { contractId: string; data: any }, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-contracts/${contractId}`, data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const tenantSignContract = createAsyncThunk(
  "contract/tenantSign",
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-contracts/${contractId}/tenant-sign`);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const ownerSignContract = createAsyncThunk(
  "contract/ownerSign",
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-contracts/${contractId}/owner-sign`);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const activateContract = createAsyncThunk(
  "contract/activate",
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-contracts/${contractId}/activate`);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const cancelContract = createAsyncThunk(
  "contract/cancel",
  async (contractId: string, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/rental-contracts/${contractId}/cancel`);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

// ─── Payment Actions ─────────────────────────────────────────────

export const getMyPayments = createAsyncThunk(
  "contract/getMyPayments",
  async (params?: { rentalId?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.rentalId) query.set("rentalId", params.rentalId);
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString();
    return await http.get(`/contract/payments/my${qs ? `?${qs}` : ""}`);
  }
);

export const confirmPayment = createAsyncThunk(
  "contract/confirmPayment",
  async ({ paymentId, data }: { paymentId: string; data: { paymentMethod: string; transactionId?: string; transactionRef?: string; paidAmount?: number } }, { rejectWithValue }) => {
    try {
      return await http.put(`/contract/payments/${paymentId}/confirm`, data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const createContract = createAsyncThunk(
  "contract/createContract",
  async (data: CreateContractPayload, { rejectWithValue }) => {
    try {
      return await http.post("/contract/rental-contracts/createContract", data);
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────

export const contractSlice = createSlice({
  name: "contract",
  initialState,
  reducers: {
    clearContractDetail: (state) => {
      state.contractDetail = null;
    },
  },
  extraReducers: (builder) => {
    // Rental Requests
    builder
      .addCase(getMyRequests.pending, (state) => { state.requestsLoading = true; })
      .addCase(getMyRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        const items = Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
            ? action.payload
            : [];
        state.myRequests = items.map(normalizeRentalRequest);
      })
      .addCase(getMyRequests.rejected, (state) => { state.requestsLoading = false; });

    builder
      .addCase(getOwnerRequests.pending, (state) => { state.requestsLoading = true; })
      .addCase(getOwnerRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        const items = Array.isArray(action.payload?.data)
          ? action.payload.data
          : Array.isArray(action.payload)
            ? action.payload
            : [];
        state.ownerRequests = items.map(normalizeRentalRequest);
      })
      .addCase(getOwnerRequests.rejected, (state) => { state.requestsLoading = false; });

    // Action loading for create/review/cancel
    builder
      .addCase(createRentalRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(createRentalRequest.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(createRentalRequest.rejected, (state) => { state.actionLoading = false; });

    builder
      .addCase(reviewRequest.pending, (state) => { state.actionLoading = true; })
      .addCase(reviewRequest.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(reviewRequest.rejected, (state) => { state.actionLoading = false; });

    // Contracts
    builder
      .addCase(getMyContracts.pending, (state) => { state.contractsLoading = true; })
      .addCase(getMyContracts.fulfilled, (state, action) => {
        state.contractsLoading = false;
        state.contracts = action.payload.data?.items ?? [];
        state.contractsMeta = action.payload.data?.meta ?? null;
      })
      .addCase(getMyContracts.rejected, (state) => { state.contractsLoading = false; });

    builder
      .addCase(getContractDetail.pending, (state) => { state.contractsLoading = true; })
      .addCase(getContractDetail.fulfilled, (state, action) => {
        state.contractsLoading = false;
        state.contractDetail = action.payload.data ?? null;
      })
      .addCase(getContractDetail.rejected, (state) => { state.contractsLoading = false; });

    builder
      .addCase(getContractStatusCounts.fulfilled, (state, action) => {
        state.contractStatusCounts = action.payload.data ?? [];
      });

    // Contract actions loading
    for (const thunk of [sendContractToTenant, tenantSignContract, ownerSignContract, activateContract, cancelContract, updateContract]) {
      builder
        .addCase(thunk.pending, (state) => { state.actionLoading = true; })
        .addCase(thunk.fulfilled, (state) => { state.actionLoading = false; })
        .addCase(thunk.rejected, (state) => { state.actionLoading = false; });
    }

    // Payments
    builder
      .addCase(getMyPayments.pending, (state) => { state.paymentsLoading = true; })
      .addCase(getMyPayments.fulfilled, (state, action) => {
        state.paymentsLoading = false;
        state.payments = action.payload.data?.items ?? [];
      })
      .addCase(getMyPayments.rejected, (state) => { state.paymentsLoading = false; });

    builder
      .addCase(confirmPayment.pending, (state) => { state.actionLoading = true; })
      .addCase(confirmPayment.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(confirmPayment.rejected, (state) => { state.actionLoading = false; });

    builder
      .addCase(createContract.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.actionLoading = false;

        const contract = action.payload?.data;
        if (!contract) return;

        // 🔍 check contract đã tồn tại chưa
        const index = state.contracts.findIndex(
          (c) => c.rentalId === contract.id
        );

        if (index !== -1) {
          // ✅ update nếu đã tồn tại
          state.contracts[index] = contract;
        } else {
          // ✅ thêm mới
          state.contracts.unshift(contract);
        }

        // ✅ đồng bộ detail
        state.contractDetail = contract;
      })
      .addCase(createContract.rejected, (state) => {
        state.actionLoading = false;
      });
  },
});

export const { clearContractDetail } = contractSlice.actions;
export default contractSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type {
  AccountItem,
  AccountListResponse,
  AccountQuery,
  CreateAccountPayload,
} from "../../types/user.type";

const BASE_ENDPOINT = "/estate/admin/user";
const KYC_ADMIN_ENDPOINT = "/estate/admin/kyc";

type AccountRolePath = "users" | "admins";

type UserState = {
  loading: boolean;
  items: AccountItem[];
  total: number;
  detail: AccountItem | null;
};

const initialState: UserState = {
  loading: false,
  items: [],
  total: 0,
  detail: null,
};

const sanitizeQuery = (query: AccountQuery = {}) => {
  const params: Record<string, string> = {};

  if (query.search?.trim()) {
    params.search = query.search.trim();
  }

  if (query.kycStatus && query.kycStatus !== "all") {
    params.kycStatus = query.kycStatus;
  }

  if (typeof query.isBanned === "boolean") {
    params.isBanned = String(query.isBanned);
  }

  if (typeof query.page === "number") {
    params.page = String(query.page);
  }

  if (typeof query.limit === "number") {
    params.limit = String(query.limit);
  }

  const queryString = new URLSearchParams(params).toString();
  return queryString ? `?${queryString}` : "";
};

const getByRole = async (
  rolePath: AccountRolePath,
  query: AccountQuery,
): Promise<AccountListResponse> => {
  const response = await http.get(`${BASE_ENDPOINT}/${rolePath}${sanitizeQuery(query)}`);
  return response.data;
};

export const getUsers = createAsyncThunk(
  "user/getUsers",
  async (query: AccountQuery = {}) => getByRole("users", query),
);

export const getAdmins = createAsyncThunk(
  "user/getAdmins",
  async (query: AccountQuery = {}) => getByRole("admins", query),
);

export const createUserAccount = createAsyncThunk(
  "user/createUser",
  async (payload: CreateAccountPayload): Promise<AccountItem> => {
    const response = await http.post(`${BASE_ENDPOINT}/users`, payload);
    return response.data;
  },
);

export const createAdminAccount = createAsyncThunk(
  "user/createAdmin",
  async (payload: CreateAccountPayload): Promise<AccountItem> => {
    const response = await http.post(`${BASE_ENDPOINT}/admins`, payload);
    return response.data;
  },
);

export const getAccountDetail = createAsyncThunk(
  "user/getAccountDetail",
  async (id: string): Promise<AccountItem> => {
    const response = await http.get(`${BASE_ENDPOINT}/${id}`);
    return response.data;
  },
);

export const banAccount = createAsyncThunk(
  "user/ban",
  async ({ id, reason, until }: { id: string; reason: string; until?: string }): Promise<AccountItem> => {
    const response = await http.put(`${BASE_ENDPOINT}/${id}/ban`, { reason, until });
    return response.data;
  },
);

export const unbanAccount = createAsyncThunk(
  "user/unban",
  async (id: string): Promise<AccountItem> => {
    const response = await http.put(`${BASE_ENDPOINT}/${id}/unban`, {});
    return response.data;
  },
);

export const approveKyc = createAsyncThunk(
  "user/approveKyc",
  async (kycId: string): Promise<{ status: string; score: number; flags: string[]; rejectionReason: string | null }> => {
    const response = await http.patch(`${KYC_ADMIN_ENDPOINT}/${kycId}/approve`, {});
    return response.data;
  },
);

export const rejectKyc = createAsyncThunk(
  "user/rejectKyc",
  async (
    { kycId, rejectionReason }: { kycId: string; rejectionReason: string },
  ): Promise<{ status: string; score: number; flags: string[]; rejectionReason: string | null }> => {
    const response = await http.patch(`${KYC_ADMIN_ENDPOINT}/${kycId}/reject`, { rejectionReason });
    return response.data;
  },
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.meta.total;
      })
      .addCase(getUsers.rejected, (state) => {
        state.loading = false;
      })
      .addCase(getAdmins.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.meta.total;
      })
      .addCase(getAdmins.rejected, (state) => {
        state.loading = false;
      })
      .addCase(getAccountDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAccountDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(getAccountDetail.rejected, (state) => {
        state.loading = false;
      })
      .addCase(banAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(banAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(banAccount.rejected, (state) => {
        state.loading = false;
      })
      .addCase(unbanAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(unbanAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.detail = action.payload;
      })
      .addCase(unbanAccount.rejected, (state) => {
        state.loading = false;
      })
      .addCase(approveKyc.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveKyc.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(approveKyc.rejected, (state) => {
        state.loading = false;
      })
      .addCase(rejectKyc.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectKyc.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(rejectKyc.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createUserAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUserAccount.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUserAccount.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createAdminAccount.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAdminAccount.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAdminAccount.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default userSlice.reducer;

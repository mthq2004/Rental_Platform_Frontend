import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const verifyKyc = createAsyncThunk(
    "kyc/verify",
    async (data: FormData, { rejectWithValue }) => {
        try {
            const response = await apiClient.post("/estate/kyc/submit", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || error.message || "Xác thực eKYC thất bại"
            );
        }
    }
);

export const saveForAdmin = createAsyncThunk(
    "kyc/saveForAdmin",
    async (data: FormData, { rejectWithValue }) => {
        try {
            const response = await apiClient.post("/estate/auth/kyc/save-for-admin", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || error.message || "Gửi yêu cầu thất bại"
            );
        }
    }
);

// ─── State ────────────────────────────────────────────────────────────────────

type KycState = {
    kycData: any;
    loading: boolean;
    error: string | null;
};

const initialState: KycState = {
    kycData: null,
    loading: false,
    error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

export const kycSlice = createSlice({
    name: "kyc",
    initialState,
    reducers: {
        resetKycState: (state) => {
            state.kycData = null;
            state.error = null;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(verifyKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.kycData = action.payload;
            })
            .addCase(verifyKyc.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || "Có lỗi xảy ra";
            });

        builder
            .addCase(saveForAdmin.pending, (state) => {
                state.loading = true;
            })
            .addCase(saveForAdmin.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(saveForAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || "Gửi yêu cầu thất bại";
            });
    },
});

export const { resetKycState } = kycSlice.actions;
export default kycSlice.reducer;

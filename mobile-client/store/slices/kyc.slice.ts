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
    },
});

export const { resetKycState } = kycSlice.actions;
export default kycSlice.reducer;

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

export const extractOcr = createAsyncThunk(
    "kyc/extractOcr",
    async (data: FormData, { rejectWithValue }) => {
        try {
            const response = await apiClient.post("/estate/kyc/extract-ocr", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || error.message || "Có lỗi trích xuất OCR"
            );
        }
    }
);

export const verifyFace = createAsyncThunk(
    "kyc/verifyFace",
    async (payload: { selfieUri: string; kycId: string }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("files", { uri: payload.selfieUri, name: `selfie_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
            formData.append("kycId", payload.kycId);
            const response = await apiClient.post("/estate/kyc/verify-face", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || error.message || "Có lỗi xác thực khuôn mặt"
            );
        }
    }
);

export const saveForAdmin = createAsyncThunk(
    "kyc/saveForAdmin",
    async (kycId: string, { rejectWithValue }) => {
        try {
            const response = await apiClient.post("/estate/kyc/request-review", { kycId });
            return response.data?.data || response.data;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || error.message || "Gửi yêu cầu thất bại"
            );
        }
    }
);

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
            })
            .addCase(extractOcr.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(extractOcr.fulfilled, (state, action) => {
                state.loading = false;
                state.kycData = action.payload;
            })
            .addCase(extractOcr.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || "Có lỗi trích xuất OCR";
            })
            .addCase(verifyFace.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyFace.fulfilled, (state, action) => {
                state.loading = false;
                state.kycData = action.payload;
            })
            .addCase(verifyFace.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) || "Có lỗi xác thực khuôn mặt";
            })
            .addCase(saveForAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
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

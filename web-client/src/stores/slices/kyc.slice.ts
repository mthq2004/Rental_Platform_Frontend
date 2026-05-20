import http from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const verifyKyc = createAsyncThunk(
    "kyc/verify",
    async (data: FormData) => {
        const response = await http.post("/estate/kyc/submit", data);
        // If the backend wraps the result in a .data property, use it, 
        // otherwise return the whole response as it's the structure provided by user.
        return response.data || response;
    }
)

export const extractOcr = createAsyncThunk(
    "kyc/extractOcr",
    async (data: FormData) => {
        const response = await http.post("/estate/kyc/extract-ocr", data);
        return response.data || response;
    }
)

export const verifyFace = createAsyncThunk(
    "kyc/verifyFace",
    async (payload: { selfie: File; kycId: string }) => {
        const formData = new FormData();
        formData.append("files", payload.selfie);
        formData.append("kycId", payload.kycId);
        const response = await http.post("/estate/kyc/verify-face", formData);
        return response.data || response;
    }
)

export const saveForAdmin = createAsyncThunk(
    "kyc/saveForAdmin",
    async (kycId: string) => {
        const response = await http.post("/estate/kyc/request-review", { kycId });
        return response.data || response;
    }
)

type initialStateType = {
    kycData: any;
    loading: boolean;
    error: string | null;
}

const initialState: initialStateType = {
    kycData: null,
    loading: false,
    error: null,
}

export const kycSlice = createSlice({
    name: "kyc",
    initialState,
    reducers: {
        resetKycState: (state) => {
            state.kycData = null;
            state.error = null;
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(verifyKyc.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        builder.addCase(verifyKyc.fulfilled, (state, action) => {
            state.loading = false;
            state.kycData = action.payload;
        })
        builder.addCase(verifyKyc.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Có lỗi xảy ra";
        })
        builder.addCase(extractOcr.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        builder.addCase(extractOcr.fulfilled, (state, action) => {
            state.loading = false;
            state.kycData = action.payload;
        })
        builder.addCase(extractOcr.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Có lỗi trích xuất OCR";
        })
        builder.addCase(verifyFace.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        builder.addCase(verifyFace.fulfilled, (state, action) => {
            state.loading = false;
            state.kycData = action.payload;
        })
        builder.addCase(verifyFace.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Có lỗi xác thực khuôn mặt";
        })
        builder.addCase(saveForAdmin.pending, (state) => {
            state.loading = true;
        })
        builder.addCase(saveForAdmin.fulfilled, (state) => {
            state.loading = false;
        })
        builder.addCase(saveForAdmin.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || "Gửi yêu cầu thất bại";
        })
    }
})

export const { resetKycState } = kycSlice.actions
export default kycSlice.reducer
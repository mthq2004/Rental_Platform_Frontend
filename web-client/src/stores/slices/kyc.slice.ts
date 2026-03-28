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

export const saveForAdmin = createAsyncThunk(
    "kyc/saveForAdmin",
    async (data: FormData) => {
        const response = await http.post("/estate/auth/kyc/save-for-admin", data);
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
import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { EligibilityResult, ImportSession, ImportSessionDetail, ImportRowError } from "@/types/bulk-import.type";

interface BulkImportState {
    eligibility: EligibilityResult | null;
    eligibilityLoading: boolean;
    uploading: boolean;
    uploadResult: ImportSession | null;
    sessions: ImportSession[];
    sessionsLoading: boolean;
    sessionDetail: ImportSessionDetail | null;
    sessionDetailLoading: boolean;
    errors: ImportRowError[];
    errorsLoading: boolean;
    error: string | null;
}

const initialState: BulkImportState = {
    eligibility: null,
    eligibilityLoading: false,
    uploading: false,
    uploadResult: null,
    sessions: [],
    sessionsLoading: false,
    sessionDetail: null,
    sessionDetailLoading: false,
    errors: [],
    errorsLoading: false,
    error: null,
};

export const checkEligibility = createAsyncThunk(
    "bulkImport/checkEligibility",
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/estate/properties/bulk-import/eligibility");
            return res.data as EligibilityResult;
        } catch (error: any) {
            return rejectWithValue(error.message || "Kiểm tra điều kiện thất bại");
        }
    }
);

export const uploadBulkExcel = createAsyncThunk(
    "bulkImport/upload",
    async (file: File, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await apiClient.post("/estate/properties/bulk-import/upload", formData);
            return res.data as ImportSession;
        } catch (error: any) {
            return rejectWithValue(error.message || "Upload thất bại");
        }
    }
);

export const getImportSessions = createAsyncThunk(
    "bulkImport/getSessions",
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/estate/properties/bulk-import/sessions");
            return res.data as ImportSession[];
        } catch (error: any) {
            return rejectWithValue(error.message || "Lấy lịch sử thất bại");
        }
    }
);

export const getSessionDetail = createAsyncThunk(
    "bulkImport/getSessionDetail",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(`/estate/properties/bulk-import/sessions/${id}`);
            return res.data as ImportSessionDetail;
        } catch (error: any) {
            return rejectWithValue(error.message || "Lấy chi tiết thất bại");
        }
    }
);

export const getSessionErrors = createAsyncThunk(
    "bulkImport/getSessionErrors",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(`/estate/properties/bulk-import/sessions/${id}/errors`);
            return res.data as ImportRowError[];
        } catch (error: any) {
            return rejectWithValue(error.message || "Lấy danh sách lỗi thất bại");
        }
    }
);

const bulkImportSlice = createSlice({
    name: "bulkImport",
    initialState,
    reducers: {
        resetUploadResult: (state) => { state.uploadResult = null; state.error = null; },
        resetSessionDetail: (state) => { state.sessionDetail = null; state.errors = []; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkEligibility.pending, (state) => { state.eligibilityLoading = true; })
            .addCase(checkEligibility.fulfilled, (state, action) => {
                state.eligibilityLoading = false;
                state.eligibility = action.payload;
            })
            .addCase(checkEligibility.rejected, (state) => { state.eligibilityLoading = false; });

        builder
            .addCase(uploadBulkExcel.pending, (state) => { state.uploading = true; state.error = null; state.uploadResult = null; })
            .addCase(uploadBulkExcel.fulfilled, (state, action) => {
                state.uploading = false;
                state.uploadResult = action.payload;
            })
            .addCase(uploadBulkExcel.rejected, (state, action) => {
                state.uploading = false;
                state.error = action.payload as string;
            });

        builder
            .addCase(getImportSessions.pending, (state) => { state.sessionsLoading = true; })
            .addCase(getImportSessions.fulfilled, (state, action) => {
                state.sessionsLoading = false;
                state.sessions = action.payload;
            })
            .addCase(getImportSessions.rejected, (state) => { state.sessionsLoading = false; });

        builder
            .addCase(getSessionDetail.pending, (state) => { state.sessionDetailLoading = true; })
            .addCase(getSessionDetail.fulfilled, (state, action) => {
                state.sessionDetailLoading = false;
                state.sessionDetail = action.payload;
            })
            .addCase(getSessionDetail.rejected, (state) => { state.sessionDetailLoading = false; });

        builder
            .addCase(getSessionErrors.pending, (state) => { state.errorsLoading = true; })
            .addCase(getSessionErrors.fulfilled, (state, action) => {
                state.errorsLoading = false;
                state.errors = action.payload;
            })
            .addCase(getSessionErrors.rejected, (state) => { state.errorsLoading = false; });
    },
});

export const { resetUploadResult, resetSessionDetail } = bulkImportSlice.actions;
export default bulkImportSlice.reducer;

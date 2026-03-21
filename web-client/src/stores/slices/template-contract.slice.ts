import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type {
  ContractRequestData,
  ContractTemplate,
  ContractTemplateDetail,
} from "../../types/template.type";

interface TemplateState {
  templates: ContractTemplate[];
  templateDetail: ContractTemplateDetail | null;

  requestData: ContractRequestData | null;

  templatesLoading: boolean;
  templateDetailLoading: boolean;
  requestLoading: boolean;

  error: string | null;
}

const initialState: TemplateState = {
  templates: [],
  templateDetail: null,

  requestData: null,

  templatesLoading: false,
  templateDetailLoading: false,
  requestLoading: false,

  error: null,
};


// ─────────────────────────────────────────
// Get Template List
// ─────────────────────────────────────────

export const getTemplates = createAsyncThunk<
  ContractTemplate[],
  string,
  { rejectValue: string }
>("template/getTemplates", async (propertyType, { rejectWithValue }) => {
  try {
    const res = await http.get(`contract/contract-templates/property-type/${propertyType}`);
    return res.data ?? [];
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to fetch templates"
    );
  }
});


// ─────────────────────────────────────────
// Get Template Detail
// ─────────────────────────────────────────

export const getTemplateDetail = createAsyncThunk<
  ContractTemplateDetail,
  string,
  { rejectValue: string }
>("template/getTemplateDetail", async (templateId, { rejectWithValue }) => {
  try {
    const res = await http.get(`contract/contract-templates/${templateId}`);
    return res.data ?? null;
  } catch (error: any) {
    return rejectWithValue(
      error?.response?.data?.message || "Failed to fetch template detail"
    );
  }
});

export const getRequestTemplateData = createAsyncThunk<
  ContractRequestData,
  string,
  { rejectValue: string }
>(
  "template/getRequestTemplateData",
  async (requestId, { rejectWithValue }) => {
    try {
      const res = await http.get(
        `contract/contract-templates/request/${requestId}`
      );
      return res.data ?? null;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
        "Failed to fetch request template data"
      );
    }
  }
);


// ─────────────────────────────────────────
// Slice
// ─────────────────────────────────────────

export const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    clearTemplateDetail: (state) => {
      state.templateDetail = null;
    },
  },
  extraReducers: (builder) => {

    // Get Templates
    builder
      .addCase(getTemplates.pending, (state) => {
        state.templatesLoading = true;
        state.error = null;
      })
      .addCase(
        getTemplates.fulfilled,
        (state, action: PayloadAction<ContractTemplate[]>) => {
          state.templatesLoading = false;
          state.templates = action.payload;
        }
      )
      .addCase(getTemplates.rejected, (state, action) => {
        state.templatesLoading = false;
        state.error = action.payload || "Error loading templates";
      });


    // Get Template Detail
    builder
      .addCase(getTemplateDetail.pending, (state) => {
        state.templateDetailLoading = true;
        state.error = null;
      })
      .addCase(
        getTemplateDetail.fulfilled,
        (state, action: PayloadAction<ContractTemplateDetail>) => {
          state.templateDetailLoading = false;
          state.templateDetail = action.payload;
        }
      )
      .addCase(getTemplateDetail.rejected, (state, action) => {
        state.templateDetailLoading = false;
        state.error = action.payload || "Error loading template detail";
      });

    // Get Request Template Data
    builder
      .addCase(getRequestTemplateData.pending, (state) => {
        state.requestLoading = true;
        state.error = null;
      })
      .addCase(
        getRequestTemplateData.fulfilled,
        (state, action: PayloadAction<ContractRequestData>) => {
          state.requestLoading = false;
          state.requestData = action.payload;
        }
      )
      .addCase(getRequestTemplateData.rejected, (state, action) => {
        state.requestLoading = false;
        state.error =
          action.payload || "Error loading request template data";
      });

  },
});

export const { clearTemplateDetail } = templateSlice.actions;

export default templateSlice.reducer;
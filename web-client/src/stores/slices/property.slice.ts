import { PropertyFormData } from "@/types/property.type";
import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface PropertyData extends PropertyFormData {
    id: string;
    createdAt: string;
    updatedAt: string;
    viewCount?: number;
    favoriteCount?: number;
    contactCount?: number;
    bookingCount?: number;
    rejectionReason?: string;
}

export interface StatusCount {
    id: string;
    label: string;
    count: number;
}

export interface PropertyMessage {
    type: "success" | "error" | "warning" | "info";
    message: string;
}

interface PropertyState {
    loading: boolean;
    loadingPropertyStatus: boolean;
    loadingProperty: boolean;
    property: PropertyData | null;
    properties: PropertyData[];
    message: PropertyMessage | null;
    statusCount: StatusCount[] | null;
    error: string | null;
}

const initialState: PropertyState = {
    loading: false,
    loadingPropertyStatus: false,
    loadingProperty: false,
    property: null,
    properties: [],
    message: null,
    statusCount: null,
    error: null,
};

// Async Thunks
export const createProperty = createAsyncThunk(
    "property/createProperty",
    async (data: Partial<PropertyFormData>, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/estate/properties", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || "Tạo bài đăng thất bại");
        }
    }
);

export const createPropertySaveDraft = createAsyncThunk(
    "property/createPropertySaveDraft",
    async (data: Partial<PropertyFormData>, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/estate/properties/draft", data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || "Lưu nháp thất bại");
        }
    }
);

export const getPostStatusCounts = createAsyncThunk(
    "property/getPostStatusCounts",
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/estate/properties/status-count");
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || "Lấy số lượng trạng thái thất bại");
        }
    }
);

export const getPropertiesByStatus = createAsyncThunk(
    "property/getPropertiesByStatus",
    async (status: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(`/estate/properties/status?status=${status}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || "Lấy danh sách bài đăng thất bại");
        }
    }
);

export const getPropertyById = createAsyncThunk(
    "property/getPropertyById",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.get(`/estate/properties/${id}`);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || "Lấy chi tiết bài đăng thất bại");
        }
    }
);

export const updateProperty = createAsyncThunk(
    "property/updateProperty",
    async (payload: { id: string; data: Partial<PropertyFormData> }, { rejectWithValue }) => {
        try {
            const res = await apiClient.put(`/estate/properties/update/${payload.id}`, payload.data);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.message || "Cập nhật bài đăng thất bại");
        }
    }
);

export const updatePropertyVisibility = createAsyncThunk(
    "property/updatePropertyVisibility",
    async (payload: { id: string; visible: boolean }, { rejectWithValue }) => {
        try {
            const res = await apiClient.put(`/estate/properties/${payload.id}/visibility`, { visible: payload.visible });
            return {
                ...res.data,
                id: payload.id,
                visible: payload.visible,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || "Cập nhật trạng thái hiển thị thất bại");
        }
    }
);

// Slice
export const propertySlice = createSlice({
    name: "property",
    initialState,
    reducers: {
        resetMessage: (state) => {
            state.message = null;
        },
        resetProperty: (state) => {
            state.property = null;
        },
        setMessage: (state, action: PayloadAction<PropertyMessage>) => {
            state.message = action.payload;
        },
    },
    extraReducers: (builder) => {
        // createProperty
        builder
            .addCase(createProperty.pending, (state) => {
                state.loading = true;
                state.message = null;
            })
            .addCase(createProperty.fulfilled, (state) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Tạo bài đăng thành công!",
                };
            })
            .addCase(createProperty.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Tạo bài đăng thất bại!",
                };
            });

        // getPostStatusCounts
        builder
            .addCase(getPostStatusCounts.pending, (state) => {
                state.loading = true;
            })
            .addCase(getPostStatusCounts.fulfilled, (state, action) => {
                state.loading = false;
                state.statusCount = action.payload || null;
            })
            .addCase(getPostStatusCounts.rejected, (state) => {
                state.loading = false;
                state.statusCount = null;
            });

        // getPropertiesByStatus
        builder
            .addCase(getPropertiesByStatus.pending, (state) => {
                state.loadingPropertyStatus = true;
            })
            .addCase(getPropertiesByStatus.fulfilled, (state, action) => {
                state.loadingPropertyStatus = false;
                state.properties = action.payload || [];
            })
            .addCase(getPropertiesByStatus.rejected, (state) => {
                state.loadingPropertyStatus = false;
                state.properties = [];
            });

        // createPropertySaveDraft
        builder
            .addCase(createPropertySaveDraft.pending, (state) => {
                state.loading = true;
                state.message = null;
            })
            .addCase(createPropertySaveDraft.fulfilled, (state) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Lưu nháp thành công!",
                };
            })
            .addCase(createPropertySaveDraft.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Lưu nháp thất bại!",
                };
            });

        // getPropertyById
        builder
            .addCase(getPropertyById.pending, (state) => {
                state.loadingProperty = true;
            })
            .addCase(getPropertyById.fulfilled, (state, action) => {
                state.loadingProperty = false;
                state.property = action.payload || null;
            })
            .addCase(getPropertyById.rejected, (state) => {
                state.loadingProperty = false;
                state.property = null;
            });

        // updateProperty
        builder
            .addCase(updateProperty.pending, (state) => {
                state.loading = true;
                state.message = null;
            })
            .addCase(updateProperty.fulfilled, (state) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Cập nhật bài đăng thành công!",
                };
            })
            .addCase(updateProperty.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Cập nhật bài đăng thất bại!",
                };
            });

        builder
            .addCase(updatePropertyVisibility.pending, (state) => {
                state.loading = true;
            })
            .addCase(updatePropertyVisibility.fulfilled, (state, action) => {
                state.loading = false;
                state.properties = state.properties.map((item) => {
                    const itemId = item.id || item.propertyId;
                    if (itemId !== action.payload.id) {
                        return item;
                    }

                    return {
                        ...item,
                        status: action.payload.visible ? "active" : "inactive",
                    };
                });
                state.message = {
                    type: "success",
                    message: action.payload.visible ? "Đã hiển thị lại tin" : "Đã ẩn tin",
                };
            })
            .addCase(updatePropertyVisibility.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Cập nhật trạng thái hiển thị thất bại",
                };
            });
    },
});

export const { resetMessage, resetProperty, setMessage } = propertySlice.actions;
export default propertySlice.reducer;

// Selectors
export const selectProperty = (state: { property: PropertyState }) =>
    state.property.property;

export const selectProperties = (state: { property: PropertyState }) =>
    state.property.properties;

export const selectPropertyLoading = (state: { property: PropertyState }) =>
    state.property.loading;

export const selectPropertyMessage = (state: { property: PropertyState }) =>
    state.property.message;

export const selectStatusCount = (state: { property: PropertyState }) =>
    state.property.statusCount;

export const selectPropertyLoadingDetail = (state: { property: PropertyState }) =>
    state.property.loadingProperty;

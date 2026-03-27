import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { Property } from "../../types/property-new.type";

interface Filter {
    approvalStatus: 'pending' | 'approved' | 'rejected',
    page: number,
    limit: number,
}

interface ApprovalStatusPayload {
    approve: boolean;
    reason?: string;
}

export const getPropertiesByStatus = createAsyncThunk(
    "property/getByStatus",
    async (filter: Filter) => {
        const response = await http.post(`/estate/properties/admin`, filter);
        return response.data
    }
);

export const approveProperty = createAsyncThunk(
    "property/approve",
    async ({ propertyId, data }: { propertyId: string, data: ApprovalStatusPayload }) => {
        const response = await http.put(`/estate/properties/admin/approve/${propertyId}`, data);

        return response.data
    }
);

export const getPropertyDetailForAdmin = createAsyncThunk(
    "property/getDetailForAdmin",
    async (propertyId: string) => {
        const response = await http.get(`/estate/properties/public/${propertyId}`);
        return response.data;
    }
);

export const updatePropertyVisibilityForAdmin = createAsyncThunk(
    "property/updateVisibilityForAdmin",
    async ({ propertyId, visible }: { propertyId: string; visible: boolean }) => {
        const response = await http.put(`/estate/properties/admin/visibility/${propertyId}`, { visible });
        return {
            ...response.data,
            visible,
            propertyId,
        };
    }
);

type initialStateType = {
    loading: boolean,
    properties: Property[],
    propertyDetail: any | null,
}

const initialState: initialStateType = {
    loading: false,
    properties: [],
    propertyDetail: null,
}

export const propertySlice = createSlice({
    name: "property",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getPropertiesByStatus.pending, state => {
                state.loading = true;
                state.properties = [];
            })
            .addCase(getPropertiesByStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.properties = action.payload.properties;
            })
            .addCase(getPropertiesByStatus.rejected, state => {
                state.loading = false;
                state.properties = [];
            })

        builder
            .addCase(approveProperty.pending, state => {
                state.loading = true;
            })
            .addCase(approveProperty.fulfilled, (state, action) => {
                state.loading = false;
                const { propertyId } = action.payload;

                state.properties = state.properties.filter(
                    p => p.propertyId !== propertyId
                );
            })
            .addCase(approveProperty.rejected, state => {
                state.loading = false;
            })

        builder
            .addCase(getPropertyDetailForAdmin.pending, state => {
                state.loading = true;
                state.propertyDetail = null;
            })
            .addCase(getPropertyDetailForAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.propertyDetail = action.payload;
            })
            .addCase(getPropertyDetailForAdmin.rejected, state => {
                state.loading = false;
                state.propertyDetail = null;
            })

        builder
            .addCase(updatePropertyVisibilityForAdmin.pending, state => {
                state.loading = true;
            })
            .addCase(updatePropertyVisibilityForAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.properties = state.properties.map((item) => {
                    if (item.propertyId !== action.payload.propertyId) {
                        return item;
                    }
                    return {
                        ...item,
                        status: action.payload.visible ? 'active' : 'inactive',
                    };
                });

                if (state.propertyDetail?.id === action.payload.propertyId) {
                    state.propertyDetail = {
                        ...state.propertyDetail,
                        status: action.payload.visible ? 'active' : 'inactive',
                    };
                }
            })
            .addCase(updatePropertyVisibilityForAdmin.rejected, state => {
                state.loading = false;
            })
    }
})


export default propertySlice.reducer
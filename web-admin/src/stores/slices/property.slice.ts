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
    rejectionReason?: string;
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

type initialStateType = {
    loading: boolean,
    properties: Property[]
}

const initialState: initialStateType = {
    loading: false,
    properties: []
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
    }
})


export default propertySlice.reducer
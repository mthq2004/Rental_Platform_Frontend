import { PropertyData } from "@/app/(tab)/(protected)/my-post";
import { PropertyFormData } from "@/types/property.type";
import apiClient from "@/utils/api";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';

export const createProperty = createAsyncThunk(
    "property/createProperty",
    async (data: any) => {
        const res = await apiClient.post("/estate/properties", data)
        return res.data;
    }
);

export const createPropertySaveDraft = createAsyncThunk(
    "property/createPropertySaveDraft",
    async (data: any) => {
        const res = await apiClient.post("/estate/properties/draft", data)
        return res.data;
    }
);

export const getPostStatusCounts = createAsyncThunk(
    "property/getPostStatusCounts",
    async () => {
        const res = await apiClient.get("/estate/properties/status-count")
        return res.data
    }
)

export const getPropertiesByStatus = createAsyncThunk(
    "property/getPropertiesByStatus",
    async (status: string) => {
        const res = await apiClient.get(`/estate/properties/status?status=${status}`)
        return res.data
    }
)

export const getPropertyById = createAsyncThunk(
    "property/getPropertyById",
    async (id: string) => {
        const res = await apiClient.get(`/estate/properties/${id}`)
        return res.data
    }
)

export const updateProperty = createAsyncThunk(
    "property/updateProperty",
    async (payload: { id: string; data: PropertyFormData }) => {
        const res = await apiClient.put(`/estate/properties/update/${payload.id}`, payload.data)
        return res.data
    }
)

export const getAllproperty = createAsyncThunk(
    "property/getAllproperty",
    async () => {
        const res = await apiClient.get("/estate/booking/properties")
        return res.data
    }
)

export const getPropertyDetail = createAsyncThunk(
    "booking/getPropertyDetail",
    async (propertyId: any) => {
        const res = await apiClient.get(`/estate/booking/property-details/${propertyId}`)
        return res.data
    }
)

export const getNumberPropertyByCity = createAsyncThunk(
    "property/getNumberPropertyByCity",
    async (type: string) => {
        const res = await apiClient.get(`/estate/properties/number-property?type=${type}`);
        return res.data;
    }
);

interface PropertyCountByCity {
    city: string;
    numberProperty: number;
}

type initialStateType = {
    loading: boolean,
    loadingPropertyStatus?: boolean
    loadingProperty?: boolean
    property: PropertyFormData | null,
    properties?: PropertyData[] | []
    message?: any
    statusCount?: {
        id: string,
        lable: string,
        count: number
    } | null
    propertyTemp?: any | [],
    propertyDetail?: any | [],
    propertyCountByCity?: PropertyCountByCity[] | []
}

const initialState: initialStateType = {
    loading: false,
    loadingPropertyStatus: false,
    property: null
}

export const propertySlice = createSlice({
    name: "property",
    initialState,
    reducers: {
        resetMessage: (state) => {
            state.message = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createProperty.pending, state => {
                state.loading = true
            })
            .addCase(createProperty.fulfilled, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Tạo thành công!"
                }
            })
            .addCase(createProperty.rejected, state => {
                state.loading = false,
                    state.message = {
                        type: "error",
                        message: "Tạo thất bại!",
                    };
            })

        builder
            .addCase(getPostStatusCounts.pending, state => {
                state.loading = true
            })
            .addCase(getPostStatusCounts.fulfilled, (state, action) => {
                state.loading = false;
                state.statusCount = action.payload?.data || null
            })
            .addCase(getPostStatusCounts.rejected, state => {
                state.loading = false
                state.statusCount = null
            })

        builder
            .addCase(getPropertiesByStatus.pending, state => {
                state.loadingPropertyStatus = true
            })
            .addCase(getPropertiesByStatus.fulfilled, (state, action) => {
                state.loadingPropertyStatus = false;
                state.properties = action.payload.data
            })
            .addCase(getPropertiesByStatus.rejected, state => {
                state.loadingPropertyStatus = false
                state.properties = []
            })

        builder
            .addCase(createPropertySaveDraft.pending, state => {
                state.loading = true
            })
            .addCase(createPropertySaveDraft.fulfilled, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Tạo tin nháp thành công!"
                }
            })
            .addCase(createPropertySaveDraft.rejected, state => {
                state.loading = false,
                    state.message = {
                        type: "error",
                        message: "Tạo tin nháp thất bại!",
                    };
            })

        builder
            .addCase(getPropertyById.pending, state => {
                state.loadingProperty = true
            })
            .addCase(getPropertyById.fulfilled, (state, action) => {
                state.loadingProperty = false;
                state.property = action.payload?.data || null
            })
            .addCase(getPropertyById.rejected, state => {
                state.loadingProperty = false
                state.property = null
            })

        builder
            .addCase(updateProperty.pending, state => {
                state.loading = true
            })
            .addCase(updateProperty.fulfilled, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Tạo thành công!"
                }
            })
            .addCase(updateProperty.rejected, state => {
                state.loading = false,
                    state.message = {
                        type: "error",
                        message: "Tạo thất bại!",
                    };
            })

        builder
            .addCase(getAllproperty.pending, state => {
                state.loading = true
            })
            .addCase(getAllproperty.fulfilled, (state, action) => {
                state.loading = false;
                state.propertyTemp = action.payload.data
            })
            .addCase(getAllproperty.rejected, state => {
                state.loading = false;
                state.propertyTemp = []
            })
        builder
            .addCase(getPropertyDetail.pending, state => {
                state.loading = true
            })
            .addCase(getPropertyDetail.fulfilled, (state, action) => {
                state.loading = false,
                    state.propertyDetail = action.payload.data
            })
            .addCase(getPropertyDetail.rejected, state => {
                state.loading = false,
                    state.propertyDetail = null
            })
        builder
            .addCase(getNumberPropertyByCity.pending, state => {
                state.loading = true
            })
            .addCase(getNumberPropertyByCity.fulfilled, (state, action) => {
                state.loading = false
                state.propertyCountByCity = action.payload.data || []
            })
            .addCase(getNumberPropertyByCity.rejected, state => {
                state.loading = false
                state.propertyCountByCity = []
            })
    },
});

export const { resetMessage } = propertySlice.actions
export default propertySlice.reducer;

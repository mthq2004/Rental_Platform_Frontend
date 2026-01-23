import { PropertyData } from "@/app/(tab)/my-post";
import { PropertyFormData } from "@/types/property.type";
import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';

export const getNotification = createAsyncThunk(
    "notification/getNotification",
    async (data: any) => {
        const res = await apiClient.post("/notification/notification", data)
        return res.data;
    }
);

type initialStateType = {
    loading: boolean,
    notification?: any
}

const initialState: initialStateType = {
    loading: false,
}

export const notificatinSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getNotification.pending, state => {
                state.loading = true
            })
            .addCase(getNotification.fulfilled, (state, action) => {
                state.loading = false;
                state.notification = action.payload.data
            })
            .addCase(getNotification.rejected, state => {
                state.loading = false,
                state.notification = null
            })
    },
});

export default notificatinSlice.reducer;

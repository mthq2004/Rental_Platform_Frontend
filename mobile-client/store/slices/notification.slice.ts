import { PropertyData } from "@/app/(tab)/my-post";
import { PropertyFormData } from "@/types/property.type";
import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios';

export const getNotification = createAsyncThunk(
    "notification/getNotification",
    async () => {
        const res = await apiClient.get("/notification/notification")
        return res.data;
    }
);

export const markAsRead = createAsyncThunk(
    "notification/markAsRead",
    async (id: String) => {
        const res = await apiClient.patch(`/notification/notification/${id}/read`)
        return res.data;
    }
)

type initialStateType = {
    loading: boolean,
    notifications?: any
}

const initialState: initialStateType = {
    loading: false,
}

export const notificatinSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        notificationReadRealtime: (state, action) => {
            const found = state.notifications.find(
                (n: any) => n.id === action.payload.notificationId
            );
            if (found) found.isRead = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getNotification.pending, state => {
                state.loading = true
            })
            .addCase(getNotification.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.data
            })
            .addCase(getNotification.rejected, state => {
                state.loading = false,
                    state.notifications = null
            })

        builder
            .addCase(markAsRead.fulfilled, () => { })
    },
});

export const { notificationReadRealtime } = notificatinSlice.actions
export default notificatinSlice.reducer;

export const selectUnreadCount = (state: any) =>
  state.notification.notifications.filter((n: any) => !n.isRead).length;


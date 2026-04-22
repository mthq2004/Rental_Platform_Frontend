import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const getNotification = createAsyncThunk(
    "notification/getNotification",
    async () => {
        const res = await apiClient.get("/notification/notification")
        return res.data;
    }
);

export const markAsRead = createAsyncThunk(
    "notification/markAsRead",
    async (id: string) => {
        const res = await apiClient.patch(`/notification/notification/${id}/read`)
        return res.data;
    }
)

export const deleteReadNotifications = createAsyncThunk(
    "notification/deleteRead",
    async () => {
        await apiClient.delete("/notification/notification/read");
        return true;
    }
)

type initialStateType = {
    loading: boolean,
    notifications?: any
}

const initialState: initialStateType = {
    loading: false,
    notifications: []
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
        deleteReadNotificationsLocal: (state) => {
            state.notifications = state.notifications.filter((n: any) => !n.isRead);
        },
        optimisticMarkAllRead: (state) => {
            state.notifications.forEach((n: any) => { n.isRead = true; });
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
                    state.notifications = []
            })

        builder
            .addCase(markAsRead.fulfilled, (state, action) => {
                const found = state.notifications.find((n: any) => n.id === action.meta.arg);
                if (found) found.isRead = true;
            })

        builder
            .addCase(deleteReadNotifications.fulfilled, (state) => {
                state.notifications = state.notifications.filter((n: any) => !n.isRead);
            })
    },
});

export const { notificationReadRealtime, deleteReadNotificationsLocal, optimisticMarkAllRead } = notificatinSlice.actions
export default notificatinSlice.reducer;

export const selectUnreadCount = (state: any) =>
  state.notification.notifications.filter((n: any) => !n.isRead).length;


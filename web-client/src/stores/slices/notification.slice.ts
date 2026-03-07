import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface Notification {
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    type?: string;
    metadata?: Record<string, any>;
}

interface NotificationState {
    loading: boolean;
    notifications: Notification[];
    error: string | null;
}

const initialState: NotificationState = {
    loading: false,
    notifications: [],
    error: null,
};

// Async Thunks
export const getNotification = createAsyncThunk(
    "notification/getNotification",
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/notification/notification");
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Lấy thông báo thất bại");
        }
    }
);

export const markAsRead = createAsyncThunk(
    "notification/markAsRead",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.patch(`/notification/notification/${id}/read`);
            return { id, data: res.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Đánh dấu đã đọc thất bại");
        }
    }
);

// Slice
export const notificationSlice = createSlice({
    name: "notification",
    initialState,
    reducers: {
        notificationReadRealtime: (state, action: PayloadAction<{ notificationId: string }>) => {
            const found = state.notifications.find(
                (n) => n.id === action.payload.notificationId
            );
            if (found) found.isRead = true;
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
        addNotification: (state, action: PayloadAction<Notification>) => {
            state.notifications.unshift(action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getNotification.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getNotification.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.data || [];
            })
            .addCase(getNotification.rejected, (state, action) => {
                state.loading = false;
                state.notifications = [];
                state.error = action.payload as string;
            });

        builder
            .addCase(markAsRead.fulfilled, (state, action) => {
                const found = state.notifications.find((n) => n.id === action.payload.id);
                if (found) found.isRead = true;
            });
    },
});

export const { notificationReadRealtime, clearNotifications, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) =>
    state.notification.notifications;

export const selectNotificationLoading = (state: { notification: NotificationState }) =>
    state.notification.loading;

export const selectUnreadCount = (state: { notification: NotificationState }) =>
    state.notification.notifications.filter((n) => !n.isRead).length;

import http from "../../utils/api";
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

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

export const getNotification = createAsyncThunk(
  "notification/getNotification",
  async (_, { rejectWithValue }) => {
    try {
      const res = await http.get("/notification/notification");
      return res;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Lấy thông báo thất bại"
      );
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await http.patch(`/notification/notification/${id}/read`);
      return { id, data: res.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Đánh dấu đã đọc thất bại"
      );
    }
  }
);

export const deleteReadNotifications = createAsyncThunk(
  "notification/deleteRead",
  async (_, { rejectWithValue }) => {
    try {
      await http.delete("/notification/notification/read");
      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Xóa thông báo thất bại"
      );
    }
  }
);

export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction <Notification>) => {
      state.notifications.unshift(action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    removeNotificationLocally: (state, action: PayloadAction<string>) => {
      // Khi admin khác đọc, xóa notification khỏi list (backend đã xóa recipient)
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
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

    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const found = state.notifications.find((n) => n.id === action.payload.id);
      if (found) found.isRead = true;
    });

    builder.addCase(deleteReadNotifications.fulfilled, (state) => {
      state.notifications = state.notifications.filter((n) => !n.isRead);
    });
  },
});

export const { addNotification, clearNotifications, removeNotificationLocally } = notificationSlice.actions;
export default notificationSlice.reducer;

export const selectNotifications = (state: { notification: NotificationState }) =>
  state.notification.notifications;

export const selectNotificationLoading = (state: { notification: NotificationState }) =>
  state.notification.loading;

export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.notifications.filter((n) => !n.isRead).length;

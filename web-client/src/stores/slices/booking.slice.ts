import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export interface BookingItem {
  bookingId: string;
  propertyId: string;
  status: BookingStatus;
  visitDate: string;
  visitTimeStart: string;
  visitTimeEnd?: string;
  tenantNote?: string;
  landlordNote?: string;
  tenantPhone?: string;
  numberOfVisitors?: number;
  tenant?: { id: string; fullName: string; avatarUrl?: string; phone?: string };
  landlord?: { id: string; fullName: string; avatarUrl?: string };
  property?: { title: string; address: string; images?: any[] };
  cancellationReason?: string;
  createdAt: string;
}

interface BookingState {
  loading: boolean;
  slotsLoading: boolean;
  timeSlots: TimeSlot[];
  myBookings: BookingItem[];
  ownerBookings: BookingItem[];
  message?: { type: "success" | "error"; message: string };
}

const initialState: BookingState = {
  loading: false,
  slotsLoading: false,
  timeSlots: [],
  myBookings: [],
  ownerBookings: [],
  message: undefined,
};

export const getAvailableSlots = createAsyncThunk(
  "booking/getAvailableSlots",
  async ({ propertyId, date }: { propertyId: string; date: string }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(
        `/estate/booking/available-slots?propertyId=${propertyId}&date=${date}`
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Lấy khung giờ thất bại");
    }
  }
);

export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async (
    data: {
      propertyId: string;
      visitDate: string;
      visitTimeStart: string;
      visitTimeEnd: string;
      tenantNote?: string;
      tenantPhone: string;
      numberOfVisitors?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiClient.post("/estate/booking/create", data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Đặt lịch thất bại");
    }
  }
);

export const getMyBookings = createAsyncThunk(
  "booking/getMyBookings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/estate/booking/my");
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Lấy danh sách đặt lịch thất bại");
    }
  }
);

export const getOwnerBookings = createAsyncThunk(
  "booking/getOwnerBookings",
  async (propertyId: string | undefined, { rejectWithValue }) => {
    try {
      const url = propertyId
        ? `/estate/booking/owner?propertyId=${propertyId}`
        : `/estate/booking/owner`;
      const res = await apiClient.get(url);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Lấy danh sách đặt lịch thất bại");
    }
  }
);

export const confirmBooking = createAsyncThunk(
  "booking/confirmBooking",
  async (
    { bookingId, landlordNote }: { bookingId: string; landlordNote?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiClient.put(`/estate/booking/${bookingId}/confirm`, {
        landlordNote,
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Xác nhận thất bại");
    }
  }
);

export const rejectBooking = createAsyncThunk(
  "booking/rejectBooking",
  async (
    { bookingId, reason }: { bookingId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiClient.put(`/estate/booking/${bookingId}/reject`, {
        cancellationReason: reason,
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Từ chối thất bại");
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "booking/cancelBooking",
  async (
    { bookingId, reason }: { bookingId: string; reason?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiClient.put(`/estate/booking/${bookingId}/cancel`, {
        cancellationReason: reason,
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Hủy lịch thất bại");
    }
  }
);

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    clearBookingMessage: (state) => {
      state.message = undefined;
    },
  },
  extraReducers: (builder) => {
    // getAvailableSlots
    builder
      .addCase(getAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
      })
      .addCase(getAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.timeSlots = action.payload?.data || action.payload || [];
      })
      .addCase(getAvailableSlots.rejected, (state) => {
        state.slotsLoading = false;
        state.timeSlots = [];
      });

    // createBooking
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.message = {
          type: "success",
          message: action.payload?.message || "Đặt lịch thành công!",
        };
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: (action.payload as string) || "Đặt lịch thất bại!",
        };
      });

    // getMyBookings
    builder
      .addCase(getMyBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = action.payload?.data || action.payload || [];
      })
      .addCase(getMyBookings.rejected, (state) => {
        state.loading = false;
      });

    // getOwnerBookings
    builder
      .addCase(getOwnerBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOwnerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerBookings = action.payload?.data || action.payload || [];
      })
      .addCase(getOwnerBookings.rejected, (state) => {
        state.loading = false;
      });

    // confirmBooking
    builder
      .addCase(confirmBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        if (updated?.bookingId) {
          const idx = state.ownerBookings.findIndex(
            (b) => b.bookingId === updated.bookingId
          );
          if (idx !== -1) state.ownerBookings[idx] = updated;
        }
        state.message = { type: "success", message: "Xác nhận lịch xem thành công!" };
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = { type: "error", message: (action.payload as string) || "Xác nhận thất bại" };
      });

    // rejectBooking
    builder
      .addCase(rejectBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        if (updated?.bookingId) {
          const idx = state.ownerBookings.findIndex(
            (b) => b.bookingId === updated.bookingId
          );
          if (idx !== -1) state.ownerBookings[idx] = updated;
        }
        state.message = { type: "success", message: "Đã từ chối lịch xem" };
      })
      .addCase(rejectBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = { type: "error", message: (action.payload as string) || "Từ chối thất bại" };
      });

    // cancelBooking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.data || action.payload;
        if (updated?.bookingId) {
          const idx = state.myBookings.findIndex(
            (b) => b.bookingId === updated.bookingId
          );
          if (idx !== -1) state.myBookings[idx] = updated;
        }
        state.message = { type: "success", message: "Đã hủy lịch xem" };
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = { type: "error", message: (action.payload as string) || "Hủy lịch thất bại" };
      });
  },
});

export const { clearBookingMessage } = bookingSlice.actions;
export default bookingSlice.reducer;

// Selectors
export const selectTimeSlots = (state: { booking: BookingState }) =>
  state.booking.timeSlots;
export const selectMyBookings = (state: { booking: BookingState }) =>
  state.booking.myBookings;
export const selectOwnerBookings = (state: { booking: BookingState }) =>
  state.booking.ownerBookings;
export const selectBookingLoading = (state: { booking: BookingState }) =>
  state.booking.loading;
export const selectSlotsLoading = (state: { booking: BookingState }) =>
  state.booking.slotsLoading;
export const selectBookingMessage = (state: { booking: BookingState }) =>
  state.booking.message;

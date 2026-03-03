import { TimeSlot } from "@/types/booking.type";
import apiClient from "@/utils/api";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const getAvailableSlots = createAsyncThunk(
  "booking/getAvailableSlots",
  async ({ propertyId, date }: any) => {
    const res = await apiClient.get(
      `/estate/booking/available-slots?propertyId=${propertyId}&date=${date}`
    );
    return res.data;
  }
);

export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async (data: any) => {
    const res = await apiClient.post("/estate/booking/create", data);
    return res.data;
  }
);

export const getMyBookings = createAsyncThunk(
  "booking/getMyBookings",
  async () => {
    const res = await apiClient.get("/estate/booking/my");
    return res.data;
  }
);

export const getOwnerBookings = createAsyncThunk(
  "booking/getOwnerBookings",
  async (propertyId?: string) => {
    const url = `/estate/booking/owner?propertyId=${propertyId}`
    const res = await apiClient.get(url);
    return res.data;
  }
);

export const confirmBooking = createAsyncThunk(
  "booking/confirmBooking",
  async ({ bookingId, landlordNote }: { bookingId: string; landlordNote?: string }) => {
    const res = await apiClient.put(`/estate/booking/${bookingId}/confirm`, {
      landlordNote,
    });
    return res.data;
  }
);

export const rejectBooking = createAsyncThunk(
  "booking/rejectBooking",
  async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
    const res = await apiClient.put(`/estate/booking/${bookingId}/reject`, {
      cancellationReason: reason,
    });
    return res.data;
  }
);

export const cancelBooking = createAsyncThunk(
  "booking/cancelBooking",
  async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
    const res = await apiClient.put(`/estate/booking/${bookingId}/cancel`, {
      cancellationReason: reason,
    });
    return res.data;
  }
);

export const completeBooking = createAsyncThunk(
  "booking/completeBooking",
  async (bookingId: string) => {
    const res = await apiClient.put(`/estate/booking/${bookingId}/complete`);
    return res.data;
  }
);

type BookingType = {
  loading: boolean;
  propertyDetail?: any;
  time_slot: TimeSlot[];
  myBookings: any[];
  ownerBookings: any[];
  message?: {
    type: "success" | "error";
    message: string;
  };
};

const initialState: BookingType = {
  loading: false,
  time_slot: [],
  myBookings: [],
  ownerBookings: [],
  message: undefined,
};

export const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    clearMessage: (state) => {
      state.message = undefined;
    },
  },
  extraReducers: (builder) => {
    // Get Available Slots
    builder
      .addCase(getAvailableSlots.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(getAvailableSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.time_slot = action.payload.data;
      })
      .addCase(getAvailableSlots.rejected, (state) => {
        state.loading = false;
        state.time_slot = [];
        state.message = {
          type: "error",
          message: "Failed to fetch available slots",
        };
      });

    // Create Booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.message = {
          type: "success",
          message: action.payload?.message || "Booking created successfully",
        };
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Booking failed",
        };
      });

    // Get My Bookings
    builder
      .addCase(getMyBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.myBookings = action.payload.data;
      })
      .addCase(getMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Failed to fetch bookings",
        };
      });

    // Get Owner Bookings
    builder
      .addCase(getOwnerBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOwnerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.ownerBookings = action.payload.data;
      })
      .addCase(getOwnerBookings.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Failed to fetch owner bookings",
        };
      });

    // Confirm Booking
    builder
      .addCase(confirmBooking.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(confirmBooking.fulfilled, (state, action) => {
        state.loading = false;
        // Update the booking in ownerBookings list
        const index = state.ownerBookings.findIndex(
          (b) => b.bookingId === action.payload.data.bookingId
        );
        if (index !== -1) {
          state.ownerBookings[index] = action.payload.data;
        }
        state.message = {
          type: "success",
          message: action.payload?.message || "Booking confirmed successfully",
        };
      })
      .addCase(confirmBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Failed to confirm booking",
        };
      });

    // Reject Booking
    builder
      .addCase(rejectBooking.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(rejectBooking.fulfilled, (state, action) => {
        state.loading = false;
        // Update the booking in ownerBookings list
        const index = state.ownerBookings.findIndex(
          (b) => b.bookingId === action.payload.data.bookingId
        );
        if (index !== -1) {
          state.ownerBookings[index] = action.payload.data;
        }
        state.message = {
          type: "success",
          message: action.payload?.message || "Booking rejected",
        };
      })
      .addCase(rejectBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Failed to reject booking",
        };
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        // Update the booking in myBookings list
        const index = state.myBookings.findIndex(
          (b) => b.bookingId === action.payload.data.bookingId
        );
        if (index !== -1) {
          state.myBookings[index] = action.payload.data;
        }
        state.message = {
          type: "success",
          message: action.payload?.message || "Booking cancelled successfully",
        };
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Failed to cancel booking",
        };
      });

    // Complete Booking
    builder
      .addCase(completeBooking.pending, (state) => {
        state.loading = true;
        state.message = undefined;
      })
      .addCase(completeBooking.fulfilled, (state, action) => {
        state.loading = false;
        // Update the booking in ownerBookings list
        const ownerIndex = state.ownerBookings.findIndex(
          (b) => b.bookingId === action.payload.data.bookingId
        );
        if (ownerIndex !== -1) {
          state.ownerBookings[ownerIndex] = action.payload.data;
        }
        // Update in myBookings if exists
        const myIndex = state.myBookings.findIndex(
          (b) => b.bookingId === action.payload.data.bookingId
        );
        if (myIndex !== -1) {
          state.myBookings[myIndex] = action.payload.data;
        }
        state.message = {
          type: "success",
          message: action.payload?.message || "Booking completed successfully",
        };
      })
      .addCase(completeBooking.rejected, (state, action) => {
        state.loading = false;
        state.message = {
          type: "error",
          message: action.error.message || "Failed to complete booking",
        };
      });
  },
});

export const { clearMessage } = bookingSlice.actions;
export default bookingSlice.reducer;
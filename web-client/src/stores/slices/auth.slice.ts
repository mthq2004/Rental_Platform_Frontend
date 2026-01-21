import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { UserType } from "../../types/user.type";

type initialStateType = {
  loading: boolean;
  isAuth: boolean;
  user: UserType | null;
};

const initialState: initialStateType = {
  loading: false,
  isAuth: false,
  user: null,
};

export const loginUser = createAsyncThunk("auth/login", async (data: any) => {
  const response = await http.post("/auth/user/login", data);
  return response;
});

export const getProfileUser = createAsyncThunk("auth/getProfile", async () => {
  const response = await http.get("/auth/profile");
  return response;
});

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (credential: string) => {
    const response = await http.post("/estate/auth/google", { credential });
    return response;
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuth = false;
      state.user = null;
      state.loading = false;
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        localStorage.setItem("access_token", action.payload.data.accessToken);
        localStorage.setItem("refresh_token", action.payload.data.refreshToken);
        state.user = action.payload.data.user;
      })
      .addCase(loginUser.rejected, (state) => {
        state.loading = false;
        state.isAuth = false;
      });

    builder
      .addCase(getProfileUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfileUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.user = action.payload.data;
      })
      .addCase(getProfileUser.rejected, (state) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
      });

    // Google Login
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        localStorage.setItem("access_token", action.payload.data.accessToken);
        localStorage.setItem("refresh_token", action.payload.data.refreshToken);
        state.user = action.payload.data.user;
      })
      .addCase(loginWithGoogle.rejected, (state) => {
        state.loading = false;
        state.isAuth = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

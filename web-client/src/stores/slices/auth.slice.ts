import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { UserType } from "../../types/user.type";
import Cookies from "js-cookie";

type initialStateType = {
  loading: boolean;
  isAuth: boolean;
  user: UserType | null;
  accessToken: string | null;
  refreshToken: string | null;
  otpSent: boolean;
  otpVerified: boolean;
};


const tokenFromCookie = Cookies.get("accessToken") || null;

const initialState: initialStateType = {
  loading: false,
  isAuth: !!tokenFromCookie,
  user: null,
  accessToken: tokenFromCookie,
  refreshToken: null,
  otpSent: false,
  otpVerified: false,
};

export const loginUser = createAsyncThunk("auth/login", async (data: any) => {
  const response = await http.post("/estate/auth/user/login", data);
  return response;
});

export const getProfileUser = createAsyncThunk("auth/getProfile", async () => {
  const response = await http.get("/auth/profile");
  return response;
});

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (credential: string, { dispatch }) => {
    http.setAccessToken(null); // 🔥 QUAN TRỌNG
    const response = await http.post("/estate/auth/google", { credential });
    return response;
  }
);

export const exchangeGoogleCode = createAsyncThunk(
  "auth/exchangeGoogleCode",
  async (code: string) => {
    http.setAccessToken(null);
    const response = await http.post("/estate/auth/google/exchange", { code });
    return response;
  }
);


// Phone Signup - Step 1: Request OTP
export const requestPhoneOtp = createAsyncThunk(
  "auth/requestPhoneOtp",
  async (phone: string) => {
    const response = await http.post("/estate/auth/phone/request-otp", { phone });
    return response;
  }
);

// Phone Signup - Step 2: Signup with OTP and password
export const signupWithPhone = createAsyncThunk(
  "auth/signupWithPhone",
  async (data: { phone: string; otp: string; password: string }) => {
    const response = await http.post("/estate/auth/phone/signup", data);
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
      state.accessToken = null;
      state.refreshToken = null;
      state.otpSent = false;
      state.otpVerified = false;
      http.setAccessToken(null);
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
    },
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuth = true;
      // Also ensure http client is updated if needed, though this is reducer logic
      // We usually handle side effects elsewhere or relies on the component to call http.setAccessToken
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.user = action.payload.data.user;
        http.setAccessToken(action.payload.data.accessToken);
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
        http.setAccessToken(null);
      });

    // Google Login
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.user = action.payload.data.user;
        http.setAccessToken(action.payload.data.accessToken);
      })
      .addCase(loginWithGoogle.rejected, (state) => {
        state.loading = false;
        state.isAuth = false;
      });

    // Exchange Google Code
    builder
      .addCase(exchangeGoogleCode.pending, (state) => {
        state.loading = true;
      })
      .addCase(exchangeGoogleCode.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.user = action.payload.data.user;
        http.setAccessToken(action.payload.data.accessToken);
      })
      .addCase(exchangeGoogleCode.rejected, (state) => {
        state.loading = false;
        state.isAuth = false;
      });

    // Phone OTP Request
    builder
      .addCase(requestPhoneOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(requestPhoneOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(requestPhoneOtp.rejected, (state) => {
        state.loading = false;
        state.otpSent = false;
      });

    // Phone Signup
    builder
      .addCase(signupWithPhone.pending, (state) => {
        state.loading = true;
      })
      .addCase(signupWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.user = action.payload.data.user;
        state.otpSent = false;
        state.otpVerified = false;
        http.setAccessToken(action.payload.data.accessToken);
      })
      .addCase(signupWithPhone.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { logout, resetOtpState, setCredentials } = authSlice.actions;
export default authSlice.reducer;

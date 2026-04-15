import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { UserType } from "../../types/user.type";
import Cookies from "js-cookie";

type AuthProvider = "phone" | "google" | "facebook" | null;

type initialStateType = {
  loading: boolean;
  isAuth: boolean;
  user: UserType | null;
  accessToken: string | null;
  refreshToken: string | null;
  otpSent: boolean;
  otpVerified: boolean;
  authProvider: AuthProvider;
};

const tokenFromCookie = Cookies.get("accessToken") || null;
const providerFromCookie = (Cookies.get("authProvider") as AuthProvider) || null;

const initialState: initialStateType = {
  loading: false,
  isAuth: !!tokenFromCookie,
  user: null,
  accessToken: tokenFromCookie,
  refreshToken: null,
  otpSent: false,
  otpVerified: false,
  authProvider: providerFromCookie,
};

export const loginUser = createAsyncThunk("auth/login", async (data: any) => {
  const response = await http.post("/estate/auth/user/login", data);
  return response;
});

export const getProfileUser = createAsyncThunk("auth/getProfile", async () => {
  const response = await http.get("/auth/profile");
  return response;
});

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data: Partial<UserType>, { rejectWithValue }) => {
    try {
      const response = await http.put("/estate/auth/profile", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Cập nhật thông tin thất bại");
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    data: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await http.put("/estate/auth/change-password", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Đổi mật khẩu thất bại");
    }
  }
);

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

export const exchangeFacebookCode = createAsyncThunk(
  "auth/exchangeFacebookCode",
  async (code: string) => {
    http.setAccessToken(null);
    const response = await http.post("/estate/auth/facebook/exchange", { code });
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

// Avatar Upload
export const updateAvatar = createAsyncThunk(
  "auth/updateAvatar",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await http.put("/estate/auth/avatar", formData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Cập nhật avatar thất bại");
    }
  }
);

// Phone Update - Request OTP for changing phone
export const requestPhoneUpdateOtp = createAsyncThunk(
  "auth/requestPhoneUpdateOtp",
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await http.post("/estate/auth/otp/request", { phone });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gửi OTP thất bại");
    }
  }
);

// Phone Update - Verify OTP
export const verifyPhoneUpdateOtp = createAsyncThunk(
  "auth/verifyPhoneUpdateOtp",
  async (data: { phone: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await http.post("/estate/auth/otp/verify-phone", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Xác thực OTP thất bại");
    }
  }
);

export const requestEmailVerificationOtp = createAsyncThunk(
  "auth/requestEmailVerificationOtp",
  async (email: string | undefined, { rejectWithValue }) => {
    try {
      const response = await http.post("/estate/auth/email/request-otp", { email });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Gửi OTP email thất bại");
    }
  }
);

export const verifyEmailOtp = createAsyncThunk(
  "auth/verifyEmailOtp",
  async (data: { otp: string; email?: string }, { rejectWithValue }) => {
    try {
      const response = await http.post("/estate/auth/email/verify", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Xác thực email thất bại");
    }
  }
);

// Forgot Password - Step 1: Request OTP
export const requestForgotPasswordOtp = createAsyncThunk(
  "auth/requestForgotPasswordOtp",
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await http.post("/estate/auth/forgot-password/request-otp", { phone });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Không thể gửi OTP");
    }
  }
);

// Forgot Password - Step 2: Reset Password with OTP
export const resetPasswordWithOtp = createAsyncThunk(
  "auth/resetPasswordWithOtp",
  async (data: { phone: string; otp: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await http.post("/estate/auth/forgot-password/reset", data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Đặt lại mật khẩu thất bại");
    }
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
      state.authProvider = null;
      http.setAccessToken(null);
      Cookies.remove("authProvider");
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
        state.authProvider = "phone";
        http.setAccessToken(action.payload.data.accessToken);
        Cookies.set("authProvider", "phone", { expires: 7 });
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
        state.authProvider = "google";
        http.setAccessToken(action.payload.data.accessToken);
        Cookies.set("authProvider", "google", { expires: 7 });
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
        state.authProvider = "google";
        http.setAccessToken(action.payload.data.accessToken);
        Cookies.set("authProvider", "google", { expires: 7 });
      })
      .addCase(exchangeGoogleCode.rejected, (state) => {
        state.loading = false;
        state.isAuth = false;
      });

    // Exchange Facebook Code
    builder
      .addCase(exchangeFacebookCode.pending, (state) => {
        state.loading = true;
      })
      .addCase(exchangeFacebookCode.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.user = action.payload.data.user;
        state.authProvider = "facebook";
        http.setAccessToken(action.payload.data.accessToken);
        Cookies.set("authProvider", "facebook", { expires: 7 });
      })
      .addCase(exchangeFacebookCode.rejected, (state) => {
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
        state.authProvider = "phone";
        http.setAccessToken(action.payload.data.accessToken);
        Cookies.set("authProvider", "phone", { expires: 7 });
      })
      .addCase(signupWithPhone.rejected, (state) => {
        state.loading = false;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.data?.user || action.payload?.data || action.payload;
        if (updated && state.user) {
          state.user = { ...state.user, ...updated };
        }
      })
      .addCase(updateProfile.rejected, (state) => {
        state.loading = false;
      });

    // Update Avatar
    builder
      .addCase(updateAvatar.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.loading = false;
        const avatarUrl = action.payload?.data?.avatarUrl || action.payload?.data?.user?.avatarUrl;
        if (avatarUrl && state.user) {
          state.user = { ...state.user, avatarUrl };
        }
      })
      .addCase(updateAvatar.rejected, (state) => {
        state.loading = false;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state) => {
        state.loading = false;
      });

    builder
      .addCase(verifyEmailOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?.data;
        if (updated && state.user) {
          state.user = { ...state.user, ...updated };
        }
      })
      .addCase(verifyEmailOtp.rejected, (state) => {
        state.loading = false;
      });

    // Forgot Password OTP
    builder
      .addCase(requestForgotPasswordOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(requestForgotPasswordOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(requestForgotPasswordOtp.rejected, (state) => {
        state.loading = false;
      });

    // Reset Password
    builder
      .addCase(resetPasswordWithOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetPasswordWithOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = false;
        state.otpVerified = false;
      })
      .addCase(resetPasswordWithOtp.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { logout, resetOtpState, setCredentials } = authSlice.actions;
export default authSlice.reducer;

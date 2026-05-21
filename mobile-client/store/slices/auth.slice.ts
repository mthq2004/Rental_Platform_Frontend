import { LoginUser, User } from "@/types/user.type";
import apiClient from "@/utils/api";
import { clearAuthStorage, saveAccessToken, saveRefreshToken } from "@/utils/secureStorage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const getErrorMessage = (error: any, fallback: string): string => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};

export const login = createAsyncThunk(
    "auth/login",
    async (credentials: LoginUser, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/user/login",
                credentials
            );

            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Sai tài khoản hoặc mật khẩu"));
        }
    }
);

export const googleExchange = createAsyncThunk(
    "auth/googleExchange",
    async (code: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/google/exchange",
                { code }
            );

            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Đăng nhập Google thất bại"));
        }
    }
);

export const facebookExchange = createAsyncThunk(
    "auth/facebookExchange",
    async (code: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/facebook/exchange",
                { code }
            );

            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Đăng nhập Facebook thất bại"));
        }
    }
);

export const getProfile = createAsyncThunk(
    "auth/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/estate/auth/profile");

            return res.data.data;
        } catch (err: any) {
            return rejectWithValue("Không lấy được profile");
        }
    }
);

export const register = createAsyncThunk(
    "auth/register",
    async (userInfo: any, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/phone/signup",
                userInfo
            );
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Đăng ký thất bại"));
        }
    }
);

export const otpVerified = createAsyncThunk(
    "auth/otpVerified",

    async (otpInfo: any, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/otp/verify",
                otpInfo
            );
            return res.data.data;
        }
        catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Xác thực OTP thất bại"));
        }
    }
);

export const updateAvatar = createAsyncThunk(
    "auth/updateAvatar",
    async (file: { uri: string; name: string; type: string }, { rejectWithValue }) => {
        try {

            const formData = new FormData();

            formData.append("file", file as any);

            const response = await apiClient.put(
                "/estate/auth/avatar",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            return response.data.data;

        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Cập nhật avatar thất bại"));
        }
    }
);

export const updateProfile = createAsyncThunk(
    "auth/updateProfile",
    async (data: Partial<User>, { rejectWithValue }) => {
        try {
            const response = await apiClient.put("/estate/auth/profile", data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Cập nhật thông tin thất bại"));
        }
    }
);

export const requestOtp = createAsyncThunk(
    "auth/requestOtp",
    async (phone: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/phone/request-otp",
                { phone }
            );
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Yêu cầu OTP thất bại"));
        }
    }
);

export const requestForgotPasswordOtp = createAsyncThunk(
    "auth/requestForgotPasswordOtp",
    async (phone: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/forgot-password/request-otp",
                { phone }
            );
            return res.data.data;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Không thể gửi OTP"));
        }
    }
);

export const resetPasswordWithOtp = createAsyncThunk(
    "auth/resetPasswordWithOtp",
    async (
        data: { phone: string; otp: string; newPassword: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await apiClient.post(
                "/estate/auth/forgot-password/reset",
                data
            );
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(getErrorMessage(error, "Đặt lại mật khẩu thất bại"));
        }
    }
);

export const requestPhoneUpdateOtp = createAsyncThunk(
    "auth/requestPhoneUpdateOtp",
    async (phone: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/estate/auth/otp/request", { phone });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Yêu cầu OTP thất bại"));
        }
    }
);

export const verifyPhoneUpdateOtp = createAsyncThunk(
    "auth/verifyPhoneUpdateOtp",
    async (data: { phone: string; otp: string }, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/estate/auth/otp/verify-phone", data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Xác thực OTP thất bại"));
        }
    }
);

export const requestEmailVerificationOtp = createAsyncThunk(
    "auth/requestEmailVerificationOtp",
    async (email: string, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/estate/auth/email/request-otp", { email });
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Gửi OTP email thất bại"));
        }
    }
);

export const verifyEmailOtp = createAsyncThunk(
    "auth/verifyEmailOtp",
    async (data: { otp: string; email?: string }, { rejectWithValue }) => {
        try {
            const res = await apiClient.post("/estate/auth/email/verify", data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(getErrorMessage(err, "Xác thực email thất bại"));
        }
    }
);

type AuthState = {
    loading: boolean;
    isAuth: boolean;
    user: User | null;
    error: string | null;
    message?: any;
    verified?: boolean;
    loadingOtp?: boolean;
};


const initialState: AuthState = {
    loading: false,
    isAuth: false,
    user: null,
    error: null,
};


export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.isAuth = false;
            state.user = null;
            state.error = null;
            state.message = {
                type: "success_logout",
                message: "Đã đăng xuất",
            };

            clearAuthStorage();
        },
        resetMessage: (state) => {
            state.message = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                const { accessToken, refreshToken, user } = action.payload;

                state.loading = false;
                state.isAuth = true;
                state.user = user;
                state.message = {
                    type: "success_login",
                    message: "Đăng nhập thành công!",
                }

                saveAccessToken(accessToken);
                saveRefreshToken(refreshToken);
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error_login",
                    message: (action.payload as string) || "Sai tài khoản hoặc mật khẩu",
                }
                clearAuthStorage();
            })
        builder
            .addCase(googleExchange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleExchange.fulfilled, (state, action) => {
                const { accessToken, refreshToken, user } = action.payload;

                state.loading = false;
                state.isAuth = true;
                state.user = user;
                state.message = {
                    type: "success_login",
                    message: "Đăng nhập Google thành công!",
                };

                saveAccessToken(accessToken);
                saveRefreshToken(refreshToken);
            })
            .addCase(googleExchange.rejected, (state) => {
                state.loading = false;
                state.message = {
                    type: "error_login",
                    message: "Đăng nhập Google thất bại!",
                };
                clearAuthStorage();
            })
        builder
            .addCase(facebookExchange.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(facebookExchange.fulfilled, (state, action) => {
                const { accessToken, refreshToken, user } = action.payload;

                state.loading = false;
                state.isAuth = true;
                state.user = user;
                state.message = {
                    type: "success_login",
                    message: "Đăng nhập Facebook thành công!",
                };

                saveAccessToken(accessToken);
                saveRefreshToken(refreshToken);
            })
            .addCase(facebookExchange.rejected, (state) => {
                state.loading = false;
                state.message = {
                    type: "error_login",
                    message: "Đăng nhập Facebook thất bại!",
                };
                clearAuthStorage();
            })
        builder
            .addCase(getProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.user = action.payload;
            })
            .addCase(getProfile.rejected, (state) => {
                // Do NOT call clearAuthStorage here.
                // The API interceptor already clears storage on 401.
                // Clearing storage on network errors would log the user
                // out even when the server is only temporarily unreachable.
                state.loading = false;
                // state.isAuth = false; // Prevent logout on network error
                // state.user = null;
            });

        builder
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                const { accessToken, refreshToken, user } = action.payload;
                state.loading = false;
                state.isAuth = true;
                state.user = action.payload.user;
                state.message = {
                    type: "success",
                    message: "Đăng ký thành công!",
                }

                saveAccessToken(accessToken);
                saveRefreshToken(refreshToken);
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.isAuth = false;
                state.user = null;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Đăng ký thất bại!",
                }
            });

        builder
            .addCase(otpVerified.pending, (state) => {
                state.loadingOtp = true;
                state.verified = false;
                state.error = null;
            })
            .addCase(otpVerified.fulfilled, (state, action) => {
                state.loadingOtp = false;
                state.verified = true;
                state.message = {
                    type: "success",
                    message: "Xác thực OTP thành công!",
                }
            })
            .addCase(otpVerified.rejected, (state, action) => {
                state.loadingOtp = false;
                state.verified = false;
                state.message = {
                    type: "error",
                    message: "Xác thực OTP thất bại!",
                }
            });

        builder
            .addCase(requestOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            }
            )
            .addCase(requestOtp.fulfilled, (state, action) => {
                state.loading = false;
            })
            .addCase(requestOtp.rejected, (state, action) => {
                state.loading = false;
            });

        builder
            .addCase(requestForgotPasswordOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(requestForgotPasswordOtp.fulfilled, (state) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Mã OTP đã được gửi",
                };
            })
            .addCase(requestForgotPasswordOtp.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Không thể gửi OTP",
                };
            });

        builder
            .addCase(resetPasswordWithOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPasswordWithOtp.fulfilled, (state) => {
                state.loading = false;
                state.message = {
                    type: "success",
                    message: "Đặt lại mật khẩu thành công",
                };
            })
            .addCase(resetPasswordWithOtp.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Đặt lại mật khẩu thất bại",
                };
            });

        builder
            .addCase(updateAvatar.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateAvatar.fulfilled, (state, action) => {
                state.loading = false;
                const avatarUrl = action.payload.avatarUrl || action.payload;
                if (avatarUrl && state.user) {
                    state.user = { ...state.user, avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : avatarUrl.avatarUrl };
                }
                state.message = {
                    type: "success_update",
                    message: "Đã cập nhật ảnh đại diện",
                };
            })
            .addCase(updateAvatar.rejected, (state) => {
                state.loading = false;
            });

        builder
            .addCase(updateProfile.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user = { ...state.user, ...action.payload };
                }
                state.message = {
                    type: "success_update",
                    message: "Cập nhật thông tin thành công",
                };
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.loading = false;
                state.message = {
                    type: "error",
                    message: (action.payload as string) || "Cập nhật thông tin thất bại",
                };
            });
    },
});


export const { logout, resetMessage } = authSlice.actions;
export default authSlice.reducer;


import { LoginUser, User } from "@/types/user.type";
import apiClient from "@/utils/api";
import { clearAuthStorage, saveAccessToken, saveRefreshToken } from "@/utils/secureStorage";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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
            return rejectWithValue(
                err.response?.data?.message || "Đăng nhập thất bại"
            );
        }
    }
);

export const getProfile = createAsyncThunk(
    "auth/getProfile",
    async (_, { rejectWithValue }) => {
        try {
            const res = await apiClient.get("/estate/auth/user/profile");
            console.log("Mach Ngoc xuan: ", res.data.data)

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
                "/estate/auth/phone-update/signup",
                userInfo
            );
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || "Đăng ký thất bại"
            );
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
            return rejectWithValue(
                err.response?.data?.message || "Xác thực OTP thất bại"
            );
        }
    }
);

export const requestOtp = createAsyncThunk(
    "auth/requestOtp",
    async (phone: String, { rejectWithValue }) => {
        try {
            const res = await apiClient.post(
                "/estate/auth/phone/request-otp",
                { phone }
            );
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || "Yêu cầu OTP thất bại"
            );
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
                    message: "Đăng nhập thất bại!",
                }
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
                state.loading = false;
                state.isAuth = false;
                state.user = null;
                clearAuthStorage();
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
                    message: "Đăng ký thất bại!",
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
    },
});


export const { logout, resetMessage } = authSlice.actions;
export default authSlice.reducer;


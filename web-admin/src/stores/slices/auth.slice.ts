import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type { UserType } from "../../types/user.type";

type UpdateProfilePayload = {
    fullName?: string;
    email?: string;
    phone?: string;
};

type initialStateType = {
    loading: boolean,
    isAuth: boolean,
    user: UserType | null
}

const initialState: initialStateType = {
    loading: false,
    isAuth: false,
    user: null
}

export const loginUser = createAsyncThunk(
    "auth/login",
    async (data: any) => {
        const response = await http.post("/estate/auth/admin/login", data);
        return response;
    }
);

export const getProfileUser = createAsyncThunk(
    "auth/getProfile",
    async () => {
        const response = await http.get("/estate/auth/profile");
        return response;
    }
);

export const updateAvatarUser = createAsyncThunk(
    "auth/updateAvatar",
    async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await http.put("/estate/auth/avatar", formData);
        return response;
    }
);

export const updateProfileUser = createAsyncThunk(
    "auth/updateProfile",
    async (data: UpdateProfilePayload) => {
        const response = await http.put("/estate/auth/profile", data);
        return response;
    }
);

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: state => {
            state.isAuth = false;
            state.user = null;
            state.loading = false;
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, state => {
                state.loading = true;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                localStorage.setItem("accessToken", action.payload.data.accessToken);
                localStorage.setItem("refreshToken", action.payload.data.refreshToken);
                state.user = action.payload.data.user;
            })
            .addCase(loginUser.rejected, state => {
                state.loading = false;
                state.isAuth = false
            })

        builder
            .addCase(getProfileUser.pending, state => {
                state.loading = true;
            })
            .addCase(getProfileUser.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuth = true;
                state.user = action.payload.data;
            })
            .addCase(getProfileUser.rejected, state => {
                state.loading = false;
                state.isAuth = false;
                state.user = null;
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            })

        builder
            .addCase(updateAvatarUser.pending, state => {
                state.loading = true;
            })
            .addCase(updateAvatarUser.fulfilled, (state, action) => {
                state.loading = false;
                if (state.user) {
                    state.user.avatarUrl = action.payload.data.avatarUrl;
                }
            })
            .addCase(updateAvatarUser.rejected, state => {
                state.loading = false;
            })

        builder
            .addCase(updateProfileUser.pending, state => {
                state.loading = true;
            })
            .addCase(updateProfileUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data;
            })
            .addCase(updateProfileUser.rejected, state => {
                state.loading = false;
            })

    }
})

export const { logout } = authSlice.actions
export default authSlice.reducer
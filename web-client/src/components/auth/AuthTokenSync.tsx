"use client";

import { useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch } from "@/stores/hooks";
import { getProfileUser, setCredentials } from "@/stores/slices/auth.slice";
import http from "@/utils/api";
import { message } from "antd";

function AuthTokenSyncContent() {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const hasProcessed = useRef(false);

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const error = searchParams.get("error");

        if (error) {
            message.error("Đăng nhập thất bại: " + error);
            // Clean URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            return;
        }

        // Prevent double processing
        if (hasProcessed.current || !accessToken || !refreshToken) {
            return;
        }
        hasProcessed.current = true;

        // 🔥 QUAN TRỌNG: Xóa token khỏi URL NGAY LẬP TỨC trước khi làm bất cứ gì
        // Điều này đảm bảo token không bao giờ hiển thị trên thanh địa chỉ
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        const processAuth = async () => {
            try {
                // 1. Set token to http client and cookie immediately
                http.setAccessToken(accessToken);

                // 2. Update Redux state with tokens
                dispatch(setCredentials({ accessToken, refreshToken }));

                // 3. Fetch user profile and WAIT for it to complete
                await dispatch(getProfileUser()).unwrap();

                // 4. Notify user
                message.success("Đăng nhập Google thành công!");

            } catch (err) {
                console.error("Failed to fetch profile after google login", err);
                message.error("Không thể lấy thông tin người dùng");
            }
        };

        processAuth();
    }, [searchParams, dispatch, router]);

    return null;
}

export default function AuthTokenSync() {
    return (
        <Suspense fallback={null}>
            <AuthTokenSyncContent />
        </Suspense>
    );
}

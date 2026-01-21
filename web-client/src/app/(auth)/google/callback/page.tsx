"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch } from "@/stores/hooks";
import { getProfileUser } from "@/stores/slices/auth.slice";

function GoogleCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            // Get tokens from URL params (backend redirects with tokens)
            const accessToken = searchParams.get("accessToken");
            const refreshToken = searchParams.get("refreshToken");
            const errorParam = searchParams.get("error");

            if (errorParam) {
                setError(errorParam);
                message.error("Đăng nhập Google thất bại!");
                setTimeout(() => router.push("/"), 2000);
                return;
            }

            if (accessToken && refreshToken) {
                // Save tokens to localStorage
                localStorage.setItem("access_token", accessToken);
                localStorage.setItem("refresh_token", refreshToken);
                
                // Fetch user profile to update Redux state
                try {
                    await dispatch(getProfileUser()).unwrap();
                    message.success("Đăng nhập thành công!");
                } catch (err) {
                    console.error("Failed to get profile:", err);
                }
                
                // Redirect to home or previous page
                const redirectTo = localStorage.getItem("redirectAfterLogin") || "/";
                localStorage.removeItem("redirectAfterLogin");
                router.push(redirectTo);
            } else {
                setError("Không nhận được thông tin đăng nhập");
                setTimeout(() => router.push("/"), 2000);
            }
        };

        handleCallback();
    }, [searchParams, router, dispatch]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">❌</div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                        Đăng nhập thất bại
                    </h2>
                    <p className="text-gray-600">{error}</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Đang chuyển hướng...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                    className="mb-4"
                />
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Đang xử lý đăng nhập...
                </h2>
                <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
            </div>
        </div>
    );
}

export default function GoogleCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                </div>
            }
        >
            <GoogleCallbackContent />
        </Suspense>
    );
}

"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/stores/hooks";
import { exchangeGoogleCode, exchangeFacebookCode } from "@/stores/slices/auth.slice";
import { message } from "antd";

const AuthExchangeHandler = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const effectRan = useRef(false);

    useEffect(() => {
        const code = searchParams.get("code");
        if (code && !effectRan.current) {
            effectRan.current = true;

            // Determine which provider is being used from localStorage
            const authProvider = localStorage.getItem("authProvider") || "google";
            console.log(`Exchanging ${authProvider} code:`, code);

            // Select the appropriate exchange action based on provider
            const exchangeAction = authProvider === "facebook"
                ? exchangeFacebookCode(code)
                : exchangeGoogleCode(code);

            dispatch(exchangeAction)
                .unwrap()
                .then(() => {
                    message.success("Đăng nhập thành công!");
                    // Clean up provider flag
                    localStorage.removeItem("authProvider");
                    // Remove the code from URL without full reload (if possible) or replace
                    router.replace("/home");
                })
                .catch((err) => {
                    console.error("Exchange failed:", err);
                    message.error("Đăng nhập thất bại");
                    // Clean up provider flag
                    localStorage.removeItem("authProvider");
                    router.replace("/home");
                });
        }
    }, [searchParams, dispatch, router]);

    return null;
};

export default AuthExchangeHandler;

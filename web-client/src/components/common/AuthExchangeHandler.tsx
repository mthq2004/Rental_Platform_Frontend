"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/stores/hooks";
import { exchangeGoogleCode } from "@/stores/slices/auth.slice";
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
            console.log("Exchanging code:", code);

            dispatch(exchangeGoogleCode(code))
                .unwrap()
                .then(() => {
                    message.success("Đăng nhập thành công!");
                    // Remove the code from URL without full reload (if possible) or replace
                    router.replace("/home");
                })
                .catch((err) => {
                    console.error("Exchange failed:", err);
                    message.error("Đăng nhập thất bại");
                    router.replace("/home");
                });
        }
    }, [searchParams, dispatch, router]);

    return null;
};

export default AuthExchangeHandler;

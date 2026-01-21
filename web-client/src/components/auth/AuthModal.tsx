"use client";
import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Checkbox, message } from "antd";
import {
    AppleFilled,
    CloseOutlined,
    PhoneOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    LoadingOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@/stores/hooks";
import envConfig from "@/config";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: "login" | "register";
}

const AuthModal = ({
    isOpen,
    onClose,
    initialView = "login",
}: AuthModalProps) => {
    const [view, setView] = useState<"login" | "register">(initialView);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { loading, isAuth } = useAppSelector((state) => state.auth);

    // Sync view when initialView changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setView(initialView);
        }
    }, [isOpen, initialView]);

    // Close modal when authenticated
    useEffect(() => {
        if (isAuth && isOpen) {
            message.success("Đăng nhập thành công!");
            onClose();
        }
    }, [isAuth, isOpen, onClose]);

    // Google Login Handler - Redirect to backend OAuth
    const handleGoogleClick = () => {
        if (googleLoading || loading) return;
        setGoogleLoading(true);
        
        // Save current path to redirect back after login
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        
        // Redirect to backend Google OAuth endpoint
        const googleAuthUrl = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/estate/auth/google`;
        window.location.href = googleAuthUrl;
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={900}
            centered
            closeIcon={null}
            className="p-0 overflow-hidden relative"
            styles={{ body: { padding: 0, borderRadius: "16px" } }}
            transitionName=""
            maskTransitionName=""
        >
            {/* Custom Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <CloseOutlined className="text-xl" />
            </button>

            <div className="flex h-[550px]">
                {/* LEFT SIDE - Branding & Illustration */}
                <div className="w-[400px] bg-red-50 flex flex-col items-center justify-center p-8 relative overflow-hidden hidden md:flex">
                    {/* Decorative Circles */}
                    <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10 text-center">
                        {/* Logo Placeholder */}
                        <div className="mb-8 flex flex-col items-center">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-16 object-contain mb-2"
                            />
                            <p className="font-bold text-gray-800 text-lg">Group33</p>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">
                                Real Estate Platform
                            </p>
                        </div>

                        {/* Illustration Placeholder */}
                        <img
                            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Login Illustration"
                            className="w-full h-48 object-cover rounded-xl shadow-lg mb-8"
                        />

                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                Tìm nhà đất
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Group33 dẫn lối - Tìm kiếm bất động sản <br />
                                nhanh chóng và hiệu quả
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Form */}
                <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-center">
                    <div className="w-full max-w-sm mx-auto">
                        <h4 className="text-sm text-gray-500 font-medium mb-1">
                            Xin chào bạn
                        </h4>
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">
                            {view === "login" ? "Đăng nhập để tiếp tục" : "Đăng ký tài khoản mới"}
                        </h2>

                        <div className="space-y-4">
                            {/* Phone Input */}
                            <div>
                                <Input
                                    size="large"
                                    prefix={<PhoneOutlined className="text-gray-400 mr-2" />}
                                    placeholder="Nhập số điện thoại"
                                    className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                />
                            </div>

                            {/* Password Input (Login only) */}
                            {view === "login" && (
                                <div>
                                    <Input.Password
                                        size="large"
                                        prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                        placeholder="Nhập mật khẩu"
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                        className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                    />
                                </div>
                            )}

                            {/* Action Button */}
                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={loading}
                                className="h-12 bg-red-500 hover:bg-red-600 border-none font-semibold text-base rounded-lg shadow-sm mt-2"
                            >
                                {view === "login" ? "Đăng nhập" : "Tiếp tục"}
                            </Button>

                            {/* Remember & Forgot Password (Login only) */}
                            {view === "login" && (
                                <div className="flex items-center justify-between">
                                    <Checkbox className="text-gray-600">Nhớ tài khoản</Checkbox>
                                    <a href="#" className="text-red-500 hover:underline text-sm font-medium">
                                        Quên mật khẩu?
                                    </a>
                                </div>
                            )}

                            {/* Terms Checkbox (Register only) */}
                            {view === "register" && (
                                <div className="flex items-start gap-2">
                                    <Checkbox className="mt-0.5" />
                                    <span className="text-xs text-gray-500 leading-tight">
                                        Tôi đã đọc và đồng ý với{" "}
                                        <a href="#" className="text-red-600 hover:underline">
                                            Điều khoản sử dụng
                                        </a>
                                        ,{" "}
                                        <a href="#" className="text-red-600 hover:underline">
                                            Chính sách bảo mật
                                        </a>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Hoặc</span>
                            </div>
                        </div>

                        {/* Social Logins */}
                        <div className="space-y-3">
                            <Button
                                size="large"
                                block
                                icon={<AppleFilled style={{ fontSize: 20 }} />}
                                className="h-11 flex items-center justify-center gap-2 font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg"
                            >
                                Đăng nhập với Apple
                            </Button>

                            {/* Google Login Button */}
                            <Button
                                size="large"
                                block
                                onClick={handleGoogleClick}
                                disabled={googleLoading || loading}
                                icon={
                                    googleLoading ? (
                                        <LoadingOutlined style={{ fontSize: 20 }} />
                                    ) : (
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="20"
                                            height="20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                                <path
                                                    fill="#4285F4"
                                                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                                                />
                                            </g>
                                        </svg>
                                    )
                                }
                                className="h-11 flex items-center justify-center gap-2 font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg"
                            >
                                {googleLoading ? "Đang xử lý..." : "Đăng nhập với Google"}
                            </Button>
                        </div>

                        {/* Toggle View */}
                        <div className="mt-8 text-center text-sm">
                            <span className="text-gray-600">
                                {view === "login"
                                    ? "Bạn chưa có tài khoản? "
                                    : "Bạn đã có tài khoản? "}
                            </span>
                            <button
                                onClick={() =>
                                    setView(view === "login" ? "register" : "login")
                                }
                                className="text-red-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
                            >
                                {view === "login" ? "Đăng ký" : "Đăng nhập"} tại đây
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AuthModal;

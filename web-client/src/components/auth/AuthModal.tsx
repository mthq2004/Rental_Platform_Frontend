"use client";
import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Checkbox, App } from "antd";
import {
    AppleFilled,
    CloseOutlined,
    PhoneOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    LoadingOutlined,
    ArrowLeftOutlined,
    SafetyOutlined,
    FacebookFilled,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { requestPhoneOtp, signupWithPhone, resetOtpState, loginUser } from "@/stores/slices/auth.slice";
import envConfig from "@/config";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: "login" | "register";
}

type RegisterStep = "phone" | "otp" | "password";

const AuthModal = ({
    isOpen,
    onClose,
    initialView = "login",
}: AuthModalProps) => {
    const { message } = App.useApp();
    const dispatch = useAppDispatch();
    const [view, setView] = useState<"login" | "register">(initialView);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [facebookLoading, setFacebookLoading] = useState(false);
    const { loading, isAuth, otpSent } = useAppSelector((state) => state.auth);

    // Register flow states
    const [registerStep, setRegisterStep] = useState<RegisterStep>("phone");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Sync view when initialView changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setRegisterStep("phone");
            setPhone("");
            setOtp("");
            setPassword("");
            setConfirmPassword("");
            setCountdown(0);
            setAgreedToTerms(false);
            dispatch(resetOtpState());
        }
    }, [isOpen, initialView, dispatch]);

    // Close modal when authenticated
    useEffect(() => {
        if (isAuth && isOpen) {
            message.success("Đăng nhập thành công!");
            onClose();
        }
    }, [isAuth, isOpen, onClose]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Move to OTP step when OTP is sent
    useEffect(() => {
        if (otpSent && registerStep === "phone") {
            setRegisterStep("otp");
            setCountdown(120); // 2 minutes countdown
        }
    }, [otpSent, registerStep]);

    // Handle request OTP
    const handleRequestOtp = async () => {
        if (!phone || phone.length < 9) {
            message.error("Vui lòng nhập số điện thoại hợp lệ");
            return;
        }
        if (!agreedToTerms) {
            message.error("Vui lòng đồng ý với điều khoản sử dụng");
            return;
        }
        try {
            await dispatch(requestPhoneOtp(phone)).unwrap();
            message.success("OTP đã được gửi đến số điện thoại của bạn");
        } catch (error: any) {
            message.error(error?.message || "Không thể gửi OTP. Vui lòng thử lại");
        }
    };

    // Handle verify OTP and go to password step
    const handleVerifyOtp = () => {
        if (!otp || otp.length !== 6) {
            message.error("Vui lòng nhập mã OTP 6 số");
            return;
        }
        setRegisterStep("password");
    };

    // Password validation regex
    const validatePassword = (pwd: string): { valid: boolean; message: string } => {
        if (pwd.length < 8) {
            return { valid: false, message: "Mật khẩu phải có ít nhất 8 ký tự" };
        }
        if (!/[a-zA-Z]/.test(pwd)) {
            return { valid: false, message: "Mật khẩu phải có ít nhất 1 chữ cái (a-z hoặc A-Z)" };
        }
        if (!/[0-9]/.test(pwd)) {
            return { valid: false, message: "Mật khẩu phải có ít nhất 1 chữ số (0-9)" };
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd)) {
            return { valid: false, message: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)" };
        }
        return { valid: true, message: "" };
    };

    // Handle complete signup
    const handleCompleteSignup = async () => {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            message.error(passwordValidation.message);
            return;
        }
        if (password !== confirmPassword) {
            message.error("Mật khẩu xác nhận không khớp");
            return;
        }
        try {
            await dispatch(signupWithPhone({ phone, otp, password })).unwrap();
            message.success("Đăng ký thành công!");
        } catch (error: any) {
            message.error(error?.message || "Đăng ký thất bại. Vui lòng thử lại");
        }
    };

    // Handle resend OTP
    const handleResendOtp = async () => {
        if (countdown > 0) return;
        try {
            await dispatch(requestPhoneOtp(phone)).unwrap();
            setCountdown(120);
            message.success("OTP mới đã được gửi");
        } catch (error: any) {
            message.error(error?.message || "Không thể gửi lại OTP");
        }
    };

    // Go back in register flow
    const handleBack = () => {
        if (registerStep === "otp") {
            setRegisterStep("phone");
            setOtp("");
        } else if (registerStep === "password") {
            setRegisterStep("otp");
            setPassword("");
            setConfirmPassword("");
        }
    };

    // Handle login with phone
    const handleLogin = async () => {
        if (!phone || phone.length < 9) {
            message.error("Vui lòng nhập số điện thoại hợp lệ");
            return;
        }
        if (!password) {
            message.error("Vui lòng nhập mật khẩu");
            return;
        }
        try {
            await dispatch(loginUser({ phone, password })).unwrap();
        } catch (error: any) {
            message.error(error?.message || "Đăng nhập thất bại. Vui lòng thử lại");
        }
    };

    // Google Login Handler - Redirect to backend OAuth
    const handleGoogleClick = () => {
        if (googleLoading || facebookLoading || loading) return;
        setGoogleLoading(true);

        // Save current path to redirect back after login
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        // Set provider for AuthExchangeHandler to know which endpoint to call
        localStorage.setItem("authProvider", "google");

        // Redirect to backend Google OAuth endpoint
        const googleAuthUrl = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/estate/auth/google`;
        window.location.href = googleAuthUrl;
    };

    // Facebook Login Handler - Redirect to backend OAuth
    const handleFacebookClick = () => {
        if (facebookLoading || googleLoading || loading) return;
        setFacebookLoading(true);

        // Save current path to redirect back after login
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        // Set provider for AuthExchangeHandler to know which endpoint to call
        localStorage.setItem("authProvider", "facebook");

        // Redirect to backend Facebook OAuth endpoint
        const facebookAuthUrl = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/estate/auth/facebook`;
        window.location.href = facebookAuthUrl;
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
                        {/* Back button for register steps */}
                        {view === "register" && registerStep !== "phone" && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 bg-transparent border-none cursor-pointer"
                            >
                                <ArrowLeftOutlined />
                                <span>Quay lại</span>
                            </button>
                        )}

                        <h4 className="text-sm text-gray-500 font-medium mb-1">
                            Xin chào bạn
                        </h4>
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">
                            {view === "login"
                                ? "Đăng nhập để tiếp tục"
                                : registerStep === "phone"
                                    ? "Đăng ký tài khoản mới"
                                    : registerStep === "otp"
                                        ? "Xác thực OTP"
                                        : "Tạo mật khẩu"}
                        </h2>

                        <div className="space-y-4">
                            {/* ===== LOGIN VIEW ===== */}
                            {view === "login" && (
                                <>
                                    <div>
                                        <Input
                                            size="large"
                                            prefix={<PhoneOutlined className="text-gray-400 mr-2" />}
                                            placeholder="Nhập số điện thoại"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                        />
                                    </div>
                                    <div>
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                            placeholder="Nhập mật khẩu"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                            className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                        />
                                    </div>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        loading={loading}
                                        onClick={handleLogin}
                                        className="h-12 bg-red-500 hover:bg-red-600 border-none font-semibold text-base rounded-lg shadow-sm mt-2"
                                    >
                                        Đăng nhập
                                    </Button>
                                    <div className="flex items-center justify-between">
                                        <Checkbox className="text-gray-600">Nhớ tài khoản</Checkbox>
                                        <a href="#" className="text-red-500 hover:underline text-sm font-medium">
                                            Quên mật khẩu?
                                        </a>
                                    </div>
                                </>
                            )}

                            {/* ===== REGISTER VIEW - STEP 1: PHONE ===== */}
                            {view === "register" && registerStep === "phone" && (
                                <>
                                    <div>
                                        <Input
                                            size="large"
                                            prefix={<PhoneOutlined className="text-gray-400 mr-2" />}
                                            placeholder="Nhập số điện thoại"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                        />
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Checkbox
                                            className="mt-0.5"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        />
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
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        loading={loading}
                                        onClick={handleRequestOtp}
                                        disabled={!phone || !agreedToTerms}
                                        className="h-12 bg-red-500 hover:bg-red-600 border-none font-semibold text-base rounded-lg shadow-sm mt-2"
                                    >
                                        Gửi mã OTP
                                    </Button>
                                </>
                            )}

                            {/* ===== REGISTER VIEW - STEP 2: OTP ===== */}
                            {view === "register" && registerStep === "otp" && (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Mã OTP đã được gửi đến số <strong>{phone}</strong>
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <input
                                                key={index}
                                                id={`otp-input-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={otp[index] || ""}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    if (value.length <= 1) {
                                                        const newOtp = otp.split("");
                                                        newOtp[index] = value;
                                                        setOtp(newOtp.join(""));
                                                        // Auto focus next input
                                                        if (value && index < 5) {
                                                            const nextInput = document.getElementById(`otp-input-${index + 1}`);
                                                            nextInput?.focus();
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    // Handle backspace - go to previous input
                                                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                                                        const prevInput = document.getElementById(`otp-input-${index - 1}`);
                                                        prevInput?.focus();
                                                    }
                                                }}
                                                onPaste={(e) => {
                                                    e.preventDefault();
                                                    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                                                    setOtp(pastedData);
                                                    // Focus on the last filled input or the next empty one
                                                    const focusIndex = Math.min(pastedData.length, 5);
                                                    const targetInput = document.getElementById(`otp-input-${focusIndex}`);
                                                    targetInput?.focus();
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                                            />
                                        ))}
                                    </div>
                                    <div className="text-center text-sm text-gray-500 mt-4">
                                        {countdown > 0 ? (
                                            <span>Gửi lại OTP sau <span className="text-red-500 font-semibold">{countdown}s</span></span>
                                        ) : (
                                            <button
                                                onClick={handleResendOtp}
                                                className="text-red-600 hover:underline bg-transparent border-none cursor-pointer font-medium"
                                            >
                                                Gửi lại OTP
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        loading={loading}
                                        onClick={handleVerifyOtp}
                                        disabled={otp.length !== 6}
                                        className="h-12 bg-red-500 hover:bg-red-600 border-none font-semibold text-base rounded-lg shadow-sm mt-4"
                                    >
                                        Xác nhận OTP
                                    </Button>
                                </>
                            )}

                            {/* ===== REGISTER VIEW - STEP 3: PASSWORD ===== */}
                            {view === "register" && registerStep === "password" && (
                                <>
                                    <div>
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                            placeholder="Nhập mật khẩu"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                            className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                        />
                                        <ul className="text-xs text-gray-500 mt-2 ml-1 space-y-0.5">
                                            <li className={password.length >= 8 ? "text-green-600" : ""}>• Ít nhất 8 ký tự</li>
                                            <li className={/[a-zA-Z]/.test(password) ? "text-green-600" : ""}>• Ít nhất 1 chữ cái (a-z, A-Z)</li>
                                            <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>• Ít nhất 1 chữ số (0-9)</li>
                                            <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? "text-green-600" : ""}>• Ít nhất 1 ký tự đặc biệt</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <Input.Password
                                            size="large"
                                            prefix={<LockOutlined className="text-gray-400 mr-2" />}
                                            placeholder="Xác nhận mật khẩu"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                            className="h-12 text-base rounded-lg border-gray-300 hover:border-red-500 focus:border-red-500"
                                        />
                                    </div>
                                    <Button
                                        type="primary"
                                        size="large"
                                        block
                                        loading={loading}
                                        onClick={handleCompleteSignup}
                                        disabled={!password || !confirmPassword}
                                        className="h-12 bg-red-500 hover:bg-red-600 border-none font-semibold text-base rounded-lg shadow-sm mt-2"
                                    >
                                        Hoàn tất đăng ký
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Divider - Only show on phone step or login */}
                        {(view === "login" || (view === "register" && registerStep === "phone")) && (
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">Hoặc</span>
                                </div>
                            </div>
                        )}

                        {/* Social Logins - Only show on phone step or login */}
                        {(view === "login" || (view === "register" && registerStep === "phone")) && (
                            <div className="space-y-3">


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
                                    className="h-11
                                    bg-white
                                    text-gray-700
                                    border border-gray-300
                                    hover:bg-gray-50
                                    flex items-center justify-center
                                    gap-2 font-medium rounded-lg
                                    [&>span]:flex [&>span]:items-center [&>span]:gap-2"
                                >
                                    {googleLoading ? "Đang xử lý..." : "Đăng nhập với Google"}
                                </Button>
                                {/* Facebook Login Button */}
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={handleFacebookClick}
                                    disabled={facebookLoading || googleLoading || loading}
                                    icon={
                                        facebookLoading ? (
                                            <LoadingOutlined style={{ fontSize: 20 }} />
                                        ) : (
                                            <FacebookFilled style={{ fontSize: 20 }} />
                                        )
                                    }
                                    className="
                                        h-11
                                        !bg-[#1877F2]
                                        !border-none
                                        !text-white
                                        hover:!bg-[#166FE5]
                                        hover:!text-white
                                        transition-colors duration-200
                                        font-medium rounded-lg
                                        flex items-center justify-center gap-2
                                        [&>span]:flex [&>span]:items-center [&>span]:gap-2
                                    "
                                >
                                    {facebookLoading ? "Đang xử lý..." : "Đăng nhập với Facebook"}
                                </Button>

                            </div>
                        )}

                        {/* Toggle View */}
                        <div className="mt-8 text-center text-sm">
                            <span className="text-gray-600">
                                {view === "login"
                                    ? "Bạn chưa có tài khoản? "
                                    : "Bạn đã có tài khoản? "}
                            </span>
                            <button
                                onClick={() => {
                                    setView(view === "login" ? "register" : "login");
                                    setRegisterStep("phone");
                                    dispatch(resetOtpState());
                                }}
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

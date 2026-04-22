import { View, Text, TextInput } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import PrimaryButton from "@/components/PrimaryButton";
import OTPInput from "@/components/auth/OTPInput";
import BackButton from "@/components/BackButton";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { requestForgotPasswordOtp } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";
import Header from "@/components/auth/Header";
import { Ionicons } from "@expo/vector-icons";

const VerifyOTPScreen = () => {

  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string>("");
  const [timer, setTimer] = useState<number>(60);
  const otpInputs = useRef<(TextInput | null)[]>([]);
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);

  const handleOtpChange = (text: string, index: number): void => {
    const cleanText = text.replace(/\D/g, '');
    const newOtp = [...otp];

    if (!cleanText) {
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleanText.length > 1) {
      const chars = cleanText.slice(0, otp.length - index).split('');
      chars.forEach((char, offset) => {
        newOtp[index + offset] = char;
      });
      setOtp(newOtp);

      const nextIndex = Math.min(index + chars.length, otp.length - 1);
      otpInputs.current[nextIndex]?.focus();
      if (error) setError("");
      return;
    }

    newOtp[index] = cleanText;
    setOtp(newOtp);
    if (error) {
      setError("");
    }

    if (index < otp.length - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number): void => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    if (!phone) {
      setError("Thiếu số điện thoại để xác thực OTP");
      return;
    }

    router.push({
      pathname: "/(auth)/reset-password",
      params: { phone, otp: otpCode }
    });

  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      return;
    }

    if (!phone) {
      setError("Thiếu số điện thoại để gửi lại OTP");
      return;
    }

    try {
      await dispatch(requestForgotPasswordOtp(phone)).unwrap();
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
      setTimer(60);
      setError("");
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Không thể gửi lại OTP");
    }
  };

  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  return (
    <KeyboardSafeWrapper
      className="bg-white dark:bg-background-dark"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="px-6 pt-16">
        <BackButton onPress={() => router.back()} />

        <Header
          title="Xác thực OTP"
          subtitle={`Mã xác thực đã được gửi đến\n${phone ?? ''}`}
        />

        <OTPInput
          otp={otp}
          otpInputs={otpInputs}
          handleOtpChange={handleOtpChange}
          handleOtpKeyPress={handleOtpKeyPress}
        />

        <View className="items-center mb-8">
          {timer > 0 ? (
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-gray-600 dark:text-gray-300 text-sm ml-1">
                Gửi lại mã sau <Text className="font-semibold text-blue-600">{timer}s</Text>
              </Text>
            </View>
          ) : (
            <Text className="text-blue-600 text-sm font-semibold" onPress={handleResendOTP}>
              Gửi lại mã OTP
            </Text>
          )}
        </View>

        <PrimaryButton
          title="Xác nhận"
          onPress={handleVerifyOTP}
          disabled={otp.join('').length !== 6}
          loading={loading}
        />

        {error ? (
          <Text className="text-red-500 text-sm mt-3 text-center">{error}</Text>
        ) : null}

      </View>
    </KeyboardSafeWrapper>
  );
};

export default VerifyOTPScreen;
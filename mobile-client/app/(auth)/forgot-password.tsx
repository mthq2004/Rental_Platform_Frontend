import {
    View,
    Text,
    TouchableOpacity
} from "react-native";
import React, { useState } from "react";
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import BackButton from "@/components/BackButton";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { requestForgotPasswordOtp } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";

const ForgotPasswordScreen = () => {

    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.auth);

    const handleSendOTP = async () => {
        const cleanPhone = phone.trim();

        if (!cleanPhone) {
            setError("Vui lòng nhập số điện thoại");
            return;
        }

        if (cleanPhone.length < 10) {
            setError("Số điện thoại không hợp lệ");
            return;
        }

        try {
            await dispatch(requestForgotPasswordOtp(cleanPhone)).unwrap();
        } catch (err: any) {
            setError(typeof err === "string" ? err : "Không thể gửi mã OTP");
            return;
        }

        router.push({
            pathname: "/(auth)/verify-otp",
            params: { phone: cleanPhone }
        });

    };

    const handleBack = (): void => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tab)');
        }
    };

    return (
        <KeyboardSafeWrapper
            className="bg-white dark:bg-background-dark"
            contentContainerStyle={{ paddingBottom: 24 }}
        >
            <View className="px-6 pt-16">

            <BackButton onPress={handleBack} />
            <Text className="text-2xl font-bold text-gray-900 dark:text-foreground-dark mb-4 mt-4">
                Quên mật khẩu
            </Text>

            <Text className="text-gray-500 dark:text-gray-300 mb-6">
                Nhập số điện thoại để nhận mã xác nhận
            </Text>

            <CustomInput
                label="Số điện thoại"
                placeholder="Nhập số số điện thoại của bạn"
                value={phone}
                onChangeText={(text) => {
                    setPhone(text);
                    setError("");
                }}
                keyboardType="phone-pad"
                error={error}
            />

            <PrimaryButton
                title="Gửi mã OTP"
                onPress={handleSendOTP}
                loading={loading}
            />

            </View>
        </KeyboardSafeWrapper>
    );
};

export default ForgotPasswordScreen;
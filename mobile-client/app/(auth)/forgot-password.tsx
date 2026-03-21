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

const ForgotPasswordScreen = () => {

    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");

    const handleSendOTP = () => {

        if (!phone) {
            setError("Vui lòng nhập số điện thoại");
            return;
        }

        if (phone.length < 10) {
            setError("Số điện thoại không hợp lệ");
            return;
        }

        // gọi API gửi OTP
        // await dispatch(sendOTP(phone))

        router.push({
            pathname: "/(auth)/verify-otp",
            params: { phone }
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
        <View className="flex-1 bg-white px-6 pt-20">

            <BackButton onPress={handleBack} />
            <Text className="text-2xl font-bold mb-4">
                Quên mật khẩu
            </Text>

            <Text className="text-gray-500 mb-6">
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
            />

        </View>
    );
};

export default ForgotPasswordScreen;
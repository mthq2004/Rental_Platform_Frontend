import { View, Text } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import CustomInput from "@/components/CustomInput";
import PrimaryButton from "@/components/PrimaryButton";

const VerifyOTPScreen = () => {

  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState("");

  const handleVerifyOTP = async () => {

    // call API verify OTP
    // const res = await verifyOTP(phone, otp)

    router.push({
      pathname: "/(auth)/reset-password",
      params: { phone }
    });

  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">

      <Text className="text-2xl font-bold mb-4">
        Xác thực OTP
      </Text>

      <Text className="text-gray-500 mb-6">
        Mã OTP đã gửi tới {phone}
      </Text>

      <CustomInput
        label="Mã OTP"
        placeholder="Nhập OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
      />

      <PrimaryButton
        title="Xác nhận"
        onPress={handleVerifyOTP}
      />

    </View>
  );
};

export default VerifyOTPScreen;
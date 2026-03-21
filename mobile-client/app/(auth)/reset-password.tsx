import { View, Text } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import CustomInput from "@/components/CustomInput";
import PrimaryButton from "@/components/PrimaryButton";

const ResetPasswordScreen = () => {

  const { phone } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async () => {

    if (password !== confirmPassword) {
      alert("Mật khẩu không khớp");
      return;
    }

    // call API reset password

    router.replace("/(auth)/login");

  };

  return (
    <View className="flex-1 bg-white px-6 pt-20">

      <Text className="text-2xl font-bold mb-6">
        Đặt mật khẩu mới
      </Text>

      <CustomInput
        label="Mật khẩu mới"
        placeholder="Nhập mật khẩu mới"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <CustomInput
        label="Nhập lại mật khẩu"
        placeholder="Nhập lại mật khẩu mớis"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <PrimaryButton
        title="Đổi mật khẩu"
        onPress={handleResetPassword}
      />

    </View>
  );
};

export default ResetPasswordScreen;
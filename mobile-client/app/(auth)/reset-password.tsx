import { View, Text } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import CustomInput from "@/components/CustomInput";
import PrimaryButton from "@/components/PrimaryButton";
import BackButton from "@/components/BackButton";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { resetPasswordWithOtp } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

const ResetPasswordScreen = () => {
  useEnableFloatingKeyboard();

  const { phone, otp } = useLocalSearchParams<{ phone?: string; otp?: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>("");
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);

  const handleResetPassword = async () => {
    setError("");

    if (!phone || !otp) {
      setError("Thiếu thông tin xác thực OTP. Vui lòng thực hiện lại.");
      return;
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }

    try {
      await dispatch(
        resetPasswordWithOtp({
          phone,
          otp,
          newPassword: password,
        })
      ).unwrap();
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Đặt lại mật khẩu thất bại");
      return;
    }

    router.replace("/(auth)/login");

  };

  return (
    <KeyboardSafeWrapper
      className="bg-white dark:bg-background-dark"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="px-6 pt-16">
        <BackButton onPress={() => router.back()} />

      <Text className="text-2xl font-bold text-gray-900 dark:text-foreground-dark mb-6 mt-4">
        Đặt mật khẩu mới
      </Text>

      <CustomInput
        label="Mật khẩu mới"
        placeholder="Nhập mật khẩu mới"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        showPasswordToggle
        onTogglePassword={() => setShowPassword(!showPassword)}
        icon="lock-closed-outline"
      />

      <CustomInput
        label="Nhập lại mật khẩu"
        placeholder="Nhập lại mật khẩu mới"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        showPasswordToggle
        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        icon="lock-closed-outline"
      />

      {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

      <PrimaryButton
        title="Đổi mật khẩu"
        onPress={handleResetPassword}
        loading={loading}
        disabled={!password || !confirmPassword}
      />

      </View>
    </KeyboardSafeWrapper>
  );
};

export default ResetPasswordScreen;
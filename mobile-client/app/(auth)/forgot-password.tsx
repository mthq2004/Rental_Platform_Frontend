import {
    View,
    Text,
    TouchableOpacity,
    StatusBar,
} from "react-native";
import React, { useState } from "react";
import PrimaryButton from "@/components/PrimaryButton";
import { router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import BackButton from "@/components/BackButton";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { requestForgotPasswordOtp } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";
import { useColorScheme } from "nativewind";
import { validatePhoneRealtime, validatePhone } from "@/utils/validation";
import { Toast } from "@/components/Notification";
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

const ForgotPasswordScreen = () => {
    useEnableFloatingKeyboard();

    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [phoneHint, setPhoneHint] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector((state) => state.auth);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (msg: string, type = 'success') => setToast({ visible: true, message: msg, type });
    const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

    const handlePhoneChange = (text: string) => {
        setPhone(text);
        setError("");
        setPhoneHint(validatePhoneRealtime(text));
    };

    const handleSendOTP = async () => {
        const cleanPhone = phone.trim();
        const phoneError = validatePhone(cleanPhone);

        if (phoneError) {
            setError(phoneError);
            return;
        }

        try {
            await dispatch(requestForgotPasswordOtp(cleanPhone)).unwrap();
            showToast('Đã gửi mã OTP đến số điện thoại của bạn', 'success');
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
        <>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#19191a' : '#FFFFFF'} />
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
                    Nhập số điện thoại đã đăng ký để nhận mã xác nhận
                </Text>

                <CustomInput
                    label="Số điện thoại"
                    placeholder="VD: 0912345678"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    error={error || (phoneHint ?? undefined)}
                    maxLength={12}
                    icon="call-outline"
                />

                <PrimaryButton
                    title="Gửi mã OTP"
                    onPress={handleSendOTP}
                    loading={loading}
                    disabled={!!phoneHint || !phone.trim()}
                />

                </View>
            </KeyboardSafeWrapper>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} duration={3000} onHide={hideToast} />
        </>
    );
};

export default ForgotPasswordScreen;
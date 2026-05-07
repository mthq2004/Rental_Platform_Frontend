import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  Image,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, AntDesign, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import CustomInput from '@/components/CustomInput';
import SocialLoginButton from '@/components/SocialLoginButton';
import BackButton from '@/components/BackButton';
import { router, useLocalSearchParams } from 'expo-router';
import PrimaryButton from '@/components/PrimaryButton';
import Header from '@/components/auth/Header';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { googleExchange, login, resetMessage } from '@/store/slices/auth.slice';
import { Toast } from '@/components/Notification';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'nativewind';
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper';
import { validatePhone, validatePhoneRealtime } from '@/utils/validation';
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

const LoginScreen = () => {
  useEnableFloatingKeyboard();
  const navigation = useNavigation();
  const { code, redirect_to } = useLocalSearchParams<{ code?: string; redirect_to?: string }>();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});
  const [handledOAuthCode, setHandledOAuthCode] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [phoneHint, setPhoneHint] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { error, isAuth, loading, user, message } = useAppSelector((state) => state.auth);

  const validateForm = (): boolean => {
    const newErrors: { phone?: string; password?: string } = {};

    if (!phoneNumber) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else {
      const phoneErr = validatePhone(phoneNumber);
      if (phoneErr) newErrors.phone = phoneErr;
    }

    // if (!password) {
    //   newErrors.password = 'Vui lòng nhập mật khẩu';
    // } else if (password.length < 8) {
    //   newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    // } else if (!/[a-zA-Z]/.test(password)) {
    //   newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ cái';
    // } else if (!/\d/.test(password)) {
    //   newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ số';
    // } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    //   newErrors.password = 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleBack = (): void => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tab)');
    }
  };

  const handleLogin = async (): Promise<void> => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    dispatch(login({ phone: phoneNumber, password }))
  };

  const getApiBaseUrl = (): string => {
    const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (!raw) {
      return '';
    }

    return raw.replace(/\/+$/, '');
  };

  const handleSocialLogin = async (platform: string): Promise<void> => {
    if (platform !== 'Google') {
      showToast('Chức năng này đang được phát triển', 'error');
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      showToast('Thiếu EXPO_PUBLIC_API_URL để đăng nhập Google', 'error');
      return;
    }

    try {
      const authUrl = `${apiBaseUrl}/estate/auth/google`;
      const redirectUri = Linking.createURL('/(auth)/login');

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type !== 'success') {
        return;
      }

      const callbackCode = new URL(result.url).searchParams.get('code');
      if (!callbackCode) {
        showToast('Không nhận được mã xác thực từ Google', 'error');
        return;
      }

      dispatch(googleExchange(callbackCode));
    } catch (error) {
      showToast('Đăng nhập Google thất bại, vui lòng thử lại', 'error');
    }
  };

  const handleForgotPassword = (): void => {
    router.push("/(auth)/forgot-password")
  };

  const handleRegister = (): void => {
    router.push('/(auth)/register');
  };

  const isFormValid = /^\d{10}$/.test(phoneNumber) && password.length >= 6;

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: any, type = 'success') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };


  useEffect(() => {
  if (!message) return;

  if (message.type === "success_login") {
    setIsRedirecting(true);
    setErrors({});
    
    setTimeout(() => {
      if (redirect_to) {
        router.replace(redirect_to as any);
      } else {
        router.replace('/(tab)');
      }
    }, 500);

  } else if (message.type === "error_login") {
    showToast(message.message, 'error');
  }

  dispatch(resetMessage());
}, [message, dispatch]);

  useEffect(() => {
    if (!code || typeof code !== 'string') {
      return;
    }

    if (handledOAuthCode === code) {
      return;
    }

    setHandledOAuthCode(code);
    dispatch(googleExchange(code));
  }, [code, dispatch, handledOAuthCode]);


  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#19191a' : '#FFFFFF'} />
      <KeyboardSafeWrapper className="bg-white dark:bg-background-dark" contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="flex-1 px-6">
              <View className="mt-12 mb-2">
                <BackButton onPress={handleBack} />

                <Header title='Chào mừng trở lại! 👋' subtitle='Đăng nhập để khám phá hàng nghìn bất động sản' />
              </View>

              <View className="mb-6">
                <CustomInput
                  label="Số điện thoại"
                  placeholder="Nhập số điện thoại"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setPhoneHint(validatePhoneRealtime(text));
                    if (errors.phone) {
                      setErrors({ ...errors, phone: undefined });
                    }
                  }}
                  keyboardType="phone-pad"
                  icon="call-outline"
                  error={errors.phone || (phoneHint ?? undefined)}
                  maxLength={12}
                />

                <CustomInput
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  secureTextEntry={!showPassword}
                  icon="lock-closed-outline"
                  error={errors.password}
                  showPasswordToggle={true}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  className="self-end mb-6"
                  activeOpacity={0.7}
                >
                  <Text className="text-blue-600 text-sm font-semibold">
                    Quên mật khẩu?
                  </Text>
                </TouchableOpacity>

                <PrimaryButton
                  title="Đăng Nhập"
                  onPress={handleLogin}
                  disabled={!isFormValid || isRedirecting}
                  loading={loading || isRedirecting}
                  style={{ backgroundColor: !isFormValid || isRedirecting || loading ? '#D1D5DB' : '#2563EB' }}
                />

              </View>

              <View className="flex-row items-center mb-5">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="mx-4 text-gray-500 text-sm font-medium">
                  Hoặc tiếp tục với
                </Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>

              <View className="mb-8">
                <SocialLoginButton
                    title="Tiếp tục với Google"
                    bgColor="bg-white"
                    textColor="text-gray-700"
                    borderColor={true}
                    iconName="google"
                    iconLibrary="FontAwesome"
                    iconColor="#EA4335"
                    onPress={() => handleSocialLogin('Google')}
                    customIcon={
                      <Image
                        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                        style={{ width: 20, height: 20 }}
                        resizeMode="contain"
                      />
                    }
                  />

                <SocialLoginButton
                  iconName="facebook-square"
                  iconLibrary="FontAwesome"
                  title="Tiếp tục với Facebook"
                  bgColor="bg-blue-600"
                  textColor="text-white"
                  iconColor="#FFFFFF"
                  onPress={() => handleSocialLogin('Facebook')}
                />

                

              </View>

              <View className="flex-row justify-center mb-10">
                <Text className="text-gray-600 text-base">
                  Chưa có tài khoản?
                </Text>
                <TouchableOpacity
                  onPress={handleRegister}
                  activeOpacity={0.7}
                >
                  <Text className="text-blue-600 text-base font-semibold ml-1">
                    Đăng ký ngay
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onHide={hideToast}
        />
      </KeyboardSafeWrapper>
    </>
  );
};

export default LoginScreen;
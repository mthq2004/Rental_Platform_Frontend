import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import CustomInput from '@/components/CustomInput';
import SocialLoginButton from '@/components/SocialLoginButton';
import BackButton from '@/components/BackButton';
import { router } from 'expo-router';
import PrimaryButton from '@/components/PrimaryButton';
import Header from '@/components/auth/Header';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { login, resetMessage } from '@/store/slices/auth.slice';
import { Toast } from '@/components/Notification';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const dispatch = useAppDispatch();
  const { error, isAuth, loading, user, message } = useAppSelector((state) => state.auth);

  const validateForm = (): boolean => {
    const newErrors: { phone?: string; password?: string } = {};

    if (!phoneNumber) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (phoneNumber.length < 10) {
      newErrors.phone = 'Số điện thoại phải có ít nhất 10 số';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/[a-zA-Z]/.test(password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ cái';
    } else if (!/\d/.test(password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ số';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
    }

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

  const handleSocialLogin = (platform: string): void => {
    console.log('Đăng nhập bằng:', platform);
    // Xử lý đăng nhập mạng xã hội
  };

  const handleForgotPassword = (): void => {
    router.push("/(auth)/forgot-password")
  };

  const handleRegister = (): void => {
    router.push('/(auth)/register');
  };

  const isFormValid = phoneNumber.length >= 10 && password.length >= 6;

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
    showToast(message.message, 'success');

    setErrors({});
    setPassword('');
    setPhoneNumber('');

    setTimeout(() => {
      router.replace('/(tab)');
    }, 500);

  } else if (message.type === "eerror_loginr") {
    showToast(message.message, 'error');
  }

  dispatch(resetMessage());
}, [message, dispatch]);


  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                    if (errors.phone) {
                      setErrors({ ...errors, phone: undefined });
                    }
                  }}
                  keyboardType="phone-pad"
                  icon="call-outline"
                  error={errors.phone}
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
                  secureTextEntry={showPassword ? false : true}
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
                  disabled={!isFormValid}
                  loading={loading}
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
                  iconName="google"
                  iconLibrary="AntDesign"
                  title="Tiếp tục với Google"
                  bgColor="bg-white"
                  textColor="text-gray-700"
                  iconColor="#DB4437"
                  borderColor={true}
                  onPress={() => handleSocialLogin('Google')}
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

                <SocialLoginButton
                  iconName="apple"
                  iconLibrary="AntDesign"
                  title="Tiếp tục với Apple"
                  bgColor="bg-black"
                  textColor="text-white"
                  iconColor="#FFFFFF"
                  onPress={() => handleSocialLogin('Apple')}
                />

                <SocialLoginButton
                  iconName="wechat"
                  iconLibrary="AntDesign"
                  title="Tiếp tục với Zalo"
                  bgColor="bg-blue-500"
                  textColor="text-white"
                  iconColor="#FFFFFF"
                  onPress={() => handleSocialLogin('Zalo')}
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
          </ScrollView>
        </TouchableWithoutFeedback>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onHide={hideToast}
        />
      </KeyboardAvoidingView>
    </>
  );
};

export default LoginScreen;
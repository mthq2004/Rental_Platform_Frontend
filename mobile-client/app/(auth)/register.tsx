import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Keyboard,
} from 'react-native';
import { Ionicons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomInput from '@/components/CustomInput';
import SocialLoginButton from '@/components/SocialLoginButton';
import PrimaryButton from '@/components/PrimaryButton';
import BackButton from '@/components/BackButton';
import ValidationItem from '@/components/ValidationItem';
import Header from '@/components/auth/Header';
import OTPInput from '@/components/auth/OTPInput';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { otpVerified, register, requestOtp, resetMessage } from '@/store/slices/auth.slice';
import { Toast } from '@/components/Notification';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper';
import { validatePhone, validatePhoneRealtime, validateFullNameRealtime } from '@/utils/validation';
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';

type Step = 'phone' | 'otp' | 'profile';

interface PasswordValidation {
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const TimerComponent = ({ timer, onResend }: { timer: number; onResend: () => void }) => (
  <View className="items-center mb-8">
    {timer > 0 ? (
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={16} color="#6B7280" />
        <Text className="text-gray-600 text-sm ml-1">
          Gửi lại mã sau <Text className="font-semibold text-blue-600">{timer}s</Text>
        </Text>
      </View>
    ) : (
      <TouchableOpacity className="flex-row items-center" onPress={onResend}>
        <Ionicons name="refresh-outline" size={16} color="#2563EB" />
        <Text className="text-blue-600 text-sm font-semibold ml-1">
          Gửi lại mã OTP
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const RegisterFlow: React.FC = () => {
  useEnableFloatingKeyboard();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { error, isAuth, loading, user, message, verified, loadingOtp } = useAppSelector(state => state.auth)

  const [currentStep, setCurrentStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60);
  const [errors, setErrors] = useState<{
    phone?: string;
    fullName?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [nameHint, setNameHint] = useState<string | null>(null);

  const otpInputs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const passwordValidation: PasswordValidation = {
    hasMinLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const isFormValid = fullName.trim() && isPasswordValid && passwordsMatch;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep, timer]);

  const validatePhoneStep = (): boolean => {
    if (!phoneNumber) {
      setErrors({ phone: 'Vui lòng nhập số điện thoại' });
      return false;
    }
    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      setErrors({ phone: phoneErr });
      return false;
    }
    setErrors({});
    return true;
  };

  const handlePhoneSubmit = (): void => {
    Keyboard.dismiss();
    if (!validatePhoneStep()) return;
    dispatch(requestOtp(phoneNumber))

    setCurrentStep('otp');
  };

  const handleSocialLogin = (provider: string): void => {
    console.log(`Đăng ký với ${provider}`);
  };

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
      return;
    }

    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (index < otp.length - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number): void => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (): void => {
    Keyboard.dismiss();

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      showToast('Vui lòng nhập đủ 6 số OTP', 'error');
      return;
    }

    dispatch(
      otpVerified({
        phone: phoneNumber,
        otp: otpCode,
      })
    );
  };


  const handleResendOTP = (): void => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);

    dispatch(requestOtp(phoneNumber));
    showToast('Đã gửi lại mã OTP', 'success');
  };


  const validateProfile = (): boolean => {
    const newErrors: any = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (!isPasswordValid) {
      newErrors.password = 'Mật khẩu chưa đủ yêu cầu';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = (): void => {
    Keyboard.dismiss();
    if (!validateProfile()) return;

    dispatch(register({ phone: phoneNumber, fullName, password }))
  };

  const handleGoBack = (): void => {
    fadeAnim.setValue(0);
    if (currentStep === 'otp') {
      setCurrentStep('phone');
    } else if (currentStep === 'profile') {
      setCurrentStep('otp');
    }
  };

  const handleLogin = (): void => {
    router.replace("/(auth)/login")
  };

  useEffect(() => {
    if (!message) return;

    if (message.type === 'success') {
      showToast(message.message, 'success');

      if (verified && currentStep === 'otp') {
        setCurrentStep('profile');
        setOtp(['', '', '', '', '', '']);
      }
    }

    if (message.type === 'error') {
      showToast(message.message, 'error');
    }
    dispatch(resetMessage())
  }, [message, verified]);

  useEffect(() => {
    if (isAuth && user) {
      showToast('Đăng ký thành công 🎉', 'success');

      // Reset stack → không quay lại Register được
      router.replace('/(tab)');
    }
  }, [isAuth, user]);



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

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const renderPhoneStep = () => (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-6 pt-12 pb-8">
        <BackButton onPress={() => navigation.goBack()} />

        <Header
          title="Tạo tài khoản mới 🎉"
          subtitle="Đăng ký để khám phá hàng nghìn bất động sản"
        />

        <View className="mb-6">
          <CustomInput
            label="Số điện thoại"
            placeholder="VD: 0912345678"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              setPhoneHint(validatePhoneRealtime(text));
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            keyboardType="phone-pad"
            icon="call-outline"
            error={errors.phone || (phoneHint ?? undefined)}
            maxLength={12}
          />

          <PrimaryButton
            title="Tiếp tục"
            onPress={handlePhoneSubmit}
            disabled={phoneNumber.length < 10}
            loading={loading}
          />
        </View>

        <View className="flex-row items-center mb-5">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-4 text-gray-500 text-sm font-medium">Hoặc đăng ký với</Text>
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

        <View className="flex-row justify-center items-center mb-10">
          <Text className="text-gray-600 text-base">Đã có tài khoản? </Text>
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
            <Text className="text-blue-600 text-base font-semibold ml-1">
              Đăng nhập ngay
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <View className="px-6 pt-12 pb-8">
        <BackButton onPress={handleGoBack} />

        <Header
          title="Xác thực OTP"
          subtitle={`Mã xác thực đã được gửi đến\n${phoneNumber}`}
        />

        <OTPInput
          otp={otp}
          otpInputs={otpInputs}
          handleOtpChange={handleOtpChange}
          handleOtpKeyPress={handleOtpKeyPress}
        />

        <TimerComponent timer={timer} onResend={handleResendOTP} />

        <PrimaryButton
          title="Xác nhận"
          onPress={handleVerifyOTP}
          disabled={otp.join('').length !== 6 || loading}
          loading={loadingOtp}
        />

      </View>
    </Animated.View>
  );

  const renderProfileStep = () => (
    <Animated.View style={{ opacity: fadeAnim }} className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-12 pb-8">
          <BackButton onPress={handleGoBack} />

          <Header
            title="Hoàn tất đăng ký"
            subtitle="Vui lòng điền thông tin để hoàn tất"
          />

          <View className="mb-6">
            <CustomInput
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setNameHint(validateFullNameRealtime(text));
                if (errors.fullName) setErrors({ ...errors, fullName: undefined });
              }}
              icon="person-outline"
              error={errors.fullName || (nameHint ?? undefined)}
            />

            <CustomInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry={!showPassword}
              icon="lock-closed-outline"
              error={errors.password}
              showPasswordToggle={true}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            {password.length > 0 && (
              <View className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Text className="text-sm font-semibold text-gray-700 mb-3">
                  Yêu cầu mật khẩu:
                </Text>
                <ValidationItem
                  isValid={passwordValidation.hasMinLength}
                  text="Ít nhất 8 ký tự"
                />
                <ValidationItem
                  isValid={passwordValidation.hasLetter}
                  text="Ít nhất 1 chữ cái (a-z, A-Z)"
                />
                <ValidationItem
                  isValid={passwordValidation.hasNumber}
                  text="Ít nhất 1 chữ số (0-9)"
                />
                <ValidationItem
                  isValid={passwordValidation.hasSpecialChar}
                  text="Ít nhất 1 ký tự đặc biệt (!@#$%...)"
                />
              </View>
            )}

            <CustomInput
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: undefined });
              }}
              secureTextEntry={!showConfirmPassword}
              icon="lock-closed-outline"
              error={errors.confirmPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <PrimaryButton
              title="Hoàn tất đăng ký"
              onPress={handleRegister}
              disabled={!isFormValid}
              loading={loading}
            />
          </View>

          <View className="bg-gray-50 p-4 rounded-xl mb-10">
            <Text className="text-center text-xs text-gray-600 leading-5">
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <Text className="text-blue-600 font-semibold">Điều khoản sử dụng</Text>
              {' và '}
              <Text className="text-blue-600 font-semibold">Chính sách bảo mật</Text>
              {' của chúng tôi'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#19191a' : '#FFFFFF'} />
      <KeyboardSafeWrapper className="bg-white dark:bg-background-dark" contentContainerStyle={{ paddingBottom: 24 }}>
            {currentStep === 'phone' && renderPhoneStep()}
            {currentStep === 'otp' && renderOTPStep()}
            {currentStep === 'profile' && renderProfileStep()}

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

export default RegisterFlow;
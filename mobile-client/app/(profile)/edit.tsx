import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomDatePicker from "@/components/CustomDatePicker";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { getProfile, updateAvatar, updateProfile, requestPhoneUpdateOtp, verifyPhoneUpdateOtp, requestEmailVerificationOtp, verifyEmailOtp } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";
import { Toast } from "@/components/Notification";
import { resetMessage } from "@/store/slices/auth.slice";
import { useColorScheme } from "nativewind";
import { COLORS } from "@/utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, Shield, User, Camera, Fingerprint, X } from "lucide-react-native";
import { validatePhoneRealtime, validateEmailRealtime, validateFullNameRealtime, validatePhone, validateEmail, validateFullName, formatFullName } from "@/utils/validation";
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext';
import FloatingKeyboardBar from '@/components/common/FloatingKeyboardBar';
import SyncTextInput from "@/components/common/SyncTextInput";

const EditProfile = () => {
  useEnableFloatingKeyboard();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [avatar, setAvatar] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [nameHint, setNameHint] = useState<string | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpType, setOtpType] = useState<'phone' | 'email'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ phone?: string, email?: string, otherPayload?: any }>({});

  const isKycApproved = user?.kycStatus === 'approved' || user?.kycStatus === 'verified';

  const showToast = (message: string, type = 'success') => {
    setToast({ visible: true, message, type });
  };
  const hideToast = () => setToast(prev => ({ ...prev, visible: false }));

  const { message } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!message) return;
    if (message.type === "success_update") {
      showToast(message.message, 'success');
    } else if (message.type === "error_update") {
      showToast(message.message, 'error');
    }
    dispatch(resetMessage());
  }, [message, dispatch]);



  useEffect(() => {
    if (!user) return;
    setAvatar(user.avatarUrl || "");
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    const initialDob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
    setDateOfBirth(initialDob);
    setGender(user.gender || "");
  }, [user]);



  const doPickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      name: `avatar_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    };

    try {
      setError("");
      setAvatar(asset.uri);
      await dispatch(updateAvatar(file)).unwrap();
      await dispatch(getProfile()).unwrap();
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Cập nhật ảnh đại diện thất bại");
    }
  };

  const doTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Thông báo", "Bạn cần cấp quyền camera để chụp ảnh.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const file = {
      uri: asset.uri,
      name: `avatar_${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    };

    try {
      setError("");
      setAvatar(asset.uri);
      await dispatch(updateAvatar(file)).unwrap();
      await dispatch(getProfile()).unwrap();
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Cập nhật ảnh đại diện thất bại");
    }
  };

  const handleEditAvatar = () => {
    Alert.alert("Cập nhật ảnh", "Chọn cách", [
      { text: "Chụp ảnh", onPress: doTakePhoto },
      { text: "Chọn từ thư viện", onPress: doPickFromLibrary },
      { text: "Huỷ", style: "cancel" },
    ]);
  };

  const handleSaveProfile = async () => {
    setError("");

    const formattedName = formatFullName(fullName);
    setFullName(formattedName);

    const nameErr = validateFullName(formattedName);
    if (nameErr) {
      setError(nameErr);
      return;
    }

    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) {
        setError(phoneErr);
        return;
      }
    }

    if (email) {
      const emailErr = validateEmail(email);
      if (emailErr) {
        setError(emailErr);
        return;
      }
    }

    let normalizedDob = "";
    if (dateOfBirth) {
      const year = dateOfBirth.getFullYear();
      const month = `${dateOfBirth.getMonth() + 1}`.padStart(2, "0");
      const day = `${dateOfBirth.getDate()}`.padStart(2, "0");
      normalizedDob = `${year}-${month}-${day}`;
    }

    if (normalizedDob) {
      const parsedDob = new Date(normalizedDob);
      if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
        setError("Ngày sinh không hợp lệ");
        return;
      }
    }

    const payload: Record<string, any> = {
      fullName: fullName.trim(),
      gender: gender || null,
      dateOfBirth: normalizedDob || null,
    };

    const normalizedEmail = email.trim();
    const normalizedPhone = phone.trim();

    const phoneChanged = normalizedPhone && normalizedPhone !== user?.phone;
    const emailChanged = normalizedEmail && normalizedEmail !== user?.email;

    setPendingChanges({
      phone: phoneChanged ? normalizedPhone : undefined,
      email: emailChanged ? normalizedEmail : undefined,
      otherPayload: payload
    });

    if (phoneChanged) {
      try {
        await dispatch(requestPhoneUpdateOtp(normalizedPhone)).unwrap();
        setOtpType('phone');
        setOtpModalVisible(true);
      } catch (err: any) {
        setError(typeof err === "string" ? err : "Không thể gửi OTP cho số điện thoại");
      }
      return;
    }

    if (emailChanged) {
      try {
        await dispatch(requestEmailVerificationOtp(normalizedEmail)).unwrap();
        setOtpType('email');
        setOtpModalVisible(true);
      } catch (err: any) {
        setError(typeof err === "string" ? err : "Không thể gửi OTP cho email");
      }
      return;
    }

    // No phone/email changes
    try {
      await dispatch(updateProfile(payload as any)).unwrap();
      await dispatch(getProfile()).unwrap();
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Cập nhật thông tin thất bại");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      showToast('Vui lòng nhập mã OTP', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      if (otpType === 'phone') {
        await dispatch(verifyPhoneUpdateOtp({ phone: pendingChanges.phone!, otp: otpCode })).unwrap();

        // Success phone, check email
        if (pendingChanges.email) {
          await dispatch(requestEmailVerificationOtp(pendingChanges.email)).unwrap();
          setOtpType('email');
          setOtpCode('');
        } else {
          // No email change, save rest of profile
          if (Object.keys(pendingChanges.otherPayload).length > 0) {
            await dispatch(updateProfile(pendingChanges.otherPayload)).unwrap();
          }
          await dispatch(getProfile()).unwrap();
          setOtpModalVisible(false);
          setOtpCode('');
        }
      } else {
        await dispatch(verifyEmailOtp({ email: pendingChanges.email, otp: otpCode })).unwrap();

        // Success email, save rest of profile
        if (Object.keys(pendingChanges.otherPayload).length > 0) {
          await dispatch(updateProfile(pendingChanges.otherPayload)).unwrap();
        }
        await dispatch(getProfile()).unwrap();
        setOtpModalVisible(false);
        setOtpCode('');
      }
    } catch (err: any) {
      showToast(typeof err === "string" ? err : "Xác thực OTP thất bại", 'error');
    } finally {
      setOtpLoading(false);
    }
  };



  const genderLabel = (val: string) => {
    if (val === 'male') return 'Nam';
    if (val === 'female') return 'Nữ';
    if (val === 'other') return 'Khác';
    return '';
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-background-dark">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#19191a' : '#FFFFFF'} />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: isDark ? '#111827' : '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1F2937' : '#F3F4F6',
        zIndex: 1000
      }}>
        <View style={{ zIndex: 10 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#374151'} />
          </TouchableOpacity>
        </View>

        <View style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '700',
            color: isDark ? '#FFF' : '#111827',
            letterSpacing: -0.3
          }}>
            Chỉnh sửa trang cá nhân
          </Text>
        </View>

        <View style={{ width: 40, zIndex: 10 }} />
      </View>

      <KeyboardSafeWrapper
        className="bg-white dark:bg-background-dark"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleEditAvatar} activeOpacity={0.8} style={styles.avatarTouchable}>
            <View style={styles.avatarRing}>
              {avatar && avatar !== "https://i.pravatar.cc/300" ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <User size={40} color="#9CA3AF" />
                </View>
              )}
            </View>
            {/* Camera badge */}
            <View style={[styles.cameraBadge, { backgroundColor: COLORS.primary }]}>
              <Camera size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3">
            Thay đổi ảnh đại diện
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <CustomInput
            label="Họ và tên"
            placeholder="Nhập họ và tên"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setNameHint(validateFullNameRealtime(text));
            }}
            onBlur={() => {
              const formatted = formatFullName(fullName);
              setFullName(formatted);
              setNameHint(validateFullNameRealtime(formatted));
            }}
            icon="person-outline"
            error={nameHint ?? undefined}
          />

          {/* Phone */}
          <CustomInput
            label="Số điện thoại"
            placeholder="VD: 0912345678"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setPhoneHint(validatePhoneRealtime(text));
            }}
            keyboardType="phone-pad"
            icon="call-outline"
            maxLength={12}
            error={phoneHint ?? undefined}
          />

          {/* Email */}
          <CustomInput
            label="Email"
            placeholder="VD: example@gmail.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailHint(validateEmailRealtime(text));
            }}
            keyboardType="email-address"
            icon="mail-outline"
            error={emailHint ?? undefined}
          />

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel} className="text-gray-500 dark:text-gray-400">Giới tính</Text>
            <View style={styles.genderRow}>
              {[
                { label: "Nam", value: "male" },
                { label: "Nữ", value: "female" },
                { label: "Khác", value: "other" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.genderChip,
                    {
                      backgroundColor: gender === item.value
                        ? (isDark ? 'rgba(0,64,209,0.2)' : '#eff6ff')
                        : (isDark ? '#1f2937' : '#f9fafb'),
                      borderColor: gender === item.value ? COLORS.primary : (isDark ? '#374151' : '#e5e7eb'),
                    },
                  ]}
                  onPress={() => setGender(item.value as "male" | "female" | "other")}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: gender === item.value ? COLORS.primary : (isDark ? '#d1d5db' : '#6b7280'),
                      fontWeight: gender === item.value ? '600' : '400',
                      fontSize: 14,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date of Birth */}
          <CustomDatePicker
            label="Ngày sinh"
            placeholder="Chọn ngày sinh"
            value={dateOfBirth}
            onChange={setDateOfBirth}
            icon="calendar-outline"
            maximumDate={new Date()}
          />

          {/* eKYC / Verification Badge */}
          {isKycApproved ? (
            <View style={[styles.verificationBadge, { backgroundColor: isDark ? '#042f2e' : '#f0fdfa' }]}>
              <View style={[styles.verificationIcon, { backgroundColor: isDark ? '#065f46' : '#ccfbf1' }]}>
                <CheckCircle size={18} color="#0d9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">
                  Tài khoản đã xác thực
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
                  Thông tin cá nhân của bạn đã được xác minh qua CMND/CCCD để đảm bảo tin cậy trên nền tảng.
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(profile)/ekyc' as any)}
              style={[styles.verificationBadge, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}
              activeOpacity={0.7}
            >
              <View style={[styles.verificationIcon, { backgroundColor: isDark ? '#3730a3' : '#c7d2fe' }]}>
                <Fingerprint size={18} color="#6366f1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">
                  Xác thực danh tính (eKYC)
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
                  Xác minh CMND/CCCD để đăng tin và tăng độ tin cậy của bạn.
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Error */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={!fullName.trim() || loading}
            style={[
              styles.saveButton,
              {
                backgroundColor: !fullName.trim() || loading ? '#9CA3AF' : COLORS.primary,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            activeOpacity={0.85}
          >
            <Shield size={18} color="#fff" />
            <Text style={styles.saveButtonText}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardSafeWrapper>

      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: 20, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? 'rgba(37,99,235,0.2)' : '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Shield size={32} color={COLORS.primary} />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#f9fafb' : '#111827', marginBottom: 8, textAlign: 'center' }}>
              Xác thực OTP
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Mã xác thực đã được gửi đến {otpType === 'phone' ? 'số điện thoại' : 'email'} của bạn. Vui lòng nhập mã để tiếp tục.
            </Text>

            <SyncTextInput
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Nhập mã 6 chữ số"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                width: '100%',
                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                borderRadius: 12,
                padding: 16,
                fontSize: 18,
                fontWeight: '600',
                letterSpacing: 4,
                textAlign: 'center',
                color: isDark ? '#f9fafb' : '#111827',
                marginBottom: 24,
                borderWidth: 1,
                borderColor: isDark ? '#4b5563' : '#e5e7eb'
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setOtpModalVisible(false)}
                style={{ flex: 1, paddingVertical: 14, backgroundColor: isDark ? '#374151' : '#F3F4F6', borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '700', color: isDark ? '#d1d5db' : '#4b5563' }}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={otpCode.length !== 6 || otpLoading}
                style={{ flex: 1, paddingVertical: 14, backgroundColor: otpCode.length !== 6 || otpLoading ? '#9CA3AF' : COLORS.primary, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {otpLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
                <Text style={{ fontWeight: '700', color: '#fff' }}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FloatingKeyboardBar />
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 15,
  },
  fieldInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  genderChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  verificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default EditProfile;

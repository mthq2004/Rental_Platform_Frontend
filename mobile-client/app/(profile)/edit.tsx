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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import CustomInput from "@/components/CustomInput";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { getProfile, updateAvatar, updateProfile } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";
import { Toast } from "@/components/Notification";
import { resetMessage } from "@/store/slices/auth.slice";
import { useColorScheme } from "nativewind";
import { COLORS } from "@/utils/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle, Shield, User, Camera, Fingerprint } from "lucide-react-native";
import { validatePhoneRealtime, validateEmailRealtime, validateFullNameRealtime, validatePhone, validateEmail, validateFullName, formatFullName } from "@/utils/validation";

const EditProfile = () => {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [avatar, setAvatar] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [error, setError] = useState("");
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [nameHint, setNameHint] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const pickerValue = useMemo(() => {
    if (!dateOfBirth) {
      return new Date(2000, 0, 1);
    }
    const parsed = new Date(dateOfBirth);
    return Number.isNaN(parsed.getTime()) ? new Date(2000, 0, 1) : parsed;
  }, [dateOfBirth]);

  useEffect(() => {
    if (!user) return;
    setAvatar(user.avatarUrl || "https://i.pravatar.cc/300");
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setDateOfBirth(user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "");
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

    const normalizedDob = dateOfBirth.trim();
    if (normalizedDob) {
      const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!dobPattern.test(normalizedDob)) {
        setError("Ngày sinh phải đúng định dạng YYYY-MM-DD");
        return;
      }
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
    if (normalizedEmail) payload.email = normalizedEmail;
    const normalizedPhone = phone.trim();
    if (normalizedPhone) payload.phone = normalizedPhone;

    try {
      await dispatch(updateProfile(payload as any)).unwrap();
      await dispatch(getProfile()).unwrap();
    } catch (err: any) {
      setError(typeof err === "string" ? err : "Cập nhật thông tin thất bại");
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setDateOfBirth(formatDate(selectedDate));
    }
    if (event.type === "set") {
      setShowDatePicker(false);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#1f2937'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.primary }]}>
          Chỉnh sửa trang cá nhân
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardSafeWrapper
        className="bg-white dark:bg-background-dark"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleEditAvatar} activeOpacity={0.8} style={styles.avatarTouchable}>
            <View style={styles.avatarRing}>
              {avatar ? (
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
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel} className="text-gray-500 dark:text-gray-400">Họ và tên</Text>
            <View style={[styles.fieldInput, { borderColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' }]}>
              <Text
                style={[styles.fieldValue, { color: isDark ? '#f9fafb' : '#1f2937' }]}
                numberOfLines={1}
              >
                {fullName || 'Chưa cập nhật'}
              </Text>
            </View>
            <CustomInput
              label=""
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
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel} className="text-gray-500 dark:text-gray-400">Số điện thoại</Text>
            <CustomInput
              label=""
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
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel} className="text-gray-500 dark:text-gray-400">Email</Text>
            <CustomInput
              label=""
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
          </View>

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
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel} className="text-gray-500 dark:text-gray-400">Ngày sinh</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePickerButton, { borderColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' }]}
            >
              <Text style={{ color: dateOfBirth ? (isDark ? '#f9fafb' : '#1f2937') : '#9ca3af', fontSize: 15 }}>
                {dateOfBirth ? formatDisplayDate(dateOfBirth) : 'Chọn ngày sinh'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            </Pressable>

            {showDatePicker ? (
              <View style={[styles.datePickerContainer, { borderColor: isDark ? '#374151' : '#e5e7eb', backgroundColor: isDark ? '#1f2937' : '#fff' }]}>
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={[styles.datePickerDone, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Xong</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

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
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
    display: 'none', // hidden, we use CustomInput
  },
  fieldValue: {
    fontSize: 15,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  datePickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  datePickerDone: {
    paddingVertical: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  verificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default EditProfile;

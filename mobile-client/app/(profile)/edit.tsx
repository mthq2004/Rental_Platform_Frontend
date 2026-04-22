import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import BackButton from "@/components/BackButton";
import CustomInput from "@/components/CustomInput";
import PrimaryButton from "@/components/PrimaryButton";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { getProfile, updateAvatar, updateProfile } from "@/store/slices/auth.slice";
import KeyboardSafeWrapper from "@/components/KeyboardSafeWrapper";

const EditProfile = () => {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  const [avatar, setAvatar] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [error, setError] = useState("");

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const pickerValue = useMemo(() => {
    if (!dateOfBirth) {
      return new Date(2000, 0, 1);
    }

    const parsed = new Date(dateOfBirth);
    return Number.isNaN(parsed.getTime()) ? new Date(2000, 0, 1) : parsed;
  }, [dateOfBirth]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setAvatar(user.avatarUrl || "https://i.pravatar.cc/300");
    setFullName(user.fullName || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setDateOfBirth(user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "");
    setGender(user.gender || "");
  }, [user]);

  const joinDateText = useMemo(() => {
    if (!user?.createdAt) {
      return "";
    }
    return `Tham gia từ ${new Date(user.createdAt).toLocaleDateString("vi-VN")}`;
  }, [user?.createdAt]);

  const doPickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

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

    if (result.canceled) {
      return;
    }

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

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ và tên");
      return;
    }

    if (phone && phone.length < 10) {
      setError("Số điện thoại không hợp lệ");
      return;
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
    if (normalizedEmail) {
      payload.email = normalizedEmail;
    }

    const normalizedPhone = phone.trim();
    if (normalizedPhone) {
      payload.phone = normalizedPhone;
    }

    try {
      await dispatch(updateProfile(payload as any)).unwrap();

      await dispatch(getProfile()).unwrap();
      router.back();
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

  return (
    <View className="flex-1 bg-white dark:bg-background-dark">
      <KeyboardSafeWrapper
        className="bg-white dark:bg-background-dark"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
          <View className="px-6 pt-16">
            <BackButton onPress={() => router.back()} />

            <Text className="text-2xl font-bold text-gray-900 dark:text-foreground-dark mt-4">
              Chỉnh sửa thông tin
            </Text>

            <View className="items-center mt-6 mb-6">
              <View className="relative">
                <Image
                  source={{ uri: avatar || "https://i.pravatar.cc/300" }}
                  className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-600"
                />

                <TouchableOpacity
                  onPress={handleEditAvatar}
                  className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
                >
                  <Feather name="edit-2" size={16} color="white" />
                </TouchableOpacity>
              </View>

              {joinDateText ? (
                <Text className="text-gray-500 dark:text-gray-300 mt-3">{joinDateText}</Text>
              ) : null}
            </View>

            <CustomInput
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChangeText={setFullName}
              icon="person-outline"
            />

            <CustomInput
              label="Email"
              placeholder="Nhập email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="mail-outline"
            />

            <CustomInput
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="call-outline"
            />

            <CustomInput
              label="Ngày sinh (YYYY-MM-DD)"
              placeholder="VD: 2000-01-01"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              icon="calendar-outline"
              editable={true}
            />

            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="mb-5 -mt-2 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 flex-row items-center justify-between bg-gray-50 dark:bg-gray-800"
            >
              <Text className={`text-base ${dateOfBirth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {dateOfBirth || 'Nhấn để chọn ngày sinh'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
            </Pressable>

            {showDatePicker ? (
              <View className="mb-5 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                <DateTimePicker
                  value={pickerValue}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="py-2 border-t border-gray-200 dark:border-gray-700"
                >
                  <Text className="text-center text-blue-600 font-semibold">Xong</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text className="text-sm font-semibold text-gray-800 dark:text-foreground-dark mb-2">Giới tính</Text>
            <View className="flex-row gap-2 mb-6">
              {[
                { label: "Nam", value: "male" },
                { label: "Nữ", value: "female" },
                { label: "Khác", value: "other" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  className={`px-4 py-3 rounded-xl border ${
                    gender === item.value
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
                  }`}
                  onPress={() => setGender(item.value as "male" | "female" | "other")}
                >
                  <Text
                    className={
                      gender === item.value
                        ? "text-blue-700 dark:text-blue-200 font-semibold"
                        : "text-gray-700 dark:text-gray-200"
                    }
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text className="text-red-500 text-sm mb-4">{error}</Text> : null}

            <PrimaryButton
              title="Lưu thay đổi"
              onPress={handleSaveProfile}
              loading={loading}
              disabled={!fullName.trim()}
            />
          </View>
      </KeyboardSafeWrapper>
    </View>
  );
};

export default EditProfile;

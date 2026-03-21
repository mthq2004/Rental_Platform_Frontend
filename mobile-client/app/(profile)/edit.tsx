import { View, Text, Image, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

const EditProfile = () => {

  const [avatar, setAvatar] = useState(
    "https://i.pravatar.cc/300"
  );

  const [followers, setFollowers] = useState(120);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwner = false; // giả lập chủ profile

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleEditAvatar = () => {
    Alert.alert("Cập nhật ảnh", "Chọn cách", [
      { text: "Chụp ảnh", onPress: takePhoto },
      { text: "Chọn từ thư viện", onPress: pickImage },
      { text: "Huỷ", style: "cancel" },
    ]);
  };

  const toggleFollow = () => {
    if (isFollowing) {
      setFollowers(followers - 1);
    } else {
      setFollowers(followers + 1);
    }

    setIsFollowing(!isFollowing);
  };

  return (
    <View className="flex-1 bg-white">

      {/* HEADER */}
      <View className="items-center mt-16">

        <View className="relative">

          <Image
            source={{ uri: avatar }}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />

          {isOwner && (
            <TouchableOpacity
              onPress={handleEditAvatar}
              className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
            >
              <Feather name="edit-2" size={16} color="white" />
            </TouchableOpacity>
          )}

        </View>

        {/* NAME */}
        <Text className="text-2xl font-bold mt-4">
          Nguyễn Văn A
        </Text>

        {/* JOIN DATE */}
        <Text className="text-gray-500 mt-1">
          Tham gia từ 2022
        </Text>

      </View>

      {/* FOLLOWERS */}
      <View className="flex-row justify-center mt-8">

        <View className="items-center mx-6">
          <Text className="text-xl font-bold">{followers}</Text>
          <Text className="text-gray-500">Người theo dõi</Text>
        </View>

        <View className="items-center mx-6">
          <Text className="text-xl font-bold">32</Text>
          <Text className="text-gray-500">Đang theo dõi</Text>
        </View>

      </View>

      {/* FOLLOW BUTTON */}
      {!isOwner && (
        <View className="items-center mt-8">

          <TouchableOpacity
            onPress={toggleFollow}
            className={`px-10 py-3 rounded-full ${
              isFollowing ? "bg-gray-300" : "bg-blue-500"
            }`}
          >
            <Text className="text-white font-semibold">
              {isFollowing ? "Đang theo dõi" : "Theo dõi"}
            </Text>
          </TouchableOpacity>

        </View>
      )}

      {/* INFO CARD */}
      <View className="mx-6 mt-10 bg-gray-50 p-5 rounded-2xl shadow">

        <Text className="text-lg font-bold mb-3">
          Thông tin
        </Text>

        <Text className="text-gray-600 mb-2">
          📍 Thành phố Hồ Chí Minh
        </Text>

        <Text className="text-gray-600 mb-2">
          🏠 12 Bất động sản đang cho thuê
        </Text>

        <Text className="text-gray-600">
          ⭐ Đánh giá trung bình: 4.8
        </Text>

      </View>

    </View>
  );
};

export default EditProfile;
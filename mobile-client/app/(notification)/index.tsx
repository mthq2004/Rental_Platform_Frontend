import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const NotificationScreen = () => {
  return (
    <View className="flex-1 bg-gray-100 items-center justify-center px-6">
      
      {/* Card */}
      <View className="bg-white w-full rounded-3xl p-8 items-center shadow-lg">
        
        {/* Icon */}
        <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
          <Ionicons name="notifications-outline" size={40} color="#2563EB" />
        </View>

        {/* Title */}
        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
          Chưa có thông báo
        </Text>

        {/* Description */}
        <Text className="text-gray-500 text-center leading-6 mb-6">
          Hiện tại bạn chưa có thông báo nào.
          Mọi cập nhật mới sẽ được hiển thị tại đây.
        </Text>

        {/* Button */}
        <TouchableOpacity
          onPress={() => router.replace('/(tab)')}
          className="bg-blue-500 px-6 py-3 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold">
            Quay về trang chủ
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotificationScreen;

import { useThemeColors } from '@/utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, useColorScheme, Switch } from 'react-native';

const NotificationSettingsScreen = () => {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === 'dark';

  const [settings, setSettings] = useState({
    push: true,
    email: false,
    sms: false,
    newMessages: true,
    propertyUpdates: true,
    promotions: false
  });

  const toggleSwitch = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSettingRow = (title: string, subtitle: string, key: keyof typeof settings) => (
    <View className="flex-row items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
      <View className="flex-1 pr-4">
        <Text className="text-base font-semibold text-foreground dark:text-foreground-dark mb-1">
          {title}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSwitch(key)}
        trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
        thumbColor={settings[key] ? '#ffffff' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.current.background}
      />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700 mt-12 gap-3">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color={colors.current.icon} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Cài đặt thông báo
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 pt-2">
        <View className="mb-6 mt-4">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">
            Phương thức nhận
          </Text>
          <View className="bg-white dark:bg-secondary-dark rounded-2xl px-4">
            {renderSettingRow('Thông báo đẩy (Push)', 'Nhận thông báo trực tiếp trên thiết bị', 'push')}
            {renderSettingRow('Email', 'Nhận email tóm tắt các hoạt động quan trọng', 'email')}
            {renderSettingRow('SMS', 'Nhận tin nhắn SMS cho cảnh báo bảo mật', 'sms')}
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Loại thông báo
          </Text>
          <View className="bg-white dark:bg-secondary-dark rounded-2xl px-4">
            {renderSettingRow('Tin nhắn mới', 'Khi có người nhắn tin hoặc trả lời bạn', 'newMessages')}
            {renderSettingRow('Bất động sản', 'Cập nhật về tin đăng của bạn hoặc bất động sản đã lưu', 'propertyUpdates')}
            {renderSettingRow('Khuyến mãi & Ưu đãi', 'Nhận thông tin về các chương trình ưu đãi mới nhất', 'promotions')}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationSettingsScreen;

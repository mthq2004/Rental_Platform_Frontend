import { useThemeColors } from '@/utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, useColorScheme, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#FFF' }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.current.background}
      />

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
          <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full active:bg-gray-200 dark:active:bg-gray-700">
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
            Cài đặt thông báo
          </Text>
        </View>

        <View style={{ width: 40, zIndex: 10 }} />
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
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;

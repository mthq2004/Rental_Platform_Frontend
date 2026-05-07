import { Text, View, TouchableOpacity, TextInput, Modal } from 'react-native';
import React, { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatHeaderProps {
  title: string;
  onSearch?: (text: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onSearch }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const iconColor = isDark ? '#d1d5db' : '#4b5563';

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const menuItems = [
    { icon: 'category', label: 'Quản lý phân loại', route: '/(chat)/category-management' },
    { icon: 'check-box', label: 'Chọn nhiều hội thoại', route: null },
    { icon: 'visibility-off', label: 'Hội thoại bị ẩn', route: '/(chat)/hidden-conversations' },
  ];

  return (
    <>
      <View
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
        }}
      >
        {/* Title Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: isDark ? '#f9fafb' : '#111827',
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={() => setMenuVisible(!menuVisible)}
              style={{
                width: 34, height: 34, borderRadius: 17,
                borderWidth: 0.5, borderColor: isDark ? '#4b5563' : '#e5e7eb',
                backgroundColor: isDark ? '#374151' : '#f9fafb',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: isDark ? '#4b5563' : '#e5e7eb',
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="search" size={16} color="#9ca3af" />
          <TextInput
            style={{
              flex: 1,
              fontSize: 14,
              color: isDark ? '#f9fafb' : '#111827',
            }}
            placeholder="Tìm kiếm hội thoại..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/30"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              position: 'absolute',
              right: 16,
              top: insets.top + 56,
              backgroundColor: isDark ? '#374151' : '#ffffff',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              width: 260,
              overflow: 'hidden',
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: index < menuItems.length - 1 ? 0.5 : 0,
                  borderBottomColor: isDark ? '#4b5563' : '#f3f4f6',
                }}
                onPress={() => {
                  setMenuVisible(false)
                  if (item.route) {
                    router.push(item.route as any)
                  }
                }}
              >
                <MaterialIcons name={item.icon as any} size={20} color={isDark ? '#d1d5db' : '#4b5563'} />
                <Text style={{ marginLeft: 12, fontSize: 14, color: isDark ? '#f9fafb' : '#374151' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ChatHeader;
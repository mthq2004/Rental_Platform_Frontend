import { Text, View, TouchableOpacity, TextInput, Modal } from 'react-native';
import React, { useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ChatHeaderProps {
  title: string;
  onSearch?: (text: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onSearch }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const menuItems = [
    { icon: 'category', label: 'Quản lý phân loại' },
    { icon: 'reply', label: 'Cài đặt trả lời tự động' },
    { icon: 'flash-on', label: 'Quản lý tin nhắn nhanh' },
    { icon: 'check-box', label: 'Chọn nhiều hội thoại' },
    { icon: 'visibility-off', label: 'Hội thoại bị ẩn' },
  ];

  return (
    <>
      <View className="bg-white px-4 py-3 border-b border-gray-200 pt-16">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-800">{title}</Text>
          <View className="flex-row">
            <TouchableOpacity
              className="p-2"
              onPress={() => setSearchVisible(!searchVisible)}
            >
              <Ionicons name="search" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              className="p-2"
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <MaterialIcons name="more-vert" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {searchVisible && (
        <View className="bg-white px-4 py-2 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              className="flex-1 ml-2 text-base text-gray-800"
              placeholder="Tìm kiếm hội thoại..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearchChange}
            />
          </View>
        </View>
      )}

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
          <View className="absolute right-4 top-28 bg-white rounded-lg shadow-lg w-64 overflow-hidden">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center px-4 py-3 ${
                  index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={() => {
                  setMenuVisible(false)
                  router.push("/category-management")
                }}
              >
                <MaterialIcons name={item.icon as any} size={20} color="#333" />
                <Text className="ml-3 text-base text-gray-800">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default ChatHeader;
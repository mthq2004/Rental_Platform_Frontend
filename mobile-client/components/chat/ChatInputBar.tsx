import { Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onSendImage?: () => void;
  onSendLocation?: () => void;
  onShowAttachments?: () => void;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onSendImage,
  onSendLocation,
  onShowAttachments,
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <View className="bg-white px-4 py-3 border-t border-gray-200">
      <View className="flex-row items-center">
        <TouchableOpacity
          className="p-2 mr-1"
          onPress={onShowAttachments}
        >
          <Ionicons name="add-circle-outline" size={28} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2 mr-1"
          onPress={onSendImage}
        >
          <Ionicons name="image-outline" size={24} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2 mr-2"
          onPress={onSendLocation}
        >
          <Ionicons name="location-outline" size={24} color="#2196F3" />
        </TouchableOpacity>

        <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2">
          <TextInput
            className="text-base text-gray-800"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          className="bg-blue-500 rounded-full w-10 h-10 items-center justify-center"
          onPress={handleSend}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInputBar;
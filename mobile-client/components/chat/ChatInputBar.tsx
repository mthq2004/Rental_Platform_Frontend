import { Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onSendImage?: () => void;
  onSendLocation?: () => void;
  onShowAttachments?: () => void;
  canSend?: boolean
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onSendImage,
  onSendLocation,
  onShowAttachments,
  canSend = false
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!canSend && !message.trim()) return;

    onSendMessage(message.trim());
    setMessage('');
  };

  return (
    <View className="bg-white dark:bg-secondary-dark px-4 py-3 border-t border-gray-200 dark:border-gray-700">
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

        <View className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 mr-2">
          <TextInput
            className="text-base text-gray-800 dark:text-gray-100"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          disabled={!message.trim() && !canSend}
          className={`rounded-full w-10 h-10 items-center justify-center ${message.trim() || canSend
              ? 'bg-blue-500'
              : 'bg-gray-300'
            }`}
          onPress={handleSend}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatInputBar;
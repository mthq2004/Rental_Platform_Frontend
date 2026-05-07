import { Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  onSendImage?: () => void;
  onSendFile?: () => void;
  onEmojiPress?: () => void;
  onShowAttachments?: () => void;
  canSend?: boolean;
  text?: string;
  onTextChange?: (text: string) => void;
}

const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  onSendImage,
  onSendFile,
  onEmojiPress,
  onShowAttachments,
  canSend = false,
  text = '',
  onTextChange
}) => {
  const handleSend = () => {
    if (!canSend && !text.trim()) return;

    onSendMessage(text.trim());
  };

  return (
    <View className="bg-white dark:bg-[#1a1a1a] px-3 py-2 border-t border-gray-200 dark:border-gray-800 flex-row items-end">
      {/* Icon Sticker / Emoji */}
      <TouchableOpacity className="p-2 mb-0.5" activeOpacity={0.7} onPress={onEmojiPress}>
        <Ionicons name="happy-outline" size={28} color="#6b7280" />
      </TouchableOpacity>

      {/* Input Field */}
      <TextInput
        className="flex-1 ml-2 mr-1 py-2.5 text-[17px] text-gray-900 dark:text-gray-100"
        placeholder="Tin nhắn"
        placeholderTextColor="#9ca3af"
        value={text}
        onChangeText={onTextChange}
        multiline
        maxLength={1000}
        style={{
          maxHeight: 120, // Allow expansion up to a point
        }}
      />

      {/* Right Icons or Send Button */}
      {text.trim() || canSend ? (
        <TouchableOpacity
          className="p-2 ml-1 mb-0.5"
          activeOpacity={0.7}
          onPress={handleSend}
        >
          <Ionicons name="send" size={26} color="#0068ff" />
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center mb-0.5">
          <TouchableOpacity className="p-2" activeOpacity={0.7} onPress={onShowAttachments}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity className="p-2" activeOpacity={0.7} onPress={onSendFile}>
            <Ionicons name="document-outline" size={28} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity className="p-2" activeOpacity={0.7} onPress={onSendImage}>
            <Ionicons name="image-outline" size={28} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ChatInputBar;
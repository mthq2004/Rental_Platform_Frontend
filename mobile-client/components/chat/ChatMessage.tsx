import { Text, View, Image, TouchableWithoutFeedback } from 'react-native';
import React, { useState } from 'react';
import { Message } from '@/types/message.type';
import MessageContextMenu from './MessageContextMenu';

interface ChatMessageProps {
  message: Message;
  isMe: boolean;
  time: string;
  onReaction?: (messageId: string, reaction: string) => void;
  onAction?: (messageId: string, action: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isMe,
  time,
  onReaction,
  onAction,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleLongPress = () => {
    setMenuVisible(true);
  };

  const handleReaction = (key: string) => {
    onReaction?.(message.id, key);
  };

  const handleAction = (key: string) => {
    onAction?.(message.id, key);
  };

  const MessageBubble = () => {
    if (message.isDeleted) {
      return (
        <View className="max-w-[75%] rounded-2xl px-4 py-2 bg-gray-100 border border-gray-200">
          <Text className="text-sm text-gray-400 italic">Tin nhắn đã bị xóa</Text>
        </View>
      );
    }

    return (
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isMe ? 'bg-blue-500' : 'bg-white border border-gray-200'
        }`}
      >
        {message.replyTo && (
          <View
            className={`mb-2 px-3 py-2 rounded-lg border-l-4 ${
              isMe ? 'bg-blue-400 border-blue-200' : 'bg-gray-100 border-gray-400'
            }`}
          >
            <Text className={`text-xs font-semibold ${isMe ? 'text-white' : 'text-gray-600'}`}>
              {message.replyTo.senderId === message.senderId ? 'Bạn' : 'Người kia'}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-sm ${isMe ? 'text-white' : 'text-gray-700'} ${
                message.replyTo.isDeleted ? 'italic' : ''
              }`}
            >
              {message.replyTo.isDeleted
                ? 'Tin nhắn đã bị xóa'
                : message.replyTo.content ?? message.replyTo.messageType}
            </Text>
          </View>
        )}

        {message.messageType === 'IMAGE' && message.fileUrl && (
          <Image
            source={{ uri: message.fileUrl }}
            style={{ width: message.width ?? 192, height: message.height ?? 192 }}
            className="rounded-lg mb-2"
            resizeMode="cover"
          />
        )}

        {message.messageType === 'VIDEO' && message.thumbnailUrl && (
          <View className="relative mb-2">
            <Image
              source={{ uri: message.thumbnailUrl }}
              style={{ width: message.width ?? 192, height: message.height ?? 192 }}
              className="rounded-lg"
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black/50 w-12 h-12 rounded-full items-center justify-center">
                <Text className="text-white text-xl">▶</Text>
              </View>
            </View>
            {message.duration && (
              <Text className="text-xs text-white absolute bottom-1 right-2">
                {Math.floor(message.duration / 60)}:{String(message.duration % 60).padStart(2, '0')}
              </Text>
            )}
          </View>
        )}

        {message.messageType === 'FILE' && (
          <View className="flex-row items-center bg-gray-100 p-3 rounded-lg mb-2 gap-2">
            <Text className="text-2xl">📎</Text>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                {message.fileName ?? 'Tệp đính kèm'}
              </Text>
              {message.fileSize && (
                <Text className="text-xs text-gray-500">
                  {(message.fileSize / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          </View>
        )}

        {message.messageType === 'TEXT' && (
          <Text className={`text-base ${isMe ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={350}>
        <View className={`mb-3 ${isMe ? 'items-end' : 'items-start'}`}>
          <MessageBubble />

          <View className="flex-row items-center gap-1 mt-1">
            <Text className="text-xs text-gray-500">{time}</Text>
            {isMe && (
              <Text className="text-xs text-gray-400">
                {message.isDelivered ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <MessageContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onReaction={handleReaction}
        onAction={handleAction}
        messagePreview={<MessageBubble />}
      />
    </>
  );
};

export default ChatMessage;
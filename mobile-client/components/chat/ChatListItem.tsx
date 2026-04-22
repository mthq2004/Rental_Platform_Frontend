import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Conversation } from '@/types/conversation.type';
import { useAppSelector } from '@/store/hook';

interface ChatListItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
}

const formatTime = (isoString: string | null): string => {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày`;

  return date.toLocaleDateString('vi-VN');
};

const getInitials = (id: string) => id.slice(0, 2).toUpperCase();

const getAvatarColor = (id: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  return colors[id.charCodeAt(0) % colors.length];
};

const getLastMessagePreview = (conversation: Conversation) => {
  const msg = conversation.lastMessage;

  if (!msg) return 'Chưa có tin nhắn';

  if (!msg.content) {
    switch (msg.type) {
      case 'IMAGE':
        return '🖼 Hình ảnh';
      case 'FILE':
        return '📎 Tệp đính kèm';
      case 'AUDIO':
        return '🎤 Tin nhắn thoại';
      default:
        return 'Tin nhắn';
    }
  }

  return msg.content;
};

const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  onPress,
}) => {
  const categories = conversation.categories ?? [];
  const lastMessage = getLastMessagePreview(conversation);
  const timeDisplay = formatTime(conversation.lastMessage?.createdAt ?? null);
  const { user } = useAppSelector(state => state.auth)

  const isMe = conversation.lastMessage?.senderId === user?.id;

  return (
    <Pressable
      onPress={() => onPress(conversation)}
      className="flex-row px-4 py-3 bg-white dark:bg-secondary-dark border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700"
    >
      <View className="mr-3">
        <View
          className={`w-14 h-14 rounded-full ${getAvatarColor(
            conversation.participant.id
          )} items-center justify-center`}
        >
          <Text className="text-white text-lg font-bold">
            {getInitials(conversation.participant.fullName)}
          </Text>
        </View>
      </View>

      <View className="flex-1">
        {categories.length > 0 && (
          <View className="flex-row flex-wrap mb-1">
            {categories.slice(0, 3).map((cat) => (
              <View
                key={cat.id}
                style={{
                  backgroundColor: `${cat.color}20`,
                  borderColor: cat.color,
                }}
                className="flex-row items-center px-2 py-[2px] rounded-full border mr-1 mb-1"
              >
                <Text
                  style={{ color: cat.color }}
                  className="text-[10px] mr-1"
                >
                  🏷
                </Text>
                <Text
                  style={{ color: cat.color }}
                  className="text-[10px] font-medium"
                >
                  {cat.name}
                </Text>
              </View>
            ))}

            {categories.length > 3 && (
              <Text className="text-[10px] text-gray-400 self-center">
                +{categories.length - 3}
              </Text>
            )}
          </View>
        )}

        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold text-gray-900 dark:text-foreground-dark">
            {conversation.participant.fullName}
          </Text>

          <View className="flex-row items-center gap-1">
            {conversation.isPinned && (
              <Text className="text-xs text-gray-400">📌</Text>
            )}
            <Text className="text-xs text-gray-500 dark:text-gray-400">{timeDisplay}</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text
            numberOfLines={1}
            className={`flex-1 text-sm ${conversation.unreadCount > 0
                ? 'text-gray-900 dark:text-foreground-dark font-semibold'
                : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            {isMe && 'Bạn: '}{lastMessage}
          </Text>

          {conversation.unreadCount > 0 && (
            <View className="bg-blue-500 rounded-full min-w-[20px] h-5 px-1 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">
                {conversation.unreadCount > 99
                  ? '99+'
                  : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default ChatListItem;
import React from 'react';
import { Text, View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Conversation } from '@/types/conversation.type';
import { useAppSelector } from '@/store/hook';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút`;
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày`;
  return date.toLocaleDateString('vi-VN');
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const AVATAR_COLORS = [
  { bg: '#e6f4ea', text: '#1e7e34' },
  { bg: '#f3e8ff', text: '#6b21a8' },
  { bg: '#fff7ed', text: '#9a3412' },
  { bg: '#f0fdf4', text: '#166534' },
  { bg: '#e0e7ff', text: '#3730a3' },
  { bg: '#fef3c7', text: '#92400e' },
];

const getAvatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const getLastMessagePreview = (conversation: Conversation) => {
  const msg = conversation.lastMessage;
  if (!msg) return 'Chưa có tin nhắn';
  if (!msg.content) {
    switch (msg.type) {
      case 'IMAGE': return '🖼 Hình ảnh';
      case 'FILE': return '📎 Tệp đính kèm';
      case 'AUDIO': return '🎤 Tin nhắn thoại';
      default: return 'Tin nhắn';
    }
  }
  return msg.content;
};

const ChatListItem: React.FC<ChatListItemProps> = ({ conversation, onPress }) => {
  const categories = conversation.categories ?? [];
  const lastMessage = getLastMessagePreview(conversation);
  const timeDisplay = formatTime(conversation.lastMessage?.createdAt ?? null);
  const { user } = useAppSelector(state => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { onlineUsers } = useAppSelector(state => state.conversation);

  const isMe = conversation.lastMessage?.senderId === user?.id;
  const isOnline = onlineUsers?.includes(conversation.participant.id);
  const avatarColor = getAvatarColor(conversation.participant.id);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => onPress(conversation)}
      style={[
        styles.row,
        {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderBottomColor: isDark ? '#374151' : '#f3f4f6',
        },
      ]}
    >
      {/* ── Avatar ── */}
      <View style={styles.avatarWrap}>
        {conversation.participant.avatarUrl ? (
          <Image
            source={{ uri: conversation.participant.avatarUrl }}
            style={[styles.avatarImg, { borderColor: isDark ? '#3b82f6' : '#93c5fd' }]}
          />
        ) : (
          <View
            style={[
              styles.avatarImg,
              styles.avatarFallback,
              {
                backgroundColor: isDark ? `${avatarColor.bg}30` : avatarColor.bg,
                borderColor: isDark ? avatarColor.text : avatarColor.bg,
              },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: avatarColor.text }]}>
              {getInitials(conversation.participant.fullName)}
            </Text>
          </View>
        )}
        {isOnline && (
          <View
            style={[
              styles.onlineDot,
              { borderColor: isDark ? '#1f2937' : '#ffffff' },
            ]}
          />
        )}
      </View>

      {/* ── Info ── */}
      <View style={styles.info}>
        {/* Category tags */}
        {categories.length > 0 && (
          <View style={styles.tagRow}>
            {categories.slice(0, 3).map((cat) => (
              <View
                key={cat.id}
                style={[styles.tag, { backgroundColor: `${cat.color}20`, borderColor: cat.color }]}
              >
                <Text style={[styles.tagText, { color: cat.color }]}>{cat.name}</Text>
              </View>
            ))}
            {categories.length > 3 && (
              <Text style={styles.tagMore}>+{categories.length - 3}</Text>
            )}
          </View>
        )}

        {/* Name + Time */}
        <View style={styles.nameRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              { color: isDark ? '#f1f5f9' : '#1a1a1a', flex: 1, marginRight: 8 },
            ]}
          >
            {conversation.participant.fullName}
          </Text>
          <Text style={[styles.time, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {timeDisplay}
          </Text>
        </View>

        {/* Preview + Badge */}
        <View style={styles.previewRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.preview,
              {
                color: hasUnread
                  ? isDark ? '#ffffff' : '#1a1a1a'
                  : isDark ? '#9ca3af' : '#6b7280',
                fontWeight: hasUnread ? '500' : '400',
              },
            ]}
          >
            {isMe && 'Bạn: '}{lastMessage}
          </Text>

          <View style={styles.badgeArea}>
            {isMe && !hasUnread && (
              <Ionicons name="checkmark" size={16} color="#22c55e" />
            )}
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    marginRight: 12,
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 3,
  },
  tag: {
    borderWidth: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '500',
  },
  tagMore: {
    fontSize: 9,
    color: '#9ca3af',
    alignSelf: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontSize: 14,
  },
  badgeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#185FA5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ChatListItem;

import { Text, View, Image, TouchableWithoutFeedback, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Message } from '@/types/message.type';
import MessageContextMenu from './MessageContextMenu';
import ImageGalleryViewer from './ImageGalleryViewer';
import { Angry, Frown, Heart, Laugh, ThumbsUp } from 'lucide-react-native';

// ─── File icon helper ──────────────────────────────────────────────────────
const getFileIcon = (fileName?: string | null): { name: string; color: string } => {
  const ext = (fileName ?? '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return { name: 'document-text', color: '#EF4444' };
    case 'doc': case 'docx':
      return { name: 'document-text', color: '#3B82F6' };
    case 'xls': case 'xlsx':
      return { name: 'document-text', color: '#10B981' };
    case 'ppt': case 'pptx':
      return { name: 'document-text', color: '#F97316' };
    case 'zip': case 'rar': case '7z':
      return { name: 'archive', color: '#8B5CF6' };
    case 'mp3': case 'wav': case 'flac':
      return { name: 'musical-notes', color: '#EC4899' };
    default:
      return { name: 'document-attach', color: '#6B7280' };
  }
};

interface ChatMessageProps {
  message: Message;
  isMe: boolean;
  time: string;
  avatar?: string;
  name?: string;
  onReaction?: (messageId: string, reaction: string) => void;
  onAction?: (messageId: string, action: string) => void;
}

const DeletedBubble = () => (
  <View className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex-row items-center gap-2">
    <Text className="text-sm text-gray-400 dark:text-gray-500 italic">Tin nhắn đã bị xóa</Text>
  </View>
);

interface ReplyPreviewProps {
  replyTo: NonNullable<Message['replyTo']>;
  isMe: boolean;
  senderId: string;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ replyTo, isMe, senderId }) => {
  const isSelf = replyTo.senderId === senderId;

  return (
    <View
      className={`mb-2 px-3 py-2 rounded-xl border-l-[3px] ${isMe
        ? 'bg-blue-400/30 border-blue-200'
        : 'bg-gray-100 border-blue-500'
        }`}
    >
      <Text
        className={`text-xs font-semibold mb-0.5 ${isMe ? 'text-blue-100' : 'text-blue-600'
          }`}
      >
        {isSelf ? 'Bạn' : 'Người kia'}
      </Text>
      <Text
        numberOfLines={1}
        className={`text-xs ${isMe ? 'text-blue-100/80' : 'text-gray-500'
          } ${replyTo.isDeleted ? 'italic' : ''}`}
      >
        {replyTo.isDeleted
          ? 'Tin nhắn đã bị xóa'
          : replyTo.content ?? replyTo.messageType}
      </Text>
    </View>
  );
};

interface MessageContentProps {
  message: Message;
  isMe: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ message, isMe }) => {

  const screenWidth = Dimensions.get("window").width;
  const MAX_WIDTH = screenWidth * 0.65; // 65% màn hình
  const MAX_HEIGHT = 300; // giới hạn chiều cao

  // State for image gallery
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  switch (message.messageType) {
    case 'TEXT':
      return (
        <Text className={`text-[15px] leading-5 ${isMe ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
          {message.content}
        </Text>
      );

    case "IMAGE": {
      if (!message.fileUrl) return null;

      // Parse multiple images: content may have comma-separated URLs or single fileUrl
      const allImages: { uri: string }[] = [];
      
      // Check if content has multiple URLs (comma or newline separated)
      if (message.content && message.content.includes(',')) {
        message.content.split(',').map(u => u.trim()).filter(Boolean).forEach(uri => {
          allImages.push({ uri });
        });
      }
      
      // Always include fileUrl
      if (!allImages.find(img => img.uri === message.fileUrl)) {
        allImages.unshift({ uri: message.fileUrl });
      }

      const imageCount = allImages.length;
      const GRID_SIZE = Math.min(MAX_WIDTH, 240);
      const GAP = 3;

      // Single image
      if (imageCount === 1) {
        const originalWidth = message.width ?? 200;
        const originalHeight = message.height ?? 200;
        const ratio = originalWidth / originalHeight;
        let displayWidth = MAX_WIDTH;
        let displayHeight = MAX_WIDTH / ratio;
        if (displayHeight > MAX_HEIGHT) {
          displayHeight = MAX_HEIGHT;
          displayWidth = MAX_HEIGHT * ratio;
        }

        return (
          <>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => { setGalleryIndex(0); setGalleryVisible(true); }}
            >
              <Image
                source={{ uri: allImages[0].uri }}
                style={{ width: displayWidth, height: displayHeight }}
                className="rounded-2xl"
                resizeMode="cover"
              />
            </TouchableOpacity>
            <ImageGalleryViewer
              visible={galleryVisible}
              images={allImages}
              initialIndex={galleryIndex}
              onClose={() => setGalleryVisible(false)}
            />
          </>
        );
      }

      // Multiple images: Grid layout
      const displayImages = allImages.slice(0, 3);
      const remaining = imageCount - 3;

      const cellSize = imageCount === 2
        ? (GRID_SIZE - GAP) / 2
        : (GRID_SIZE - GAP) / 2;

      return (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => { setGalleryIndex(0); setGalleryVisible(true); }}
          >
            <View style={{
              width: GRID_SIZE,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: GAP,
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              {displayImages.map((img, idx) => {
                // First image takes full width if 3 images
                const isFirstInThree = idx === 0 && imageCount >= 3;
                const w = isFirstInThree ? GRID_SIZE : cellSize;
                const h = isFirstInThree ? cellSize * 1.2 : cellSize;
                const isLast = idx === displayImages.length - 1 && remaining > 0;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.85}
                    onPress={() => { setGalleryIndex(idx); setGalleryVisible(true); }}
                  >
                    <View style={{ width: w, height: h, position: 'relative' }}>
                      <Image
                        source={{ uri: img.uri }}
                        style={{ width: w, height: h }}
                        resizeMode="cover"
                      />
                      {isLast && (
                        <View style={{
                          position: 'absolute', inset: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{
                            color: '#fff', fontSize: 22, fontWeight: '700',
                          }}>
                            +{remaining}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
          <ImageGalleryViewer
            visible={galleryVisible}
            images={allImages}
            initialIndex={galleryIndex}
            onClose={() => setGalleryVisible(false)}
          />
        </>
      );
    }

    case 'VIDEO':
      if (!message.thumbnailUrl) return null;
      return (
        <View className="relative">
          <Image
            source={{ uri: message.thumbnailUrl }}
            style={{ width: message.width ?? 200, height: message.height ?? 200 }}
            className="rounded-xl"
            resizeMode="cover"
          />
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/40 w-11 h-11 rounded-full items-center justify-center">
              <Text className="text-white text-base ml-0.5">▶</Text>
            </View>
          </View>
          {message.duration != null && (
            <View className="absolute bottom-2 right-2 bg-black/50 rounded px-1.5 py-0.5">
              <Text className="text-white text-[11px] font-medium">
                {Math.floor(message.duration / 60)}:
                {String(message.duration % 60).padStart(2, '0')}
              </Text>
            </View>
          )}
        </View>
      );

    case 'FILE': {
      const fileIcon = getFileIcon(message.fileName);
      const handleDownload = () => {
        if (message.fileUrl) {
          Linking.openURL(message.fileUrl).catch(() => {
            Alert.alert('Lỗi', 'Không thể mở tệp');
          });
        }
      };

      return (
        <View
          className={`flex-row items-center rounded-xl px-3 py-2.5 gap-3 ${isMe ? 'bg-blue-400/25' : 'bg-gray-100 dark:bg-gray-700'
            }`}
          style={{ minWidth: 200 }}
        >
          <View
            style={{ backgroundColor: fileIcon.color + '18' }}
            className="w-10 h-10 rounded-lg items-center justify-center"
          >
            <Ionicons name={fileIcon.name as any} size={22} color={fileIcon.color} />
          </View>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className={`text-sm font-semibold ${isMe ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}
            >
              {message.fileName ?? 'Tệp đính kèm'}
            </Text>
            {message.fileSize != null && (
              <Text className={`text-xs mt-0.5 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                {message.fileSize >= 1_048_576
                  ? `${(message.fileSize / 1_048_576).toFixed(1)} MB`
                  : `${(message.fileSize / 1024).toFixed(1)} KB`}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleDownload}
            style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(59,130,246,0.1)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="download-outline" size={18} color={isMe ? '#BFDBFE' : '#3B82F6'} />
          </TouchableOpacity>
        </View>
      );
    }

    case 'CALL_VOICE':
    case 'CALL_VIDEO':
    case 'CALL_MISSED': {
      const isMissed = message.messageType === 'CALL_MISSED';
      const isVideoCall = message.messageType === 'CALL_VIDEO';
      const callLabel = isVideoCall ? 'Cuộc gọi video' : isMissed ? 'Cuộc gọi nhỡ' : 'Cuộc gọi thoại';

      const formatCallDuration = (dur: number | null) => {
        if (!dur) return null;
        const m = Math.floor(dur / 60).toString().padStart(2, '0');
        const s = Math.round(dur % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      const durationFormatted = formatCallDuration(message.duration);
      const subtitleText = isMissed
        ? 'Missed call'
        : `${isVideoCall ? 'Video' : 'Voice'} call (${durationFormatted || '00:00'})`;

      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 12,
            minWidth: 180,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isMe ? '#ffffff' : '#EFF6FF',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isMe ? '#DBEAFE' : '#E0E7FF',
            }}
          >
            <Ionicons
              name={isVideoCall ? 'videocam' : 'call'}
              size={20}
              color="#3B82F6"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#1e293b',
              }}
            >
              {callLabel}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isMissed ? '#EF4444' : '#64748b',
                marginTop: 2,
              }}
            >
              {subtitleText}
            </Text>
          </View>
        </View>
      );
    }

    default:
      return null;
  }
};

// ─── Reactions ────────────────────────────────────────────────────────────────

interface ReactionsRowProps {
  reactions: Message['reactions'];
  isMe: boolean;
}

const ReactionsRow = ({ reactions }: { reactions?: any[] }) => {

  const REACTIONS = [
    { key: 'love', icon: Heart, color: '#ff3b30' },
    { key: 'like', icon: ThumbsUp, color: '#0a84ff' },
    { key: 'haha', icon: Laugh, color: '#ffd60a' },
    { key: 'sad', icon: Frown, color: '#64d2ff' },
    { key: 'angry', icon: Angry, color: '#ff453a' },
  ];

  if (!reactions || reactions.length === 0) return null;

  const grouped = reactions.reduce((acc: Record<string, number>, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(grouped) as [string, number][];
  const totalCount = reactions.length;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingHorizontal: 6,
        paddingVertical: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.08)',
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {entries.slice(0, 3).map(([key]) => {
          const reaction = REACTIONS.find(r => r.key === key);
          if (!reaction) return null;

          const Icon = reaction.icon;

          return (
            <Icon
              key={key}
              size={14}
              color={reaction.color}
              style={{ marginRight: -2 }}
            />
          );
        })}
      </View>

      {totalCount > 0 && (
        <Text
          style={{
            fontSize: 11,
            color: '#888',
            fontWeight: '500',
            marginLeft: 3,
          }}
        >
          {totalCount}
        </Text>
      )}
    </View>
  );
};

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe }) => {
  if (message.isDeleted) return <DeletedBubble />;

  const hasReactions = message.reactions && message.reactions.length > 0;

  const isCall =
    message.messageType === 'CALL_VOICE' ||
    message.messageType === 'CALL_VIDEO' ||
    message.messageType === 'CALL_MISSED';

  const isMediaOnly =
    ((message.messageType === 'IMAGE' || message.messageType === 'VIDEO') && !message.replyTo) ||
    isCall;

  const bubbleBg = isCall
    ? isMe ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'
    : isMe ? 'bg-blue-500' : 'bg-white dark:bg-secondary-dark border border-gray-200 dark:border-gray-600';

  return (
    <View style={{ position: 'relative', marginBottom: hasReactions ? 10 : 0 }}>
      <View
        className={`max-w-[85%] rounded-2xl overflow-hidden ${isMediaOnly ? '' : 'px-3.5 py-2.5'} ${bubbleBg}`}
      >
        {!isMediaOnly && message.replyTo && (
          <ReplyPreview
            replyTo={message.replyTo}
            isMe={isMe}
            senderId={message.senderId}
          />
        )}
        <MessageContent message={message} isMe={isMe} />
      </View>

      {hasReactions && (
        <View
          style={{
            position: 'absolute',
            bottom: -10,
            ...(isMe ? { right: 8 } : { left: 8 }),
            zIndex: 10,
          }}
        >
          {message.reactions && <ReactionsRow reactions={message.reactions} />}

        </View>
      )}
    </View>
  );
};

interface AvatarProps {
  avatarUrl?: string;
  name?: string;
}

const Avatar: React.FC<AvatarProps> = ({ avatarUrl, name }) => {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        className="w-8 h-8 rounded-full"
        resizeMode="cover"
      />
    );
  }

  return (
    <View className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center">
      <Text className="text-sm font-semibold text-gray-500 dark:text-gray-300">
        {(name ?? '?')[0].toUpperCase()}
      </Text>
    </View>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isMe,
  time,
  avatar,
  name,
  onReaction,
  onAction,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const otherUserName = name || 'Người dùng';

  const handleLongPress = () => setMenuVisible(true);
  const handleReaction = (key: string) => onReaction?.(message.id, key);
  const handleAction = (key: string) => onAction?.(message.id, key);

  return (
    <>
      <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={350}>
        <View
          className={`flex-row items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'
            }`}
        >
          {!isMe && (
            <View className="mb-4">
              <Avatar avatarUrl={avatar} name={otherUserName} />
            </View>
          )}

          <View className={`flex-1 ${isMe ? 'items-end' : 'items-start'}`}>
            {/* Sender name (group chats) */}
            {/* {!isMe && message.senderName && (
              <Text className="text-xs text-gray-400 font-medium mb-1 ml-1">
                {message.senderName}
              </Text>
            )} */}

            {!isMe && (
              <Text className="text-xs text-gray-400 font-medium mb-1 ml-1">
                {otherUserName}
              </Text>
            )}

            <MessageBubble message={message} isMe={isMe} />

            {/* Timestamp + delivery status */}
            {/* <View className="flex-row items-center gap-1 mt-1">
              <Text className="text-[11px] text-gray-400">{time}</Text>
              {isMe && (
                <Text
                  className={`text-[11px] ${
                    message.isRead ? 'text-blue-400' : 'text-gray-300'
                  }`}
                >
                  {message.isDelivered ? '✓✓' : '✓'}
                </Text>
              )}
            </View> */}

            <View className="flex-row items-center gap-1 mt-1">
              <Text className="text-[11px] text-gray-400">{time}</Text>
              {isMe && (
                <Text
                  className={`text-[11px] ${true ? 'text-blue-400' : 'text-gray-300'
                    }`}
                >
                  {message.isDelivered ? '✓✓' : '✓'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <MessageContextMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onReaction={handleReaction}
        onAction={handleAction}
        messagePreview={<MessageBubble message={message} isMe={isMe} />}
      />
    </>
  );
};

export default ChatMessage;
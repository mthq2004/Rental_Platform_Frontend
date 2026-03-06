import { Text, View, Image, TouchableWithoutFeedback, Dimensions } from 'react-native';
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

const DeletedBubble = () => (
  <View className="max-w-[75%] rounded-2xl px-4 py-2.5 bg-gray-100 border border-gray-200 flex-row items-center gap-2">
    <Text className="text-sm text-gray-400 italic">Tin nhắn đã bị xóa</Text>
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

  switch (message.messageType) {
    case 'TEXT':
      return (
        <Text className={`text-[15px] leading-5 ${isMe ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </Text>
      );

    case "IMAGE":
      if (!message.fileUrl) return null;

      const originalWidth = message.width ?? 200;
      const originalHeight = message.height ?? 200;

      const ratio = originalWidth / originalHeight;

      let displayWidth = MAX_WIDTH;
      let displayHeight = MAX_WIDTH / ratio;

      // nếu ảnh quá cao
      if (displayHeight > MAX_HEIGHT) {
        displayHeight = MAX_HEIGHT;
        displayWidth = MAX_HEIGHT * ratio;
      }

      return (
        <Image
          source={{ uri: message.fileUrl }}
          style={{
            width: displayWidth,
            height: displayHeight,
          }}
          className="rounded-2xl"
          resizeMode="cover"
        />
      );

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

    case 'FILE':
      return (
        <View
          className={`flex-row items-center rounded-xl px-3 py-2.5 gap-3 ${isMe ? 'bg-blue-400/25' : 'bg-gray-100'
            }`}
        >
          <View
            className={`w-9 h-9 rounded-lg items-center justify-center ${isMe ? 'bg-blue-400/30' : 'bg-white'
              }`}
          >
            <Text className="text-lg">📄</Text>
          </View>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className={`text-sm font-semibold ${isMe ? 'text-white' : 'text-gray-800'}`}
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

          <Text className={`text-base ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>⬇</Text>
        </View>
      );

    default:
      return null;
  }
};

// ─── Reactions ────────────────────────────────────────────────────────────────

interface ReactionsRowProps {
  reactions: Message['reactions'];
  isMe: boolean;
}

const ReactionsRow = ({ reactions, isMe }: { reactions?: any[]; isMe?: boolean }) => {
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
      <Text style={{ fontSize: 13, letterSpacing: -1 }}>
        {entries.slice(0, 3).map(([emoji]) => emoji).join('')}
      </Text>

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

  const isMediaOnly =
    (message.messageType === 'IMAGE' || message.messageType === 'VIDEO') &&
    !message.replyTo;

  return (
    <View style={{ position: 'relative', marginBottom: hasReactions ? 10 : 0 }}>
      <View
        className={`max-w-[75%] rounded-2xl overflow-hidden ${isMediaOnly ? '' : 'px-3.5 py-2.5'
          } ${isMe ? 'bg-blue-500' : 'bg-white border border-gray-200'}`}
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
          {message.reactions && <ReactionsRow reactions={message.reactions} isMe={isMe} />}

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
    <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center">
      <Text className="text-sm font-semibold text-gray-500">
        {(name ?? '?')[0].toUpperCase()}
      </Text>
    </View>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isMe,
  time,
  onReaction,
  onAction,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

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
              <Avatar avatarUrl="https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://thuthuatphanmem.vn/uploads/2018/05/21/khi-co-tin-nhan-bong-bong-chat-zalo-se-xuat-hien-tren-man-hi_0zOcH_095053182.png" name="Mạch Ngọc Xuân" />
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
                Mạch Ngọc Đạt
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
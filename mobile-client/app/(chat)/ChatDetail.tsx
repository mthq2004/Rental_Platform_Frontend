import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCall } from '@/contexts/CallContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import ChatPropertyCard from '@/components/chat/ChatPropertyCard';
import ChatMessage from '@/components/chat/ChatMessage';
import QuickMessageBar from '@/components/chat/QuickMessageBar';
import ChatInputBar from '@/components/chat/ChatInputBar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMessages, reactMessage, sendMessage } from '@/store/slices/message.slice';
import { Message } from '@/types/message.type';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { Conversation } from '@/types/conversation.type';
import { FlatList } from 'react-native-gesture-handler';
import { markAsRead, setCurrentConversation } from '@/store/slices/conversation.slice';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';

const ChatDetail = () => {
  const params = useLocalSearchParams<{
    id: string;
    participantId: string;
    status: string;
    name: string;
    avatar: string;
  }>();

  const dispatch = useAppDispatch()
  const { error, hasNextPage, loading, messages, nextCursor } = useAppSelector(state => state.message)
  const { onlineUsers } = useAppSelector(state => state.conversation)
  const { user } = useAppSelector(state => state.auth)
  const { startCall } = useCall();
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewMessageWhileScrolled, setHasNewMessageWhileScrolled] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (messages.length > prevMessagesLength.current && showScrollToBottom) {
      setHasNewMessageWhileScrolled(true);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  const isOnline =
    params.participantId
      ? onlineUsers.includes(params.participantId)
      : false;

  const conversation: Conversation = {
    id: params.id,
    status: (params.status as Conversation['status']) ?? 'ACTIVE',
    participant: { id: params.participantId, fullName: params.name, avatarUrl: params.avatar },
    lastMessage: {
      content: null,
      type: null,
      senderId: null,
      createdAt: null,
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(setCurrentConversation(conversation.id));
      dispatch(markAsRead(conversation.id));

      return () => {
        dispatch(setCurrentConversation(null));
      };
    }, [conversation.id])
  );

  useEffect(() => {
    console.log("tin nhan");

    dispatch(fetchMessages({ conversationId: conversation.id }))
  }, [conversation.id])

  const flatListRef = useRef<FlatList>(null);

  const propertyInfo = {
    id: '1',
    title: 'Căn hộ cao cấp Q1 - 2PN, 2WC',
    price: '15.000.000 đ/tháng',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
  };

  const quickMessages = [
    'Căn hộ còn không ạ?',
    'Giá thuê bao nhiêu?',
    'Có thể xem nhà không?',
  ];

  const handleSendMessage = async (text: string) => {
    if (!user?.id) return;

    try {
      if (selectedImage) {
        const uploadData = await uploadToCloudinary({
          uri: selectedImage,
          fileName: "image.jpg",
          mimeType: "image/jpeg",
          resourceType: "image",
        })

        dispatch(sendMessage({
          conversationId: conversation.id,
          messageType: "IMAGE",
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          mimeType: uploadData.mimeType,
          width: uploadData.width,
          height: uploadData.height,
          replyToId: replyingMessage?.id,
        }))
      }
      else if (text.trim()) {
        dispatch(sendMessage({
          conversationId: conversation.id,
          content: text.trim(),
          messageType: "TEXT",
          replyToId: replyingMessage?.id,
        }))
      }

      setSelectedImage(null)
      setReplyingMessage(null)
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })

    } catch (error) {
      console.log("Send message error:", error)
    }
  }

  const handleStartCall = (type: 'voice' | 'video') => {
    startCall({
      conversationId: params.id,
      calleeId: params.participantId,
      callType: type === 'voice' ? 'VOICE' : 'VIDEO',
      participantName: params.name,
      participantAvatar: params.avatar,
    });
  };

  const handleAction = (messageId: string, action: string) => {
    if (action === 'reply') {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setReplyingMessage(message);
      }
    }
  }

  const handleReaction = (messageId: string, action: string) => {
    console.log("jnj: ", messageId, action);
    dispatch(reactMessage({ messageId, emoji: action }))
  }

  const handleSendImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  const handleSendLocation = () =>
    Alert.alert('Gửi vị trí', 'Chức năng đang phát triển');

  const handleShowAttachments = () =>
    Alert.alert('Tệp đính kèm', 'Chức năng đang phát triển');

  const handleViewProperty = () =>
    Alert.alert('Xem bất động sản', 'Chuyển đến trang chi tiết');

  const getStatusStyle = () => {
    switch (conversation.status) {
      case 'ACTIVE':
        return { color: 'text-green-500', label: 'Đang hoạt động' };
      case 'BLOCKED':
        return { color: 'text-red-500', label: 'Đã bị chặn' };
      case 'DELETED':
        return { color: 'text-gray-400', label: 'Đã xóa' };
    }
  };

  const statusStyle = getStatusStyle();

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View
        className="bg-white dark:bg-secondary-dark px-4 py-3 border-b border-gray-200 dark:border-gray-700"
        style={{ paddingTop: insets.top + 4 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>

            <View className="relative mr-3">
              <Image
                source={{ uri: params.avatar }}
                className="w-10 h-10 rounded-full"
              />
              {isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-secondary-dark" />
              )}
            </View>

            <View>
              <Text className="text-base font-semibold text-gray-800 dark:text-foreground-dark">
                {params.name}
              </Text>
              {
                isOnline && <Text className={`text-xs ${statusStyle.color}`}>
                  Đang hoạt động
                </Text>
              }
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            {conversation.unreadCount > 0 && (
              <View className="bg-red-500 w-6 h-6 rounded-full items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">
                  {conversation.unreadCount}
                </Text>
              </View>
            )}
            
            <TouchableOpacity onPress={() => handleStartCall('voice')}>
              <Ionicons name="call" size={22} color="#3b82f6" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleStartCall('video')}>
              <Ionicons name="videocam" size={26} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ChatPropertyCard property={propertyInfo} onPress={handleViewProperty} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -Math.max(insets.bottom, 0) : 0}
      >
        <View className="flex-1">

          <FlatList
            className="px-4"
            ref={flatListRef}
            data={messages}
            inverted
            contentContainerStyle={{ paddingTop: 8 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage
                message={item}
                isMe={item.senderId === user?.id}
                time={formatTime(item.createdAt)}
                avatar={params.avatar}
                name={params.name}
                onAction={handleAction}
                onReaction={handleReaction}
              />
            )}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              if (offsetY > 150) {
                setShowScrollToBottom(true);
              } else {
                setShowScrollToBottom(false);
                setHasNewMessageWhileScrolled(false);
              }
            }}
            scrollEventThrottle={16}
            onEndReachedThreshold={0.2}
            onEndReached={() => {
              if (hasNextPage && !loading) {
                dispatch(
                  fetchMessages({
                    conversationId: conversation.id,
                    cursor: nextCursor,
                  })
                );
              }
            }}
          />

          {showScrollToBottom && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                setHasNewMessageWhileScrolled(false);
              }}
              style={{
                position: 'absolute',
                bottom: 80, // Above input bar
                right: 16,
                backgroundColor: '#ffffff',
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
                zIndex: 10,
                borderWidth: 1,
                borderColor: '#e2e8f0'
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#64748b" />
              {hasNewMessageWhileScrolled && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: '#ef4444',
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: '#ffffff',
                }} />
              )}
            </TouchableOpacity>
          )}

          <QuickMessageBar
            messages={quickMessages}
            onSelectMessage={handleSendMessage}
          />

          {replyingMessage && (
            <View className="mx-4 mb-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Đang trả lời
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-gray-800 dark:text-gray-200">
                    {replyingMessage.content}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setReplyingMessage(null)}>
                  <Ionicons name="close" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedImage && (
            <View className="mx-4 mb-2">
              <Image
                source={{ uri: selectedImage }}
                className="w-24 h-24 rounded-lg"
              />
              <TouchableOpacity onPress={() => setSelectedImage(null)}>
                <Ionicons name="close" size={18} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8 }}>
            <ChatInputBar
              onSendMessage={handleSendMessage}
              onSendImage={handleSendImage}
              onSendLocation={handleSendLocation}
              onShowAttachments={handleShowAttachments}
              canSend={!!selectedImage}
            />
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatDetail;
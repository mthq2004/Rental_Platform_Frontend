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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import ChatPropertyCard from '@/components/chat/ChatPropertyCard';
import ChatMessage from '@/components/chat/ChatMessage';
import QuickMessageBar from '@/components/chat/QuickMessageBar';
import ChatInputBar from '@/components/chat/ChatInputBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMessages, sendMessage } from '@/store/slices/message.slice';
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
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  } catch (error) {
    console.log("Send message error:", error)
  }
}

  const handleAction = (messageId: string, action: string) => {
    if (action === 'reply') {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setReplyingMessage(message);
      }
    }
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
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200 pt-16">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View className="relative mr-3">
              <Image
                source={{ uri: params.avatar }}
                className="w-10 h-10 rounded-full"
              />
              {isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </View>

            <View>
              <Text className="text-base font-semibold text-gray-800">
                {params.name}
              </Text>
              {
                isOnline && <Text className={`text-xs ${statusStyle.color}`}>
                  Đang hoạt động
                </Text>
              }
            </View>
          </View>

          {conversation.unreadCount > 0 && (
            <View className="bg-red-500 w-6 h-6 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">
                {conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ChatPropertyCard property={propertyInfo} onPress={handleViewProperty} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1">

          <FlatList
            className="px-4"
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage
                message={item}
                isMe={item.senderId === user?.id}
                time={formatTime(item.createdAt)}
                onAction={handleAction}
              />
            )}
            keyboardShouldPersistTaps="handled"
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

          <QuickMessageBar
            messages={quickMessages}
            onSelectMessage={handleSendMessage}
          />

          {replyingMessage && (
            <View className="mx-4 mb-2 p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500">
                    Đang trả lời
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-gray-800">
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

          <ChatInputBar
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onSendLocation={handleSendLocation}
            onShowAttachments={handleShowAttachments}
            canSend={!!selectedImage}
          />

        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatDetail;
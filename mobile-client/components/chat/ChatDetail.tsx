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
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import ChatPropertyCard from '@/components/chat/ChatPropertyCard';
import ChatMessage from '@/components/chat/ChatMessage';
import QuickMessageBar from '@/components/chat/QuickMessageBar';
import ChatInputBar from '@/components/chat/ChatInputBar';
import { Conversation } from '@/types/conversation.type';
import { Message } from '@/types/message.type';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { fetchMessages } from '@/store/slices/message.slice';
import { setCurrentConversation } from '@/store/slices/conversation.slice';

const ChatDetail = () => {
  const params = useLocalSearchParams<{
    id: string;
    participantId: string;
    status: string;
    name: string;
    avatar: string;
  }>();
  console.log("hon: ", params.id);


  const dispatch = useAppDispatch()
  const { error, hasNextPage, loading, messages, nextCursor } = useAppSelector(state => state.message)
  const { user } = useAppSelector(state => state.auth)

  const conversation: Conversation = {
    id: params.id,
    status: (params.status as Conversation['status']) ?? 'ACTIVE',
    participantId: params.participantId,
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

  useEffect(() => {
    dispatch(setCurrentConversation(conversation.id));

    return () => {
      dispatch(setCurrentConversation(null));
    };
  }, [conversation.id]);

  useEffect(() => {
    console.log("tin nhan");

    dispatch(fetchMessages({ conversationId: conversation.id }))
  }, [conversation.id])

  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleSendMessage = (text: string) => {
    if (!user?.id) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId: conversation.id,
      senderId: user.id,
      content: text,
      messageType: 'TEXT',
      fileUrl: null,
      fileName: null,
      fileSize: null,
      mimeType: null,
      width: null,
      height: null,
      duration: null,
      thumbnailUrl: null,
      replyToId: null,
      isDelivered: false,
      isDeleted: false,
      deletedAt: null,
      reactions: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // setMessages((prev) => [...prev, newMessage]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSendImage = () =>
    Alert.alert('Gửi hình ảnh', 'Chức năng đang phát triển');

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
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">

          {/* HEADER */}
          <View className="bg-white px-4 py-3 border-b border-gray-200">
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
                  {conversation.status === 'ACTIVE' && (
                    <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>

                <View>
                  <Text className="text-base font-semibold text-gray-800">
                    {params.name}
                  </Text>
                  <Text className={`text-xs ${statusStyle.color}`}>
                    {statusStyle.label}
                  </Text>
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

          {/* PROPERTY CARD */}
          <ChatPropertyCard property={propertyInfo} onPress={handleViewProperty} />

          {/* MESSAGES */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages
              .filter((msg) => !msg.isDeleted)
              .map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isMe={msg.senderId === user?.id}
                  time={formatTime(msg.createdAt)}
                />
              ))}
          </ScrollView>

          {/* QUICK MESSAGE */}
          <QuickMessageBar
            messages={quickMessages}
            onSelectMessage={handleSendMessage}
          />

          {/* INPUT BAR */}
          <ChatInputBar
            onSendMessage={handleSendMessage}
            onSendImage={handleSendImage}
            onSendLocation={handleSendLocation}
            onShowAttachments={handleShowAttachments}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ChatDetail;
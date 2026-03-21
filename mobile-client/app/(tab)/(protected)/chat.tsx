import { View } from 'react-native';
import React, { useEffect, useState } from 'react';
import ChatList from '@/components/chat/ChatList';
import { router } from 'expo-router';
import { Conversation } from '@/types/conversation.type';
import { useAppDispatch } from '@/store/hook';
import { fetchConversations } from '@/store/slices/conversation.slice';
import { getAllCustomerCategories } from '@/store/slices/customer-category.slice';
import AuthGuard from '@/components/AuthGuard';

const Chat = () => {
  const dispatch = useAppDispatch()

  const handleSelectChat = (conversation: Conversation) => {
    router.push({
      pathname: '/(chat)/ChatDetail',
      params: {
        id: conversation.id,
        participantId: conversation.participant.id,
        status: conversation.status,
        avatar: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
        name: conversation.participant.fullName
      },
    });
  };

  useEffect(() => {
    dispatch(fetchConversations())
    dispatch(getAllCustomerCategories())
  }, [])

  return (
    <AuthGuard>
      <View className="flex-1">
        <ChatList onSelectChat={handleSelectChat} />
      </View>
    </AuthGuard>
  );
};

export default Chat;
"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import socketService from '@/services/chat.socket';
import { addConversation, setUserOffline, setUserOnline, setOnlineUsersSnapshot, updateConversationOnNewMessage } from '@/stores/slices/conversation.slice';
import { addRealtimeMessage, updateMessageReaction } from '@/stores/slices/message.slice';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { store } from '@/stores/store';

interface SocketContextType {
  isConnected: boolean;
  emitTyping: (conversationId: string, recipientId: string, isTyping: boolean) => void;
  onTypingEvent: (callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) => void;
  offTypingEvent: () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  emitTyping: () => {},
  onTypingEvent: () => {},
  offTypingEvent: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuth, user } = useAppSelector(state => state.auth);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuth) return;

    let isMounted = true;

    const init = async () => {
      await socketService.connect();
      if (!isMounted) return;

      setIsConnected(socketService.isConnected());

      // Xóa listener cũ trước khi đăng ký lại
      socketService.off('new_message');
      socketService.off('new_conversation');
      socketService.off('connect');
      socketService.off('disconnect');
      socketService.off("user_online");
      socketService.off("user_offline");
      socketService.off("online_users_snapshot");
      socketService.off("message_reaction");

      socketService.on('connect', () => {
        setIsConnected(true);
      });

      socketService.on('disconnect', () => {
        setIsConnected(false);
      });

      socketService.on("online_users_snapshot", (userIds: string[]) => {
        dispatch(setOnlineUsersSnapshot(userIds));
      });

      socketService.on("user_online", (userId) => {
        dispatch(setUserOnline(userId));
      });

      socketService.on("user_offline", (userId) => {
        dispatch(setUserOffline(userId));
      });

      socketService.on('new_conversation', (data) => {
        dispatch(addConversation(data));
      });

      socketService.on('new_message', (data) => {
        const currentUserId = store.getState().auth.user?.id;

        const state = store.getState();
        const currentConversationId =
          state.conversation.currentConversationId;

        dispatch(
          updateConversationOnNewMessage({
            conversationId: data.conversationId,
            message: data.content,
            isCurrentOpen:
              currentConversationId === data.conversationId,
          })
        );

        if (data.senderId === currentUserId) return;

        dispatch(addRealtimeMessage(data));
      });

      socketService.on("message_reaction", (data) => {
        dispatch(
          updateMessageReaction({
            messageId: data.messageId,
            reactions: data.reactions
          })
        );
      });
    };

    init();

    return () => {
      isMounted = false;
      dispatch(setOnlineUsersSnapshot([])); // xóa trạng thái online khi disconnect/logout
      socketService.disconnect();
    };
  }, [isAuth]);

  const emitTyping = useCallback((conversationId: string, recipientId: string, isTyping: boolean) => {
    socketService.emit('typing', { conversationId, recipientId, isTyping });
  }, []);

  const onTypingEvent = useCallback((callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void) => {
    socketService.off('user_typing');
    socketService.on('user_typing', callback);
  }, []);

  const offTypingEvent = useCallback(() => {
    socketService.off('user_typing');
  }, []);

  return (
    <SocketContext.Provider value={{ isConnected, emitTyping, onTypingEvent, offTypingEvent }}>
      {children}
    </SocketContext.Provider>
  );
};
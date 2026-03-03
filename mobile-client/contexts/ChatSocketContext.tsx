import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '@/services/chat.socket';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { addConversation, setUserOffline, setUserOnline, updateConversationOnNewMessage } from '@/store/slices/conversation.slice';
import { addRealtimeMessage } from '@/store/slices/message.slice';
import { store } from '@/store'; // cần để đọc user trực tiếp

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
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

      socketService.on('connect', () => {
        setIsConnected(true);
      });

      socketService.on('disconnect', () => {
        setIsConnected(false);
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
    };

    init();

    return () => {
      isMounted = false;
      socketService.disconnect();
    };
  }, [isAuth]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
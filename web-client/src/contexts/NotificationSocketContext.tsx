"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { addConversation, setUserOffline, setUserOnline, updateConversationOnNewMessage } from '@/stores/slices/conversation.slice';
import { addRealtimeMessage, updateMessageReaction } from '@/stores/slices/message.slice';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import { store } from '@/stores/store';
import socketService from '@/services/notificaion.socket';

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const NotificationSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuth, user } = useAppSelector(state => state.auth);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log("🔥 NotificationSocketProvider useEffect");
    if (!isAuth) return;

    let isMounted = true;

    const init = async () => {
      await socketService.connect();
      if (isMounted) {
        setIsConnected(true);
      }
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
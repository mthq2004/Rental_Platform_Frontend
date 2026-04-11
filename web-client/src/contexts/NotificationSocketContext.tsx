"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/stores/hooks';
import socketService from '@/services/notificaion.socket';
import {
  addNotification,
  notificationReadRealtime,
  getNotification,
} from '@/stores/slices/notification.slice';

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const NotificationSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuth } = useAppSelector(state => state.auth);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuth) return;

    let isMounted = true;

    const init = async () => {
      await socketService.connect();
      if (!isMounted) return;

      setIsConnected(true);

      // Tải thông báo ban đầu
      dispatch(getNotification());

      // Lắng nghe thông báo mới từ server push
      socketService.on('notification', (notification: any) => {
        dispatch(addNotification(notification));
      });

      // Lắng nghe cập nhật trạng thái đọc từ tab/thiết bị khác
      socketService.on('notification:read', (payload: { notificationId: string }) => {
        dispatch(notificationReadRealtime({ notificationId: payload.notificationId }));
      });
    };

    init();

    return () => {
      isMounted = false;
      socketService.off('notification');
      socketService.off('notification:read');
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [isAuth, dispatch]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
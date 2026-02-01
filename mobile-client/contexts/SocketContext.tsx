import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '@/services/socket.service';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getNotification, notificationReadRealtime } from '@/store/slices/notification.slice';
import { getAccessToken } from '@/utils/secureStorage';

interface SocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  connect: () => { },
  disconnect: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeSocket = async () => {
      const accessToken = await getAccessToken();
      if (accessToken) {
        handleConnect();
      }
    };

    initializeSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const onNotification = (data: any) => {
      console.log('Notification nhận:', data);
      dispatch(getNotification())
    };

    socketService.on('notification', onNotification);

    return () => {
      socketService.off('notification', onNotification);
    };
  }, [isConnected]);

  useEffect(() => {
    dispatch(getNotification())
  }, [])

  useEffect(() => {
    if (!isConnected) return;

    const onNotificationRead = (payload: any) => {
      dispatch(notificationReadRealtime({
        notificationId: payload.notificationId,
      }));
    };

    socketService.on('notification:read', onNotificationRead);

    return () => {
      socketService.off('notification:read', onNotificationRead)
    };
  }, [isConnected]);



  const handleConnect = async () => {
    await socketService.connect();
    setIsConnected(socketService.isConnected());

    socketService.on('connect', () => {
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
    });
  };

  const handleDisconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  return (
    <SocketContext.Provider value={{
      isConnected,
      connect: handleConnect,
      disconnect: handleDisconnect,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
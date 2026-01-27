import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '@/services/socket.service';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getNotification, notificationReadRealtime } from '@/store/slices/notification.slice';

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
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFmM2QxMGJjLThjZjUtNGViMC1hMzFiLTNjZDQ1YzNiNGY3NSIsInJvbGUiOiJhZG1pbiIsInRva2VuVHlwZSI6IkFjY2Vzc1Rva2VuIiwiaWF0IjoxNzY5NDg2ODE0LCJleHAiOjE3Njk1NzMyMTR9.mbtMVqP0lFQ7zaDUBDH-g95-6NPlt03L_99IAsCvAT4"

  useEffect(() => {
    if (token) {
      handleConnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!isConnected) return;

    const onNotification = (data: any) => {
      console.log('📩 Notification nhận:', data);
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
      console.log('====================================');
      console.log("jnkmlkmkl: ", payload);
      console.log('====================================');
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
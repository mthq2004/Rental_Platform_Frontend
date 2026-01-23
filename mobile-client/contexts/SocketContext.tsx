import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '@/services/socket.service';
import { useAppSelector } from '@/store/hook';

interface SocketContextType {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA2MTZiN2U5LTY3MzctNGMxYS1iMGFhLWU0N2IyY2ZmZGQ3NiIsInJvbGUiOiJhZG1pbiIsInRva2VuVHlwZSI6IkFjY2Vzc1Rva2VuIiwiaWF0IjoxNzY4OTcxODY4LCJleHAiOjE3NjkwNTgyNjh9.wfdo4-Bv0isp1428goQ8LMEgKyzvd2PNfYOkbCAM6C8"

  useEffect(() => {
    // Tự động connect khi có token
    if (token) {
      handleConnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  const handleConnect = async () => {
    await socketService.connect();
    setIsConnected(socketService.isConnected());

    // Lắng nghe sự kiện connect/disconnect
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
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/utils/secureStorage';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    async connect() {
        try {
            const token = await getAccessToken();
            
            if (!token) {
                console.log('Không có token, không thể kết nối socket');
                return;
            }

            // Kết nối qua Kong Gateway
            this.socket = io(`${process.env.EXPO_PUBLIC_SOCKET_URL}/notification`, {
                path: "/api/notification/socket.io",
                auth: {
                    token: token
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket?.id);
            });

            this.socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.log('Connection error:', error.message);
            });

        } catch (error) {
            console.error('Socket connection failed:', error);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
            console.log('🔌 Socket disconnected');
        }
    }

    on(event: string, callback: (...args: any[]) => void) {
        if (!this.socket) {
            console.warn('Socket not connected');
            return;
        }

        this.socket.on(event, callback);

        // Lưu listener để cleanup sau
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    // Gửi sự kiện đến server
    emit(event: string, data: any) {
        if (!this.socket) {
            console.warn('Socket not connected');
            return;
        }
        this.socket.emit(event, data);
    }

    // Remove listener
    off(event: string, callback?: (...args: any[]) => void) {
        if (!this.socket) return;

        if (callback) {
            this.socket.off(event, callback);
        } else {
            this.socket.off(event);
            this.listeners.delete(event);
        }
    }

    // Kiểm tra trạng thái kết nối
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export default new SocketService();
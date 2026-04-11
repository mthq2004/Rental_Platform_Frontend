import { io, Socket } from 'socket.io-client';
import envConfig from '../config';

class NotificationSocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(`${envConfig.API_ENDPOINT}/notification`, {
      path: '/api/notification/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Admin] Notification socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Admin] Notification socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Admin] Notification socket error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

const notificationSocketService = new NotificationSocketService();
export default notificationSocketService;

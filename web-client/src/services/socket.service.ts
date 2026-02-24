"use client";
import { io, Socket } from "socket.io-client";
import envConfig from "@/config";
import { getAccessToken } from "@/utils/secureStorage";

type EventCallback = (...args: any[]) => void;

class SocketService {
    private socket: Socket | null = null;
    private eventHandlers: Map<string, Set<EventCallback>> = new Map();

    /**
     * Connect to the socket server
     */
    async connect(): Promise<void> {
        if (this.socket?.connected) {
            console.log("[Socket] Already connected");
            return;
        }

        const accessToken = getAccessToken();
        if (!accessToken) {
            console.warn("[Socket] No access token, cannot connect");
            return;
        }

        const socketUrl = envConfig.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:3000";

        this.socket = io(socketUrl, {
            auth: {
                token: accessToken,
            },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.socket.on("connect", () => {
            console.log("[Socket] Connected:", this.socket?.id);
        });

        this.socket.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });

        this.socket.on("connect_error", (error) => {
            console.error("[Socket] Connection error:", error.message);
        });
    }

    /**
     * Disconnect from the socket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.eventHandlers.clear();
            console.log("[Socket] Disconnected manually");
        }
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Subscribe to an event
     */
    on(event: string, callback: EventCallback): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)?.add(callback);

        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback?: EventCallback): void {
        if (callback) {
            this.eventHandlers.get(event)?.delete(callback);
            this.socket?.off(event, callback);
        } else {
            this.eventHandlers.delete(event);
            this.socket?.off(event);
        }
    }

    /**
     * Emit an event to the server
     */
    emit(event: string, data?: any): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn("[Socket] Cannot emit, socket not connected");
        }
    }

    /**
     * Get the socket instance
     */
    getSocket(): Socket | null {
        return this.socket;
    }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

"use client";

import { usePathname } from "next/navigation";
import { ReduxProvider } from "@/stores/provider";
import AuthTokenSync from "@/components/auth/AuthTokenSync";
import { ChatSocketProvider } from "@/contexts/ChatSocketContext";
import { CallProvider } from "@/contexts/CallContext";
import AIChatBox from "@/components/chat/AIChatBox";
import CallOverlay from "@/components/call/CallOverlay";
import { NotificationSocketProvider } from "@/contexts/NotificationSocketContext"

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/chat");

  // Suppress Antd React 19 compatibility warning
  if (typeof window !== "undefined") {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (
        args[0]?.includes?.("antd v5 support React is 16 ~ 18") ||
        args[0]?.includes?.("Hydration failed")
      ) {
        return;
      }
      originalError.apply(console, args);
    };
  }

  return (
    <ReduxProvider>
      <AuthTokenSync />
      <NotificationSocketProvider>
      <ChatSocketProvider>
        <CallProvider>
          {children}
          {!isChat && <AIChatBox />}
          <CallOverlay />
        </CallProvider>
      </ChatSocketProvider>
      </NotificationSocketProvider>
    </ReduxProvider>
  );
}
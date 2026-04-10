import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/stores/provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import NextTopLoader from "nextjs-toploader";
import GoogleAuthProviderWrapper from "@/components/auth/GoogleAuthProvider";
import AntdConfigProvider from "@/components/common/AntdConfigProvider";
import AuthTokenSync from "@/components/auth/AuthTokenSync";
import { ChatSocketProvider } from "@/contexts/ChatSocketContext";
import AIChatBox from "@/components/chat/AIChatBox";
import { NotificationSocketProvider } from "@/contexts/NotificationSocketContext";

// Suppress Antd React 19 compatibility warning and hydration mismatch
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Suppress Antd v5 React compatibility warning
    if (
      args[0]?.includes?.("antd v5 support React is 16 ~ 18") ||
      (typeof args[0] === "string" && args[0].includes("antd v5 support React"))
    ) {
      return;
    }
    // Suppress hydration mismatch warning from Ant Design
    if (
      typeof args[0] === "string" &&
      args[0].includes("Hydration failed because the server rendered HTML didn't match the client")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export const metadata: Metadata = {
  title: "Rental Platform",
  icons: {
    icon: "/assets/logo1.png",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AntdRegistry>
          <AntdConfigProvider>
            <NextTopLoader
              color="#5750F1"
              showSpinner={false}
              height={3}
              crawlSpeed={200}
              speed={200}
              easing="ease"
              shadow="0 0 10px #5750F1,0 0 5px #5750F1"
            />
            <GoogleAuthProviderWrapper>
              <ReduxProvider>
                <AuthTokenSync />
                <NotificationSocketProvider>
                <ChatSocketProvider>
                  {children}
                  <AIChatBox />
                </ChatSocketProvider>
                </NotificationSocketProvider>
              </ReduxProvider>
            </GoogleAuthProviderWrapper>
          </AntdConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}


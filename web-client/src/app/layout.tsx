import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/stores/provider";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import NextTopLoader from "nextjs-toploader";

// Suppress Antd React 19 compatibility warning
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.("antd v5 support React is 16 ~ 18") ||
      (typeof args[0] === "string" && args[0].includes("antd v5 support React"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export const metadata: Metadata = {
  title: "Rental Platform",
  icons: {
    icon: "/assets/image/logo.png",
  },
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
          <NextTopLoader
            color="#5750F1"
            showSpinner={false}
            height={3}
            crawlSpeed={200}
            speed={200}
            easing="ease"
            shadow="0 0 10px #5750F1,0 0 5px #5750F1"
          />
          <ReduxProvider>{children}</ReduxProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

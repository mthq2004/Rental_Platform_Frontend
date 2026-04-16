import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import NextTopLoader from "nextjs-toploader";
import GoogleAuthProviderWrapper from "@/components/auth/GoogleAuthProvider";
import AntdConfigProvider from "@/components/common/AntdConfigProvider";
import ClientWrapper from "@/components/layout/ClientWrapper";

export const metadata: Metadata = {
  title: "Rental Platform",
  description: "Your trust rental platform",
  icons: {
    icon: "/assets/logo1.png",
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
              {/* Bọc toàn bộ logic Client vào Wrapper này */}
              <ClientWrapper>
                {children}
              </ClientWrapper>
            </GoogleAuthProviderWrapper>
          </AntdConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
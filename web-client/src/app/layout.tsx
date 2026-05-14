import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import NextTopLoader from "nextjs-toploader";
import GoogleAuthProviderWrapper from "@/components/auth/GoogleAuthProvider";
import AntdConfigProvider from "@/components/common/AntdConfigProvider";
import ClientWrapper from "@/components/layout/ClientWrapper";
import ClickEffect from "@/components/common/ClickEffect";

export const metadata: Metadata = {
  metadataBase: new URL("http://rental-platform-iuh.duckdns.org"),

  title: {
    default: "Nền tảng cho thuê bất động sản, phòng trọ, nhà ở",
    template: "%s | Nền tảng cho thuê bất động sản",
  },

  description:
    "Nền tảng cho thuê bất động sản, phòng trọ, căn hộ, nhà ở uy tín tại Việt Nam. Hỗ trợ tìm phòng trọ giá rẻ, thuê nhà nhanh chóng, quản lý hợp đồng thuê và đặt phòng online tiện lợi.",

  keywords: [
    "cho thuê phòng trọ",
    "thuê phòng giá rẻ",
    "thuê nhà nguyên căn",
    "thuê căn hộ",
    "cho thuê bất động sản",
    "nền tảng thuê nhà online",
    "website cho thuê phòng",
    "app thuê phòng trọ",
    "tìm phòng trọ HCM",
    "thuê nhà Hồ Chí Minh",
    "thuê nhà Hà Nội",
    "phòng trọ sinh viên",
    "thuê căn hộ chung cư",
    "quản lý bất động sản",
    "hệ thống cho thuê nhà",
    "phần mềm quản lý cho thuê",
    "thuê nhà nhanh chóng",
    "đặt phòng online",
    "tìm nhà cho thuê",
    "thuê nhà uy tín Việt Nam",
    "rental platform Vietnam",
    "rental housing system",
  ],

  icons: {
    icon: "/logo1.png",
  },

  openGraph: {
    title: "Nền tảng cho thuê bất động sản, phòng trọ, nhà ở",
    description:
      "Tìm phòng trọ, căn hộ, nhà ở giá rẻ nhanh chóng. Hệ thống cho thuê bất động sản uy tín tại Việt Nam.",
    url: "http://rental-platform-iuh.duckdns.org",
    siteName: "Nền tảng cho thuê",
    images: [
      {
        url: "/assets/ho-chi-minh-city.png",
        width: 1200,
        height: 630,
        alt: "Nền tảng cho thuê bất động sản",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Nền tảng cho thuê bất động sản",
    description:
      "Tìm phòng trọ, thuê nhà, căn hộ giá rẻ nhanh chóng tại Việt Nam.",
    images: ["/assets/ho-chi-minh-city.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  alternates: {
    canonical: "http://rental-platform-iuh.duckdns.org",
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
            <ClickEffect />
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
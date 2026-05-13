"use client";

import FooterBottom from "@/components/layout/footer/FooterBottom";
import Header from "@/components/layout/Header";
import React from "react";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isChat = pathname.startsWith("/chat");
  const isKYC = pathname.startsWith("/kyc");
  const isTemplateContract = pathname.startsWith("/template-contracts");

  console.log("Test Deploy Mạch Ngọc Xuân!!!!!!!!!!!!!!!!!!");
  

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header />

      {/* Content */}
      <main className="flex-1 bg-white">
        {children}
      </main>

      {/* Footer */}
      {!isDashboard && !isChat && !isKYC && !isTemplateContract && <FooterBottom />}
    </div>
  );
};

export default MainLayout;
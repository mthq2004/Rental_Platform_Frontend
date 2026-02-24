"use client";

import FooterBottom from "@/components/layout/footer/FooterBottom";
import Header from "@/components/layout/Header";
import React from "react";
import { usePathname } from "next/navigation";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isChat = pathname.startsWith("/chat");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      {!isDashboard && <Header />}

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {!isDashboard && !isChat && <FooterBottom />}
    </div>
  );
};

export default MainLayout;
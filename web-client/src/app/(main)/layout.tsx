import FooterBottom from "@/components/layout/footer/FooterBottom";
import Header from "@/components/layout/Header";

import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      {children}
      <FooterBottom />
    </div>
  );
};

export default MainLayout;

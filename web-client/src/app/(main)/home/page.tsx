import React from "react";
import CategoryCards from "@/components/common/CategoryCards";
import PropertyListings from "@/components/common/PropertyListings";
import PriceReference from "@/components/common/PriceReference";
import FooterTop from "@/components/layout/footer/FooterTop";
import HeroSection from "@/components/common/section/HeroSection";
import ServicesSection from "@/components/common/section/ServicesSection";
import RegionSection from "@/components/common/section/RegionSection";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Category Cards */}
      <CategoryCards />

      {/* Utility Tools & Broker Services */}
      <ServicesSection />

      {/* Property Listings */}
      <PropertyListings />

      {/* Real Estate by Region */}
      <RegionSection />

      {/* Price Reference */}
      <PriceReference />

      {/* Footer CTA */}
      <FooterTop />
    </div>
  );
};

export default HomePage;

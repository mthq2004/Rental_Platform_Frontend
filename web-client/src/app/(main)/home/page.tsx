import React from "react";
import HeroSection from "@/components/common/HeroSection";
import CategoryCards from "@/components/common/CategoryCards";
import ServicesSection from "@/components/common/ServicesSection";
import PropertyListings from "@/components/common/PropertyListings";
import RegionSection from "@/components/common/RegionSection";
import PriceReference from "@/components/common/PriceReference";
import FooterTop from "@/components/layout/footer/FooterTop";

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

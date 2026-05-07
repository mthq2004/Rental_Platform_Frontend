import React, { Suspense } from "react";
import PropertyListings from "@/components/common/PropertyListings";
import PriceReference from "@/components/common/PriceReference";
import FooterTop from "@/components/layout/footer/FooterTop";
import HeroSection from "@/components/common/section/HeroSection";
import RegionSection from "@/components/common/section/RegionSection";
import MapSection from "@/components/common/section/MapSection";
import AuthExchangeHandler from "@/components/common/AuthExchangeHandler";

const HomePage = () => {

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <AuthExchangeHandler />
      </Suspense>
      {/* Hero Section with Search */}
      <HeroSection />

      {/* Property Listings */}
      <PropertyListings />

      {/* Real Estate by Region */}
      <RegionSection />

      {/* Map Section */}
      <MapSection />

      {/* Price Reference */}
      <PriceReference />

      {/* Footer CTA */}
      <FooterTop />
    </div>
  );
};

export default HomePage;

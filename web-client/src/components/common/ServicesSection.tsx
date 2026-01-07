"use client";
import React from "react";
import UtilityTools from "./UtilityTools";
import BrokerServices from "./BrokerServices";

const ServicesSection = () => {
  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UtilityTools />
          <BrokerServices />
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

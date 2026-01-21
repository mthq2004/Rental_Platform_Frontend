"use client";
import React from "react";
import PropertyCard from "@/components/property/PropertyCard";

const PropertyListings = () => {
  // Sample data - replace with API data
  const properties = [
    {
      id: "1",
      image: "/assets/image/property-1.jpg",
      title: "Căn hộ cao cấp 3PN view sông Sài Gòn, full nội thất",
      price: "4.5 tỷ",
      area: "120m²",
      location: "Quận 2, TP. Hồ Chí Minh",
    },
    {
      id: "2",
      image: "/assets/image/property-2.jpg",
      title: "Nhà phố mặt tiền đường lớn, tiện kinh doanh",
      price: "8.2 tỷ",
      area: "85m²",
      location: "Quận Bình Thạnh, TP. HCM",
    },
    {
      id: "3",
      image: "/assets/image/property-3.jpg",
      title: "Biệt thự song lập khu compound an ninh 24/7",
      price: "15 tỷ",
      area: "250m²",
      location: "Quận 7, TP. Hồ Chí Minh",
    },
    {
      id: "4",
      image: "/assets/image/property-4.jpg",
      title: "Căn hộ studio hiện đại, gần trung tâm",
      price: "1.8 tỷ",
      area: "45m²",
      location: "Quận Tân Bình, TP. HCM",
    },
    {
      id: "5",
      image: "/assets/image/property-5.jpg",
      title: "Đất nền dự án, sổ hồng riêng, hạ tầng hoàn thiện",
      price: "2.5 tỷ",
      area: "100m²",
      location: "TP. Thủ Đức, TP. HCM",
    },
  ];

  const handleToggleFavorite = (id: string) => {
    console.log("Toggle favorite:", id);
  };

  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1200px] px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Tin đăng dành cho bạn
          </h2>
          <a
            href="/tin-dang"
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Xem tất cả
          </a>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyListings;

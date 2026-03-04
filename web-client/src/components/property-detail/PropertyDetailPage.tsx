"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slug";

import type { PropertyDetailData } from "./types";
import StickyHeader from "./StickyHeader";
import ImageGallery from "./ImageGallery";
import PropertyInfo from "./PropertyInfo";
import PropertyTabs from "./PropertyTabs";
import SimilarListings from "./SimilarListings";
import OwnerSidebar from "./OwnerSidebar";
import CommentSection from "./CommentSection";

// Sample data – replace with API call
const SAMPLE_PROPERTY: PropertyDetailData = {
  id: "1",
  title: "TỔNG HỢP QUỸ CĂN GIÁ TỐT CHO THUÊ TẠI VINHOMES OCEAN PARK - GIA LÂM - HÀ NỘI (STUDIO -1N- 2N- 3N)",
  description:
    "Nhà phố mặt tiền khu dân cư văn minh và an ninh (khu Gia Viên). Trung tâm phường Tân Hiệp cũ (nay là phường Tam Hiệp). Để ở hoặc cho thuê đều rất phù hợp.\n\n*Tiện ích đầy đủ: bán kính 500m Bệnh viện Đồng Nai, Bệnh viện Nhi; Hệ thống Trường Đình Tiên Hoàng và các Trường khác; Siêu thị Lotte - BigC; Chợ truyền thống và các địa điểm vui chơi giải trí khác...\n\n- Diện tích: 75m² (5x15m)\n- Kết cấu: 1 trệt 2 lầu\n- 4 phòng ngủ, 5 phòng vệ sinh\n- Sổ hồng thổ cư hoàn công\n- Hướng Đông Nam, thoáng mát\n\nLiên hệ xem nhà trực tiếp để được tư vấn chi tiết.",
  propertyType: "house",
  listingType: "rent",
  pricePerMonth: 10000000,
  depositAmount: 20000000,
  depositMonths: 2,
  address: "Hẻm 136, Đường Đồng Khởi",
  ward: "Phường Tân Hiệp",
  district: "Thành phố Biên Hòa",
  city: "Đồng Nai",
  latitude: 10.9516,
  longitude: 106.8246,
  areaSqm: 75,
  bedrooms: 4,
  bathrooms: 5,
  livingRooms: 1,
  kitchens: 1,
  balconies: 2,
  floorNumber: 0,
  totalFloors: 3,
  furnitureStatus: "full",
  parkingFee: 0,
  managementFee: 0,
  electricityCostPerKwh: 3500,
  waterCostPerM3: 15000,
  minimumLeaseMonths: 12,
  maximumLeaseMonths: 60,
  availableFrom: "2026-03-01",
  hasFireCertificate: true,
  images: [
    { id: "1", uri: "/assets/image/property-1.jpg", isPrimary: true },
    { id: "2", uri: "/assets/image/property-2.jpg", isPrimary: false },
    { id: "3", uri: "/assets/image/property-3.jpg", isPrimary: false },
    { id: "4", uri: "/assets/image/property-4.jpg", isPrimary: false },
    { id: "5", uri: "/assets/image/property-5.jpg", isPrimary: false },
    { id: "6", uri: "/assets/image/property-1.jpg", isPrimary: false },
    { id: "7", uri: "/assets/image/property-2.jpg", isPrimary: false },
    { id: "8", uri: "/assets/image/property-3.jpg", isPrimary: false },
    { id: "9", uri: "/assets/image/property-4.jpg", isPrimary: false },
    { id: "10", uri: "/assets/image/property-5.jpg", isPrimary: false },
    { id: "11", uri: "/assets/image/property-1.jpg", isPrimary: false },
    { id: "12", uri: "/assets/image/property-2.jpg", isPrimary: false },
    { id: "13", uri: "/assets/image/property-3.jpg", isPrimary: false },
  ],
  videos: [],
  amenities: ["Hồ bơi", "Phòng gym", "An ninh 24/7", "Thang máy", "Chỗ đỗ xe", "Sân vườn"],
  rules: [
    { text: "Không nuôi thú cưng", order: 1 },
    { text: "Không hút thuốc trong nhà", order: 2 },
    { text: "Giữ yên lặng sau 22h", order: 3 },
  ],
  status: "active",
  approvalStatus: "approved",
  createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  user: {
    id: "u1",
    fullName: "Trần Ngọc Nghĩa",
    avatarUrl: "",
    phone: "093345 ***",
    userType: "personal",
    totalListings: 1,
    joinedYears: 6,
    lastActive: "8 giờ trước",
    responseRate: "---",
  },
};

interface PropertyDetailPageProps {
  slug: string;
}

export default function PropertyDetailPage({ slug }: PropertyDetailPageProps) {
  const router = useRouter();
  const propertyId = extractIdFromSlug(slug) || slug;
  const [property, setProperty] = useState<PropertyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Fetch property data
  useEffect(() => {
    // TODO: Replace with actual API call
    // const fetchProperty = async () => {
    //   try {
    //     const res = await http.get(`/properties/${propertyId}`);
    //     setProperty(res.data);
    //   } catch (error) {
    //     console.error("Failed to fetch property:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchProperty();

    // Simulated load
    const timer = setTimeout(() => {
      setProperty({ ...SAMPLE_PROPERTY, id: propertyId });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [propertyId]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (infoRef.current) {
        const rect = infoRef.current.getBoundingClientRect();
        setShowStickyHeader(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading skeleton
  if (loading || !property) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-300 mx-auto px-4 py-6">
          {/* Gallery skeleton */}
          <div className="animate-pulse">
            <div className="h-[450px] bg-gray-200 rounded-xl mb-4" />
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex-1 animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-60 bg-gray-200 rounded-xl" />
            </div>
            <div className="w-80 shrink-0 hidden lg:block animate-pulse space-y-4">
              <div className="h-60 bg-gray-200 rounded-xl" />
              <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky header */}
      <StickyHeader property={property} visible={showStickyHeader} />

      <div className="max-w-300 mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1 flex-wrap">
          <span
            className="hover:text-blue-500 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Trang chủ
          </span>
          <span>/</span>
          <span
            className="hover:text-blue-500 cursor-pointer"
            onClick={() => router.push("/search")}
          >
            Cho thuê nhà đất
          </span>
          <span>/</span>
          <span
            className="hover:text-blue-500 cursor-pointer"
            onClick={() =>
              router.push(`/search?city=${encodeURIComponent(property.city)}`)
            }
          >
            {property.city}
          </span>
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1">
            {property.title}
          </span>
        </nav>

        {/* Image gallery */}
        <ImageGallery images={property.images} title={property.title} />

        {/* Main content */}
        <div className="flex gap-6 mt-6" ref={infoRef}>
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <PropertyInfo property={property} />
            <PropertyTabs property={property} />
            <SimilarListings currentPropertyId={property.id} city={property.city} />
          </div>

          {/* Right sidebar */}
          <div className="w-80 shrink-0 hidden lg:block">
            <OwnerSidebar owner={property.user} propertyId={property.id} />
            <CommentSection propertyId={property.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

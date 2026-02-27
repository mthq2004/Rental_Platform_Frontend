"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/property/PropertyCard";

const PropertyListings = () => {
  const router = useRouter();

  // Dữ liệu mẫu khớp với hình ảnh bạn cung cấp
  const allProperties = [
    {
      id: "1",
      image: "/assets/image/property-1.jpg",
      title: "Bán biệt thự Vinhomes Wonder City Đan Phượng, BM-90: 228m2,...",
      price: "55 tỷ",
      area: "228 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP", // Màu vàng
      time: "Đăng hôm qua"
    },
    {
      id: "2",
      image: "/assets/image/property-2.jpg",
      title: "VINHOMES ĐAN PHƯỢNG CHIẾT KHẤU 7% MỪNG XUÂN BÍNH...",
      price: "Giá thỏa thuận",
      area: "288 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "Vip", // Màu xanh
      time: "Đăng 4 ngày trước"
    },
    {
      id: "3",
      image: "/assets/image/property-3.jpg",
      title: "Biệt thự song lập 228m2 tặng thêm 7% + xe VF8 + miễn 3 năm...",
      price: "37,9 tỷ",
      area: "228 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "Vip",
      time: "Đăng 6 ngày trước"
    },
    {
      id: "4",
      image: "/assets/image/property-4.jpg",
      title: "Nóng! Quỹ 30 căn khai xuân chiết khấu đến 7% chỉ có trong tháng...",
      price: "23 tỷ",
      area: "120 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "Vip",
      time: "Đăng 6 ngày trước"
    },
    {
      id: "5",
      image: "/assets/image/property-5.jpg",
      title: "Gấp! Chiết khấu đặc biệt cuối năm 2 tỷ đồng cho biệt thự, liền...",
      price: "38 tỷ",
      area: "228 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "Vip",
      time: "Đăng 6 ngày trước"
    },
    {
      id: "6",
      image: "/assets/image/property-6.jpg",
      title: "Bán gấp! Duy nhất 01 căn góc Đông Nam - đường 13m sát cụm...",
      price: "Giá thỏa thuận",
      area: "120 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "Vip",
      time: "Đăng 1 tuần trước"
    },
    {
      id: "7",
      image: "/assets/image/property-7.jpg",
      title: "Giảm sâu 30% so với thị trường căn TĐ - 01 Suất ngoại giao",
      price: "60 tỷ",
      area: "147 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: false,
      time: "Đăng hôm qua"
    },
    {
      id: "8",
      image: "/assets/image/property-8.jpg",
      title: "Quỹ hàng ngoại giao chiết khấu 25%, tặng xe điện...",
      price: "17 tỷ",
      area: "120 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng hôm qua"
    },
    {
      id: "9",
      image: "/assets/image/property-9.jpg",
      title: "10 SUẤT NGOẠI GIAO GIÁ TỐT TẠI VINHOMES ĐAN PHƯỢNG...",
      price: "41,9 tỷ",
      area: "228 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng hôm qua"
    },
    {
      id: "10",
      image: "/assets/image/property-10.jpg",
      title: "Quỹ căn ngoại giao trực tiếp CĐT Vinhomes chiết...",
      price: "18,1 tỷ",
      area: "120 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng hôm qua"
    },
    {
      id: "11",
      image: "/assets/image/property-11.jpg",
      title: "Quỹ căn chính chủ bán thu hồi vốn liền kề 96-120m2 gi...",
      price: "16,3 tỷ",
      area: "96 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng hôm qua"
    },
    {
      id: "12",
      image: "/assets/image/property-12.jpg",
      title: "Quỹ biệt thự CĐT chiết khấu khủng chỉ 135tr/m2 đất, qu...",
      price: "38,5 tỷ",
      area: "288 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng 2 ngày trước"
    },
    {
      id: "13",
      image: "/assets/image/property-13.jpg",
      title: "FULL HÀNG CHUYỂN NHƯỢNG LK - BT CHỦ NHÀ CẦN BÁN GẤP...",
      price: "16,3 tỷ",
      area: "96 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng 3 ngày trước"
    },
    {
      id: "14",
      image: "/assets/image/property-14.jpg",
      title: "QUỸ CĂN HOT VINHOMES WONDER CITY. CK KHỦNG TỪ 1...",
      price: "19,5 tỷ",
      area: "120 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng 3 ngày trước"
    },
    {
      id: "15",
      image: "/assets/image/property-15.jpg",
      title: "Quỹ căn chuyển nhượng chủ nhà bán hoà vốn! giá chỉ từ 17 tỉ...",
      price: "18 tỷ",
      area: "96 m²",
      location: "Đan Phượng, Hà Nội",
      isVip: true,
      vipType: "VIP",
      time: "Đăng hôm qua"
    }
  ];

  // Logic quản lý hiển thị
  const [visibleCount, setVisibleCount] = useState(8); // Mặc định hiện 8 căn (2 hàng)
  const SHOW_STEP = 8; // Mỗi lần mở rộng thêm 8 căn

  const handleToggleFavorite = (id: string) => {
    console.log("Toggle favorite:", id);
  };

  const handleExpand = () => {
    setVisibleCount(prev => prev + SHOW_STEP);
  };

  const handleSeeMore = () => {
    router.push("/search"); // Chuyển trang khi bấm "Xem tiếp"
  };

  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1214px] px-4">
        {/* Header giống ảnh mẫu */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Bất động sản dành cho bạn
          </h2>
          <div className="hidden md:flex gap-4 text-sm text-gray-600">
            <span className="cursor-pointer hover:underline">Tin nhà đất cho thuê mới nhất</span>
          </div>
        </div>

        {/* Grid hiển thị 4 cột trên desktop để giống ảnh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allProperties.slice(0, visibleCount).map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>

        {/* Nút điều hướng */}
        <div className="mt-8 flex justify-center">
          {visibleCount < allProperties.length ? (
            <button
              onClick={handleExpand}
              className="group flex items-center gap-2 px-8 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
            >
              Mở rộng
              <svg 
                className="w-4 h-4 text-gray-400 group-hover:translate-y-0.5 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSeeMore}
              className="px-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
            >
              Xem tiếp
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PropertyListings;
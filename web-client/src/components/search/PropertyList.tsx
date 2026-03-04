"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Pagination, Select, Skeleton } from "antd";
import { SortAscendingOutlined } from "@ant-design/icons";
import type { SearchFilters } from "./SearchPage";
import http from "@/utils/api";
import PropertySearchCard from "./PropertySearchCard";

interface PropertyListProps {
  filters: SearchFilters;
  onPageChange: (page: number) => void;
}

interface PropertyItem {
  id: string;
  title: string;
  pricePerMonth: number;
  areaSqm: number;
  address: string;
  district: string;
  city: string;
  description: string;
  images: { id: string; uri: string; isPrimary: boolean }[];
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  furnitureStatus: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string;
    phone: string;
  };
  isVip?: boolean;
  vipLevel?: string;
}

// Sample data for demo - will be replaced by API
const SAMPLE_PROPERTIES: PropertyItem[] = [
  {
    id: "1",
    title: "TỔNG HỢP QUỸ CĂN GIÁ TỐT CHO THUÊ TẠI VINHOMES OCEAN PARK - GIA LÂM - HÀ NỘI (STUDIO -1N- 2N- 3N)",
    pricePerMonth: 5000000,
    areaSqm: 43,
    address: "Vinhomes Ocean Park",
    district: "Gia Lâm",
    city: "Hà Nội",
    description: "Quỹ căn cho thuê, chuyên nhượng tìm theo yêu cầu khách hàng. ĐC: Vinhomes Ocean Park - Gia Lâm - Hà Nội. - Studio nguyên bản từ: 4tr5. Full đồ: 5tr5. - 1PN nguyên bản từ 5tr. Full đồ từ: 6tr.",
    images: [
      { id: "1", uri: "/assets/image/property-1.jpg", isPrimary: true },
      { id: "2", uri: "/assets/image/property-2.jpg", isPrimary: false },
      { id: "3", uri: "/assets/image/property-3.jpg", isPrimary: false },
      { id: "4", uri: "/assets/image/property-4.jpg", isPrimary: false },
    ],
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "apartment",
    furnitureStatus: "full",
    createdAt: new Date().toISOString(),
    user: {
      id: "u1",
      fullName: "Trần Liên",
      avatarUrl: "",
      phone: "0989 821 ***",
    },
    isVip: true,
    vipLevel: "diamond",
  },
  {
    id: "2",
    title: "CHÍNH CHỦ CHO THUÊ NHÀ TẠI NGÕ 255 NGUYỄN KHANG, YÊN HÒA, HÀ NỘI - 80M2 2 TẦNG GIÁ RẺ TIỆN NGHI",
    pricePerMonth: 10000000,
    areaSqm: 80,
    address: "Ngõ 255 Nguyễn Khang",
    district: "Cầu Giấy",
    city: "Hà Nội",
    description: "CHÍNH CHỦ CHO THUÊ NHÀ TẠI NGÕ 255 NGUYỄN KHANG, YÊN HÒA Diện tích: 2 tầng tổng gần 80m², 2 toilet. Vị trí: Mặt ngõ rộng 2.5m, cách đường ô tô 50m (nhà mới tinh vừa xây xong)",
    images: [
      { id: "5", uri: "/assets/image/property-3.jpg", isPrimary: true },
      { id: "6", uri: "/assets/image/property-4.jpg", isPrimary: false },
    ],
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "house",
    furnitureStatus: "basic",
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    user: {
      id: "u2",
      fullName: "Nguyễn Phương Lan",
      avatarUrl: "",
      phone: "0986 377 ***",
    },
    isVip: true,
    vipLevel: "diamond",
  },
  {
    id: "3",
    title: "Cho thuê căn hộ 2PN full nội thất tại Times City - 458 Minh Khai, Hai Bà Trưng, Hà Nội",
    pricePerMonth: 12000000,
    areaSqm: 75,
    address: "458 Minh Khai",
    district: "Hai Bà Trưng",
    city: "Hà Nội",
    description: "Căn hộ 2 phòng ngủ full nội thất cao cấp, view đẹp, thoáng mát. Tiện ích đầy đủ: bể bơi, gym, siêu thị, trường học ngay trong khu đô thị.",
    images: [
      { id: "7", uri: "/assets/image/property-5.jpg", isPrimary: true },
      { id: "8", uri: "/assets/image/property-1.jpg", isPrimary: false },
      { id: "9", uri: "/assets/image/property-2.jpg", isPrimary: false },
    ],
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "apartment",
    furnitureStatus: "full",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: {
      id: "u3",
      fullName: "Nguyễn Thị Kim Thảo",
      avatarUrl: "",
      phone: "0981 725 ***",
    },
    isVip: false,
  },
  {
    id: "4",
    title: "Phòng trọ cao cấp quận Thanh Xuân, full nội thất, giá rẻ, gần Ngã Tư Sở",
    pricePerMonth: 3500000,
    areaSqm: 25,
    address: "Ngã Tư Sở",
    district: "Thanh Xuân",
    city: "Hà Nội",
    description: "Phòng trọ mới xây, sạch sẽ, an ninh. Đầy đủ nội thất: điều hòa, nóng lạnh, giường, tủ, bàn ghế. Gần chợ, trường học, bệnh viện.",
    images: [
      { id: "10", uri: "/assets/image/property-4.jpg", isPrimary: true },
    ],
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "room",
    furnitureStatus: "full",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    user: {
      id: "u4",
      fullName: "Lê Văn Minh",
      avatarUrl: "",
      phone: "0912 456 ***",
    },
    isVip: false,
  },
  {
    id: "5",
    title: "Cho thuê mặt bằng kinh doanh 120m2 mặt phố Trần Đại Nghĩa, Hai Bà Trưng",
    pricePerMonth: 25000000,
    areaSqm: 120,
    address: "Trần Đại Nghĩa",
    district: "Hai Bà Trưng",
    city: "Hà Nội",
    description: "Mặt bằng kinh doanh rộng rãi, vị trí đắc địa. Phù hợp làm nhà hàng, quán cafe, showroom. Mặt tiền rộng 8m, có chỗ đỗ xe.",
    images: [
      { id: "11", uri: "/assets/image/property-2.jpg", isPrimary: true },
      { id: "12", uri: "/assets/image/property-3.jpg", isPrimary: false },
    ],
    bedrooms: 0,
    bathrooms: 2,
    propertyType: "office",
    furnitureStatus: "empty",
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    user: {
      id: "u5",
      fullName: "Hoàng Anh Tuấn",
      avatarUrl: "",
      phone: "0978 234 ***",
    },
    isVip: true,
    vipLevel: "gold",
  },
  {
    id: "6",
    title: "Studio cao cấp Vinhomes Smart City, full đồ, free dịch vụ tháng đầu",
    pricePerMonth: 6000000,
    areaSqm: 30,
    address: "Vinhomes Smart City",
    district: "Nam Từ Liêm",
    city: "Hà Nội",
    description: "Studio full nội thất cao cấp. Free 1 tháng dịch vụ. Tiện ích đầy đủ: bể bơi, gym, công viên, trung tâm thương mại.",
    images: [
      { id: "13", uri: "/assets/image/property-1.jpg", isPrimary: true },
      { id: "14", uri: "/assets/image/property-5.jpg", isPrimary: false },
      { id: "15", uri: "/assets/image/property-3.jpg", isPrimary: false },
    ],
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "apartment",
    furnitureStatus: "luxury",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    user: {
      id: "u6",
      fullName: "Phạm Thu Hà",
      avatarUrl: "",
      phone: "0967 890 ***",
    },
    isVip: false,
  },
];

export default function PropertyList({ filters, onPageChange }: PropertyListProps) {
  const [properties, setProperties] = useState<PropertyItem[]>(SAMPLE_PROPERTIES);
  const [total, setTotal] = useState(938 * 20); // Demo total
  const [loading, setLoading] = useState(false);

  // Sort select
  const [sortBy, setSortBy] = useState(filters.sortBy);

  // TODO: Replace with actual API call
  // useEffect(() => {
  //   const fetchProperties = async () => {
  //     setLoading(true);
  //     try {
  //       const params = new URLSearchParams();
  //       if (filters.keyword) params.set("keyword", filters.keyword);
  //       if (filters.propertyType) params.set("propertyType", filters.propertyType);
  //       if (filters.priceMin !== null) params.set("priceMin", String(filters.priceMin));
  //       if (filters.priceMax !== null) params.set("priceMax", String(filters.priceMax));
  //       if (filters.areaMin !== null) params.set("areaMin", String(filters.areaMin));
  //       if (filters.areaMax !== null) params.set("areaMax", String(filters.areaMax));
  //       params.set("page", String(filters.page));
  //       params.set("pageSize", String(filters.pageSize));
  //       params.set("sortBy", filters.sortBy);
  //
  //       const res = await http.get(`/properties/search?${params.toString()}`);
  //       setProperties(res.data.items);
  //       setTotal(res.data.total);
  //     } catch (error) {
  //       console.error("Failed to fetch properties:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchProperties();
  // }, [filters]);

  // Skeleton loading
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm p-4 flex gap-4 animate-pulse"
          >
            <div className="w-75 h-50 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="flex justify-between items-center mt-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Sort bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <input type="checkbox" className="accent-blue-500" />
            Nhận email tin mới
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SortAscendingOutlined className="text-gray-400" />
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            className="w-40"
            size="small"
            options={[
              { value: "newest", label: "Mặc định" },
              { value: "price_asc", label: "Giá tăng dần" },
              { value: "price_desc", label: "Giá giảm dần" },
              { value: "area_asc", label: "Diện tích tăng" },
              { value: "area_desc", label: "Diện tích giảm" },
              { value: "created_desc", label: "Mới nhất" },
            ]}
          />
        </div>
      </div>

      {/* Property cards */}
      <div className="space-y-4">
        {properties.map((property) => (
          <PropertySearchCard key={property.id} property={property} />
        ))}
      </div>

      {/* Empty state */}
      {properties.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Không tìm thấy bất động sản phù hợp
          </h3>
          <p className="text-sm text-gray-500">
            Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      )}

      {/* Pagination */}
      {properties.length > 0 && (
        <div className="flex justify-center mt-8 mb-4">
          <Pagination
            current={filters.page}
            total={total}
            pageSize={filters.pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} / ${total} tin`
            }
          />
        </div>
      )}
    </div>
  );
}

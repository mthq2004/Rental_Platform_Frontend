"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  DollarOutlined,
  ColumnWidthOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
} from "@ant-design/icons";
import type { SearchFilters } from "./SearchPage";

interface SidebarFilterProps {
  filters: SearchFilters;
  onFilterChange: (partial: Partial<SearchFilters>) => void;
}

const PRICE_RANGES = [
  { label: "Thỏa thuận", min: 0, max: 0 },
  { label: "Dưới 1 triệu", min: null, max: 1000000 },
  { label: "1 - 3 triệu", min: 1000000, max: 3000000 },
  { label: "3 - 5 triệu", min: 3000000, max: 5000000 },
  { label: "5 - 10 triệu", min: 5000000, max: 10000000 },
  { label: "10 - 40 triệu", min: 10000000, max: 40000000 },
  { label: "40 - 70 triệu", min: 40000000, max: 70000000 },
  { label: "70 - 100 triệu", min: 70000000, max: 100000000 },
  { label: "Trên 100 triệu", min: 100000000, max: null },
];

const AREA_RANGES = [
  { label: "Dưới 30 m²", min: null, max: 30 },
  { label: "30 - 50 m²", min: 30, max: 50 },
  { label: "50 - 80 m²", min: 50, max: 80 },
  { label: "80 - 100 m²", min: 80, max: 100 },
  { label: "100 - 150 m²", min: 100, max: 150 },
  { label: "150 - 200 m²", min: 150, max: 200 },
  { label: "200 - 250 m²", min: 200, max: 250 },
  { label: "Trên 250 m²", min: 250, max: null },
];

export default function SidebarFilter({
  filters,
  onFilterChange,
}: SidebarFilterProps) {
  const router = useRouter();
  const isPriceActive = (min: number | null, max: number | null) =>
    filters.priceMin === min && filters.priceMax === max;

  const isAreaActive = (min: number | null, max: number | null) =>
    filters.areaMin === min && filters.areaMax === max;

  return (
    <div className="space-y-4 sticky top-32">
      {/* Price filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
            <DollarOutlined className="text-blue-500 text-xs" />
          </div>
          Lọc theo khoảng giá
        </h3>

        <div className="space-y-0.5">
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() =>
                onFilterChange({ priceMin: range.min, priceMax: range.max })
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                ${isPriceActive(range.min, range.max)
                  ? "bg-blue-50 text-blue-600 font-medium border-l-3 border-blue-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-500 hover:pl-4"
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
            <ColumnWidthOutlined className="text-blue-500 text-xs" />
          </div>
          Lọc theo diện tích
        </h3>

        <div className="space-y-0.5">
          {AREA_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() =>
                onFilterChange({ areaMin: range.min, areaMax: range.max })
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                ${isAreaActive(range.min, range.max)
                  ? "bg-blue-50 text-blue-600 font-medium border-l-3 border-blue-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-500 hover:pl-4"
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Professional CTA Box */}
      <div className="bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl p-5 shadow-lg shadow-blue-200/50 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <PhoneOutlined className="text-white text-sm" />
          </div>
          <h4 className="font-bold text-sm">Cần tư vấn?</h4>
        </div>
        <p className="text-xs text-white/80 mb-4 leading-relaxed">
          Đội ngũ chuyên gia bất động sản sẵn sàng hỗ trợ bạn tìm kiếm không gian phù hợp nhất.
        </p>
        <button
          onClick={() => router.push("/chat")}
          className="w-full bg-white text-blue-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-50 active:scale-[0.98] transition-all duration-200 shadow-sm"
        >
          Liên hệ tư vấn
        </button>
      </div>

      {/* Trust badges */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Cam kết dịch vụ</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <SafetyCertificateOutlined className="text-green-500 text-sm" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">Tin đăng xác thực</p>
              <p className="text-[11px] text-gray-400">Thông tin được kiểm duyệt</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <StarOutlined className="text-amber-500 text-sm" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">Hỗ trợ 24/7</p>
              <p className="text-[11px] text-gray-400">Sẵn sàng giải đáp thắc mắc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

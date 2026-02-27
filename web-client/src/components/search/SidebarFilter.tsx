"use client";

import React from "react";
import { DollarOutlined, ColumnWidthOutlined } from "@ant-design/icons";
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
  const isPriceActive = (min: number | null, max: number | null) =>
    filters.priceMin === min && filters.priceMax === max;

  const isAreaActive = (min: number | null, max: number | null) =>
    filters.areaMin === min && filters.areaMax === max;

  return (
    <div className="space-y-4 sticky top-32">
      {/* Price filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarOutlined className="text-blue-500" />
          Lọc theo khoảng giá
        </h3>

        <div className="space-y-1">
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() =>
                onFilterChange({ priceMin: range.min, priceMax: range.max })
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                ${isPriceActive(range.min, range.max)
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ColumnWidthOutlined className="text-blue-500" />
          Lọc theo diện tích
        </h3>

        <div className="space-y-1">
          {AREA_RANGES.map((range, idx) => (
            <button
              key={idx}
              onClick={() =>
                onFilterChange({ areaMin: range.min, areaMax: range.max })
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                ${isAreaActive(range.min, range.max)
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-blue-500"
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Helpful CTA */}
      <div className="bg-linear-to-br from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-100">
        <h4 className="font-semibold text-gray-800 text-sm mb-2">
          Bạn cần tư vấn?
        </h4>
        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
          Liên hệ với chúng tôi để được hỗ trợ tìm kiếm bất động sản phù hợp nhất.
        </p>
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg transition-colors">
          Liên hệ ngay
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FilterOutlined,
  HomeOutlined,
  DollarOutlined,
  ColumnWidthOutlined,
  DownOutlined,
  CheckOutlined,
  CloseOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import type { SearchFilters } from "./SearchPage";
import FilterDrawer from "./FilterDrawer";

interface FilterBarProps {
  filters: SearchFilters;
  onFilterChange: (partial: Partial<SearchFilters>) => void;
}

const PROPERTY_TYPES = [
  { value: "", label: "Tất cả" },
  { value: "apartment", label: "Chung cư / Căn hộ" },
  { value: "house", label: "Nhà ở" },
  { value: "room", label: "Phòng trọ" },
  { value: "office", label: "Văn phòng" },
  { value: "land", label: "Đất" },
];

const PRICE_RANGES = [
  { label: "Tất cả mức giá", min: null, max: null },
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
  { label: "Tất cả diện tích", min: null, max: null },
  { label: "Dưới 30 m²", min: null, max: 30 },
  { label: "30 - 50 m²", min: 30, max: 50 },
  { label: "50 - 80 m²", min: 50, max: 80 },
  { label: "80 - 100 m²", min: 80, max: 100 },
  { label: "100 - 150 m²", min: 100, max: 150 },
  { label: "150 - 200 m²", min: 150, max: 200 },
  { label: "200 - 250 m²", min: 200, max: 250 },
  { label: "Trên 250 m²", min: 250, max: null },
];

type DropdownType = "propertyType" | "price" | "area" | "sort" | null;

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
  { value: "area_asc", label: "Diện tích tăng" },
  { value: "area_desc", label: "Diện tích giảm" },
];

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleDropdown = (type: DropdownType) => {
    setOpenDropdown((prev) => (prev === type ? null : type));
  };

  const getPriceLabel = () => {
    const match = PRICE_RANGES.find(
      (r) => r.min === filters.priceMin && r.max === filters.priceMax
    );
    if (match && (match.min !== null || match.max !== null)) return match.label;
    if (filters.priceMin !== null || filters.priceMax !== null) {
      const minStr = filters.priceMin ? `${(filters.priceMin / 1000000).toFixed(0)} tr` : "0";
      const maxStr = filters.priceMax ? `${(filters.priceMax / 1000000).toFixed(0)} tr` : "∞";
      return `${minStr} - ${maxStr}`;
    }
    return "Khoảng giá";
  };

  const getAreaLabel = () => {
    const match = AREA_RANGES.find(
      (r) => r.min === filters.areaMin && r.max === filters.areaMax
    );
    return match && match.min !== null ? match.label : "Diện tích";
  };

  const getSortLabel = () => {
    return SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? "Sắp xếp";
  };

  const getTypeLabel = () => {
    const match = PROPERTY_TYPES.find(
      (t) => t.value === filters.propertyType
    );
    return match && match.value ? match.label : "Loại nhà đất";
  };

  const activeFilterCount = [
    filters.propertyType,
    filters.priceMin !== null || filters.priceMax !== null,
    filters.areaMin !== null || filters.areaMax !== null,
  ].filter(Boolean).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mt-4" ref={dropdownRef}>
        {/* Filter drawer button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 border border-blue-200 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 hover:border-blue-300 transition-all text-sm font-semibold text-blue-600 shadow-sm"
        >
          <FilterOutlined />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ml-1 font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Property type dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("propertyType")}
            className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl bg-white hover:border-blue-400 hover:text-blue-500 transition-all text-sm font-medium shadow-sm ${openDropdown === "propertyType" ? "border-blue-400 text-blue-500 shadow-md" : "border-gray-200"}`}
          >
            <HomeOutlined />
            {getTypeLabel()}
            <DownOutlined className={`text-xs ml-1 transition-transform duration-200 ${openDropdown === "propertyType" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "propertyType" && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    onFilterChange({ propertyType: type.value });
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${filters.propertyType === type.value ? "text-blue-500 font-medium bg-blue-50/50" : "text-gray-700"}`}
                >
                  {type.label}
                  {filters.propertyType === type.value && (
                    <CheckOutlined className="text-blue-500 text-xs" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("price")}
            className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl bg-white hover:border-blue-400 hover:text-blue-500 transition-all text-sm font-medium shadow-sm ${openDropdown === "price" ? "border-blue-400 text-blue-500 shadow-md" : "border-gray-200"}`}
          >
            <DollarOutlined />
            {getPriceLabel()}
            <DownOutlined className={`text-xs ml-1 transition-transform duration-200 ${openDropdown === "price" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "price" && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
              {PRICE_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onFilterChange({
                      priceMin: range.min,
                      priceMax: range.max,
                    });
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${filters.priceMin === range.min && filters.priceMax === range.max ? "text-blue-500 font-medium bg-blue-50/50" : "text-gray-700"}`}
                >
                  {range.label}
                  {filters.priceMin === range.min &&
                    filters.priceMax === range.max && (
                      <CheckOutlined className="text-blue-500 text-xs" />
                    )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Area dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("area")}
            className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl bg-white hover:border-blue-400 hover:text-blue-500 transition-all text-sm font-medium shadow-sm ${openDropdown === "area" ? "border-blue-400 text-blue-500 shadow-md" : "border-gray-200"}`}
          >
            <ColumnWidthOutlined />
            {getAreaLabel()}
            <DownOutlined className={`text-xs ml-1 transition-transform duration-200 ${openDropdown === "area" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "area" && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
              {AREA_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onFilterChange({
                      areaMin: range.min,
                      areaMax: range.max,
                    });
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${filters.areaMin === range.min && filters.areaMax === range.max ? "text-blue-500 font-medium bg-blue-50/50" : "text-gray-700"}`}
                >
                  {range.label}
                  {filters.areaMin === range.min &&
                    filters.areaMax === range.max && (
                      <CheckOutlined className="text-blue-500 text-xs" />
                    )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active filter tags */}
        {(filters.propertyType ||
          filters.priceMin !== null ||
          filters.areaMin !== null) && (
          <button
            onClick={() =>
              onFilterChange({
                propertyType: "",
                priceMin: null,
                priceMax: null,
                areaMin: null,
                areaMax: null,
              })
            }
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors ml-1"
          >
            <CloseOutlined className="text-xs" />
            Xóa bộ lọc
          </button>
        )}

        {/* Sort dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => toggleDropdown("sort")}
            className={`flex items-center gap-1.5 border px-4 py-2 rounded-xl bg-white hover:border-blue-400 hover:text-blue-500 transition-all text-sm font-medium shadow-sm ${openDropdown === "sort" ? "border-blue-400 text-blue-500 shadow-md" : "border-gray-200"}`}
          >
            <SortAscendingOutlined />
            {getSortLabel()}
            <DownOutlined className={`text-xs ml-1 transition-transform duration-200 ${openDropdown === "sort" ? "rotate-180" : ""}`} />
          </button>

          {openDropdown === "sort" && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange({ sortBy: opt.value });
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${filters.sortBy === opt.value ? "text-blue-500 font-medium bg-blue-50/50" : "text-gray-700"}`}
                >
                  {opt.label}
                  {filters.sortBy === opt.value && (
                    <CheckOutlined className="text-blue-500 text-xs" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFilterChange={onFilterChange}
      />
    </>
  );
}

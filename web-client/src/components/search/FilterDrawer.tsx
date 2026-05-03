"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CloseOutlined,
  HomeOutlined,
  DollarOutlined,
  ColumnWidthOutlined,
  CheckOutlined,
  UndoOutlined,
  AppstoreOutlined,
  BankOutlined,
  ShopOutlined,
  GoldOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { LuDoorOpen } from "react-icons/lu";
import type { SearchFilters } from "./SearchPage";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFilterChange: (partial: Partial<SearchFilters>) => void;
}

const PROPERTY_TYPES: {
  value: string;
  label: string;
  icon: React.ReactNode;
}[] = [
    { value: "", label: "Tất cả", icon: <AppstoreOutlined className="text-xl text-blue-500" /> },
    { value: "apartment", label: "Chung cư / Căn hộ", icon: <BankOutlined className="text-xl text-blue-500" /> },
    { value: "house", label: "Nhà ở", icon: <HomeOutlined className="text-xl text-blue-500" /> },
    { value: "room", label: "Phòng trọ", icon: <LuDoorOpen className="text-xl text-blue-500" /> },
    { value: "office", label: "Văn phòng", icon: <ShopOutlined className="text-xl text-blue-500" /> },
    { value: "land", label: "Đất", icon: <GlobalOutlined className="text-xl text-blue-500" /> },
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

// Price slider config
const PRICE_STEP = 500000; // 500k step
const PRICE_MIN = 0;
const PRICE_MAX = 100000000; // 100 triệu

function formatPriceLabel(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} tr`;
  }
  return `${(value / 1000).toFixed(0)}k`;
}

function formatPriceDisplay(value: number): string {
  if (value === 0) return "Thỏa thuận";
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} triệu`;
  }
  return `${value.toLocaleString("vi-VN")} đ`;
}

// Custom Dual Range Slider Component
function PriceRangeSlider({
  minValue,
  maxValue,
  onChange,
}: {
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);

  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
  }, [minValue, maxValue]);

  const getPercent = (value: number) => ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = PRICE_MIN + percent * (PRICE_MAX - PRICE_MIN);
    return Math.round(raw / PRICE_STEP) * PRICE_STEP;
  }, []);

  const handlePointerDown = useCallback((type: "min" | "max") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(type);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const val = getValueFromPosition(e.clientX);
    if (dragging === "min") {
      const clamped = Math.min(val, localMax - PRICE_STEP);
      setLocalMin(Math.max(PRICE_MIN, clamped));
    } else {
      const clamped = Math.max(val, localMin + PRICE_STEP);
      setLocalMax(Math.min(PRICE_MAX, clamped));
    }
  }, [dragging, localMin, localMax, getValueFromPosition]);

  const handlePointerUp = useCallback(() => {
    if (dragging) {
      onChange(localMin, localMax);
      setDragging(null);
    }
  }, [dragging, localMin, localMax, onChange]);

  const minPercent = getPercent(localMin);
  const maxPercent = getPercent(localMax);

  // Price tick marks
  const ticks = [0, 5000000, 10000000, 20000000, 40000000, 70000000, 100000000];

  return (
    <div className="pt-2 pb-6 px-1">
      {/* Display values — centered */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl px-4 py-2.5 min-w-[130px] text-center">
          <span className="text-xs text-blue-400 block mb-0.5">Tối thiểu</span>
          <span className="text-sm font-bold text-blue-700">{formatPriceDisplay(localMin)}</span>
        </div>
        <div className="h-[1px] w-6 bg-gray-300" />
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-xl px-4 py-2.5 min-w-[130px] text-center">
          <span className="text-xs text-blue-400 block mb-0.5">Tối đa</span>
          <span className="text-sm font-bold text-blue-700">
            {localMax >= PRICE_MAX ? "100+ triệu" : formatPriceDisplay(localMax)}
          </span>
        </div>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Active range fill */}
        <div
          className="absolute h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />

        {/* // 1. Sửa Min Thumb */}
        <div
          className={`absolute top-1/2 w-6 h-6 bg-white border-[3px] border-blue-500 rounded-full shadow-lg cursor-grab z-20 transition-all
    ${dragging === "min" ? "shadow-blue-300 shadow-md" : "hover:shadow-blue-200 hover:shadow-md"}`}
          style={{
            left: `${minPercent}%`,
            // Gộp: Căn giữa X (-50%), Căn giữa Y (-50%), và Scale nếu đang drag
            transform: `translate(-50%, -50%) ${dragging === "min" ? 'scale(1.1)' : 'scale(1)'}`
          }}
          onPointerDown={handlePointerDown("min")}
        />

        {/* // 2. Sửa Max Thumb */}
        <div
          className={`absolute top-1/2 w-6 h-6 bg-white border-[3px] border-blue-500 rounded-full shadow-lg cursor-grab z-20 transition-all
    ${dragging === "max" ? "shadow-blue-300 shadow-md" : "hover:shadow-blue-200 hover:shadow-md"}`}
          style={{
            left: `${maxPercent}%`,
            // Tương tự cho nút Max
            transform: `translate(-50%, -50%) ${dragging === "max" ? 'scale(1.1)' : 'scale(1)'}`
          }}
          onPointerDown={handlePointerDown("max")}
        />
      </div>

      {/* Tick marks */}
      <div className="relative mt-3 h-4">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute text-[10px] text-gray-400 -translate-x-1/2"
            style={{ left: `${getPercent(tick)}%` }}
          >
            {formatPriceLabel(tick)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FilterDrawer({
  open,
  onClose,
  filters,
  onFilterChange,
}: FilterDrawerProps) {
  const [localFilters, setLocalFilters] = useState({
    propertyType: filters.propertyType,
    priceMin: filters.priceMin ?? PRICE_MIN,
    priceMax: filters.priceMax ?? PRICE_MAX,
    areaMin: filters.areaMin,
    areaMax: filters.areaMax,
  });

  // Sync from parent when drawer opens
  useEffect(() => {
    if (open) {
      setLocalFilters({
        propertyType: filters.propertyType,
        priceMin: filters.priceMin ?? PRICE_MIN,
        priceMax: filters.priceMax ?? PRICE_MAX,
        areaMin: filters.areaMin,
        areaMax: filters.areaMax,
      });
    }
  }, [open, filters]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleApply = () => {
    onFilterChange({
      propertyType: localFilters.propertyType,
      priceMin: localFilters.priceMin === PRICE_MIN ? null : localFilters.priceMin,
      priceMax: localFilters.priceMax === PRICE_MAX ? null : localFilters.priceMax,
      areaMin: localFilters.areaMin,
      areaMax: localFilters.areaMax,
    });
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      propertyType: "",
      priceMin: PRICE_MIN,
      priceMax: PRICE_MAX,
      areaMin: null,
      areaMax: null,
    });
  };

  const isAreaActive = (min: number | null, max: number | null) =>
    localFilters.areaMin === min && localFilters.areaMax === max;

  const activeFilterCount = [
    localFilters.propertyType,
    localFilters.priceMin !== PRICE_MIN || localFilters.priceMax !== PRICE_MAX,
    localFilters.areaMin !== null || localFilters.areaMax !== null,
  ].filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-white shadow-2xl z-[9999] flex flex-col
          transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
              <GoldOutlined className="text-white text-base" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bộ lọc nâng cao</h2>
              <p className="text-xs text-gray-400">Tùy chỉnh kết quả tìm kiếm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <CloseOutlined className="text-base" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {/* Property Type */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <HomeOutlined className="text-blue-500" />
              Loại hình bất động sản
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setLocalFilters((p) => ({ ...p, propertyType: type.value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
                    ${localFilters.propertyType === type.value
                      ? "border-blue-500 bg-blue-50 shadow-sm shadow-blue-100"
                      : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                    }`}
                >
                  {type.icon}
                  <span className={`text-xs font-medium leading-tight text-center ${localFilters.propertyType === type.value ? "text-blue-600" : "text-gray-600"
                    }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Price Range Slider */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarOutlined className="text-blue-500" />
              Khoảng giá thuê
              <span className="text-xs text-gray-400 font-normal ml-auto">(đ/tháng)</span>
            </h3>
            <PriceRangeSlider
              minValue={localFilters.priceMin}
              maxValue={localFilters.priceMax}
              onChange={(min, max) => setLocalFilters((p) => ({ ...p, priceMin: min, priceMax: max }))}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Area */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ColumnWidthOutlined className="text-blue-500" />
              Diện tích
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {AREA_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    setLocalFilters((p) => ({
                      ...p,
                      areaMin: range.min,
                      areaMax: range.max,
                    }))
                  }
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border-2 transition-all duration-200
                    ${isAreaActive(range.min, range.max)
                      ? "border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
                      : "border-gray-100 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/30"
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gradient-to-r from-white to-slate-50 flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <UndoOutlined className="text-xs" />
            Đặt lại
          </button>
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all duration-200"
          >
            <CheckOutlined className="text-xs" />
            Áp dụng bộ lọc
            {activeFilterCount > 0 && (
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

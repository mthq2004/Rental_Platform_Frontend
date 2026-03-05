"use client";

import React, { useEffect } from "react";
import { Select } from "antd";
import { SortAscendingOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { SearchFilters } from "./SearchPage";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { searchPropertiesThunk } from "@/stores/slices/estate.slice";
import PropertySearchCard from "./PropertySearchCard";

interface PropertyListProps {
  filters: SearchFilters;
  onNextPage: (nextCursor: string) => void;
  onPrevPage: () => void;
}

function PropertySkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4 animate-pulse">
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
  );
}

export default function PropertyList({ filters, onNextPage, onPrevPage }: PropertyListProps) {
  const dispatch = useAppDispatch();
  const { data: properties, loading, error, total, nextCursor, hasMore } =
    useAppSelector((state) => state.estate.search);

  useEffect(() => {
    dispatch(searchPropertiesThunk({
      keyword: filters.keyword || undefined,
      propertyType: filters.propertyType || undefined,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      areaMin: filters.areaMin,
      areaMax: filters.areaMax,
      city: filters.city || undefined,
      district: filters.district || undefined,
      cursor: filters.cursor,
      limit: 20,
      sortBy: filters.sortBy,
    }));
  }, [
    dispatch,
    filters.keyword, filters.propertyType, filters.priceMin, filters.priceMax,
    filters.areaMin, filters.areaMax, filters.city, filters.district,
    filters.sortBy, filters.cursor,
  ]);

  const PAGE_SIZE = 20;
  const currentStart = (filters.pageIndex - 1) * PAGE_SIZE + 1;
  const currentEnd = Math.min(filters.pageIndex * PAGE_SIZE, total);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <PropertySkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{error}</h3>
        <button
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          onClick={() => dispatch(searchPropertiesThunk({
            keyword: filters.keyword || undefined,
            propertyType: filters.propertyType || undefined,
            priceMin: filters.priceMin,
            priceMax: filters.priceMax,
            areaMin: filters.areaMin,
            areaMax: filters.areaMax,
            city: filters.city || undefined,
            district: filters.district || undefined,
            cursor: filters.cursor,
            limit: 20,
            sortBy: filters.sortBy,
          }))}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Sort + total bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {total > 0
            ? <>Hiển thị <span className="font-medium text-gray-700">{currentStart}–{currentEnd}</span> trong <span className="font-medium text-gray-700">{total.toLocaleString("vi-VN")}</span> tin đăng</>
            : "Không tìm thấy kết quả"}
        </p>

        <div className="flex items-center gap-2">
          <SortAscendingOutlined className="text-gray-400" />
          <Select
            value={filters.sortBy}
            onChange={(value) => {
              /* sortBy change is handled via updateFilters in parent via FilterBar */
            }}
            className="w-42"
            size="small"
            options={[
              { value: "newest", label: "Mới nhất" },
              { value: "oldest", label: "Cũ nhất" },
              { value: "price_asc", label: "Giá tăng dần" },
              { value: "price_desc", label: "Giá giảm dần" },
              { value: "area_asc", label: "Diện tích tăng" },
              { value: "area_desc", label: "Diện tích giảm" },
            ]}
            disabled
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
      {properties.length === 0 && (
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

      {/* Cursor-based Pagination Controls */}
      {properties.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8 mb-4">
          <button
            onClick={onPrevPage}
            disabled={filters.pageIndex <= 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
              ${filters.pageIndex <= 1
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-500"
              }`}
          >
            <LeftOutlined className="text-xs" />
            Trang trước
          </button>

          <span className="text-sm text-gray-600 min-w-[80px] text-center">
            Trang <span className="font-semibold text-gray-900">{filters.pageIndex}</span>
          </span>

          <button
            onClick={() => nextCursor && onNextPage(nextCursor)}
            disabled={!hasMore || !nextCursor}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
              ${!hasMore || !nextCursor
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-500"
              }`}
          >
            Trang tiếp
            <RightOutlined className="text-xs" />
          </button>
        </div>
      )}
    </div>
  );
}


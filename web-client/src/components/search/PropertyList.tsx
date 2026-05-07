"use client";

import React, { useEffect } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { SearchFilters } from "./SearchPage";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { searchPropertiesThunk } from "@/stores/slices/estate.slice";
import PropertySearchCard from "./PropertySearchCard";

interface PropertyListProps {
  filters: SearchFilters;
  onGoToPage: (page: number) => void;
  onFilterChange: (partial: Partial<SearchFilters>) => void;
}

function PropertySkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4 animate-pulse border border-gray-100">
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

/** Generate page number array with ellipsis, e.g. [1, 2, 3, '...', 10] */
function generatePageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (current <= 4) {
    // Show first 5 pages + ellipsis + last
    for (let i = 2; i <= 5; i++) pages.push(i);
    pages.push("...");
    pages.push(totalPages);
  } else if (current >= totalPages - 3) {
    // Show first + ellipsis + last 5 pages
    pages.push("...");
    for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
  } else {
    // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
    pages.push("...");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}

export default function PropertyList({ filters, onGoToPage, onFilterChange }: PropertyListProps) {
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
      page: filters.pageIndex,
      limit: 20,
      sortBy: filters.sortBy,
    }));
  }, [
    dispatch,
    filters.keyword, filters.propertyType, filters.priceMin, filters.priceMax,
    filters.areaMin, filters.areaMax, filters.city, filters.district,
    filters.sortBy, filters.pageIndex,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters.pageIndex]);

  const PAGE_SIZE = 20;
  const currentStart = (filters.pageIndex - 1) * PAGE_SIZE + 1;
  const currentEnd = Math.min(filters.pageIndex * PAGE_SIZE, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageNumbers = generatePageNumbers(filters.pageIndex, totalPages);

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
        {/* <div className="text-5xl mb-4">⚠️</div> */}
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
            page: filters.pageIndex,
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
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">
          {total > 0
            ? <>Hiển thị <span className="font-semibold text-gray-800">{currentStart}–{currentEnd}</span> trong <span className="font-semibold text-blue-600">{total.toLocaleString("vi-VN")}</span> tin đăng</>
            : "Không tìm thấy kết quả"}
        </p>
      </div>

      {/* Property cards */}
      <div className="space-y-4">
        {properties.map((property) => (
          <PropertySearchCard key={property.id} property={property} />
        ))}
      </div>

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🏠</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Không tìm thấy bất động sản phù hợp
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm được kết quả phù hợp hơn.
          </p>
        </div>
      )}

      {/* Pagination Controls - Full page numbers */}
      {properties.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-8 mb-4">
          {/* Previous button */}
          <button
            onClick={() => onGoToPage(filters.pageIndex - 1)}
            disabled={filters.pageIndex <= 1}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${filters.pageIndex <= 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
          >
            <LeftOutlined className="text-xs" />
            Trước
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, idx) => {
              if (page === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
                    ···
                  </span>
                );
              }
              const isActive = page === filters.pageIndex;
              return (
                <button
                  key={page}
                  disabled={isActive}
                  onClick={() => onGoToPage(page as number)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          <button
            onClick={() => onGoToPage(filters.pageIndex + 1)}
            disabled={filters.pageIndex >= totalPages}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${filters.pageIndex >= totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
          >
            Tiếp
            <RightOutlined className="text-xs" />
          </button>
        </div>
      )}

      {/* Pagination info */}
      {properties.length > 0 && totalPages > 1 && (
        <p className="text-center text-xs text-gray-400 mb-4">
          Trang {filters.pageIndex} / {totalPages} · Tổng {total.toLocaleString("vi-VN")} kết quả
        </p>
      )}
    </div>
  );
}

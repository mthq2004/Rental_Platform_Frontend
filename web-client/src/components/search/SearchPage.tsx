"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchHeader from "./SearchHeader";
import FilterBar from "./FilterBar";
import PropertyList from "./PropertyList";
import SidebarFilter from "./SidebarFilter";
import { HomeOutlined, RightOutlined } from "@ant-design/icons";


export interface SearchFilters {
  keyword: string;
  propertyType: string;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  city: string;
  district: string;
  sortBy: string;
  /** 1-based page index for display & API */
  pageIndex: number;
}

const defaultFilters: SearchFilters = {
  keyword: "",
  propertyType: "",
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  city: "",
  district: "",
  sortBy: "newest",
  pageIndex: 1,
};


export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params (cursor not stored in URL for simplicity)
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...defaultFilters,
    keyword: searchParams.get("keyword") || "",
    propertyType: searchParams.get("propertyType") || "",
    priceMin: searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : null,
    priceMax: searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : null,
    areaMin: searchParams.get("areaMin") ? Number(searchParams.get("areaMin")) : null,
    areaMax: searchParams.get("areaMax") ? Number(searchParams.get("areaMax")) : null,
    city: searchParams.get("city") || "",
    district: searchParams.get("district") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  }));

  // Sync non-cursor filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (filters.priceMin !== null) params.set("priceMin", String(filters.priceMin));
    if (filters.priceMax !== null) params.set("priceMax", String(filters.priceMax));
    if (filters.areaMin !== null) params.set("areaMin", String(filters.areaMin));
    if (filters.areaMax !== null) params.set("areaMax", String(filters.areaMax));
    if (filters.city) params.set("city", filters.city);
    if (filters.district) params.set("district", filters.district);
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [
    filters.keyword, filters.propertyType, filters.priceMin, filters.priceMax,
    filters.areaMin, filters.areaMax, filters.city, filters.district, filters.sortBy,
    router,
  ]);

  /** Update non-page filters and reset to page 1 */
  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    // If only pageIndex is being updated, don't reset it
    const { pageIndex, ...rest } = partial;
    const hasNonPageChanges = Object.keys(rest).length > 0;

    setFilters((prev) => ({
      ...prev,
      ...partial,
      // Reset to page 1 only when non-page filters change
      pageIndex: hasNonPageChanges ? 1 : (pageIndex ?? prev.pageIndex),
    }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      pageIndex: page,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);


  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Search bar */}
      <SearchHeader
        keyword={filters.keyword}
        onSearch={(keyword: string) => updateFilters({ keyword })}
      />

      <div className="max-w-300 mx-auto px-4 pb-10">
        {/* Filter chips */}
        <FilterBar filters={filters} onFilterChange={updateFilters} />

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-5 mb-3">
          <HomeOutlined className="text-blue-500 text-xs" />
          <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push("/")}>
            Trang chủ
          </span>
          <RightOutlined className="text-[10px] text-gray-400" />
          <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => router.push("/search")}>
            Cho thuê
          </span>
          {filters.city && (
            <>
              <RightOutlined className="text-[10px] text-gray-400" />
              <span className="font-medium text-gray-700">{filters.city}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.city
                ? `Cho thuê nhà đất tại ${filters.city}`
                : "Cho thuê nhà đất trên toàn quốc"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Tìm kiếm bất động sản cho thuê phù hợp với nhu cầu của bạn
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Left - listings */}
          <div className="flex-1 min-w-0">
            <PropertyList
              filters={filters}
              onGoToPage={goToPage}
              onFilterChange={updateFilters}
            />

          </div>

          {/* Right - sidebar */}
          <div className="w-70 hidden lg:block shrink-0">
            <SidebarFilter filters={filters} onFilterChange={updateFilters} />
          </div>
        </div>
      </div>
    </div>
  );
}

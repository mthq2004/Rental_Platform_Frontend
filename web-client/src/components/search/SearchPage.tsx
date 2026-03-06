"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchHeader from "./SearchHeader";
import FilterBar from "./FilterBar";
import PropertyList from "./PropertyList";
import SidebarFilter from "./SidebarFilter";


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
  /** cursor for current page - null means first page */
  cursor: string | null;
  /** history stack of cursors for back-navigation: index 0 = page 1 cursor (null) */
  cursorHistory: (string | null)[];
  /** 1-based page index for display */
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
  cursor: null,
  cursorHistory: [null],
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

  /** Update non-cursor filters and reset cursor history to page 1 */
  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    // Ignore cursor/cursorHistory/pageIndex from incoming partial – always reset to page 1
    const { cursor: _c, cursorHistory: _ch, pageIndex: _pi, ...safePartial } = partial;
    setFilters((prev) => ({
      ...prev,
      ...safePartial,
      cursor: null,
      cursorHistory: [null],
      pageIndex: 1,
    }));
  }, []);

  /** Navigate to next page using the cursor returned by the API */
  const goToNextPage = useCallback((nextCursor: string) => {
    setFilters((prev) => {
      const newHistory = [...prev.cursorHistory, nextCursor];
      return {
        ...prev,
        cursor: nextCursor,
        cursorHistory: newHistory,
        pageIndex: prev.pageIndex + 1,
      };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /** Navigate to previous page using the cursor history */
  const goToPrevPage = useCallback(() => {
    setFilters((prev) => {
      if (prev.pageIndex <= 1) return prev;
      const newHistory = prev.cursorHistory.slice(0, -1);
      const prevCursor = newHistory[newHistory.length - 1] ?? null;
      return {
        ...prev,
        cursor: prevCursor,
        cursorHistory: newHistory,
        pageIndex: prev.pageIndex - 1,
      };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Search bar */}
      <SearchHeader
        keyword={filters.keyword}
        onSearch={(keyword: string) => updateFilters({ keyword })}
      />

      <div className="max-w-300 mx-auto px-4 pb-10">
        {/* Filter chips */}
        <FilterBar filters={filters} onFilterChange={updateFilters} />

        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mt-4 mb-2">
          <span className="hover:text-blue-500 cursor-pointer" onClick={() => router.push("/")}>
            Cho thuê
          </span>
          <span className="mx-1">/</span>
          <span className="font-medium text-gray-700">
            {filters.city ? `${filters.city}` : "Tất cả BĐS trên toàn quốc"}
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {filters.city
            ? `Cho thuê nhà đất tại ${filters.city}`
            : "Cho thuê nhà đất trên toàn quốc"}
        </h1>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Left - listings */}
          <div className="flex-1 min-w-0">
            <PropertyList
              filters={filters}
              onNextPage={goToNextPage}
              onPrevPage={goToPrevPage}
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

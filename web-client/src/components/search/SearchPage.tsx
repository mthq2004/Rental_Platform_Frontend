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
  page: number;
  pageSize: number;
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
  page: 1,
  pageSize: 20,
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilters>(() => {
    return {
      keyword: searchParams.get("keyword") || "",
      propertyType: searchParams.get("propertyType") || "",
      priceMin: searchParams.get("priceMin")
        ? Number(searchParams.get("priceMin"))
        : null,
      priceMax: searchParams.get("priceMax")
        ? Number(searchParams.get("priceMax"))
        : null,
      areaMin: searchParams.get("areaMin")
        ? Number(searchParams.get("areaMin"))
        : null,
      areaMax: searchParams.get("areaMax")
        ? Number(searchParams.get("areaMax"))
        : null,
      city: searchParams.get("city") || "",
      district: searchParams.get("district") || "",
      sortBy: searchParams.get("sortBy") || "newest",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: 20,
    };
  });

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (filters.propertyType) params.set("propertyType", filters.propertyType);
    if (filters.priceMin !== null)
      params.set("priceMin", String(filters.priceMin));
    if (filters.priceMax !== null)
      params.set("priceMax", String(filters.priceMax));
    if (filters.areaMin !== null)
      params.set("areaMin", String(filters.areaMin));
    if (filters.areaMax !== null)
      params.set("areaMax", String(filters.areaMax));
    if (filters.city) params.set("city", filters.city);
    if (filters.district) params.set("district", filters.district);
    if (filters.sortBy && filters.sortBy !== "newest")
      params.set("sortBy", filters.sortBy);
    if (filters.page > 1) params.set("page", String(filters.page));

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [filters, router]);

  const updateFilters = useCallback(
    (partial: Partial<SearchFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...partial,
        // Reset page when filter changes (unless page itself is changing)
        page: partial.page !== undefined ? partial.page : 1,
      }));
    },
    []
  );

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
            Tất cả BĐS trên toàn quốc
          </span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Cho thuê nhà đất trên toàn quốc
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Hiện có <span className="font-medium">18.742</span> bất động sản.
        </p>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Left - listings */}
          <div className="flex-1 min-w-0">
            <PropertyList
              filters={filters}
              onPageChange={(page: number) => updateFilters({ page })}
            />
          </div>

          {/* Right - sidebar */}
          <div className="w-70 hidden lg:block shrink-0">
            <SidebarFilter
              filters={filters}
              onFilterChange={updateFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

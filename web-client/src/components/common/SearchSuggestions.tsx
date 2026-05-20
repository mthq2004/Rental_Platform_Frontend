"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  SearchOutlined,
  EnvironmentOutlined,
  RightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { InstantSearchPropertyCard } from "@/hooks/useInstantSearch";
import { propertySlug } from "@/utils/slug";

interface SearchSuggestionsProps {
  /** Whether the dropdown is visible */
  visible: boolean;
  /** Keyword suggestions from AI */
  keywords: string[];
  /** Property cards (only shown in search mode) */
  properties?: InstantSearchPropertyCard[];
  /** Whether data is loading */
  loading?: boolean;
  /** Search mode - determines what to show */
  mode: "home" | "search";
  /** Callback when a keyword is selected */
  onSelectKeyword: (keyword: string) => void;
  /** Callback when a property is clicked */
  onSelectProperty?: (property: InstantSearchPropertyCard) => void;
}

function formatPrice(priceStr: string): string {
  return priceStr || "Liên hệ";
}

export default function SearchSuggestions({
  visible,
  keywords,
  properties = [],
  loading = false,
  mode,
  onSelectKeyword,
  onSelectProperty,
}: SearchSuggestionsProps) {
  const router = useRouter();

  if (!visible) return null;

  const hasKeywords = keywords.length > 0;
  const hasProperties = mode === "search" && properties.length > 0;
  const hasContent = hasKeywords || hasProperties || loading;

  if (!hasContent) return null;

  const handlePropertyClick = (property: InstantSearchPropertyCard) => {
    if (onSelectProperty) {
      onSelectProperty(property);
    } else {
      router.push(`/property/${property.slug || property.id}`);
    }
  };

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
      style={{
        animation: "fadeSlideDown 0.2s ease-out",
      }}
    >
      <style jsx>{`
        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 border-b border-gray-50">
          <LoadingOutlined className="text-blue-500 animate-spin" />
          <span>Đang tìm gợi ý...</span>
        </div>
      )}

      {/* Keyword suggestions */}
      {hasKeywords && (
        <div className="py-1.5">
          <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Gợi ý tìm kiếm
          </div>
          {keywords.map((keyword, index) => (
            <button
              key={`kw-${index}`}
              onClick={() => onSelectKeyword(keyword)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50/70 transition-colors duration-150 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <SearchOutlined className="text-blue-500 text-sm" />
              </div>
              <span className="text-sm text-gray-700 font-medium truncate group-hover:text-blue-600 transition-colors flex-1">
                {keyword}
              </span>
              <RightOutlined className="text-[10px] text-gray-300 group-hover:text-blue-400 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Property cards (search mode only) */}
      {hasProperties && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="py-1.5">
            <div className="px-4 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Bất động sản liên quan
            </div>
            {properties.slice(0, 5).map((property) => (
              <button
                key={property.id}
                onClick={() => handlePropertyClick(property)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50/70 transition-colors duration-150 group"
              >
                {/* Property thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {property.image ? (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                      🏠
                    </div>
                  )}
                </div>

                {/* Property info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors leading-tight">
                    {property.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">
                      {formatPrice(property.price)}
                    </span>
                    {(property.district || property.city) && (
                      <>
                        <span className="text-gray-300 text-[10px]">·</span>
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <EnvironmentOutlined className="text-[10px]" />
                          {[property.district, property.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <RightOutlined className="text-[10px] text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

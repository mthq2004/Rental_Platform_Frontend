"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAnimatedPlaceholder } from "@/hooks/useAnimatedPlaceholder";
import { useInstantSearch } from "@/hooks/useInstantSearch";
import SearchSuggestions from "@/components/common/SearchSuggestions";
import type { InstantSearchPropertyCard } from "@/hooks/useInstantSearch";
import { propertySlug } from "@/utils/slug";

interface SearchHeaderProps {
  keyword: string;
  onSearch: (keyword: string) => void;
}

export default function SearchHeader({ keyword, onSearch }: SearchHeaderProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(keyword);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const animatedPlaceholder = useAnimatedPlaceholder(!inputValue && !isFocused);

  // AI instant search hook - search mode (keywords + properties)
  const {
    keywords,
    properties,
    loading: suggestionsLoading,
  } = useInstantSearch(inputValue, "search", 300);

  // Sync input when keyword changes externally
  useEffect(() => {
    setInputValue(keyword);
  }, [keyword]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== keyword) {
        onSearch(inputValue);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, keyword, onSearch]);

  const handleSearch = useCallback(() => {
    onSearch(inputValue);
    setShowSuggestions(false);
  }, [inputValue, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSelectKeyword = (kw: string) => {
    setInputValue(kw);
    setShowSuggestions(false);
    onSearch(kw);
  };

  const handleSelectProperty = (property: InstantSearchPropertyCard) => {
    setShowSuggestions(false);
    const slug = property.slug || propertySlug(property.title, property.id);
    router.push(`/property/${slug}`);
  };

  return (
    <div
      className="relative z-40 w-full overflow-visible"
      style={{ zIndex: showSuggestions ? 100 : 40 }}
    >
      {/* Background gradient - đường thẳng, không cong */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-blue-300 to-blue-100" />

      {/* Search Box Card */}
      <div className="relative z-10 max-w-300 mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 overflow-visible">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search input - giống HeroSection */}
            <div className="flex-1 relative">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <input
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (e.target.value.trim().length >= 1) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200
                  hover:border-blue-500 focus:border-blue-500 focus:outline-none
                  text-gray-800 placeholder-transparent shadow-sm transition-all duration-200"
              />
              {/* Animated placeholder overlay */}
              {!inputValue && (
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-px text-sm">
                  {animatedPlaceholder}
                  <span className="inline-block w-0.5 h-4 bg-red-400 ml-px animate-[blink_0.75s_step-start_infinite] rounded-sm" />
                </span>
              )}

              {/* AI Search Suggestions - Search mode: keywords + property cards */}
              <SearchSuggestions
                visible={showSuggestions && inputValue.trim().length >= 1}
                keywords={keywords}
                properties={properties}
                loading={suggestionsLoading}
                mode="search"
                onSelectKeyword={handleSelectKeyword}
                onSelectProperty={handleSelectProperty}
              />
            </div>

            {/* Search Button - giống HeroSection */}
            <button
              onClick={handleSearch}
              className="
                h-12 px-8 rounded-lg
                font-semibold text-white
                bg-blue-800
                transition-all duration-500
                active:scale-95
                shadow-md
                flex items-center justify-center gap-2
                min-w-[120px]
                hover:bg-blue-700
                hover:shadow-[0_0_20px_rgba(168,85,247,0.4),_0_0_40px_rgba(59,130,246,0.3)]
                hover:ring-1 hover:ring-blue-500/30
              "
            >
              <SearchOutlined />
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

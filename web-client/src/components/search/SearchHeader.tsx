"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useAnimatedPlaceholder } from "@/hooks/useAnimatedPlaceholder";

interface SearchHeaderProps {
  keyword: string;
  onSearch: (keyword: string) => void;
}

export default function SearchHeader({ keyword, onSearch }: SearchHeaderProps) {
  const [inputValue, setInputValue] = useState(keyword);
  const [isFocused, setIsFocused] = useState(false);

  const animatedPlaceholder = useAnimatedPlaceholder(!inputValue && !isFocused);

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
  }, [inputValue, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 sticky top-14 z-40 shadow-lg shadow-blue-200/30">
      <div className="max-w-300 mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Search input with animated placeholder */}
          <div className="flex-1 relative group">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-lg z-10 group-focus-within:text-blue-500 transition-colors" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-white/95 backdrop-blur-sm border-2 border-transparent rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-white focus:bg-white focus:shadow-lg focus:shadow-white/20 transition-all duration-300 placeholder-transparent text-gray-800"
            />
            {/* Animated placeholder overlay */}
            {!inputValue && (
              <span className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-px text-sm">
                {animatedPlaceholder}
                <span className="inline-block w-0.5 h-4 bg-blue-400 ml-px animate-[blink_0.75s_step-start_infinite] rounded-sm" />
              </span>
            )}
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="bg-white text-blue-600 hover:bg-blue-50 active:scale-95 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 shrink-0 shadow-md shadow-blue-700/20"
          >
            <SearchOutlined />
            Tìm kiếm
          </button>


        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SearchOutlined, EnvironmentOutlined } from "@ant-design/icons";

interface SearchHeaderProps {
  keyword: string;
  onSearch: (keyword: string) => void;
}

export default function SearchHeader({ keyword, onSearch }: SearchHeaderProps) {
  const [inputValue, setInputValue] = useState(keyword);

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
    <div className="bg-white border-b border-gray-200 sticky top-14 z-40">
      <div className="max-w-300 mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập khu vực, dự án, tên đường..."
              className="w-full border border-gray-300 rounded-lg pl-11 pr-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shrink-0"
          >
            <SearchOutlined />
            Tìm kiếm
          </button>

          {/* Map button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors items-center gap-2 shrink-0 md:inline-flex hidden"
          >
            <EnvironmentOutlined />
            Xem bản đồ
          </button>
        </div>
      </div>
    </div>
  );
}

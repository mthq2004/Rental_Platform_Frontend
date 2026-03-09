"use client";
import React, { useState, useRef, useEffect } from "react";
import { formatVND, parsePrice } from "@/utils/priceFormatter";
import "./SmartPriceInput.css";

interface PriceSuggestion {
  value: number;
  label: string;
}

export interface SmartPriceInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minPrice?: number;
  maxPrice?: number;
  required?: boolean;
  disabled?: boolean;
}

const SmartPriceInput: React.FC<SmartPriceInputProps> = ({
  value,
  onChange,
  placeholder = "Nhập giá (VD: 5000000)",
  label,
  error,
  minPrice = 0,
  maxPrice = 100000000000,
  required = false,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    value ? formatVND(value) : ""
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<PriceSuggestion[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectingRef = useRef(false);

  // Tạo gợi ý giá từ số nhập vào
  const generateSuggestions = (numValue: number): PriceSuggestion[] => {
  if (numValue <= 0) return [];

  const multipliers = [
    100,
    1000,
    10000,
    100000,
    1000000,
  ];

  const result: PriceSuggestion[] = [];

  for (const m of multipliers) {
    const value = numValue * m;

    if (value >= minPrice && value <= maxPrice) {
      result.push({
        value,
        label: formatVND(value) + " ₫",
      });
    }
  }

  return result;
};

  // Xử lý khi nhập
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/[^0-9]/g, "");
    
    if (cleanValue === "") {
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      onChange(0);
      return;
    }

    const numValue = parseInt(cleanValue, 10);
    
    // Format và hiển thị
    setInputValue(formatVND(numValue));
    
    // Cập nhật giá trị ngay lập tức
    onChange(numValue);
    
    // Tạo gợi ý nếu số nhỏ
    const newSuggestions = generateSuggestions(numValue);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setFocusedIndex(-1);
  };

  // Xử lý chọn gợi ý
  const handleSelectSuggestion = (suggestion: PriceSuggestion) => {
    isSelectingRef.current = true;
    setInputValue(formatVND(suggestion.value));
    onChange(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
    
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  // Xử lý khi blur
  const handleInputBlur = () => {
    // Không xử lý nếu đang chọn suggestion
    setTimeout(() => {
      if (isSelectingRef.current) return;
      
      if (inputValue) {
        const numValue = parsePrice(inputValue);
        if (numValue >= minPrice && numValue <= maxPrice) {
          onChange(numValue);
        }
      }
      setShowSuggestions(false);
    }, 150);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0) {
          handleSelectSuggestion(suggestions[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync khi value thay đổi từ ngoài
  useEffect(() => {
    if (value && value !== parsePrice(inputValue)) {
      setInputValue(formatVND(value));
    }
  }, [value]);

  return (
    <div ref={containerRef} className="smart-price-input-wrapper">
      {label && (
        <label className="smart-price-input-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="smart-price-input-container">
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`smart-price-input ${error ? "smart-price-input--error" : ""}`}
        />
        <span className="smart-price-input-suffix">₫</span>
      </div>

      {error && <p className="smart-price-input-error">{error}</p>}

      {showSuggestions && suggestions.length > 0 && (
        <div className="smart-price-suggestions" role="listbox">
          <div className="smart-price-suggestions-header">Chọn nhanh:</div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.value}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`smart-price-suggestion-item ${
                focusedIndex === index ? "smart-price-suggestion-item--focused" : ""
              }`}
              role="option"
              aria-selected={focusedIndex === index}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartPriceInput;

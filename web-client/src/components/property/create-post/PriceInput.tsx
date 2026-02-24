"use client";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "antd";

interface PriceInputProps {
    value?: number;
    onChange?: (value: number) => void;
    placeholder?: string;
    suffix?: React.ReactNode;
    className?: string;
    size?: "small" | "middle" | "large";
}

// Format number with comma as thousand separator
const formatNumber = (num: number): string => {
    return num.toLocaleString("en-US");
};

// Generate price suggestions based on input
const generateSuggestions = (input: string): number[] => {
    if (!input || input === "0") return [];

    const num = parseFloat(input.replace(/,/g, ""));
    if (isNaN(num) || num <= 0) return [];

    const suggestions: number[] = [];

    // Generate multipliers: x1000, x10000, x100000, x1000000
    const multipliers = [1000, 10000, 100000, 1000000];

    multipliers.forEach(mult => {
        const value = num * mult;
        // Only add if value is reasonable (less than 100 billion)
        if (value <= 100_000_000_000) {
            suggestions.push(value);
        }
    });

    return suggestions;
};

export default function PriceInput({
    value = 0,
    onChange,
    placeholder = "Nhập số tiền",
    suffix,
    className = "",
    size = "large",
}: PriceInputProps) {
    const [inputValue, setInputValue] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<number[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync display value when external value changes
    useEffect(() => {
        if (value > 0 && !showSuggestions) {
            setInputValue(formatNumber(value));
        } else if (value === 0) {
            setInputValue("");
        }
    }, [value]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
                // Format the current value when clicking outside
                if (value > 0) {
                    setInputValue(formatNumber(value));
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;

        // Allow empty input
        if (!rawValue) {
            setInputValue("");
            setSuggestions([]);
            setShowSuggestions(false);
            onChange?.(0);
            return;
        }

        // Only allow numbers, dots, and commas
        const sanitized = rawValue.replace(/[^0-9.,]/g, "");
        setInputValue(sanitized);

        // Generate suggestions
        const newSuggestions = generateSuggestions(sanitized);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
    };

    const handleSelectSuggestion = (selectedValue: number) => {
        setInputValue(formatNumber(selectedValue));
        onChange?.(selectedValue);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleFocus = () => {
        // Clear formatted value to show raw input
        if (value > 0) {
            // Keep showing suggestions if there's a value
            const rawNum = value.toString();
            // Don't change input, just check if we should show suggestions
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setShowSuggestions(false);
            if (value > 0) {
                setInputValue(formatNumber(value));
            }
        }
        if (e.key === "Enter" && suggestions.length > 0) {
            e.preventDefault();
            // Select the first suggestion on Enter
            handleSelectSuggestion(suggestions[0]);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                ref={inputRef as any}
                value={inputValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                suffix={suffix}
                size={size}
                className={`rounded-lg ${className}`}
                autoComplete="off"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center justify-between group"
                        >
                            <span className="font-medium text-gray-800 group-hover:text-blue-600">
                                {formatNumber(suggestion)}
                            </span>
                            <span className="text-sm text-gray-400">
                                VNĐ
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

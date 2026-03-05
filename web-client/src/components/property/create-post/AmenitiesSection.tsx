"use client";
import React, { useState } from "react";
import { CheckCircleFilled, PlusOutlined, CloseCircleFilled } from "@ant-design/icons";
import { Input, Tag } from "antd";
import { PropertyFormData, PropertyType } from "@/types/property.type";
import { PROPERTY_META } from "@/constants/property.constant";

interface AmenitiesSectionProps {
    propertyType: PropertyType;
    amenities: string[];
    onUpdate: (amenities: string[]) => void;
}

export default function AmenitiesSection({
    propertyType,
    amenities,
    onUpdate,
}: AmenitiesSectionProps) {
    const currentPropertyMeta = PROPERTY_META[propertyType];
    const [customInput, setCustomInput] = useState("");

    const toggleAmenity = (amenity: string) => {
        const newAmenities = amenities.includes(amenity)
            ? amenities.filter((a) => a !== amenity)
            : [...amenities, amenity];
        onUpdate(newAmenities);
    };

    const addCustomAmenity = () => {
        const trimmed = customInput.trim();
        if (!trimmed) return;
        if (amenities.includes(trimmed)) {
            setCustomInput("");
            return;
        }
        onUpdate([...amenities, trimmed]);
        setCustomInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addCustomAmenity();
        }
    };

    // Custom amenities = those not in the predefined list
    const predefinedSet = new Set(currentPropertyMeta.amenities);
    const customAmenities = amenities.filter((a) => !predefinedSet.has(a));

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tiện ích</h3>

            {/* Predefined amenities */}
            <div className="flex flex-wrap gap-2">
                {currentPropertyMeta.amenities.map((amenity) => (
                    <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${amenities.includes(amenity)
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {amenities.includes(amenity) && (
                            <CheckCircleFilled className="mr-2" />
                        )}
                        {amenity}
                    </button>
                ))}
            </div>

            {/* Custom amenities display */}
            {customAmenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {customAmenities.map((amenity) => (
                        <Tag
                            key={amenity}
                            closable
                            onClose={() => toggleAmenity(amenity)}
                            className="px-3 py-1 text-sm rounded-full bg-green-50 border-green-200 text-green-700"
                        >
                            {amenity}
                        </Tag>
                    ))}
                </div>
            )}

            {/* Custom input */}
            <div className="mt-4 flex gap-2">
                <Input
                    placeholder="Nhập tiện ích khác..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    size="middle"
                />
                <button
                    type="button"
                    onClick={addCustomAmenity}
                    disabled={!customInput.trim()}
                    className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                    <PlusOutlined />
                    Thêm
                </button>
            </div>
        </div>
    );
}

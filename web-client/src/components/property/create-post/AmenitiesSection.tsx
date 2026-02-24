"use client";
import React from "react";
import { CheckCircleFilled } from "@ant-design/icons";
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

    const toggleAmenity = (amenity: string) => {
        const newAmenities = amenities.includes(amenity)
            ? amenities.filter((a) => a !== amenity)
            : [...amenities, amenity];
        onUpdate(newAmenities);
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tiện ích</h3>

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
        </div>
    );
}

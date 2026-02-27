"use client";

import React, { useState } from "react";
import {
  MessageOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import type { PropertyDetailData } from "./types";
import { PROPERTY_META } from "@/constants/property.constant";
import type { PropertyType } from "@/types/property.type";

interface StickyHeaderProps {
  property: PropertyDetailData;
  visible: boolean;
}

function formatPriceShort(price: number): string {
  if (price >= 1000000) {
    const m = price / 1000000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
}

export default function StickyHeader({ property, visible }: StickyHeaderProps) {
  const [showPhone, setShowPhone] = useState(false);
  const meta = PROPERTY_META[property.propertyType as PropertyType];
  const primaryImage =
    property.images.find((img) => img.isPrimary) || property.images[0];

  return (
    <div
      className={`fixed top-14 left-0 right-0 bg-white border-b border-gray-200 z-40 
        transition-all duration-300 
        ${visible
          ? "translate-y-0 opacity-100 shadow-md"
          : "-translate-y-full opacity-0 pointer-events-none"
        }`}
    >
      <div className="max-w-300 mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: thumb + info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-200">
            <img
              src={primaryImage?.uri || "/assets/image/property-1.jpg"}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {property.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-blue-600 font-bold">
                {formatPriceShort(property.pricePerMonth)}
              </span>
              {property.bedrooms > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{property.bedrooms} PN</span>
                </>
              )}
              {meta && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{meta.label}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: CTA buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 
              hover:border-blue-400 hover:text-blue-500
              px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageOutlined />
            Chat
          </button>
          <button
            onClick={() => setShowPhone(true)}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 
              text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PhoneOutlined />
            {showPhone
              ? property.user.phone.replace(/\*/g, "8")
              : `Hiện số ${property.user.phone}`}
          </button>
        </div>
      </div>
    </div>
  );
}

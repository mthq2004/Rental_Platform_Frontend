"use client";

import React from "react";
import {
  HeartOutlined,
  HeartFilled,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { PROPERTY_META } from "@/constants/property.constant";
import type { PropertyDetailData } from "./types";
import type { PropertyType } from "@/types/property.type";

interface PropertyInfoProps {
  property: PropertyDetailData;
  isSaved: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite: () => void;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Vừa cập nhật";
  if (diffHours < 24) return `Cập nhật ${diffHours} giờ trước`;
  if (diffDays < 7) return `Cập nhật ${diffDays} ngày trước`;
  return `Cập nhật ${Math.floor(diffDays / 7)} tuần trước`;
}

export default function PropertyInfo({ property, isSaved, favoriteLoading = false, onToggleFavorite }: PropertyInfoProps) {
  const meta = PROPERTY_META[property.propertyType as PropertyType];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      {/* Title + Save */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900 leading-snug">
          {property.title}
        </h1>
        <button
          onClick={onToggleFavorite}
          disabled={favoriteLoading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border shrink-0 transition-colors text-sm font-medium
            ${isSaved
              ? "border-red-300 text-red-500 bg-red-50"
              : "border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-300"
            }`}
        >
          {isSaved ? <HeartFilled /> : <HeartOutlined />}
          Lưu
        </button>
      </div>

      {/* Property type tags */}
      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
        <span className="font-medium text-gray-700">
          {property.bedrooms > 0 && `${property.bedrooms} PN`}
        </span>
        {meta && (
          <>
            <span className="text-gray-300">·</span>
            <span>{meta.label}</span>
          </>
        )}
      </div>

      {/* Price + Area */}
      <div className="flex items-baseline gap-4 mt-4">
        <span className="text-2xl font-bold text-blue-600">
          {formatPrice(property.pricePerMonth)}
        </span>
        {property.areaSqm > 0 && (
          <>
            <span className="text-gray-400 text-lg">|</span>
            <span className="text-lg font-semibold text-gray-700">
              {property.areaSqm} m²
            </span>
          </>
        )}
      </div>

      {/* Location */}
      <div className="flex items-start gap-2 mt-4 text-gray-600">
        <EnvironmentOutlined className="text-blue-500 mt-0.5" />
        <div>
          <p className="text-sm">
            {property.address}, {property.ward}, {property.district},{" "}
            {property.city}
          </p>
          {property.ward && (
            <p className="text-xs text-gray-400 mt-0.5">
              ({property.ward} mới)
            </p>
          )}
        </div>
      </div>

      {/* Updated time */}
      <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
        <ClockCircleOutlined />
        <span>{formatTimeAgo(property.updatedAt)}</span>
      </div>
    </div>
  );
}

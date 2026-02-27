"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HeartOutlined,
  HeartFilled,
  PhoneOutlined,
  EnvironmentOutlined,
  PictureOutlined,
} from "@ant-design/icons";

interface PropertyImage {
  id: string;
  uri: string;
  isPrimary: boolean;
}

interface PropertyUser {
  id: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
}

interface PropertyData {
  id: string;
  title: string;
  pricePerMonth: number;
  areaSqm: number;
  address: string;
  district: string;
  city: string;
  description: string;
  images: PropertyImage[];
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  furnitureStatus: string;
  createdAt: string;
  user: PropertyUser;
  isVip?: boolean;
  vipLevel?: string;
}

interface PropertySearchCardProps {
  property: PropertyData;
}

const VIP_LABELS: Record<string, { text: string; color: string; bg: string }> = {
  diamond: { text: "VIP KIM CƯƠNG", color: "#fff", bg: "linear-gradient(135deg, #e53e3e, #c53030)" },
  gold: { text: "VIP VÀNG", color: "#fff", bg: "linear-gradient(135deg, #d69e2e, #b7791f)" },
  silver: { text: "VIP BẠC", color: "#fff", bg: "linear-gradient(135deg, #718096, #4a5568)" },
};

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
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Đăng hôm nay";
  if (diffDays === 1) return "Đăng 1 ngày trước";
  if (diffDays < 7) return `Đăng ${diffDays} ngày trước`;
  if (diffDays < 30) return `Đăng ${Math.floor(diffDays / 7)} tuần trước`;
  return `Đăng ${Math.floor(diffDays / 30)} tháng trước`;
}

export default function PropertySearchCard({ property }: PropertySearchCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const primaryImage = property.images.find((img) => img.isPrimary) || property.images[0];
  const otherImages = property.images.filter((img) => !img.isPrimary).slice(0, 3);
  const totalImages = property.images.length;

  const vipLabel = property.isVip && property.vipLevel
    ? VIP_LABELS[property.vipLevel]
    : null;

  const handlePhoneReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPhone(true);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      onClick={() => router.push(`/property/${property.id}`)}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 group cursor-pointer border border-gray-100"
    >  <div className="flex flex-col sm:flex-row">
        {/* === Image Gallery === */}
        <div className="relative w-full sm:w-[320px] shrink-0">
          <div className="flex h-55 sm:h-full">
            {/* Main image */}
            <div className="flex-1 relative overflow-hidden">
              <img
                src={primaryImage?.uri || "/assets/image/property-1.jpg"}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* VIP Label */}
              {vipLabel && (
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-bold shadow-md"
                  style={{ background: vipLabel.bg, color: vipLabel.color }}
                >
                  {vipLabel.text}
                </div>
              )}
            </div>

            {/* Side thumbnails */}
            {otherImages.length > 0 && (
              <div className="hidden sm:flex flex-col w-25 gap-0.5">
                {otherImages.map((img, idx) => (
                  <div key={img.id} className="flex-1 relative overflow-hidden">
                    <img
                      src={img.uri}
                      alt={`${property.title} ${idx + 2}`}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image count badge */}
          {totalImages > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <PictureOutlined />
              {totalImages}
            </div>
          )}
        </div>

        {/* === Content === */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-[15px] text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
              {property.title}
            </h3>

            {/* Price + Area + Location */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-blue-600 font-bold text-base">
                {formatPrice(property.pricePerMonth)}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-green-600 font-medium text-sm">
                {property.areaSqm} m²
              </span>

              {property.bedrooms > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500 text-sm">
                    {property.bedrooms} PN
                  </span>
                </>
              )}

              {property.bathrooms > 0 && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500 text-sm">
                    {property.bathrooms} WC
                  </span>
                </>
              )}

              <span className="text-gray-300">·</span>
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <EnvironmentOutlined className="text-xs" />
                {property.district}, {property.city}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* Footer: user info + actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {property.user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 leading-tight">
                  {property.user.fullName}
                </p>
                <p className="text-xs text-gray-400">{formatTimeAgo(property.createdAt)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Phone reveal */}
              <button
                onClick={handlePhoneReveal}
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 
                  text-white px-4 py-2 rounded-lg text-sm font-medium 
                  transition-colors active:scale-95"
              >
                <PhoneOutlined />
                {showPhone ? property.user.phone.replace(/\*/g, "8") : `${property.user.phone} · Hiện số`}
              </button>

              {/* Favorite */}
              <button
                onClick={handleFavoriteToggle}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors
                  ${isFavorite
                    ? "border-red-300 text-red-500 bg-red-50"
                    : "border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-300 bg-white"
                  }`}
              >
                {isFavorite ? (
                  <HeartFilled className="text-lg" />
                ) : (
                  <HeartOutlined className="text-lg" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

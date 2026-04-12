"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { propertySlug } from "@/utils/slug";
import {
  HeartOutlined,
  HeartFilled,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { message } from "antd"; // Import thêm message từ antd

interface PropertyCardProps {
  id: string;
  image: string;
  title: string;
  price: string;
  area: string;
  location: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  image,
  title,
  price,
  area,
  location,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const router = useRouter();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Gọi callback từ props để cập nhật database/state
    onToggleFavorite?.(id);

    // Hiển thị thông báo dựa trên trạng thái hiện tại
    if (!isFavorite) {
      message.success({
        content: "Đã lưu bất động sản vào danh sách yêu thích!",
        duration: 2,
      });
    } else {
      message.info({
        content: "Đã bỏ lưu khỏi danh sách yêu thích.",
        duration: 2,
      });
    }
  };

  return (
    <div
      onClick={() => router.push(`/property/${propertySlug(title, id)}`)}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-sm active:scale-90"
        >
          {isFavorite ? (
            /* Sử dụng inline style để "ép" màu đỏ chuẩn */
            <HeartFilled style={{ color: "#ff4d4f" }} className="text-lg animate-jump-in animate-duration-300" />
          ) : (
            <HeartOutlined className="text-gray-600 text-lg hover:text-red-500" />
          )}
        </button>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[40px] group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Price & Area */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-bold text-red-600">{price}</span>
          <span className="text-gray-400 font-light">•</span>
          <span className="text-sm text-gray-600">{area}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-500">
          <EnvironmentOutlined className="text-xs text-blue-400" />
          <span className="text-[11px] truncate uppercase tracking-wider">{location}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
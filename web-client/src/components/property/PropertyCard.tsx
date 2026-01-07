"use client";
import React from "react";
import {
  HeartOutlined,
  HeartFilled,
  EnvironmentOutlined,
} from "@ant-design/icons";

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
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(id);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
        >
          {isFavorite ? (
            <HeartFilled className="text-red-500 text-lg" />
          ) : (
            <HeartOutlined className="text-gray-600 text-lg hover:text-red-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 min-h-[40px]">
          {title}
        </h3>

        {/* Price & Area */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-bold text-red-600">{price}</span>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">{area}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-500">
          <EnvironmentOutlined className="text-xs" />
          <span className="text-xs truncate">{location}</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;

"use client";

import React, { useRef, useEffect } from "react";
import {
  HeartOutlined,
  HeartFilled,
  LeftOutlined,
  RightOutlined,
  PictureOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { propertySlug } from "@/utils/slug";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  fetchSimilarPropertiesThunk,
  addFavoriteThunk,
  removeFavoriteThunk,
  getFavoriteStatusThunk,
} from "@/stores/slices/estate.slice";

interface SimilarListingsProps {
  currentPropertyId: string;
  city: string;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const m = price / 1000000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
}

function formatDaysAgo(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "1 ngày trước";
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return `${Math.floor(diffDays / 30)} tháng trước`;
}

export default function SimilarListings({ currentPropertyId, city }: SimilarListingsProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { data: allItems } = useAppSelector((state) => state.estate.similar);
  const { isAuth } = useAppSelector((state) => state.auth);
  const favoriteStatusMap = useAppSelector((state) => state.estate.favoriteStatusMap);
  const items = allItems.filter((p) => p.id !== currentPropertyId).slice(0, 8);

  useEffect(() => {
    dispatch(fetchSimilarPropertiesThunk({ city, limit: 10, sortBy: "newest" }));
  }, [dispatch, city]);

  // Fetch favorite status for similar items
  useEffect(() => {
    if (!isAuth) return;
    items.forEach((item) => {
      if (favoriteStatusMap[item.id] === undefined) {
        dispatch(getFavoriteStatusThunk(item.id));
      }
    });
  }, [dispatch, isAuth, items, favoriteStatusMap]);

  const handleToggleFavorite = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!isAuth) {
      router.push("/?auth=login");
      return;
    }
    if (favoriteStatusMap[itemId]) {
      dispatch(removeFavoriteThunk(itemId));
    } else {
      dispatch(addFavoriteThunk(itemId));
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Tin đăng tương tự</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 
              text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <LeftOutlined className="text-xs" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 
              text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <RightOutlined className="text-xs" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => {
          const primaryImage = item.images.find((i) => i.isPrimary) || item.images[0];
          return (
            <div
              key={item.id}
              onClick={() => router.push(`/property/${propertySlug(item.title, item.id)}`)}
              className="w-[220px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 
                overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={primaryImage?.uri || "/assets/image/property-1.jpg"}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={(e) => handleToggleFavorite(e, item.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full 
                    flex items-center justify-center hover:bg-white transition-colors"
                >
                  {favoriteStatusMap[item.id] ? (
                    <HeartFilled className="text-red-500 text-sm" />
                  ) : (
                    <HeartOutlined className="text-gray-500 text-sm" />
                  )}
                </button>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                    <ClockCircleOutlined />
                    {formatDaysAgo(item.createdAt)}
                  </span>
                  {item.images.length > 1 && (
                    <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                      <PictureOutlined />
                      {item.images.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug min-h-[36px]">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                  {item.bedrooms > 0 && <><span>{item.bedrooms} PN</span><span className="text-gray-300">·</span></>}
                  <span>{item.propertyType}</span>
                </div>
                <p className="text-blue-600 font-bold text-sm mt-1.5">{formatPrice(item.pricePerMonth)}</p>
                <p className="text-xs text-gray-400 mt-1">{item.district}, {item.city}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-2">
        <button
          onClick={() => router.push(`/search?city=${encodeURIComponent(city)}`)}
          className="border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-500 
            px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          Xem thêm
        </button>
      </div>
    </div>
  );
}


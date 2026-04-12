"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/property/PropertyCard";
import { DownOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getFeaturedPropertiesThunk,
  getListProperty,
  addFavoriteThunk,
  removeFavoriteThunk,
  getFavoriteStatusThunk,
} from "@/stores/slices/estate.slice";

function formatPrice(price: number): string {
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)} tỷ/tháng`;
  }
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
}

const SHOW_STEP = 8;

const PropertyListings = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: featuredProperties, loading } = useAppSelector((state) => state.estate.featured);
  const favoriteStatusMap = useAppSelector((state) => state.estate.favoriteStatusMap);
  const [visibleCount, setVisibleCount] = useState(8);
  const { isAuth } = useAppSelector(state => state.auth)

  useEffect(() => {
    if (isAuth) {
      dispatch(getListProperty());
    } else {
      dispatch(getFeaturedPropertiesThunk(16));
    }
  }, [dispatch, isAuth]);

  // Fetch favorite status for visible properties
  useEffect(() => {
    if (!isAuth) return;
    featuredProperties.slice(0, visibleCount).forEach((p) => {
      if (favoriteStatusMap[p.id] === undefined) {
        dispatch(getFavoriteStatusThunk(p.id));
      }
    });
  }, [dispatch, isAuth, featuredProperties, visibleCount, favoriteStatusMap]);

  const handleToggleFavorite = (id: string) => {
    if (!isAuth) {
      router.push("/?auth=login");
      return;
    }
    if (favoriteStatusMap[id]) {
      dispatch(removeFavoriteThunk(id));
    } else {
      dispatch(addFavoriteThunk(id));
    }
  };

  const handleExpand = () => {
    setVisibleCount((prev) => prev + SHOW_STEP);
  };

  const handleSeeMore = () => {
    router.push("/search");
  };

  if (loading) {
    return (
      <section className="w-full bg-white py-8">
        <div className="mx-auto max-w-[1214px] px-4">
          <div className="h-7 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1214px] px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Bất động sản dành cho bạn
          </h2>
          <div className="hidden md:flex gap-4 text-sm text-gray-600">
            <span className="cursor-pointer hover:underline">Tin nhà đất cho thuê mới nhất</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredProperties.slice(0, visibleCount).map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              image={property.image || "/assets/image/property-placeholder.jpg"}
              title={property.title}
              price={formatPrice(property.pricePerMonth)}
              area={`${property.areaSqm} m²`}
              location={`${property.district}, ${property.city}`}
              isFavorite={!!favoriteStatusMap[property.id]}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          {visibleCount < featuredProperties.length ? (
            <button
              onClick={handleExpand}
              className="group flex items-center gap-2 px-8 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
            >
              Mở rộng
              <DownOutlined className="text-gray-400 group-hover:translate-y-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleSeeMore}
              className="px-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
            >
              Xem tiếp
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PropertyListings;

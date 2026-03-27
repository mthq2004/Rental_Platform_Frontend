"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { extractIdFromSlug } from "@/utils/slug";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  addFavoriteThunk,
  clearDetail,
  getFavoriteStatusThunk,
  getPropertyDetailThunk,
  removeFavoriteThunk,
} from "@/stores/slices/estate.slice";

import type { PropertyDetailData } from "./types";
import StickyHeader from "./StickyHeader";
import ImageGallery from "./ImageGallery";
import PropertyInfo from "./PropertyInfo";
import PropertyTabs from "./PropertyTabs";
import SimilarListings from "./SimilarListings";
import OwnerSidebar from "./OwnerSidebar";
import CommentSection from "./CommentSection";

interface PropertyDetailPageProps {
  slug: string;
}

export default function PropertyDetailPage({ slug }: PropertyDetailPageProps) {
  const router = useRouter();
  const propertyId = extractIdFromSlug(slug) || slug;
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Redux
  const dispatch = useAppDispatch();
  const { data: apiData, loading, error } = useAppSelector((state) => state.estate.detail);
  const favoriteStatusMap = useAppSelector((state) => state.estate.favoriteStatusMap);
  const favoriteActionLoading = useAppSelector((state) => state.estate.favoriteActionLoading);
  const currentUser = useAppSelector((state) => state.auth.user);

  // Fetch property data
  useEffect(() => {
    dispatch(getPropertyDetailThunk(propertyId));
    return () => { dispatch(clearDetail()); };
  }, [dispatch, propertyId]);

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }
    dispatch(getFavoriteStatusThunk(propertyId));
  }, [currentUser?.id, dispatch, propertyId]);

  const isSaved = favoriteStatusMap[propertyId] ?? false;

  const handleToggleFavorite = async () => {
    if (!currentUser?.id) {
      router.push("/?auth=login");
      return;
    }

    if (favoriteActionLoading) {
      return;
    }

    if (isSaved) {
      await dispatch(removeFavoriteThunk(propertyId));
      return;
    }

    await dispatch(addFavoriteThunk(propertyId));
  };

  // Map API response to component PropertyDetailData shape
  const property = useMemo((): PropertyDetailData | null => {
    if (!apiData) return null;
    return {
      id: apiData.id,
      title: apiData.title,
      description: apiData.description,
      propertyType: apiData.propertyType as PropertyDetailData["propertyType"],
      listingType: "rent",
      pricePerMonth: apiData.pricePerMonth,
      depositAmount: apiData.depositAmount,
      depositMonths: apiData.depositMonths,
      address: apiData.address,
      ward: apiData.ward,
      district: apiData.district,
      city: apiData.city,
      latitude: apiData.latitude,
      longitude: apiData.longitude,
      areaSqm: apiData.areaSqm,
      bedrooms: apiData.bedrooms,
      bathrooms: apiData.bathrooms,
      livingRooms: apiData.livingRooms,
      kitchens: apiData.kitchens,
      balconies: apiData.balconies,
      floorNumber: apiData.floorNumber,
      totalFloors: apiData.totalFloors,
      furnitureStatus: apiData.furnitureStatus as PropertyDetailData["furnitureStatus"],
      parkingFee: apiData.parkingFee,
      managementFee: apiData.managementFee,
      electricityCostPerKwh: apiData.electricityCostPerKwh,
      waterCostPerM3: apiData.waterCostPerM3,
      minimumLeaseMonths: apiData.minimumLeaseMonths,
      maximumLeaseMonths: apiData.maximumLeaseMonths ?? 0,
      availableFrom: apiData.availableFrom ?? "",
      hasFireCertificate: apiData.hasFireCertificate,
      images: apiData.images,
      videos: apiData.videos,
      amenities: apiData.amenities,
      rules: apiData.rules,
      status: apiData.status,
      approvalStatus: apiData.approvalStatus,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      user: {
        id: apiData.user.id,
        fullName: apiData.user.fullName,
        avatarUrl: apiData.user.avatarUrl,
        phone: apiData.user.phone,
        userType: apiData.user.userType,
        totalListings: apiData.user.totalListings,
        joinedYears: apiData.user.joinedYears,
        lastActive: "Gần đây",
        responseRate: undefined,
      },
    };
  }, [apiData]);

  // Sticky header on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (infoRef.current) {
        const rect = infoRef.current.getBoundingClientRect();
        setShowStickyHeader(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Is current user the landlord?
  const isOwner = currentUser?.id === apiData?.user?.id;
  const isTenant = !!currentUser && !isOwner;

  // Loading skeleton
  if (loading || !property) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-300 mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-[450px] bg-gray-200 rounded-xl mb-4" />
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex-1 animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-60 bg-gray-200 rounded-xl" />
            </div>
            <div className="w-80 shrink-0 hidden lg:block animate-pulse space-y-4">
              <div className="h-60 bg-gray-200 rounded-xl" />
              <div className="h-40 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏚️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => router.push("/search")}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tìm kiếm bất động sản khác
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky header */}
      <StickyHeader property={property} visible={showStickyHeader} />

      <div className="max-w-300 mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1 flex-wrap">
          <span
            className="hover:text-blue-500 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Trang chủ
          </span>
          <span>/</span>
          <span
            className="hover:text-blue-500 cursor-pointer"
            onClick={() => router.push("/search")}
          >
            Cho thuê nhà đất
          </span>
          <span>/</span>
          <span
            className="hover:text-blue-500 cursor-pointer"
            onClick={() =>
              router.push(`/search?city=${encodeURIComponent(property.city)}`)
            }
          >
            {property.city}
          </span>
          <span>/</span>
          <span className="text-gray-700 font-medium line-clamp-1">
            {property.title}
          </span>
        </nav>

        {/* Image gallery */}
        <ImageGallery images={property.images} videos={property.videos} title={property.title} />

        {/* Main content */}
        <div className="flex gap-6 mt-6" ref={infoRef}>
          {/* Left column */}
          <div className="flex-1 min-w-0">
            <PropertyInfo
              property={property}
              isSaved={isSaved}
              favoriteLoading={favoriteActionLoading}
              onToggleFavorite={handleToggleFavorite}
            />
            <PropertyTabs property={property} />
            <SimilarListings currentPropertyId={property.id} city={property.city} />
          </div>

          {/* Right sidebar */}
          <div className="w-80 shrink-0 hidden lg:block">
            <OwnerSidebar
              owner={property.user}
              propertyId={property.id}
              isTenant={isTenant}
              isLoggedIn={!!currentUser}
              pricePerMonth={property.pricePerMonth}
            />
            <CommentSection propertyId={property.id} />
          </div>
        </div>

        {/* Mobile sticky CTA bar (only for tenants) */}
        {isTenant && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-40">
            <button
              onClick={() => router.push(`/chat?to=${property.user.id}&property=${property.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium"
            >
              💬 Chat
            </button>
            <button
              onClick={() => window.location.href = `tel:${property.user.phone?.replace(/\*/g, '')}`}
              className="flex-1 flex items-center justify-center gap-1.5 border border-blue-500 text-blue-500 py-2.5 rounded-lg text-sm font-medium"
            >
              📞 Gọi ngay
            </button>
            <button
              onClick={() => router.push(`/dashboard?tab=booking&property=${property.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              📅 Đặt lịch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


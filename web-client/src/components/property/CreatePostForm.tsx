"use client";

import React, { useEffect, useState } from "react";
import { App, Button, Input, Spin } from "antd";
import { RightOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";

import { PROPERTY_META } from "@/constants/property.constant";
import { PropertyFormData, PropertyType } from "@/types/property.type";
import {
  MediaUploadSection,
  CategoryModal,
  AddressModal,
  PropertyDetailsSection,
  PriceSection,
  DescriptionSection,
  AmenitiesSection,
  AddressData,
  MediaItem,
} from "./create-post";

import {
  createProperty,
  createPropertySaveDraft,
  getPropertyById,
  updateProperty,
  resetProperty,
  selectProperty,
  selectPropertyLoading,
  selectPropertyLoadingDetail,
  selectPropertyMessage,
  resetMessage,
} from "@/stores/slices/property.slice";
import { AppDispatch } from "@/stores/store";
import { getMissingPostingRequirements } from "@/utils/profile-completeness";
import { useAppSelector } from "@/stores/hooks";

/* =========================
   Initial Data
========================= */
const initialFormData: PropertyFormData = {
  title: "",
  description: "",
  propertyType: "apartment",
  listingType: "rent",
  pricePerMonth: 0,
  depositAmount: 0,
  depositMonths: 1,
  address: "",
  ward: "",
  district: "",
  city: "",
  country: "Việt Nam",
  latitude: 0,
  longitude: 0,
  availableFrom: "",
  minimumLeaseMonths: 6,
  maximumLeaseMonths: 12,
  areaSqm: 0,
  bedrooms: 0,
  bathrooms: 0,
  livingRooms: 0,
  kitchens: 0,
  balconies: 0,
  floorNumber: 0,
  totalFloors: 0,
  furnitureStatus: "basic",
  parkingFee: 0,
  managementFee: 0,
  electricityCostPerKwh: 0,
  waterCostPerM3: 0,
  hasFireCertificate: false,
  images: [],
  videos: [],
  amenities: [],
  rules: [],
  status: "draft",
  approvalStatus: "pending",
  rejectionReason: "",
};

const NUMERIC_FIELDS = new Set<keyof PropertyFormData>([
  "pricePerMonth",
  "depositAmount",
  "depositMonths",
  "areaSqm",
  "bedrooms",
  "bathrooms",
  "livingRooms",
  "kitchens",
  "balconies",
  "floorNumber",
  "totalFloors",
  "parkingFee",
  "managementFee",
  "electricityCostPerKwh",
  "waterCostPerM3",
  "minimumLeaseMonths",
  "maximumLeaseMonths",
  "latitude",
  "longitude",
]);

/* =========================
   Component
========================= */
export default function CreatePostForm() {
  const { message } = App.useApp();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("id");
  const isEditMode = searchParams.get("mode") === "edit" && !!editId;

  const isLoading = useSelector(selectPropertyLoading);
  const isLoadingDetail = useSelector(selectPropertyLoadingDetail);
  const propertyMessage = useSelector(selectPropertyMessage);
  const existingProperty = useSelector(selectProperty);

  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastAction, setLastAction] = useState<"draft" | "publish" | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(true);
  const [categorySelected, setCategorySelected] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [blockedByProfile, setBlockedByProfile] = useState(false);
  const authUser = useAppSelector((state) => state.auth.user);
  const authLoading = useAppSelector((state) => state.auth.loading);

  const propertyMeta = PROPERTY_META[formData.propertyType];

  /* =========================
     Effects
  ========================= */
  // Load existing property in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      setShowCategoryModal(false);
      setCategorySelected(true);
      dispatch(getPropertyById(editId));
    }
    return () => {
      dispatch(resetProperty());
    };
  }, [isEditMode, editId, dispatch]);

  // Populate form when existing property data arrives
  useEffect(() => {
    if (!isEditMode || !existingProperty || dataLoaded) return;

    const p = existingProperty;
    setFormData({ ...initialFormData, ...p });

    if (p.images?.length) {
      setImages(
        p.images.map((img) => ({
          id: img.id,
          preview: img.uri,
          uri: img.uri,
          uploading: false,
          progress: 100,
          uploaded: true,
        }))
      );
    }

    if (p.address) {
      setAddressData({
        city: p.city,
        cityCode: 0,
        district: p.district,
        districtCode: 0,
        ward: p.ward,
        wardCode: 0,
        streetAddress: p.address,
        fullAddress: [p.address, p.ward, p.district, p.city].filter(Boolean).join(", "),
      });
    }

    setDataLoaded(true);
  }, [isEditMode, existingProperty, dataLoaded]);

  useEffect(() => {
    if (!propertyMessage) return;

    if (propertyMessage.type === "success") {
      message.success(propertyMessage.message);
      if (
        propertyMessage.message.includes("Tạo bài đăng") ||
        (isEditMode && lastAction === "publish")
      ) {
        router.push("/dashboard/posts");
      }
    } else {
      message.error(propertyMessage.message);
    }

    dispatch(resetMessage());
  }, [propertyMessage, dispatch, message, router, isEditMode, lastAction]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const missingRequirements = getMissingPostingRequirements(authUser);
    if (missingRequirements.length > 0) {
      setBlockedByProfile(true);

      const onlyMissingKyc = missingRequirements.length === 1 && missingRequirements[0] === "Xác thực KYC";
      const notLoggedIn = missingRequirements.includes("Bạn chưa đăng nhập");
      message.warning(`Bạn cần bổ sung: ${missingRequirements.join(", ")}`);
      router.replace(notLoggedIn ? "/" : onlyMissingKyc ? "/kyc" : "/dashboard/profile");
      return;
    }

    setBlockedByProfile(false);
  }, [authUser, authLoading, message, router]);

  /* =========================
     Helpers
  ========================= */
  const updateFormData = (field: keyof PropertyFormData, value: any) => {
    let finalValue = value;

    if (NUMERIC_FIELDS.has(field)) {
      finalValue = value === "" ? 0 : Number(value);
      if (Number.isNaN(finalValue)) finalValue = 0;
    }

    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };

  const prepareSubmitData = (status: "draft" | "pending_approval") => {
    const imageData = images
      .filter((i) => i.uploaded && i.uri)
      .map((i, idx) => ({
        id: i.id,
        uri: i.uri,
        isPrimary: idx === 0,
      }));

    const videoData = videos
      .filter((v) => v.uploaded && v.uri)
      .map((v) => ({
        id: v.id,
        uri: v.uri,
        thumbnail: v.preview,
      }));

    return {
      title: formData.title,
      description: formData.description,
      propertyType: formData.propertyType,
      pricePerMonth: formData.pricePerMonth,
      depositAmount: formData.depositAmount,
      depositMonths: formData.depositMonths,
      address: formData.address,
      ward: formData.ward,
      district: formData.district,
      city: formData.city,
      latitude: formData.latitude,
      longitude: formData.longitude,
      areaSqm: formData.areaSqm,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      floorNumber: formData.floorNumber || undefined,
      totalFloors: formData.totalFloors || undefined,
      furnitureStatus: formData.furnitureStatus,
      parkingFee: formData.parkingFee || undefined,
      managementFee: formData.managementFee || undefined,
      electricityCostPerKwh: formData.electricityCostPerKwh || undefined,
      waterCostPerM3: formData.waterCostPerM3 || undefined,
      minimumLeaseMonths: formData.minimumLeaseMonths || undefined,
      maximumLeaseMonths: formData.maximumLeaseMonths || undefined,
      availableFrom: formData.availableFrom || undefined,
      hasFireCertificate: formData.hasFireCertificate,
      amenities: formData.amenities,
      images: imageData,
      videos: videoData.length ? videoData : undefined,
      status,
    };
  };

  /* =========================
     Actions
  ========================= */
  const handleSubmit = () => {
    if (!formData.title) return message.error("Vui lòng nhập tiêu đề");
    if (!formData.address) return message.error("Vui lòng chọn địa chỉ");
    if (formData.areaSqm <= 0) return message.error("Diện tích không hợp lệ");
    if (formData.pricePerMonth <= 0) return message.error("Giá thuê không hợp lệ");
    if (images.filter((i) => i.uploaded).length < 3) {
      return message.error("Cần ít nhất 3 hình ảnh");
    }

    setLastAction("publish");
    if (isEditMode && editId) {
      dispatch(updateProperty({ id: editId, data: prepareSubmitData("pending_approval") }));
    } else {
      dispatch(createProperty(prepareSubmitData("pending_approval")));
    }
  };

  const handleSaveDraft = () => {
    if (!formData.title) {
      return message.error("Nhập tiêu đề để lưu nháp");
    }
    setLastAction("draft");
    if (isEditMode && editId) {
      dispatch(updateProperty({ id: editId, data: prepareSubmitData("draft") }));
    } else {
      dispatch(createPropertySaveDraft(prepareSubmitData("draft")));
    }
  };

  /* =========================
     Render
  ========================= */
  if (isEditMode && isLoadingDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (blockedByProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24">
      {isEditMode && existingProperty?.rejectionReason && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <p className="text-red-700 font-semibold text-sm mb-1">Lý do từ chối</p>
              <p className="text-red-600 text-sm">{existingProperty.rejectionReason}</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Media */}
        <div className="lg:col-span-4">
          <MediaUploadSection
            images={images}
            setImages={setImages}
            videos={videos}
            setVideos={setVideos}
          />
        </div>

        {/* Form */}
        <div className="lg:col-span-8 space-y-6">
          {/* Category */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="text-sm font-medium">Loại BĐS *</label>
            <div
              className="mt-2 p-4 bg-white rounded-xl border border-gray-300 cursor-pointer flex justify-between"
              onClick={() => setShowCategoryModal(true)}
            >
              <span>BĐS cho thuê - {propertyMeta.label}</span>
              <RightOutlined />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <Input
              size="large"
              placeholder="Tiêu đề"
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
            />

            <div
              className="mt-2 p-4 bg-white rounded-xl border border-gray-300 cursor-pointer flex justify-between"
              onClick={() => setShowAddressModal(true)}
            >
              <div className="flex gap-2">
                <EnvironmentOutlined />
                <span>
                  {addressData?.fullAddress || "Chọn địa chỉ"}
                </span>
              </div>
              <RightOutlined />
            </div>
          </div>

          <PropertyDetailsSection
            propertyType={formData.propertyType}
            formData={formData}
            updateFormData={updateFormData}
          />

          <PriceSection formData={formData} updateFormData={updateFormData} />
          <DescriptionSection
            formData={formData}
            updateFormData={updateFormData}
            imageUrls={images.filter((i) => i.uploaded && i.uri).map((i) => i.uri!)}
          />
          <AmenitiesSection
            propertyType={formData.propertyType}
            amenities={formData.amenities}
            onUpdate={(v) => updateFormData("amenities", v)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-center gap-4">
        <Button onClick={handleSaveDraft} loading={isLoading}>
          Lưu nháp
        </Button>
        <Button type="primary" onClick={handleSubmit} loading={isLoading}>
          {isEditMode ? "Cập nhật thông tin" : "Đăng tin"}
        </Button>
      </div>

      {/* Modals */}
      <CategoryModal
        open={showCategoryModal}
        selectedType={formData.propertyType}
        isFirstTime={!categorySelected}
        onClose={() => categorySelected && setShowCategoryModal(false)}
        onSelect={(type: PropertyType) => {
          updateFormData("propertyType", type);
          setCategorySelected(true);
          setShowCategoryModal(false);
        }}
      />

      <AddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onConfirm={(data) => {
          setAddressData(data);
          updateFormData("address", data.fullAddress);
          updateFormData("city", data.city);
          updateFormData("district", data.district);
          updateFormData("ward", data.ward);
        }}
      />
    </div>
  );
}

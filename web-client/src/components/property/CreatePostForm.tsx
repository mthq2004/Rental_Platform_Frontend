"use client";

import React, { useEffect, useState } from "react";
import { App, Button, Input } from "antd";
import { RightOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";

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
  selectPropertyLoading,
  selectPropertyMessage,
  resetMessage,
} from "@/stores/slices/property.slice";
import { AppDispatch } from "@/stores/store";

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

  const isLoading = useSelector(selectPropertyLoading);
  const propertyMessage = useSelector(selectPropertyMessage);

  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [addressData, setAddressData] = useState<AddressData | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(true);
  const [categorySelected, setCategorySelected] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const propertyMeta = PROPERTY_META[formData.propertyType];

  /* =========================
     Effects
  ========================= */
  useEffect(() => {
    if (!propertyMessage) return;

    if (propertyMessage.type === "success") {
      message.success(propertyMessage.message);
      if (propertyMessage.message.includes("Tạo bài đăng")) {
        router.push("/dashboard/posts");
      }
    } else {
      message.error(propertyMessage.message);
    }

    dispatch(resetMessage());
  }, [propertyMessage, dispatch, message, router]);

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

    dispatch(createProperty(prepareSubmitData("pending_approval")));
  };

  const handleSaveDraft = () => {
    if (!formData.title) {
      return message.error("Nhập tiêu đề để lưu nháp");
    }
    dispatch(createPropertySaveDraft(prepareSubmitData("draft")));
  };

  /* =========================
     Render
  ========================= */
  return (
    <div className="w-full min-h-screen bg-gray-50 pb-24">
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
          <DescriptionSection formData={formData} updateFormData={updateFormData} />
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
          Đăng tin
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

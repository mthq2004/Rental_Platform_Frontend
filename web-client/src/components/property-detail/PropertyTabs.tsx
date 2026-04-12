"use client";

import React, { useState, useRef } from "react";
import {
  HomeOutlined,
  ExpandOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  DropboxOutlined,
  CarOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FireOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { PropertyDetailData } from "./types";
import type { PropertyType } from "@/types/property.type";
import { PROPERTY_META } from "@/constants/property.constant";

interface PropertyTabsProps {
  property: PropertyDetailData;
}

type TabKey = "overview" | "features" | "description" | "map";

const FURNITURE_LABELS: Record<string, string> = {
  empty: "Không nội thất",
  basic: "Nội thất cơ bản",
  full: "Nội thất đầy đủ",
  luxury: "Nội thất cao cấp",
};

const DETAIL_ROWS = (p: PropertyDetailData) => {
  const rows: { icon: React.ReactNode; label: string; value: string | number | null }[] = [
    { icon: <HomeOutlined />, label: "Loại hình", value: PROPERTY_META[p.propertyType as PropertyType]?.label || p.propertyType },
    { icon: <ExpandOutlined />, label: "Diện tích", value: `${p.areaSqm} m²` },
    { icon: <DollarOutlined />, label: "Giá thuê", value: formatPriceShort(p.pricePerMonth) },
    { icon: <TeamOutlined />, label: "Số phòng ngủ", value: p.bedrooms > 0 ? `${p.bedrooms} phòng` : null },
    { icon: <AppstoreOutlined />, label: "Số phòng vệ sinh", value: p.bathrooms > 0 ? `${p.bathrooms} phòng` : null },
    { icon: <BankOutlined />, label: "Số tầng", value: p.totalFloors > 0 ? `${p.totalFloors} tầng` : null },
    { icon: <SafetyCertificateOutlined />, label: "Nội thất", value: FURNITURE_LABELS[p.furnitureStatus] || null },
    { icon: <ThunderboltOutlined />, label: "Giá điện", value: p.electricityCostPerKwh > 0 ? `${p.electricityCostPerKwh.toLocaleString("vi-VN")} đ/kWh` : null },
    { icon: <DropboxOutlined />, label: "Giá nước", value: p.waterCostPerM3 > 0 ? `${p.waterCostPerM3.toLocaleString("vi-VN")} đ/m³` : null },
    { icon: <CarOutlined />, label: "Phí gửi xe", value: p.parkingFee > 0 ? `${p.parkingFee.toLocaleString("vi-VN")} đ/tháng` : null },
    { icon: <DollarOutlined />, label: "Phí quản lý", value: p.managementFee > 0 ? `${p.managementFee.toLocaleString("vi-VN")} đ/tháng` : null },
    { icon: <DollarOutlined />, label: "Đặt cọc", value: p.depositAmount > 0 ? `${(p.depositAmount / 1000000).toFixed(0)} triệu (${p.depositMonths} tháng)` : null },
    { icon: <CalendarOutlined />, label: "Thời hạn thuê tối thiểu", value: p.minimumLeaseMonths > 0 ? `${p.minimumLeaseMonths} tháng` : null },
    { icon: <FireOutlined />, label: "Chứng nhận PCCC", value: p.hasFireCertificate ? "Có" : null },
  ];
  return rows.filter((r) => r.value !== null && r.value !== "");
};

function formatPriceShort(price: number): string {
  if (price >= 1000000) {
    const m = price / 1000000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString("vi-VN")} đ/tháng`;
}

export default function PropertyTabs({ property }: PropertyTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "features", label: "Đặc điểm" },
    { key: "description", label: "Mô tả" },
    { key: "map", label: "Bản đồ" },
  ];

  const detailRows = DETAIL_ROWS(property);
  const meta = PROPERTY_META[property.propertyType as PropertyType];

  return (
    <div className="mt-4">
      {/* Tab bar */}
      <div className="bg-white rounded-t-xl border border-gray-100 border-b-0">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3.5 text-sm font-medium transition-colors relative
                ${activeTab === tab.key
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div
        ref={contentRef}
        className="bg-white rounded-b-xl border border-gray-100 border-t shadow-sm"
      >
        {/* === Overview === */}
        {activeTab === "overview" && (
          <div className="p-6">
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full">
                <tbody>
                  {detailRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                    >
                      <td className="px-5 py-3.5 text-sm text-gray-500 w-[45%]">
                        <span className="flex items-center gap-2.5">
                          <span className="text-blue-500">{row.icon}</span>
                          {row.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-800">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === Features (Amenities) === */}
        {activeTab === "features" && (
          <div className="p-6">
            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tiện ích</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50/50 rounded-lg px-3 py-2.5"
                    >
                      <CheckCircleOutlined className="text-blue-500" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {property.rules.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quy định</h3>
                <div className="space-y-2">
                  {[...property.rules]
                    .sort((a, b) => a.order - b.order)
                    .map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                        {rule.text}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Available from */}
            {property.availableFrom && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <CalendarOutlined className="text-green-600 text-lg" />
                <div>
                  <p className="text-sm font-medium text-green-800">Ngày có thể dọn vào</p>
                  <p className="text-sm text-green-600">
                    {new Date(property.availableFrom).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === Description === */}
        {activeTab === "description" && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Mô tả chi tiết</h3>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </div>
          </div>
        )}

        {/* === Map === */}
        {activeTab === "map" && (
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Xem trên bản đồ</h3>
            {property.latitude && property.longitude ? (
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  title="Property Map"
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                />
              </div>
            ) : (
              <div className="h-[350px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <EnvironmentOutlined className="text-4xl mb-2" />
                  <p>Không có dữ liệu bản đồ</p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-3">
              <EnvironmentOutlined className="text-blue-500 mr-1" />
              {property.address}, {property.ward}, {property.district}, {property.city}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

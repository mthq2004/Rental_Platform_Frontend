"use client";
import React, { useState, useEffect } from "react";
import { Button, Select, Spin } from "antd";
import provinceService from "@/services/province.service";
import { Province } from "@/types/province.type";

const PriceReference = () => {
  const [activeCategory, setActiveCategory] = useState<string>("apartment");
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);

  const categories = [
    { key: "apartment", label: "Căn hộ / Chung cư" },
    { key: "house", label: "Nhà ở" },
    { key: "land", label: "Đất" },
  ];

  // Fetch provinces from API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const data = await provinceService.getProvinces();
        setProvinces(data);
        // Set default to Ho Chi Minh (code 79)
        const hcm = data.find((p) => p.code === 79);
        if (hcm) setSelectedProvince(hcm.code);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              {/* Header */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Tham khảo giá bất động sản
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Cập nhật dữ liệu biến động giá mới nhất tháng 01/2026 tại 5
                thành phố lớn
              </p>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${
                        activeCategory === cat.key
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* City Select */}
              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-2">
                  Chọn tỉnh thành
                </label>
                <Select
                  size="large"
                  placeholder="Chọn tỉnh thành"
                  className="w-full max-w-[300px]"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  loading={loadingProvinces}
                  value={selectedProvince}
                  onChange={(value) => setSelectedProvince(value)}
                  options={provinces.map((p) => ({
                    value: p.code,
                    label: p.name,
                  }))}
                  notFoundContent={
                    loadingProvinces ? <Spin size="small" /> : null
                  }
                />
              </div>

              {/* CTA Button */}
              <Button
                type="primary"
                size="large"
                className="bg-red-500 hover:bg-red-600 border-none rounded-lg px-8 font-semibold"
              >
                Xem giá ngay
              </Button>
            </div>

            {/* Right Column - Map Placeholder */}
            <div className="relative">
              <div className="bg-red-50 rounded-xl h-[300px] flex items-center justify-center overflow-hidden">
                {/* Map Placeholder */}
                <div className="relative w-full h-full">
                  <img
                    src="/assets/image/vietnam-map.png"
                    alt="Vietnam Map"
                    className="w-full h-full object-contain opacity-80"
                  />
                  {/* Location Pin */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      Bình Thạnh
                    </div>
                    <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceReference;

"use client";
import React, { useState, useEffect } from "react";
import { Button, Select, Spin } from "antd";
import provinceService from "@/services/province.service";
import { Province } from "@/types/province.type";
import { useRouter } from "next/navigation";

const PriceReference = () => {
  const [activeCategory, setActiveCategory] = useState<string>("apartment");
  const [selectedProvince, setSelectedProvince] = useState<number>(79);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const route = useRouter();

  const categories = [
    { key: "apartment", label: "Căn hộ / Chung cư" },
    { key: "house", label: "Nhà ở" },
    { key: "land", label: "Đất" },
    { key: "office", label: "Văn phòng" },
    { key: "room", label: "Phòng trọ" },
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
                  virtual={false}
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
                className="bg-blue-500 hover:bg-blue-600 border-none rounded-lg px-8 font-semibold"
                onClick={() => {
                  route.push("/analysis");
                }}
              >
                Xem giá ngay
              </Button>
            </div>

            {/* Right Column - Map */}
            <div className="relative">
              <div className="rounded-xl h-[300px] overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  title="Bản đồ tham khảo giá"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps?q=${
                    selectedProvince === 79
                      ? "10.8231,106.6297"
                      : selectedProvince === 1
                      ? "21.0285,105.8542"
                      : selectedProvince === 48
                      ? "16.0544,108.2022"
                      : selectedProvince === 92
                      ? "10.0452,105.7469"
                      : selectedProvince === 74
                      ? "11.3254,106.477"
                      : "14.0583,108.2772"
                  }&z=12&output=embed`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceReference;

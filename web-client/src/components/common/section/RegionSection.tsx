"use client";
import React, { useState, useEffect } from "react";
import provinceService from "@/services/province.service";
import { Province } from "@/types/province.type";

// Mapping tỉnh thành với hình ảnh mặc định
const provinceImages: Record<string, string> = {
  thanh_pho_ho_chi_minh: "/assets/image/region-hcm.jpg",
  thanh_pho_ha_noi: "/assets/image/region-hanoi.jpg",
  thanh_pho_da_nang: "/assets/image/region-danang.jpg",
  thanh_pho_can_tho: "/assets/image/region-cantho.jpg",
  tinh_binh_duong: "/assets/image/region-binhduong.jpg",
};

// Danh sách mã tỉnh thành ưu tiên hiển thị (theo thứ tự)
const priorityProvinceCodes = [79, 1, 48, 92, 74]; // HCM, Hà Nội, Đà Nẵng, Cần Thơ, Bình Dương

// Extended Province với postCount cho hiển thị
interface DisplayProvince extends Province {
  postCount?: number;
}

const RegionSection = () => {
  const [activeTab, setActiveTab] = useState<"rent">("rent");
  const [activeCategory, setActiveCategory] = useState<string>("apartment");
  const [provinces, setProvinces] = useState<DisplayProvince[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { key: "apartment", label: "Căn hộ/Chung cư" },
    { key: "house", label: "Nhà ở" },
    { key: "office", label: "Văn phòng, Mặt bằng kinh doanh" },
    { key: "land", label: "Đất" },
  ];

  // Fetch provinces từ API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        setError(null);
        const allProvinces = await provinceService.getProvinces();

        // Lọc và sắp xếp theo priority
        const priorityProvinces = priorityProvinceCodes
          .map((code) => allProvinces.find((p) => p.code === code))
          .filter((p): p is Province => p !== undefined)
          .map((p) => ({
            ...p,
            postCount: getDefaultPostCount(p.code),
          }));

        setProvinces(priorityProvinces);
      } catch (err) {
        console.error("Error fetching provinces:", err);
        setError("Không thể tải dữ liệu tỉnh thành");
        // Fallback data khi API lỗi
        setProvinces([
          {
            code: 79,
            name: "Thành phố Hồ Chí Minh",
            codename: "thanh_pho_ho_chi_minh",
            division_type: "tỉnh",
            phone_code: 28,
            postCount: 3585,
          },
          {
            code: 1,
            name: "Thành phố Hà Nội",
            codename: "thanh_pho_ha_noi",
            division_type: "tỉnh",
            phone_code: 24,
            postCount: 1229,
          },
          {
            code: 48,
            name: "Thành phố Đà Nẵng",
            codename: "thanh_pho_da_nang",
            division_type: "tỉnh",
            phone_code: 236,
            postCount: 653,
          },
          {
            code: 92,
            name: "Thành phố Cần Thơ",
            codename: "thanh_pho_can_tho",
            division_type: "tỉnh",
            phone_code: 292,
            postCount: 90,
          },
          {
            code: 74,
            name: "Tỉnh Bình Dương",
            codename: "tinh_binh_duong",
            division_type: "tỉnh",
            phone_code: 274,
            postCount: 1072,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // Lấy số lượng tin đăng mặc định theo mã tỉnh
  const getDefaultPostCount = (code: number): number => {
    const postCounts: Record<number, number> = {
      79: 3585, // HCM
      1: 1229, // Hà Nội
      48: 653, // Đà Nẵng
      92: 90, // Cần Thơ
      74: 1072, // Bình Dương
    };
    return postCounts[code] || 0;
  };

  // Hàm lấy hình ảnh cho tỉnh thành
  const getProvinceImage = (province: DisplayProvince): string => {
    // Tìm theo codename
    if (province.codename && provinceImages[province.codename]) {
      return provinceImages[province.codename];
    }

    // Default image
    return "/assets/image/region-default.jpg";
  };

  // Format số lượng tin đăng
  const formatPostCount = (count?: number): string => {
    if (!count) return "0 tin đăng";
    return `${count.toLocaleString("vi-VN")} tin đăng`;
  };

  return (
    <section className="w-full bg-white py-8">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Bất động sản cho thuê theo khu vực
            </h2>

            {/* Single Tab - Cho thuê only */}
            {/* <div className="flex items-center gap-2">
              <button
                className="px-5 py-2 rounded-full text-sm font-medium transition-all bg-red-500 text-white"
              >
                Cho thuê
              </button>
            </div> */}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`
                  px-4 py-2 text-sm font-medium transition-all rounded-t-lg
                  ${activeCategory === cat.key
                    ? "text-red-600 border-b-2 border-red-500"
                    : "text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[400px]">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className={`
                    ${index === 0 ? "col-span-2 row-span-2" : ""}
                    bg-gray-200 rounded-xl animate-pulse
                  `}
                />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-red-500 hover:text-red-600 underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Regions Grid */}
          {!loading && provinces.length > 0 && (
            <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[400px]">
              {/* Large card - spans 2 columns and 2 rows */}
              {provinces[0] && (
                <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer">
                  <img
                    src={getProvinceImage(provinces[0])}
                    alt={provinces[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-2xl font-bold">{provinces[0].name}</h3>
                    <p className="text-sm text-red-300">
                      {formatPostCount(provinces[0].postCount)}
                    </p>
                  </div>
                </div>
              )}

              {/* Medium cards */}
              {provinces.slice(1, 3).map((province) => (
                <div
                  key={province.code}
                  className="relative rounded-xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={getProvinceImage(province)}
                    alt={province.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="text-lg font-bold">{province.name}</h3>
                    <p className="text-xs text-red-300">
                      {formatPostCount(province.postCount)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Small cards */}
              {provinces.slice(3, 5).map((province) => (
                <div
                  key={province.code}
                  className="relative rounded-xl overflow-hidden group cursor-pointer"
                >
                  <img
                    src={getProvinceImage(province)}
                    alt={province.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="text-base font-bold">{province.name}</h3>
                    <p className="text-xs text-red-300">
                      {formatPostCount(province.postCount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RegionSection;

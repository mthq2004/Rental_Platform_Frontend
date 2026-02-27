"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EnvironmentFilled,
  SearchOutlined,
  HomeOutlined,
  RightOutlined,
} from "@ant-design/icons";

interface CityMarker {
  name: string;
  code: number;
  lat: number;
  lng: number;
  listings: number;
  topDistricts: string[];
}

const CITY_MARKERS: CityMarker[] = [
  {
    name: "TP. Hồ Chí Minh",
    code: 79,
    lat: 10.8231,
    lng: 106.6297,
    listings: 3585,
    topDistricts: ["Quận 1", "Quận 7", "Thủ Đức", "Bình Thạnh", "Quận 2"],
  },
  {
    name: "Hà Nội",
    code: 1,
    lat: 21.0285,
    lng: 105.8542,
    listings: 1229,
    topDistricts: ["Cầu Giấy", "Đống Đa", "Hoàn Kiếm", "Hai Bà Trưng", "Thanh Xuân"],
  },
  {
    name: "Đà Nẵng",
    code: 48,
    lat: 16.0544,
    lng: 108.2022,
    listings: 856,
    topDistricts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu"],
  },
  {
    name: "Cần Thơ",
    code: 92,
    lat: 10.0452,
    lng: 105.7469,
    listings: 342,
    topDistricts: ["Ninh Kiều", "Cái Răng", "Bình Thủy", "Ô Môn"],
  },
  {
    name: "Bình Dương",
    code: 74,
    lat: 11.3254,
    lng: 106.477,
    listings: 478,
    topDistricts: ["Thủ Dầu Một", "Dĩ An", "Thuận An", "Bến Cát"],
  },
  {
    name: "Đồng Nai",
    code: 75,
    lat: 10.9451,
    lng: 106.8244,
    listings: 312,
    topDistricts: ["Biên Hòa", "Long Thành", "Nhơn Trạch", "Trảng Bom"],
  },
];

const MapSection = () => {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<CityMarker>(CITY_MARKERS[0]);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  const handleCityClick = (city: CityMarker) => {
    setSelectedCity(city);
  };

  const handleSearchInCity = (cityName: string) => {
    router.push(`/search?city=${encodeURIComponent(cityName)}`);
  };

  const handleDistrictClick = (cityName: string, district: string) => {
    router.push(
      `/search?city=${encodeURIComponent(cityName)}&district=${encodeURIComponent(district)}`
    );
  };

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto max-w-300 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Khám phá bất động sản theo khu vực
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tìm kiếm nhà cho thuê trên bản đồ theo vị trí bạn mong muốn
            </p>
          </div>
          <button
            onClick={() => router.push("/search")}
            className="hidden md:flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
          >
            Xem tất cả
            <RightOutlined className="text-xs" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Map container */}
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100">
            <iframe
              title="Bản đồ bất động sản"
              width="100%"
              height="450"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${selectedCity.lat},${selectedCity.lng}&z=12&output=embed`}
            />

            {/* City quick-switch pills overlay */}
            <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 z-10">
              {CITY_MARKERS.map((city) => (
                <button
                  key={city.code}
                  onClick={() => handleCityClick(city)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-md transition-all
                    ${
                      selectedCity.code === city.code
                        ? "bg-blue-500 text-white shadow-blue-200"
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                >
                  <EnvironmentFilled
                    className={`text-[10px] ${
                      selectedCity.code === city.code ? "text-white" : "text-blue-500"
                    }`}
                  />
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* City listing sidebar */}
          <div className="w-full lg:w-80 shrink-0">
            {/* Selected city info */}
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <EnvironmentFilled className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">
                    {selectedCity.name}
                  </h3>
                  <p className="text-sm text-blue-600 font-medium">
                    {selectedCity.listings.toLocaleString("vi-VN")} tin đăng
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSearchInCity(selectedCity.name)}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium transition-colors mb-4"
              >
                <SearchOutlined />
                Tìm kiếm tại {selectedCity.name}
              </button>

              {/* Top districts */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                  Khu vực nổi bật
                </p>
                <div className="space-y-1.5">
                  {selectedCity.topDistricts.map((district) => (
                    <button
                      key={district}
                      onClick={() => handleDistrictClick(selectedCity.name, district)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:shadow-sm transition-all group"
                    >
                      <span className="flex items-center gap-2">
                        <HomeOutlined className="text-blue-400 text-xs" />
                        {district}
                      </span>
                      <RightOutlined className="text-[10px] text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Other cities list */}
            <div className="mt-4 space-y-2">
              {CITY_MARKERS.filter((c) => c.code !== selectedCity.code).map((city) => (
                <button
                  key={city.code}
                  onClick={() => handleCityClick(city)}
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border
                    ${
                      hoveredCity === city.name
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <EnvironmentFilled
                      className={`${
                        hoveredCity === city.name ? "text-blue-500" : "text-gray-400"
                      } transition-colors`}
                    />
                    <span className="font-medium text-gray-800">{city.name}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {city.listings.toLocaleString("vi-VN")} tin
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapSection;

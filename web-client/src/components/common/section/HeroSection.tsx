"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input, Select, Button, Spin } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  DownOutlined,
} from "@ant-design/icons";
import provinceService from "@/services/province.service";
import { Province, District, Ward } from "@/types/province.type";

const HeroSection = () => {
  const [activeTab, setActiveTab] = useState<"rent" | "project">(
    "rent"
  );

  // Location modal states
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Selected values
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);

  // Applied values (hiển thị trên button)
  const [appliedProvince, setAppliedProvince] = useState<Province | null>(null);
  const [appliedDistrict, setAppliedDistrict] = useState<District | null>(null);
  const [appliedWard, setAppliedWard] = useState<Ward | null>(null);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const tabs = [
    { key: "rent", label: "Cho thuê" },
    { key: "project", label: "Dự án" },
  ];

  /* ===================== FETCH DATA ===================== */

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const data = await provinceService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) return;

    const fetchDistricts = async () => {
      try {
        setLoadingDistricts(true);
        setDistricts([]);
        setWards([]);
        setSelectedDistrict(null);
        setSelectedWard(null);

        const provinceData = await provinceService.getProvinceWithDistricts(
          selectedProvince
        );
        setDistricts(provinceData.districts || []);
      } catch (error) {
        console.error("Failed to fetch districts:", error);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) return;

    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        setWards([]);
        setSelectedWard(null);

        const districtData = await provinceService.getDistrictWithWards(
          selectedDistrict
        );
        setWards(districtData.wards || []);
      } catch (error) {
        console.error("Failed to fetch wards:", error);
      } finally {
        setLoadingWards(false);
      }
    };

    fetchWards();
  }, [selectedDistrict]);

  /* ===================== CLICK OUTSIDE FIX ===================== */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Bỏ qua nếu click vào button (để button tự handle toggle)
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      
      // Đóng modal nếu click bên ngoài modal
      if (modalRef.current && !modalRef.current.contains(target)) {
        setIsLocationModalOpen(false);
      }
    };

    if (isLocationModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLocationModalOpen]);

  /* ===================== HANDLERS ===================== */

  const handleApplyLocation = () => {
    const province = provinces.find((p) => p.code === selectedProvince) || null;
    const district = districts.find((d) => d.code === selectedDistrict) || null;
    const ward = wards.find((w) => w.code === selectedWard) || null;

    setAppliedProvince(province);
    setAppliedDistrict(district);
    setAppliedWard(ward);
    setIsLocationModalOpen(false);
  };

  const getLocationDisplayText = (): string => {
    if (appliedDistrict) return appliedDistrict.name;
    if (appliedProvince) return appliedProvince.name;
    return "Chọn khu vực";
  };

  /* ===================== RENDER ===================== */

  return (
    <section
      className={`py-4 relative w-full ${isLocationModalOpen ? "overflow-visible" : "overflow-hidden"
        }`}
      style={{ zIndex: isLocationModalOpen ? 100 : 1 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500 via-blue-300 to-blue-100">
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none">
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </div>

      {/* Mascot – FULL WIDTH */}
      {/* <div className="relative w-full mb-4">
        <img
          src="/assets/image/mascot.png"
          alt="Mascot"
          className="w-full h-40 md:h-55 object-contain  "
        />
      </div> */}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-300 px-4 py-8 md:py-12">
        {/* Slogan */}
        <h1 className="text-center text-2xl md:text-4xl font-bold text-white mb-6 italic">
          Nhà vừa ý, giá hợp lý!
        </h1>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() =>
                setActiveTab(tab.key as "rent" | "project")
              }
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all
            ${activeTab === tab.key
                  ? "bg-white text-red-600 shadow-md"
                  : "bg-transparent text-white border border-white/50 hover:bg-white/10"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 max-w-[900px] mx-auto relative z-[999]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1">
            <Input
              size="large"
              placeholder="Tìm bất động sản..."
              prefix={<SearchOutlined className="text-gray-400 text-lg" />}
              className="w-full shadow-sm h-12 rounded-lg border-gray-200 hover:border-red-400 focus:border-red-500"
            />
          </div>

          {/* Location Button */}
          <div className="relative z-[1000]">
            <button
              ref={buttonRef}
              onClick={() => setIsLocationModalOpen(!isLocationModalOpen)}
              className="flex items-center justify-between gap-2 
                w-full md:w-[220px] h-12 px-4
                bg-white text-gray-700 rounded-lg border border-gray-200
                hover:border-red-400 hover:text-red-600 hover:shadow-md
                active:scale-[0.98]
                transition-all duration-200 ease-out shadow-sm
                group"
            >
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-red-500 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {getLocationDisplayText()}
                </span>
              </div>
              <DownOutlined 
                className={`text-xs transition-transform duration-300 ease-out
                  ${isLocationModalOpen ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>

            {/* Location Modal with Animation */}
            <div
              ref={modalRef}
              className={`absolute top-14 left-0 md:left-1/2 md:-translate-x-1/2 
                w-[320px] bg-white rounded-xl shadow-xl 
                border border-red-100 z-[9999]
                transition-all duration-300 ease-out origin-top
                ${isLocationModalOpen 
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 border-b border-red-100 rounded-t-xl">
                <h3 className="text-center text-base font-semibold text-gray-800">
                  Khu vực
                </h3>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                {/* Province */}
                <div className={`transition-all duration-300 delay-75
                  ${isLocationModalOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">
                    Chọn tỉnh thành <span className="text-red-500">*</span>
                  </label>
                    <Select
                      size="large"
                      placeholder="Chọn tỉnh thành"
                      className="w-full"
                      showSearch
                      getPopupContainer={() => modalRef.current!}
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

                {/* District */}
                <div className={`transition-all duration-300 delay-150
                  ${isLocationModalOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">
                    Chọn quận huyện <span className="text-red-500">*</span>
                  </label>
                    <Select
                      size="large"
                      placeholder="Chọn quận huyện"
                      className="w-full"
                      showSearch
                      getPopupContainer={() => modalRef.current!}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      loading={loadingDistricts}
                      value={selectedDistrict}
                      onChange={(value) => setSelectedDistrict(value)}
                      disabled={!selectedProvince}
                      options={districts.map((d) => ({
                        value: d.code,
                        label: d.name,
                      }))}
                    notFoundContent={
                      loadingDistricts ? <Spin size="small" /> : null
                    }
                  />
                </div>

                {/* Ward */}
                <div className={`transition-all duration-300 delay-200
                  ${isLocationModalOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <label className="block text-sm text-gray-600 mb-1 font-medium">
                    Chọn phường xã <span className="text-red-500">*</span>
                  </label>
                    <Select
                      size="large"
                      placeholder="Chọn phường xã"
                      className="w-full"
                      showSearch
                      getPopupContainer={() => modalRef.current!}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      loading={loadingWards}
                      value={selectedWard}
                      onChange={(value) => setSelectedWard(value)}
                      disabled={!selectedDistrict}
                      options={wards.map((w) => ({
                        value: w.code,
                        label: w.name,
                      }))}
                    notFoundContent={
                      loadingWards ? <Spin size="small" /> : null
                    }
                  />
                </div>
              </div>

              {/* Footer */}
              <div className={`p-4 pt-0 transition-all duration-300 delay-300
                ${isLocationModalOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleApplyLocation}
                  className="h-12 bg-gradient-to-r from-red-500 to-orange-500 
                    hover:from-red-600 hover:to-orange-600
                    border-none rounded-lg font-semibold shadow-md
                    hover:shadow-lg hover:scale-[1.02]
                    active:scale-[0.98]
                    transition-all duration-200"
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          </div>

          {/* Type Select */}
          <Select
            size="large"
            placeholder="Loại hình BĐS"
            suffixIcon={<AppstoreOutlined className="text-red-500" />}
            className="w-full md:w-[180px] h-12 shadow-sm"
            options={[
              { value: "apartment", label: "Căn hộ" },
              { value: "house", label: "Nhà ở" },
              { value: "land", label: "Đất nền" },
              { value: "office", label: "Văn phòng" },
            ]}
          />

          {/* Search Button */}
          <Button
            type="primary"
            size="large"
            className="h-12 px-8 bg-red-500 hover:bg-red-600 
              border-none rounded-lg font-semibold"
            style={{ height: "45px" }}
          >
            Tìm nhà
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

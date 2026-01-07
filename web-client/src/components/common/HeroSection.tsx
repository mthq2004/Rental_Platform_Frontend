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
  const [activeTab, setActiveTab] = useState<"rent" | "sale" | "project">(
    "sale"
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

  const tabs = [
    { key: "rent", label: "Cho thuê" },
    { key: "sale", label: "Mua bán" },
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
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
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
      className={`relative w-full ${
        isLocationModalOpen ? "overflow-visible" : "overflow-hidden"
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
                setActiveTab(tab.key as "rent" | "sale" | "project")
              }
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all
            ${
              activeTab === tab.key
                ? "bg-white text-orange-600 shadow-md"
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
              className="w-full shadow-sm h-12 rounded-lg border-gray-200 hover:border-orange-400 focus:border-orange-500"
            />
          </div>

          {/* Location Button */}
          <div className="relative z-[1000]">
            <button
              onClick={() => setIsLocationModalOpen(!isLocationModalOpen)}
              className="flex items-center justify-between gap-2 
                w-full md:w-[220px] h-12 px-4
                bg-white text-gray-700 rounded-lg border border-gray-200
                hover:border-orange-400 hover:text-orange-600
                transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-orange-500" />
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {getLocationDisplayText()}
                </span>
              </div>
              <DownOutlined className="text-xs" />
            </button>

            {/* Location Modal */}
            {isLocationModalOpen && (
              <div
                ref={modalRef}
                className="absolute top-14 left-0 md:left-auto md:right-0 
                  w-[320px] bg-white rounded-xl shadow-xl 
                  border border-orange-100 z-[9999]"
              >
                {/* Header */}
                <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
                  <h3 className="text-center text-base font-semibold text-gray-800">
                    Khu vực
                  </h3>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                  {/* Province */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
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
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
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
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
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
                <div className="p-4 pt-0">
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleApplyLocation}
                    className="h-12 bg-orange-500 hover:bg-orange-600 
                      border-none rounded-lg font-semibold shadow-md"
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Type Select */}
          <Select
            size="large"
            placeholder="Loại hình BĐS"
            suffixIcon={<AppstoreOutlined className="text-orange-500" />}
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
            className="h-12 px-8 bg-orange-500 hover:bg-orange-600 
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

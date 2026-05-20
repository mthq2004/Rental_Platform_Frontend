"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input, Select, Button, Spin } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import provinceService from "@/services/province.service";
import { Province, District, Ward } from "@/types/province.type";
import { useAnimatedPlaceholder } from "@/hooks/useAnimatedPlaceholder";
import { useInstantSearch } from "@/hooks/useInstantSearch";
import SearchSuggestions from "@/components/common/SearchSuggestions";

const HeroSection = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"rent" | "project">(
    "rent"
  );

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | undefined>(undefined);

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

  const [isOpenType, setIsOpenType] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsOpenType(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const propertyOptions = [
    { value: "apartment", label: "Căn hộ" },
    { value: "house", label: "Nhà ở" },
    { value: "land", label: "Đất nền" },
    { value: "office", label: "Văn phòng" },
    { value: "room", label: "Phòng trọ" },
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

  const handleSearchNavigate = () => {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
    if (selectedPropertyType) params.set("propertyType", selectedPropertyType);
    if (appliedProvince) params.set("city", appliedProvince.name);
    if (appliedDistrict) params.set("district", appliedDistrict.name);
    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ""}`);
  };

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isAnyDropdownOpen = isLocationModalOpen || isOpenType || showSuggestions;
  const animatedPlaceholder = useAnimatedPlaceholder(!searchKeyword && !isFocused);
  const { keywords, loading: suggestionsLoading } = useInstantSearch(
    searchKeyword,
    "home",
    300
  );

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay hiding to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSelectKeyword = (keyword: string) => {
    setSearchKeyword(keyword);
    setShowSuggestions(false);
    // Navigate with the selected keyword
    const params = new URLSearchParams();
    params.set("keyword", keyword);
    if (selectedPropertyType) params.set("propertyType", selectedPropertyType);
    if (appliedProvince) params.set("city", appliedProvince.name);
    if (appliedDistrict) params.set("district", appliedDistrict.name);
    router.push(`/search?${params.toString()}`);
  };
  /* ===================== RENDER ===================== */

  return (
    <section
      // CHỈNH Ở ĐÂY: Sử dụng overflow-visible khi CÓ BẤT KỲ dropdown nào mở
      className={`py-4 relative w-full ${isAnyDropdownOpen ? "overflow-visible" : "overflow-hidden"}`}
      style={{ zIndex: isAnyDropdownOpen ? 100 : 1 }}
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
      <div className="relative z-10 mx-auto max-w-300 px-8 py-14 md:py-12">
        <div className="text-center mb-10 space-y-3">
          {/* Chữ lớn - Chỉnh lại màu sắc sắc nét và kích thước vừa vặn */}
          <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase">
            <span className="
              text-white
              /* Đổ bóng tối giúp chữ tách biệt hoàn toàn khỏi nền xanh sáng */
              [text-shadow:_0_4px_8px_rgba(0,0,0,0.3)]
              drop-shadow-md"
            >
              TÌM NƠI Ở - CHỌN NIỀM TIN
            </span>
          </h1>

          {/* Chữ nhỏ - Tăng độ đậm và tương phản */}
          <p className="text-white/90 text-base md:text-4xl font-medium italic tracking-wide">
            "Cho thuê vừa ý, giá cả hợp lý!"
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div
        // CHỈNH Ở ĐÂY: Thêm overflow-visible để Dropdown không bị cắt cụt
        className="bg-white rounded-xl shadow-lg p-3 md:p-4 max-w-[900px] mx-auto relative z-[999] overflow-visible"
      >
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <input
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-200
                hover:border-blue-500 focus:border-blue-500 focus:outline-none
                text-gray-800 placeholder-transparent shadow-sm transition-all duration-200"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                if (e.target.value.trim().length >= 1) {
                  setShowSuggestions(true);
                }
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => e.key === "Enter" && handleSearchNavigate()}
            />
            {!searchKeyword && (
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center gap-px text-sm">
                {animatedPlaceholder}
                <span className="inline-block w-0.5 h-4 bg-red-400 ml-px animate-[blink_0.75s_step-start_infinite] rounded-sm" />
              </span>
            )}

            {/* AI Search Suggestions - Home mode: keywords only */}
            <SearchSuggestions
              visible={showSuggestions && searchKeyword.trim().length >= 1}
              keywords={keywords}
              loading={suggestionsLoading}
              mode="home"
              onSelectKeyword={handleSelectKeyword}
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
                hover:border-blue-500 hover:text-blue-600 hover:shadow-sm
                active:scale-[0.98]
                transition-all duration-200 ease-out shadow-sm
                group"
            >
              <div className="flex items-center gap-2">
                {/* Đổi icon sang màu xanh cho đồng bộ */}
                <EnvironmentOutlined className="text-blue-500 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {getLocationDisplayText()}
                </span>
              </div>
              <DownOutlined
                className={`text-xs transition-transform duration-300 ease-out
                  ${isLocationModalOpen ? 'rotate-180 text-blue-500' : 'rotate-0'}`}
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
              <div className="bg-gradient-to-r from-blue-500 to-blue-300 px-4 py-3 border-b border-red-100 rounded-t-xl">
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
                <button
                  onClick={handleSearchNavigate}
                  className="h-12 bg-gradient-to-r from-blue-500 to-blue-300 text-white w-full
                          hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-500
                          border-none rounded-lg font-semibold shadow-md
                          hover:shadow-lg hover:scale-[1.02]
                          active:scale-[0.98]
                          transition-all duration-200"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>

          {/* Type Select */}
          <div className="relative w-full md:w-[180px]" ref={typeRef}>
            {/* Trigger Button */}
            <div
              onClick={() => setIsOpenType(!isOpenType)}
              className={`relative w-full h-12 pl-10 pr-10 bg-white rounded-lg border 
              flex items-center cursor-pointer transition-all duration-300 shadow-sm
              ${isOpenType ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200 hover:border-blue-500'}`}
            >
              <AppstoreOutlined className={`absolute left-3 text-blue-500 transition-transform duration-300 ${isOpenType ? 'scale-110 rotate-12' : ''}`} />
              <span className={`text-sm truncate select-none ${!selectedPropertyType ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
                {propertyOptions.find(o => o.value === selectedPropertyType)?.label || "Loại hình BĐS"}
              </span>
              <DownOutlined className={`absolute right-3 text-[10px] text-gray-400 transition-all duration-300 ${isOpenType ? 'rotate-180 text-blue-500' : ''}`} />
            </div>

            {/* Dropdown Menu - CỰC KỲ QUAN TRỌNG */}
            <div
              className={`absolute top-[calc(100%+6px)] left-0 w-full bg-white rounded-xl shadow-2xl border border-gray-100 
              z-[99999] /* Tăng hẳn lên mức tối đa */
              transition-all duration-300 ease-out origin-top
              ${isOpenType
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
            >
              <div className="py-1.5 px-1.5 max-h-[250px] overflow-y-auto">
                {propertyOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setSelectedPropertyType(option.value);
                      setIsOpenType(false);
                    }}
                    className={`px-3 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer
                    flex items-center justify-between
                    ${selectedPropertyType === option.value
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'}`}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearchNavigate}
            className="
              h-12 px-8 rounded-lg
              font-semibold text-white
              bg-blue-800
              
              transition-all duration-500
              active:scale-95
              
              shadow-md
              flex items-center justify-center
              min-w-[120px]

              /* Hover: Pha trộn Tím và Xanh biển */
              hover:bg-blue-700
                hover:shadow-[0_0_20px_rgba(168,85,247,0.4),_0_0_40px_rgba(59,130,246,0.3)]
                hover:ring-1 hover:ring-blue-500/30
            "
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

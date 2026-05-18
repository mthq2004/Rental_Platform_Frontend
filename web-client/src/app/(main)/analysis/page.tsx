"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BedDouble,
  Briefcase,
  Building2,
  ChevronDown,
  Home,
  Landmark,
  LineChart,
  MapPin,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Space_Grotesk, Fraunces } from "next/font/google";
import provinceService from "@/services/province.service";
import { fetchPriceAnalytics } from "@/services/analysis.service";
import PricePredictorSection from "@/components/analysis/PricePredictorSection";
import type {
  PriceAnalyticsQuery,
  PriceAnalyticsResponse,
  PriceAnalyticsTrendPoint,
} from "@/types/analysis.type";
import type { Province, District, Ward } from "@/types/province.type";

const space = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

const PROPERTY_TYPES = [
  { value: "apartment", label: "Chung cư / Căn hộ", icon: Building2 },
  { value: "house", label: "Nhà ở", icon: Home },
  { value: "room", label: "Phòng trọ", icon: BedDouble },
  { value: "office", label: "Văn phòng", icon: Briefcase },
  { value: "land", label: "Đất", icon: Landmark },
];

const formatMillion = (value: number, digits: number = 2) => {
  if (!value || value <= 0) return "0";
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: digits,
  }).format(value / 1_000_000);
};

const formatCompact = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const Sparkline = ({
  points,
  stroke,
  fill,
}: {
  points: PriceAnalyticsTrendPoint[];
  stroke: string;
  fill: string;
}) => {
  if (points.length === 0) {
    return (
      <div className="h-28 flex items-center justify-center text-sm text-slate-400">
        Chưa có dữ liệu xu hướng.
      </div>
    );
  }

  const values = points.map((p) => p.avgPrice);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1, max - min);

  const coords = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return { x, y };
  });

  const path = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const area = `${path} L 100 100 L 0 100 Z`;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-28">
      <path d={area} fill={fill} opacity={0.35} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2.5} />
    </svg>
  );
};

const ModalShell = ({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-slate-600" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bộ chọn</p>
              <h3 className={`${fraunces.className} text-lg text-slate-900`}>{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100">{footer}</div>}
      </motion.div>
    </div>
  );
};

const AnalysisPage = () => {
  const [analytics, setAnalytics] = useState<PriceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PriceAnalyticsQuery>({
    propertyType: "apartment",
    months: 6,
    top: 8,
  });

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [draftProvince, setDraftProvince] = useState<Province | null>(null);
  const [draftDistrict, setDraftDistrict] = useState<District | null>(null);
  const [draftWard, setDraftWard] = useState<Ward | null>(null);

  const [appliedProvince, setAppliedProvince] = useState<Province | null>(null);
  const [appliedDistrict, setAppliedDistrict] = useState<District | null>(null);
  const [appliedWard, setAppliedWard] = useState<Ward | null>(null);

  const [provinceFilter, setProvinceFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [wardFilter, setWardFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPriceAnalytics(filters);
        setAnalytics(data);
      } catch (err: any) {
        setError(err?.message || "Không thể tải dữ liệu phân tích");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await provinceService.getProvinces();
        setProvinces(data);
      } catch {
        setProvinces([]);
      }
    };

    if (locationModalOpen) {
      loadProvinces();
      setDraftProvince(appliedProvince);
      setDraftDistrict(appliedDistrict);
      setDraftWard(appliedWard);
    }
  }, [locationModalOpen, appliedProvince, appliedDistrict, appliedWard]);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!draftProvince) {
        setDistricts([]);
        return;
      }
      try {
        const data = await provinceService.getProvinceWithDistricts(draftProvince.code);
        setDistricts(data.districts || []);
      } catch {
        setDistricts([]);
      }
    };
    loadDistricts();
  }, [draftProvince]);

  useEffect(() => {
    const loadWards = async () => {
      if (!draftDistrict) {
        setWards([]);
        return;
      }
      try {
        const data = await provinceService.getDistrictWithWards(draftDistrict.code);
        setWards(data.wards || []);
      } catch {
        setWards([]);
      }
    };
    loadWards();
  }, [draftDistrict]);

  const summary = analytics?.summary;
  const trend = analytics?.trend ?? [];
  const distribution = analytics?.distribution ?? [];
  const topCities = analytics?.topCities ?? [];

  const selectedType = PROPERTY_TYPES.find((type) => type.value === filters.propertyType);
  const selectedTypeLabel = selectedType?.label ?? "Tất cả";

  const locationLabel = useMemo(() => {
    if (appliedWard) return appliedWard.name;
    if (appliedDistrict) return appliedDistrict.name;
    if (appliedProvince) return appliedProvince.name;
    return "Chọn khu vực";
  }, [appliedProvince, appliedDistrict, appliedWard]);

  const cityPrimary = topCities[0];
  const citySecondary = topCities[1];

  const distributionMax = Math.max(...distribution.map((bucket) => bucket.count), 1);

  const heroStats = [
    {
      label: "Giá trung bình",
      value: summary ? `${formatMillion(summary.avgPrice)} tr/tháng` : "--",
    },
    {
      label: "Mẫu tin",
      value: summary ? formatCompact(summary.sampleCount) : "--",
    },
    {
      label: "Diện tích TB",
      value: summary ? `${Math.round(summary.avgArea)} m2` : "--",
    },
  ];

  return (
    <div className={`${space.className} bg-[#f5f8ff] text-slate-900`}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 right-[-10%] w-[520px] h-[520px] bg-gradient-to-br from-[#ffd6b0] via-[#ffe6d0] to-transparent rounded-full opacity-70 blur-2xl" />
          <div className="absolute -bottom-24 left-[-20%] w-[420px] h-[420px] bg-gradient-to-br from-[#cfe2ff] via-[#e6f0ff] to-transparent rounded-full opacity-80 blur-2xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Báo cáo thị trường
            </p>
            <h1
              className={`${fraunces.className} text-4xl sm:text-5xl lg:text-6xl leading-tight mt-4 text-slate-900`}
            >
              Toàn cảnh biến động giá bất động sản
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl">
              Dữ liệu được tính từ các tin đăng thực tế, cập nhật liên tục theo
              khu vực và loại hình. Đánh giá xu hướng, khoảng giá phổ biến và
              mức biến động mới nhất.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="px-4 py-3 rounded-2xl bg-white/80 border border-white shadow-sm min-w-[140px]"
                >
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-xl font-semibold text-slate-900 mt-1">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 border border-white rounded-3xl shadow-xl p-6 lg:p-7 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Chỉ số nhanh
                </p>
                <h3 className={`${fraunces.className} text-2xl mt-2`}>
                  Giá theo tháng
                </h3>
              </div>
              <span className="w-12 h-12 rounded-2xl bg-[#e0ecff] flex items-center justify-center">
                <LineChart className="w-6 h-6 text-[#2563eb]" />
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Tháng gần nhất</p>
                <p className="text-lg font-semibold">
                  {summary ? `${formatMillion(summary.avgPrice)} tr/tháng` : "--"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Biến động tháng</p>
                <div className="flex items-center gap-2">
                  {summary && summary.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      summary && summary.changePercent >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {summary ? `${summary.changePercent}%` : "--"}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl bg-[#f2f6ff] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Khoảng phổ biến
                </p>
                <p className="text-lg font-semibold mt-2">
                  {summary
                    ? `${formatMillion(summary.popularRange.min)} - ${formatMillion(
                        summary.popularRange.max
                      )} tr/tháng`
                    : "--"}
                </p>
              </div>
              <button
                onClick={() => window.scrollTo({ top: 750, behavior: "smooth" })}
                className="w-full rounded-2xl bg-blue-600 text-white py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                Xem chi tiết
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative -mt-10 pb-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6 lg:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Bộ lọc phân tích
                </p>
                <h2 className={`${fraunces.className} text-2xl mt-2`}>
                  Chọn bộ lọc để xem giá chi tiết
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAppliedProvince(null);
                    setAppliedDistrict(null);
                    setAppliedWard(null);
                    setFilters({ propertyType: "apartment", months: 6, top: 8 });
                  }}
                  className="px-4 py-2 rounded-full border border-slate-200 text-sm font-medium hover:border-slate-400"
                >
                  Đặt lại
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
              <button
                onClick={() => setTypeModalOpen(true)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400"
              >
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    Loại hình
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {selectedTypeLabel}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400"
              >
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    Khu vực
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {locationLabel}
                  </p>
                </div>
                <MapPin className="w-4 h-4 text-slate-500" />
              </button>
              <div className="flex items-center gap-3">
                {[6, 12].map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilters((prev) => ({ ...prev, months: value }))}
                    className={`flex-1 px-4 py-3 rounded-2xl border text-sm font-semibold ${
                      filters.months === value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white hover:border-blue-400"
                    }`}
                  >
                    {value} tháng
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-10">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-7"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Tổng quan
                  </p>
                  <h3 className={`${fraunces.className} text-2xl mt-2`}>
                    Chỉ số giá trung bình
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs">
                  {summary?.latestMonthLabel || "--"}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    Giá trung vị
                  </p>
                  <p className="text-2xl font-semibold mt-2">
                    {summary ? `${formatMillion(summary.medianPrice)} tr/tháng` : "--"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Trung bình trên {summary ? formatCompact(summary.sampleCount) : "--"} tin đăng
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    Giá cao nhất
                  </p>
                  <p className="text-2xl font-semibold mt-2">
                    {summary ? `${formatMillion(summary.maxPrice)} tr/tháng` : "--"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Giá thấp nhất {summary ? `${formatMillion(summary.minPrice)} tr/tháng` : "--"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    Giá/m2
                  </p>
                  <p className="text-2xl font-semibold mt-2">
                    {summary ? `${formatMillion(summary.avgPricePerSqm)} tr/m2` : "--"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Diện tích TB {summary ? `${Math.round(summary.avgArea)} m2` : "--"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                    Khoảng phổ biến
                  </p>
                  <p className="text-2xl font-semibold mt-2">
                    {summary
                      ? `${formatMillion(summary.popularRange.min)} - ${formatMillion(
                          summary.popularRange.max
                        )} tr/tháng`
                      : "--"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tập trung 50% tin đăng
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-7"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Phân bổ
                  </p>
                  <h3 className={`${fraunces.className} text-2xl mt-2`}>
                    Khoảng giá phổ biến
                  </h3>
                </div>
                <Search className="w-5 h-5 text-slate-400" />
              </div>

              <div className="mt-6 space-y-4">
                {distribution.map((bucket) => (
                  <div key={bucket.label}>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{bucket.label} tr/tháng</span>
                      <span>{bucket.count} tin</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fb923c]"
                        style={{ width: `${(bucket.count / distributionMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {distribution.length === 0 && (
                  <p className="text-sm text-slate-500">Chưa có dữ liệu để hiển thị.</p>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-7"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Xu hướng
                  </p>
                  <h3 className={`${fraunces.className} text-2xl mt-2`}>
                    Biến động giá theo tháng
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Đơn vị: triệu/tháng</span>
              </div>

              <div className="mt-6">
                <Sparkline
                  points={trend}
                  stroke="#2563eb"
                  fill="#bfdbfe"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-4">
                  {trend.map((point) => (
                    <span key={point.month} className="min-w-[40px] text-center">
                      {point.month.split("/")[0]}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-7"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Thị trường
                  </p>
                  <h3 className={`${fraunces.className} text-2xl mt-2`}>
                    Giá BĐS tại các tỉnh thành
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
                  {selectedTypeLabel}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {[cityPrimary, citySecondary].map((city, index) => (
                  <div
                    key={city?.key ?? index}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                          {city?.label || "--"}
                        </p>
                        <p className="text-lg font-semibold mt-2">
                          {city ? `${formatMillion(city.avgPrice)} tr/tháng` : "--"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Tin đăng</p>
                        <p className="text-sm font-semibold">
                          {city ? formatCompact(city.count) : "--"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Sparkline
                        points={trend}
                        stroke={index === 0 ? "#f97316" : "#2563eb"}
                        fill={index === 0 ? "#fed7aa" : "#bfdbfe"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

            <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl border border-slate-100 p-6 lg:p-7"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Bảng giá
                </p>
                <h3 className={`${fraunces.className} text-2xl mt-2`}>
                    Chi tiết theo tỉnh thành
                </h3>
              </div>
              <p className="text-xs text-slate-400">Đơn vị: triệu VND/tháng</p>
            </div>

            <div className="mt-6 grid gap-4">
              {topCities.map((city) => (
                <div
                  key={city.key}
                  className="grid sm:grid-cols-[1.2fr_0.8fr_0.8fr] gap-4 items-center border border-slate-100 rounded-2xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {city.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {city.count} tin đăng
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                      Giá TB
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {formatMillion(city.avgPrice)} tr/tháng
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                      Giá/m2
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {formatMillion(city.avgPricePerSqm)} tr
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {loading && <p className="text-sm text-slate-500 mt-4">Đang tải dữ liệu...</p>}
            {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}
          </motion.div>

          {/* Price Predictor */}
          <PricePredictorSection />
        </div>
      </section>

      <ModalShell
        open={typeModalOpen}
        title="Chọn loại hình bất động sản"
        onClose={() => setTypeModalOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setTypeModalOpen(false)}
              className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={() => setTypeModalOpen(false)}
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold"
            >
              Đóng
            </button>
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {PROPERTY_TYPES.map((type) => {
            const Icon = type.icon;
            const active = filters.propertyType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    propertyType: type.value as PriceAnalyticsQuery["propertyType"],
                  }));
                  setTypeModalOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left ${
                  active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    active ? "bg-white/10" : "bg-blue-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-600"}`} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{type.label}</p>
                  <p className={`text-xs ${active ? "text-white/70" : "text-slate-400"}`}>
                    Cập nhật giá theo loại
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </ModalShell>

      <ModalShell
        open={locationModalOpen}
        title="Chọn khu vực"
        onClose={() => setLocationModalOpen(false)}
        footer={
          <div className="flex flex-wrap justify-between gap-3">
            <button
              onClick={() => {
                setDraftProvince(null);
                setDraftDistrict(null);
                setDraftWard(null);
                setDistricts([]);
                setWards([]);
              }}
              className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold"
            >
              Xóa chọn
            </button>
            <button
              onClick={() => {
                setAppliedProvince(draftProvince);
                setAppliedDistrict(draftDistrict);
                setAppliedWard(draftWard);
                setFilters((prev) => ({
                  ...prev,
                  city: draftProvince?.name,
                  district: draftDistrict?.name,
                  ward: draftWard?.name,
                }));
                setLocationModalOpen(false);
              }}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        }
      >
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-blue-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={provinceFilter}
                onChange={(event) => setProvinceFilter(event.target.value)}
                placeholder="Tìm tỉnh / thành"
                className="flex-1 text-sm outline-none"
              />
            </div>
            <div className="max-h-56 overflow-auto space-y-2">
              {provinces
                .filter((province) => province.name.toLowerCase().includes(provinceFilter.toLowerCase()))
                .map((province) => (
                  <button
                    key={province.code}
                    onClick={() => {
                      setDraftProvince(province);
                      setDraftDistrict(null);
                      setDraftWard(null);
                      setDistrictFilter("");
                      setWardFilter("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border ${
                      draftProvince?.code === province.code
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {province.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-blue-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={districtFilter}
                onChange={(event) => setDistrictFilter(event.target.value)}
                placeholder="Tìm quận / huyện"
                className="flex-1 text-sm outline-none"
                disabled={!draftProvince}
              />
            </div>
            <div className="max-h-56 overflow-auto space-y-2">
              {districts
                .filter((district) => district.name.toLowerCase().includes(districtFilter.toLowerCase()))
                .map((district) => (
                  <button
                    key={district.code}
                    onClick={() => {
                      setDraftDistrict(district);
                      setDraftWard(null);
                      setWardFilter("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border ${
                      draftDistrict?.code === district.code
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                    disabled={!draftProvince}
                  >
                    {district.name}
                  </button>
                ))}
              {!draftProvince && (
                <p className="text-xs text-slate-400">Chọn tỉnh để mở danh sách.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-blue-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={wardFilter}
                onChange={(event) => setWardFilter(event.target.value)}
                placeholder="Tìm phường / xã"
                className="flex-1 text-sm outline-none"
                disabled={!draftDistrict}
              />
            </div>
            <div className="max-h-56 overflow-auto space-y-2">
              {wards
                .filter((ward) => ward.name.toLowerCase().includes(wardFilter.toLowerCase()))
                .map((ward) => (
                  <button
                    key={ward.code}
                    onClick={() => setDraftWard(ward)}
                    className={`w-full text-left px-3 py-2 rounded-xl border ${
                      draftWard?.code === ward.code
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                    disabled={!draftDistrict}
                  >
                    {ward.name}
                  </button>
                ))}
              {!draftDistrict && (
                <p className="text-xs text-slate-400">Chọn quận để mở danh sách.</p>
              )}
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};

export default AnalysisPage;
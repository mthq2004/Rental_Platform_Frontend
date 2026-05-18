"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BedDouble, Briefcase, Building2, Home, Landmark,
  MapPin, Search, Zap, Car, Shield, Dumbbell, Waves,
  ChevronDown, X, TrendingUp, AlertCircle, CheckCircle2,
} from "lucide-react";
import { Fraunces, Space_Grotesk } from "next/font/google";
import provinceService from "@/services/province.service";
import type { Province, District } from "@/types/province.type";

const space = Space_Grotesk({ subsets: ["latin", "vietnamese"], weight: ["400","500","600","700"] });
const fraunces = Fraunces({ subsets: ["latin", "vietnamese"], weight: ["600","700"] });

const API = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

const PROPERTY_TYPES = [
  { value: "apartment", label: "Căn hộ", icon: Building2 },
  { value: "house",     label: "Nhà nguyên căn", icon: Home },
  { value: "room",      label: "Phòng trọ", icon: BedDouble },
  { value: "office",    label: "Văn phòng", icon: Briefcase },
  { value: "land",      label: "Đất", icon: Landmark },
];

const FURNITURE_OPTS = [
  { value: "none",  label: "Không nội thất" },
  { value: "basic", label: "Nội thất cơ bản" },
  { value: "full",  label: "Nội thất đầy đủ" },
];

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

interface PredictResult {
  predictedPrice: number;
  minPrice?: number;
  maxPrice?: number;
  confidence?: number;
}

interface Form {
  propertyType: string;
  area: number;
  rooms: number;
  bathrooms: number;
  floors: number;
  furnitureStatus: string;
  location: string;
  nearCityCenter: boolean;
  nearShoppingMall: boolean;
  nearMarket: boolean;
  nearSchool: boolean;
  nearHospital: boolean;
  nearBusStation: boolean;
  nearPark: boolean;
  nearIndustrialZone: boolean;
  hasElevator: boolean;
  hasParking: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasSecurity: boolean;
  hasGenerator: boolean;
  landFrontage: number | null;
  landDepth: number | null;
}

const defaultForm: Form = {
  propertyType: "apartment", area: 50, rooms: 2, bathrooms: 1, floors: 1,
  furnitureStatus: "none", location: "",
  nearCityCenter: false, nearShoppingMall: false, nearMarket: false,
  nearSchool: false, nearHospital: false, nearBusStation: false,
  nearPark: false, nearIndustrialZone: false,
  hasElevator: false, hasParking: false, hasPool: false,
  hasGym: false, hasSecurity: false, hasGenerator: false,
  landFrontage: null, landDepth: null,
};

/* ── tiny sub-components ── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">{children}</p>
);

const FieldBox = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">{children}</div>
);

const CheckPill = ({
  checked, onChange, children,
}: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
      checked
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
    }`}
  >
    {children}
  </button>
);

const NumberInput = ({
  value, onChange, min = 0, step = 1, placeholder,
}: { value: number | null; onChange: (v: number | null) => void; min?: number; step?: number; placeholder?: string }) => (
  <input
    type="number"
    min={min}
    step={step}
    placeholder={placeholder}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent"
  />
);

/* ── Location Modal ── */
const LocationModal = ({
  open, onClose, onSelect,
}: { open: boolean; onClose: () => void; onSelect: (district: string) => void }) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selProv, setSelProv] = useState<Province | null>(null);
  const [provQ, setProvQ] = useState("");
  const [distQ, setDistQ] = useState("");

  useEffect(() => {
    if (open) provinceService.getProvinces().then(setProvinces).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!selProv) { setDistricts([]); return; }
    provinceService.getProvinceWithDistricts(selProv.code)
      .then((d) => setDistricts(d.districts || []))
      .catch(() => setDistricts([]));
  }, [selProv]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bộ chọn</p>
            <h3 className={`${fraunces.className} text-lg text-slate-900`}>Chọn khu vực</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 grid sm:grid-cols-2 gap-4">
          {/* Provinces */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-blue-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={provQ} onChange={(e) => setProvQ(e.target.value)} placeholder="Tìm tỉnh / thành" className="flex-1 text-sm outline-none" />
            </div>
            <div className="max-h-52 overflow-auto space-y-1">
              {provinces.filter((p) => p.name.toLowerCase().includes(provQ.toLowerCase())).map((p) => (
                <button key={p.code} onClick={() => { setSelProv(p); setDistQ(""); }}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-sm ${selProv?.code === p.code ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 hover:border-slate-300"}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          {/* Districts */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl focus-within:border-blue-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={distQ} onChange={(e) => setDistQ(e.target.value)} placeholder="Tìm quận / huyện" className="flex-1 text-sm outline-none" disabled={!selProv} />
            </div>
            <div className="max-h-52 overflow-auto space-y-1">
              {!selProv && <p className="text-xs text-slate-400">Chọn tỉnh trước.</p>}
              {districts.filter((d) => d.name.toLowerCase().includes(distQ.toLowerCase())).map((d) => (
                <button key={d.code} onClick={() => { onSelect(d.name); onClose(); }}
                  className="w-full text-left px-3 py-2 rounded-xl border border-slate-100 hover:border-blue-400 hover:bg-blue-50 text-sm">
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function PricePredictorSection() {
  const [form, setForm] = useState<Form>(defaultForm);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locModalOpen, setLocModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const isLand = form.propertyType === "land";
  const isOffice = form.propertyType === "office";
  const isResidential = !isLand && !isOffice;
  const isHouseOrApt = form.propertyType === "house" || form.propertyType === "apartment";
  const selectedType = PROPERTY_TYPES.find((t) => t.value === form.propertyType);

  const handlePredict = async () => {
    if (!form.location) { setError("Vui lòng chọn quận / huyện."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const body: Record<string, unknown> = {
        area: form.area, rooms: form.rooms, bathrooms: form.bathrooms,
        floors: form.floors, location: form.location,
        propertyType: form.propertyType, furnitureStatus: form.furnitureStatus,
        nearCityCenter: form.nearCityCenter, nearShoppingMall: form.nearShoppingMall,
        nearMarket: form.nearMarket, nearSchool: form.nearSchool,
        nearHospital: form.nearHospital, nearBusStation: form.nearBusStation,
        nearPark: form.nearPark, nearIndustrialZone: form.nearIndustrialZone,
        hasElevator: form.hasElevator, hasParking: form.hasParking,
        hasPool: form.hasPool, hasGym: form.hasGym,
        hasSecurity: form.hasSecurity, hasGenerator: form.hasGenerator,
      };
      if (isLand && form.landFrontage) body.landFrontage = form.landFrontage;
      if (isLand && form.landDepth) body.landDepth = form.landDepth;

      const res = await fetch(`${API}/api/ai/api/v1/predict-price`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Dự đoán thất bại"); }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message || "Không thể kết nối AI service.");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true }}
      className={`${space.className} bg-white rounded-3xl border border-slate-100 p-6 lg:p-8`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI • Machine Learning</p>
          <h2 className={`${fraunces.className} text-2xl lg:text-3xl mt-2 text-slate-900`}>
            Dự đoán giá thuê
          </h2>
          <p className="text-sm text-slate-500 mt-1">Nhập thông tin BĐS để AI ước tính giá thuê phù hợp.</p>
        </div>
        <span className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </span>
      </div>

      <div className="mt-8 space-y-6">
        {/* Row 1: Loại BĐS + Diện tích + Tỉnh/Huyện */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Loại BĐS */}
          <div>
            <Label>Loại hình</Label>
            <button
              onClick={() => setTypeModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-left"
            >
              <div className="flex items-center gap-2">
                {selectedType && <selectedType.icon className="w-4 h-4 text-slate-500" />}
                <span className="text-sm font-semibold text-slate-900">{selectedType?.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Diện tích */}
          <div>
            <Label>Diện tích (m²)</Label>
            <FieldBox>
              <NumberInput value={form.area} onChange={(v) => set({ area: v ?? 50 })} min={1} />
            </FieldBox>
          </div>

          {/* Khu vực */}
          <div>
            <Label>Khu vực</Label>
            <button
              onClick={() => setLocModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-left"
            >
              <span className={`text-sm font-semibold ${form.location ? "text-slate-900" : "text-slate-400"}`}>
                {form.location || "Chọn quận / huyện"}
              </span>
              <MapPin className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Row 2: Số phòng + Nội thất (ẩn cho đất) */}
        {!isLand && (
          <div className="grid gap-3 sm:grid-cols-4">
            {isResidential && (
              <div>
                <Label>Phòng ngủ</Label>
                <FieldBox><NumberInput value={form.rooms} onChange={(v) => set({ rooms: v ?? 0 })} /></FieldBox>
              </div>
            )}
            <div>
              <Label>Phòng tắm</Label>
              <FieldBox><NumberInput value={form.bathrooms} onChange={(v) => set({ bathrooms: v ?? 0 })} /></FieldBox>
            </div>
            {(form.propertyType === "house" || form.propertyType === "apartment") && (
              <div>
                <Label>Số tầng</Label>
                <FieldBox><NumberInput value={form.floors} onChange={(v) => set({ floors: v ?? 1 })} min={1} /></FieldBox>
              </div>
            )}
            <div className={isResidential ? "" : "sm:col-span-2"}>
              <Label>Nội thất</Label>
              <div className="flex gap-2 flex-wrap">
                {FURNITURE_OPTS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => set({ furnitureStatus: o.value })}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      form.furnitureStatus === o.value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Đặc thù đất */}
        {isLand && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Mặt tiền (m)</Label>
              <FieldBox><NumberInput value={form.landFrontage} onChange={(v) => set({ landFrontage: v })} step={0.5} placeholder="VD: 5.0" /></FieldBox>
            </div>
            <div>
              <Label>Chiều sâu (m)</Label>
              <FieldBox><NumberInput value={form.landDepth} onChange={(v) => set({ landDepth: v })} step={0.5} placeholder="VD: 15.0" /></FieldBox>
            </div>
          </div>
        )}

        {/* Vị trí lân cận */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">Vị trí lân cận</p>
          <div className="flex flex-wrap gap-2">
            <CheckPill checked={form.nearCityCenter} onChange={(v) => set({ nearCityCenter: v })}>🏙 Trung tâm TP</CheckPill>
            <CheckPill checked={form.nearShoppingMall} onChange={(v) => set({ nearShoppingMall: v })}>🛍 TTTM</CheckPill>
            <CheckPill checked={form.nearMarket} onChange={(v) => set({ nearMarket: v })}>🏪 Chợ / Siêu thị</CheckPill>
            <CheckPill checked={form.nearSchool} onChange={(v) => set({ nearSchool: v })}>🎓 Trường học</CheckPill>
            <CheckPill checked={form.nearHospital} onChange={(v) => set({ nearHospital: v })}>🏥 Bệnh viện</CheckPill>
            <CheckPill checked={form.nearBusStation} onChange={(v) => set({ nearBusStation: v })}>🚌 Bến xe / Bus</CheckPill>
            {isHouseOrApt && <CheckPill checked={form.nearPark} onChange={(v) => set({ nearPark: v })}>🌳 Công viên</CheckPill>}
            {(isLand || form.propertyType === "room") && (
              <CheckPill checked={form.nearIndustrialZone} onChange={(v) => set({ nearIndustrialZone: v })}>🏭 Khu công nghiệp</CheckPill>
            )}
          </div>
        </div>

        {/* Tiện ích nội khu */}
        {!isLand && (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3">Tiện ích nội khu</p>
            <div className="flex flex-wrap gap-2">
              {(form.propertyType === "apartment" || isOffice) && (
                <CheckPill checked={form.hasElevator} onChange={(v) => set({ hasElevator: v })}>
                  <TrendingUp className="w-3.5 h-3.5" /> Thang máy
                </CheckPill>
              )}
              <CheckPill checked={form.hasParking} onChange={(v) => set({ hasParking: v })}>
                <Car className="w-3.5 h-3.5" /> Bãi xe
              </CheckPill>
              {isOffice && (
                <CheckPill checked={form.hasGenerator} onChange={(v) => set({ hasGenerator: v })}>
                  <Zap className="w-3.5 h-3.5" /> Máy phát điện
                </CheckPill>
              )}
              {isHouseOrApt && (
                <>
                  <CheckPill checked={form.hasPool} onChange={(v) => set({ hasPool: v })}>
                    <Waves className="w-3.5 h-3.5" /> Hồ bơi
                  </CheckPill>
                  <CheckPill checked={form.hasGym} onChange={(v) => set({ hasGym: v })}>
                    <Dumbbell className="w-3.5 h-3.5" /> Gym
                  </CheckPill>
                </>
              )}
              <CheckPill checked={form.hasSecurity} onChange={(v) => set({ hasSecurity: v })}>
                <Shield className="w-3.5 h-3.5" /> Bảo vệ 24/7
              </CheckPill>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 text-white py-3.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Đang tính toán...</>
          ) : (
            <><TrendingUp className="w-4 h-4" />Dự đoán giá thuê</>
          )}
        </button>

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Kết quả dự đoán
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white">
                <p className="text-xs opacity-70 uppercase tracking-[0.2em]">Giá dự đoán</p>
                <p className="text-2xl font-bold mt-2">{money.format(result.predictedPrice)}</p>
                <p className="text-xs opacity-60 mt-1">/tháng</p>
              </div>
              {result.minPrice != null && result.maxPrice != null && (
                <div className="rounded-2xl border border-slate-100 bg-[#f2f6ff] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Khoảng giá</p>
                  <p className="text-base font-semibold text-slate-900 mt-2">
                    {money.format(result.minPrice)}
                  </p>
                  <p className="text-xs text-slate-400 my-0.5">đến</p>
                  <p className="text-base font-semibold text-slate-900">
                    {money.format(result.maxPrice)}
                  </p>
                </div>
              )}
              {result.confidence != null && (
                <div className="rounded-2xl border border-slate-100 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Độ tin cậy</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{Math.round(result.confidence)}%</p>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${result.confidence >= 75 ? "bg-emerald-500" : result.confidence >= 55 ? "bg-orange-400" : "bg-rose-500"}`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <LocationModal
        open={locModalOpen}
        onClose={() => setLocModalOpen(false)}
        onSelect={(district) => set({ location: district })}
      />

      {/* Type Modal */}
      {typeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bộ chọn</p>
                <h3 className={`${fraunces.className} text-lg text-slate-900`}>Loại hình bất động sản</h3>
              </div>
              <button onClick={() => setTypeModalOpen(false)} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 grid sm:grid-cols-2 gap-3">
              {PROPERTY_TYPES.map((t) => {
                const Icon = t.icon;
                const active = form.propertyType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      set({
                        propertyType: t.value,
                        rooms: t.value === "land" || t.value === "office" ? 0 : form.rooms,
                        furnitureStatus: t.value === "land" ? "none" : form.furnitureStatus,
                      });
                      setTypeModalOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white hover:border-blue-300"}`}
                  >
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${active ? "bg-white/10" : "bg-blue-50"}`}>
                      <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-600"}`} />
                    </span>
                    <p className="text-sm font-semibold">{t.label}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

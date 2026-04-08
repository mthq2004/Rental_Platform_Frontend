export type PropertyTypeKey = "apartment" | "house" | "land" | "office" | "room";

export interface KeyValueMetric {
  key: string;
  label: string;
  value: number;
}

export interface OverviewMetrics {
  tongBatDongSan: number;
  tongNguoiDung: number;
  tongNguoiThue: number;
  tongChuNha: number;
  tongYeuCauThue: number;
  tongHopDong: number;
  tongDoanhThuUocTinh: number;
  tileTangTruongThang: number;
  tinDangMoiHomNay: number;
  yeuCauDangCho: number;
  conversionRate: number;
  occupancyRate: number;
  avgRentalPrice: number;
}

export interface PropertyTypeAnalytics {
  soLuongTheoLoai: Array<KeyValueMetric & { key: PropertyTypeKey }>;
  doanhThuTheoLoai: Array<KeyValueMetric & { key: PropertyTypeKey }>;
  tyLeDuocThueTheoLoai: Array<KeyValueMetric & { key: PropertyTypeKey }>;
  giaTrungBinhTheoLoai: Array<KeyValueMetric & { key: PropertyTypeKey }>;
  xuHuongTheoThang: Array<{ thang: string } & Record<PropertyTypeKey, number>>;
}

export interface PricingAnalytics {
  minPrice: number;
  maxPrice: number;
  medianPrice: number;
  avgPrice: number;
  giaTheoKhuVuc: KeyValueMetric[];
  xuHuongGiaTheoThang: Array<{ thang: string; giaTrungBinh: number }>;
  outliers: Array<{ propertyId: string; tieuDe: string; gia: number; mucDo: "cao" | "thap" }>;
}

export interface LocationAnalytics {
  soLuongTheoThanhPho: KeyValueMetric[];
  doanhThuTheoKhuVuc: KeyValueMetric[];
  khuVucHot: KeyValueMetric[];
  khuVucItHoatDong: KeyValueMetric[];
}

export interface UserAnalytics {
  activeDau: number;
  activeMau: number;
  tyLeThueThanhCong: number;
  theoKyc: KeyValueMetric[];
  biKhoa: number;
  funnel: Array<{ buoc: string; value: number }>;
}

export interface ListingAnalytics {
  tongTinDang: number;
  dangHoatDong: number;
  dangAn: number;
  biTuChoi: number;
  chatLuongCoAnh: number;
  chatLuongCoMoTa: number;
  chatLuongTrungBinh: number;
}

export interface RentalRequestAnalytics {
  tong: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  underReview: number;
  tiLeRequestToContract: number;
  funnel: Array<{ buoc: string; value: number }>;
}

export interface RevenueAnalytics {
  tongDoanhThuUocTinh: number;
  doanhThuTheoLoai: KeyValueMetric[];
  doanhThuTheoKhuVuc: KeyValueMetric[];
  giaoDichThanhCong: number;
  giaoDichThatBai: number;
  aov: number;
  commissionEarned: number;
  feeBreakdown: KeyValueMetric[];
}

export interface ContractAnalytics {
  dangHoatDong: number;
  hetHan: number;
  biHuy: number;
  trungBinhThoiGianThueThang: number;
  theoTrangThai: KeyValueMetric[];
}

export interface ModerationRiskAnalytics {
  tinBiReport: number;
  userBiKhoa: number;
  tiLeGianLan: number;
  kycPending: number;
  kycVerified: number;
  kycRejected: number;
  tiLeKycVerified: number;
  tiLeFailAiCheck: number;
}

export interface AiAnalytics {
  soRequestDuDoanGia: number;
  soRequestMoTaTuDong: number;
  soRequestChatAi: number;
  doChinhXacModel: number;
  diemFeedback: number;
}

export interface SystemMetrics {
  apiCallsPerSec: number;
  errorRate: number;
  responseTimeMs: number;
  uptime: number;
}

export interface AdvancedReports {
  topKhuVucHot: KeyValueMetric[];
  topChuNha: KeyValueMetric[];
  topBatDongSanXemNhieu: KeyValueMetric[];
  userRetention: number;
  ltv: number;
  cac: number;
}

export interface DashboardAnalytics {
  overview: OverviewMetrics;
  propertyType: PropertyTypeAnalytics;
  pricing: PricingAnalytics;
  location: LocationAnalytics;
  users: UserAnalytics;
  listings: ListingAnalytics;
  requests: RentalRequestAnalytics;
  revenue: RevenueAnalytics;
  contracts: ContractAnalytics;
  moderation: ModerationRiskAnalytics;
  ai: AiAnalytics;
  system: SystemMetrics;
  advanced: AdvancedReports;
  warnings: string[];
  fetchedAt: string;
}
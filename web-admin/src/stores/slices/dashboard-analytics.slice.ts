import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import http from '../../utils/api';
import type { DashboardAnalytics } from '../../types/analytics.type';

const createEmptyMetrics = (): DashboardAnalytics => ({
  overview: {
    tongBatDongSan: 0,
    tongNguoiDung: 0,
    tongNguoiThue: 0,
    tongChuNha: 0,
    tongYeuCauThue: 0,
    tongHopDong: 0,
    tongDoanhThuUocTinh: 0,
    tileTangTruongThang: 0,
    tinDangMoiHomNay: 0,
    yeuCauDangCho: 0,
    conversionRate: 0,
    occupancyRate: 0,
    avgRentalPrice: 0,
  },
  propertyType: {
    soLuongTheoLoai: [],
    doanhThuTheoLoai: [],
    tyLeDuocThueTheoLoai: [],
    giaTrungBinhTheoLoai: [],
    xuHuongTheoThang: [],
  },
  pricing: {
    minPrice: 0,
    maxPrice: 0,
    medianPrice: 0,
    avgPrice: 0,
    giaTheoKhuVuc: [],
    xuHuongGiaTheoThang: [],
    outliers: [],
  },
  location: {
    soLuongTheoThanhPho: [],
    doanhThuTheoKhuVuc: [],
    khuVucHot: [],
    khuVucItHoatDong: [],
  },
  users: {
    activeDau: 0,
    activeMau: 0,
    tyLeThueThanhCong: 0,
    theoKyc: [],
    biKhoa: 0,
    funnel: [],
  },
  listings: {
    tongTinDang: 0,
    dangHoatDong: 0,
    dangAn: 0,
    biTuChoi: 0,
    chatLuongCoAnh: 0,
    chatLuongCoMoTa: 0,
    chatLuongTrungBinh: 0,
  },
  requests: {
    tong: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    underReview: 0,
    tiLeRequestToContract: 0,
    funnel: [],
  },
  revenue: {
    tongDoanhThuUocTinh: 0,
    doanhThuTheoLoai: [],
    doanhThuTheoKhuVuc: [],
    giaoDichThanhCong: 0,
    giaoDichThatBai: 0,
    aov: 0,
    commissionEarned: 0,
    feeBreakdown: [],
  },
  contracts: {
    dangHoatDong: 0,
    hetHan: 0,
    biHuy: 0,
    trungBinhThoiGianThueThang: 0,
    theoTrangThai: [],
  },
  moderation: {
    tinBiReport: 0,
    userBiKhoa: 0,
    tiLeGianLan: 0,
    kycPending: 0,
    kycVerified: 0,
    kycRejected: 0,
    tiLeKycVerified: 0,
    tiLeFailAiCheck: 0,
  },
  ai: {
    soRequestDuDoanGia: 0,
    soRequestMoTaTuDong: 0,
    soRequestChatAi: 0,
    doChinhXacModel: 0,
    diemFeedback: 0,
  },
  system: {
    apiCallsPerSec: 0,
    errorRate: 0,
    responseTimeMs: 0,
    uptime: 0,
  },
  advanced: {
    topKhuVucHot: [],
    topChuNha: [],
    topBatDongSanXemNhieu: [],
    userRetention: 0,
    ltv: 0,
    cac: 0,
  },
  warnings: [],
  fetchedAt: '',
});

type DashboardAnalyticsState = {
  loading: boolean;
  metrics: DashboardAnalytics;
  error: string | null;
  usingFallback: boolean;
};

const initialState: DashboardAnalyticsState = {
  loading: false,
  metrics: createEmptyMetrics(),
  error: null,
  usingFallback: false,
};

export const fetchDashboardAnalytics = createAsyncThunk(
  'dashboardAnalytics/fetch',
  async (): Promise<DashboardAnalytics> => {
    const response = await http.get('/estate/admin/analytics/dashboard');
    return response.data as DashboardAnalytics;
  },
);

const dashboardAnalyticsSlice = createSlice({
  name: 'dashboardAnalytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
        state.usingFallback = action.payload.warnings.length > 0;
      })
      .addCase(fetchDashboardAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Không tải được dữ liệu thống kê';
      });
  },
});

export default dashboardAnalyticsSlice.reducer;
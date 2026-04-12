import { useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Skeleton,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ApartmentOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  FireOutlined,
  ReloadOutlined,
  SafetyOutlined,
  TeamOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { KeyValueMetric } from "../../types/analytics.type";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { fetchDashboardAnalytics } from "../../stores/slices/dashboard-analytics.slice";
import "./dashboard-enterprise.css";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("vi-VN");

const propertyTypeColors: Record<string, string> = {
  apartment: "#2563eb",
  house: "#f97316",
  land: "#16a34a",
  office: "#7c3aed",
  room: "#dc2626",
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getPropertyColor = (key: string): string => {
  return propertyTypeColors[key] ?? "#0f4bd8";
};

const SmallStat = ({ label, value }: { label: string; value: string }) => (
  <div className="enterprise-stat-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const TopList = ({ title, rows, currency }: { title: string; rows: KeyValueMetric[]; currency?: boolean }) => (
  <Card className="enterprise-panel" variant="borderless" title={title}>
    <div className="enterprise-top-list">
      {rows.map((item, index) => (
        <div key={item.key} className="enterprise-top-item">
          <span className="enterprise-top-rank">{index + 1}</span>
          <div>
            <p>{item.label}</p>
            <span>{currency ? money.format(item.value) : num.format(item.value)}</span>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { loading, metrics } = useAppSelector((state) => state.dashboardAnalytics);

  const loadMetrics = async () => {
    await dispatch(fetchDashboardAnalytics());
  };

  useEffect(() => {
    loadMetrics();
  }, [dispatch]);

  const priceTrend = metrics.pricing.xuHuongGiaTheoThang.map((item) => ({
    thang: item.thang,
    giaTrungBinh: item.giaTrungBinh,
  }));

  return (
    <div className="admin-page-shell enterprise-dashboard">
      <Card className="hero-surface enterprise-header-card" variant="borderless">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>Bảng điều khiển quản trị</Typography.Title>
            <Typography.Text type="secondary">Tổng quan hoạt động nền tảng cho thuê bất động sản</Typography.Text>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button icon={<ReloadOutlined />} onClick={loadMetrics}>Làm mới</Button>
            <Button type="primary">Xuất báo cáo</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card variant="borderless" className="enterprise-panel" style={{ marginTop: 14 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
        <div className="enterprise-main-stack">
          <div className="enterprise-status-tags">
            <Tag icon={<DashboardOutlined />} color="blue">API/s: {num.format(metrics.system.apiCallsPerSec)}</Tag>
            <Tag icon={<SafetyOutlined />} color={metrics.system.errorRate > 2 ? "red" : "green"}>Error rate: {metrics.system.errorRate}%</Tag>
            <Tag icon={<FireOutlined />} color="volcano">Tăng trưởng tháng: +{metrics.overview.tileTangTruongThang}%</Tag>
          </div>

          {/* KPI Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="enterprise-kpi-card" variant="borderless">
                <Statistic title="Tổng bất động sản" value={metrics.overview.tongBatDongSan} formatter={(v) => num.format(Number(v))} prefix={<ApartmentOutlined />} />
                <span className="enterprise-kpi-sub"><Tag color="green">{num.format(metrics.listings.dangHoatDong)} đang hoạt động</Tag></span>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="enterprise-kpi-card" variant="borderless">
                <Statistic title="Người dùng" value={metrics.overview.tongNguoiDung} formatter={(v) => num.format(Number(v))} prefix={<TeamOutlined />} />
                <span className="enterprise-kpi-sub">DAU: {num.format(metrics.users.activeDau)} · MAU: {num.format(metrics.users.activeMau)}</span>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="enterprise-kpi-card" variant="borderless">
                <Statistic title="Yêu cầu thuê" value={metrics.overview.tongYeuCauThue} formatter={(v) => num.format(Number(v))} prefix={<FileTextOutlined />} />
                <span className="enterprise-kpi-sub"><Tag color="orange">{num.format(metrics.requests.pending)} đang chờ</Tag></span>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="enterprise-kpi-card enterprise-kpi-card-primary" variant="borderless">
                <Statistic title="Giá thuê trung bình" value={metrics.overview.avgRentalPrice} formatter={(v) => money.format(Number(v))} prefix={<DollarOutlined />} />
                <span className="enterprise-kpi-sub" style={{ color: "#fff" }}>Trung bình/tháng toàn hệ thống</span>
              </Card>
            </Col>
          </Row>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Hợp đồng hoạt động" value={metrics.contracts.dangHoatDong} prefix={<CheckCircleOutlined style={{ color: "#16a34a" }} />} formatter={(v) => num.format(Number(v))} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Tin đăng mới hôm nay" value={metrics.overview.tinDangMoiHomNay} prefix={<ClockCircleOutlined style={{ color: "#f97316" }} />} formatter={(v) => num.format(Number(v))} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Report đang chờ" value={metrics.moderation.tinBiReport} prefix={<WarningOutlined style={{ color: "#dc2626" }} />} formatter={(v) => num.format(Number(v))} />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card className="enterprise-panel" variant="borderless" style={{ textAlign: "center" }}>
                <Statistic title="Tỷ lệ lấp đầy" value={metrics.overview.occupancyRate} suffix="%" prefix={<RiseOutlined style={{ color: "#2563eb" }} />} />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={16}>
              <Card className="enterprise-panel" variant="borderless" title="Xu hướng giá thuê trung bình (6 tháng)">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={priceTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                    <XAxis dataKey="thang" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} />
                    <Tooltip formatter={(value) => money.format(toNumber(value))} />
                    <Line type="monotone" dataKey="giaTrungBinh" stroke="#0f4bd8" strokeWidth={3} dot={{ r: 4 }} name="Giá TB/tháng" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card className="enterprise-panel" variant="borderless" title="Phân bố loại BĐS">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={metrics.propertyType.soLuongTheoLoai} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {metrics.propertyType.soLuongTheoLoai.map((item) => (
                        <Cell key={item.key} fill={getPropertyColor(item.key)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => num.format(toNumber(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="enterprise-legend-list">
                  {metrics.propertyType.soLuongTheoLoai.map((item) => (
                    <div key={item.key}>
                      <i style={{ backgroundColor: getPropertyColor(item.key) }} />
                      <span>{item.label}</span>
                      <strong>{num.format(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Giá cho thuê TB theo loại + Chất lượng tin */}
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <Card className="enterprise-panel" variant="borderless" title="Giá cho thuê trung bình theo loại BĐS">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.propertyType.giaTrungBinhTheoLoai}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} />
                    <Tooltip formatter={(value) => money.format(toNumber(value))} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} name="Giá TB/tháng">
                      {metrics.propertyType.giaTrungBinhTheoLoai.map((item) => (
                        <Cell key={item.key} fill={getPropertyColor(item.key)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} xl={10}>
              <Card className="enterprise-panel" variant="borderless" title="Chất lượng tin đăng">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--ent-subtitle)", fontSize: 13 }}>Có ảnh minh họa</span>
                    <strong style={{ color: "var(--ent-title)" }}>{metrics.listings.chatLuongCoAnh}%</strong>
                  </div>
                  <Progress percent={metrics.listings.chatLuongCoAnh} showInfo={false} strokeColor="#2563eb" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--ent-subtitle)", fontSize: 13 }}>Có mô tả chi tiết</span>
                    <strong style={{ color: "var(--ent-title)" }}>{metrics.listings.chatLuongCoMoTa}%</strong>
                  </div>
                  <Progress percent={metrics.listings.chatLuongCoMoTa} showInfo={false} strokeColor="#16a34a" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--ent-subtitle)", fontSize: 13 }}>Chất lượng trung bình</span>
                    <strong style={{ color: "var(--ent-title)" }}>{metrics.listings.chatLuongTrungBinh}%</strong>
                  </div>
                  <Progress percent={metrics.listings.chatLuongTrungBinh} showInfo={false} strokeColor="#f97316" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ textAlign: "center", padding: "8px", background: "var(--ent-surface-soft)", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--ent-subtitle)" }}>Đang hoạt động</div>
                    <strong style={{ fontSize: 18, color: "var(--ent-title)" }}>{num.format(metrics.listings.dangHoatDong)}</strong>
                  </div>
                  <div style={{ textAlign: "center", padding: "8px", background: "var(--ent-surface-soft)", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--ent-subtitle)" }}>Bị từ chối</div>
                    <strong style={{ fontSize: 18, color: "#dc2626" }}>{num.format(metrics.listings.biTuChoi)}</strong>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Hợp đồng + Hệ thống + AI */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card className="enterprise-panel" variant="borderless" title="Hợp đồng">
                <SmallStat label="Đang hiệu lực" value={num.format(metrics.contracts.dangHoatDong)} />
                <SmallStat label="Đã hết hạn" value={num.format(metrics.contracts.hetHan)} />
                <SmallStat label="Đã hủy" value={num.format(metrics.contracts.biHuy)} />
                <SmallStat label="Thời hạn thuê TB" value={`${metrics.contracts.trungBinhThoiGianThueThang} tháng`} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="enterprise-panel" variant="borderless" title="Hiệu suất hệ thống">
                <SmallStat label="API Requests/s" value={`${num.format(metrics.system.apiCallsPerSec)} req/s`} />
                <SmallStat label="Tỷ lệ lỗi" value={`${metrics.system.errorRate}%`} />
                <div className="enterprise-sys-boxes">
                  <div><span>UPTIME</span><strong>{metrics.system.uptime}%</strong></div>
                  <div><span>RESPONSE</span><strong>{metrics.system.responseTimeMs}ms</strong></div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="enterprise-panel enterprise-ai-panel" variant="borderless" title="Trí tuệ nhân tạo (AI)">
                <SmallStat label="Request AI/tháng" value={num.format(metrics.ai.soRequestChatAi + metrics.ai.soRequestDuDoanGia)} />
                <SmallStat label="Độ chính xác model" value={`${metrics.ai.doChinhXacModel}%`} />
                <SmallStat label="Phản hồi người dùng" value={`${metrics.ai.diemFeedback}/5`} />
              </Card>
            </Col>
          </Row>

          {/* Top BĐS + Top khu vực */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <TopList title="Thị trường trọng điểm" rows={metrics.advanced.topKhuVucHot} currency />
            </Col>
            <Col xs={24} lg={14}>
              <Card className="enterprise-panel" variant="borderless" title="BĐS được xem nhiều nhất">
                <div className="enterprise-table-head">
                  <span>Tên bất động sản</span>
                  <span>Lượt xem</span>
                </div>
                {metrics.advanced.topBatDongSanXemNhieu.map((item) => (
                  <div key={item.key} className="enterprise-table-row">
                    <p>{item.label}</p>
                    <strong>{num.format(item.value)}</strong>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

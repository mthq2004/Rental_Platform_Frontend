import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Skeleton,
  Statistic,
  Segmented,
  Tag,
  Typography,
} from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { KeyValueMetric } from "../../types/analytics.type";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { fetchDashboardAnalytics } from "../../stores/slices/dashboard-analytics.slice";
import "../dashboard/dashboard-enterprise.css";

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

const getPropertyColor = (key: string): string => propertyTypeColors[key] ?? "#0f4bd8";

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

type TabKey = "doanh-thu" | "khu-vuc" | "kiem-duyet";

const StatisticsPage = () => {
  const dispatch = useAppDispatch();
  const { loading, metrics } = useAppSelector((state) => state.dashboardAnalytics);
  const [activeTab, setActiveTab] = useState<TabKey>("doanh-thu");

  const loadMetrics = async () => {
    await dispatch(fetchDashboardAnalytics());
  };

  useEffect(() => {
    loadMetrics();
  }, [dispatch]);

  const renderRevenue = () => (
    <>
      {/* KPI Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Doanh thu ước tính" value={metrics.revenue.tongDoanhThuUocTinh} formatter={(v) => money.format(Number(v))} prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Hoa hồng nền tảng" value={metrics.revenue.commissionEarned} formatter={(v) => money.format(Number(v))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Giao dịch thành công" value={metrics.revenue.giaoDichThanhCong} formatter={(v) => num.format(Number(v))} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Giao dịch thất bại" value={metrics.revenue.giaoDichThatBai} formatter={(v) => num.format(Number(v))} styles={{ content: { color: "#dc2626" } }} />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card className="enterprise-panel" variant="borderless" title="Giá cho thuê trung bình theo loại BĐS">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={metrics.revenue.giaChoThueTheoLoai}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} />
                <Tooltip formatter={(value) => money.format(toNumber(value))} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Giá TB/tháng">
                  {metrics.revenue.giaChoThueTheoLoai.map((item) => (
                    <Cell key={item.key} fill={getPropertyColor(item.key)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="enterprise-panel" variant="borderless" title="Chi tiết tài chính">
            <SmallStat label="AOV (Giá trị TB/giao dịch)" value={money.format(metrics.revenue.aov)} />
            <SmallStat label="Hoa hồng nền tảng" value={money.format(metrics.revenue.commissionEarned)} />
            {metrics.revenue.feeBreakdown.map((item) => (
              <SmallStat key={item.key} label={item.label} value={money.format(item.value)} />
            ))}
          </Card>
        </Col>
      </Row>

      {/* Doanh thu theo khu vực */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="enterprise-panel" variant="borderless" title="Doanh thu theo khu vực">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.revenue.doanhThuTheoKhuVuc} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1_000_000_000)}B`} />
                <YAxis type="category" dataKey="label" width={140} />
                <Tooltip formatter={(value) => money.format(toNumber(value))} />
                <Bar dataKey="value" fill="#0f4bd8" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderLocation = () => (
    <>
      {/* Thống kê theo thành phố */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="enterprise-panel" variant="borderless" title="Số lượng BĐS theo thành phố">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={metrics.location.soLuongTheoThanhPho} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={140} />
                <Tooltip formatter={(value) => num.format(toNumber(value))} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <TopList title="Khu vực Hot" rows={metrics.location.khuVucHot} currency />
        </Col>
      </Row>

      {/* Doanh thu theo khu vực + Khu vực ít hoạt động */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="enterprise-panel" variant="borderless" title="Doanh thu theo khu vực">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={metrics.location.doanhThuTheoKhuVuc} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1_000_000_000)}B`} />
                <YAxis type="category" dataKey="label" width={140} />
                <Tooltip formatter={(value) => money.format(toNumber(value))} />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <TopList title="Khu vực ít hoạt động" rows={metrics.location.khuVucItHoatDong} currency />
        </Col>
      </Row>

      {/* Giá theo khu vực */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card className="enterprise-panel" variant="borderless" title="Giá trung bình theo khu vực">
            <div className="enterprise-heat-grid">
              {metrics.pricing.giaTheoKhuVuc.map((item) => (
                <div key={item.key}>
                  <p>{item.label}</p>
                  <strong>{money.format(item.value)}</strong>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderModeration = () => (
    <>
      {/* KPI kiểm duyệt */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Tin bị report" value={metrics.moderation.tinBiReport} formatter={(v) => num.format(Number(v))} styles={{ content: { color: "#dc2626" } }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="User bị khóa" value={metrics.moderation.userBiKhoa} formatter={(v) => num.format(Number(v))} styles={{ content: { color: "#f97316" } }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Tỷ lệ gian lận" value={metrics.moderation.tiLeGianLan} suffix="%" valueStyle={{ color: metrics.moderation.tiLeGianLan > 5 ? "#dc2626" : "#16a34a" }} />
          </Card>
        </Col>
      </Row>

      {/* KYC */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="enterprise-panel" variant="borderless" title="Xác minh danh tính (KYC)">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <Progress type="circle" percent={metrics.moderation.tiLeKycVerified} strokeColor="#16a34a" size={140} format={(p) => `${p}%`} />
            </div>
            <SmallStat label="Đã xác minh" value={num.format(metrics.moderation.kycVerified)} />
            <SmallStat label="Đang chờ xét duyệt" value={num.format(metrics.moderation.kycPending)} />
            <SmallStat label="Bị từ chối" value={num.format(metrics.moderation.kycRejected)} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="enterprise-panel" variant="borderless" title="Phân tích rủi ro">
            <SmallStat label="Tỷ lệ KYC xác minh" value={`${metrics.moderation.tiLeKycVerified}%`} />
            <SmallStat label="Tỷ lệ fail AI check" value={`${metrics.moderation.tiLeFailAiCheck}%`} />
            <SmallStat label="Tỷ lệ gian lận" value={`${metrics.moderation.tiLeGianLan}%`} />
            <SmallStat label="Tin bị report" value={num.format(metrics.moderation.tinBiReport)} />
            <SmallStat label="Tài khoản bị khóa" value={num.format(metrics.moderation.userBiKhoa)} />
          </Card>
        </Col>
      </Row>

      {/* Phễu người dùng */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="enterprise-panel" variant="borderless" title="Phễu hành vi người dùng">
            {metrics.users.funnel.map((item) => {
              const max = metrics.users.funnel[0]?.value || 1;
              const percent = (item.value / max) * 100;
              return (
                <div key={item.buoc} className="enterprise-funnel-row">
                  <div>
                    <span>{item.buoc}</span>
                    <strong>{num.format(item.value)}</strong>
                  </div>
                  <Progress percent={percent} showInfo={false} strokeColor="#0f4bd8" />
                </div>
              );
            })}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="enterprise-panel" variant="borderless" title="Trạng thái KYC">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={metrics.users.theoKyc}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  <Cell fill="#16a34a" />
                  <Cell fill="#f97316" />
                  <Cell fill="#dc2626" />
                </Pie>
                <Tooltip formatter={(value) => num.format(toNumber(value))} />
              </PieChart>
            </ResponsiveContainer>
            <div className="enterprise-legend-list">
              {metrics.users.theoKyc.map((item, idx) => (
                <div key={item.key}>
                  <i style={{ backgroundColor: ["#16a34a", "#f97316", "#dc2626"][idx] }} />
                  <span>{item.label}</span>
                  <strong>{num.format(item.value)}</strong>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );

  const tabOptions = [
    { label: "Doanh thu", value: "doanh-thu", icon: <DollarOutlined /> },
    { label: "Khu vực", value: "khu-vuc", icon: <EnvironmentOutlined /> },
    { label: "Kiểm duyệt", value: "kiem-duyet", icon: <SafetyOutlined /> },
  ];

  return (
    <div className="admin-page-shell enterprise-dashboard">
      <Card className="hero-surface enterprise-header-card" variant="borderless">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>Thống kê & Phân tích</Typography.Title>
            <Typography.Text type="secondary">Doanh thu, khu vực hoạt động và kiểm duyệt rủi ro</Typography.Text>
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
          <Segmented
            options={tabOptions}
            value={activeTab}
            onChange={(val) => setActiveTab(val as TabKey)}
            size="large"
            block
            style={{ marginBottom: 4 }}
          />

          {activeTab === "doanh-thu" && renderRevenue()}
          {activeTab === "khu-vuc" && renderLocation()}
          {activeTab === "kiem-duyet" && renderModeration()}
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;

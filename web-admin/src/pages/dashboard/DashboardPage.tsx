import { useEffect, useMemo } from "react";
import {
  Alert,
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
  Area,
  AreaChart,
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
  FireOutlined,
  ReloadOutlined,
  SafetyOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
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

type AnalyticsTabKey =
  | "tong-quan"
  | "bat-dong-san"
  | "nguoi-dung"
  | "yeu-cau"
  | "hop-dong"
  | "doanh-thu"
  | "khu-vuc"
  | "kiem-duyet"
  | "ai";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, metrics, usingFallback } = useAppSelector((state) => state.dashboardAnalytics);

  const tab = (searchParams.get("tab") as AnalyticsTabKey | null) ?? "tong-quan";

  const loadMetrics = async () => {
    await dispatch(fetchDashboardAnalytics());
  };

  useEffect(() => {
    loadMetrics();
  }, [dispatch]);

  useEffect(() => {
    if (tab === "nguoi-dung") {
      navigate("/dashboard/users", { replace: true });
    }
  }, [navigate, tab]);

  const revenueTrend = metrics.pricing.xuHuongGiaTheoThang.map((item) => ({
    thang: item.thang,
    doanhThu: Math.round(item.giaTrungBinh * 16),
  }));

  const renderOverview = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Tổng bất động sản" value={metrics.overview.tongBatDongSan} formatter={(v) => num.format(Number(v))} prefix={<ApartmentOutlined />} />
            <span className="enterprise-kpi-sub">{num.format(metrics.listings.dangAn)} tin đang ẩn</span>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Người dùng hệ thống" value={metrics.overview.tongNguoiDung} formatter={(v) => num.format(Number(v))} prefix={<TeamOutlined />} />
            <span className="enterprise-kpi-sub">DAU/MAU: {num.format(metrics.users.activeDau)} / {num.format(metrics.users.activeMau)}</span>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="enterprise-kpi-card enterprise-kpi-card-primary" variant="borderless">
            <Statistic title="Doanh thu tạm tính" value={metrics.revenue.tongDoanhThuUocTinh} formatter={(v) => money.format(Number(v))} prefix={<DollarOutlined />} />
            <span className="enterprise-kpi-sub">+ {metrics.overview.tileTangTruongThang}% so với tháng trước</span>
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card className="enterprise-kpi-card" variant="borderless">
            <Statistic title="Hiệu suất vận hành" value={metrics.overview.occupancyRate} suffix="%" />
            <span className="enterprise-kpi-sub">Tỷ lệ lấp đầy (Occupancy)</span>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
        <Col xs={24} xl={16}>
          <Card className="enterprise-panel" variant="borderless" title="Xu hướng Doanh thu & Giao dịch">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                <XAxis dataKey="thang" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000_000)}B`} />
                <Tooltip formatter={(value) => money.format(toNumber(value))} />
                <Line type="monotone" dataKey="doanhThu" stroke="#0f4bd8" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card className="enterprise-panel" variant="borderless" title="Phân bố loại BĐS">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={metrics.propertyType.soLuongTheoLoai}
                  dataKey="value"
                  innerRadius={52}
                  outerRadius={85}
                  paddingAngle={3}
                >
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

      <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
        <Col xs={24} md={8}>
          <Card className="enterprise-panel" variant="borderless" title="Chỉ số Hợp đồng">
            <SmallStat label="Hợp đồng đang hiệu lực" value={num.format(metrics.contracts.dangHoatDong)} />
            <SmallStat label="Hợp đồng đã hết hạn" value={num.format(metrics.contracts.hetHan)} />
            <SmallStat label="Yêu cầu hủy ngang" value={num.format(metrics.contracts.biHuy)} />
            <SmallStat label="Thời gian thuê TB" value={`${metrics.contracts.trungBinhThoiGianThueThang} tháng`} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="enterprise-panel" variant="borderless" title="Hiệu suất hệ thống">
            <SmallStat label="API Requests/s" value={`${num.format(metrics.system.apiCallsPerSec)} req/s`} />
            <SmallStat label="Tỷ lệ lỗi" value={`${metrics.system.errorRate}%`} />
            <div className="enterprise-sys-boxes">
              <div>
                <span>UPTIME</span>
                <strong>{metrics.system.uptime}%</strong>
              </div>
              <div>
                <span>RESPONSE</span>
                <strong>{metrics.system.responseTimeMs}ms</strong>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="enterprise-panel enterprise-ai-panel" variant="borderless" title="Trí tuệ Nhân tạo (AI)">
            <SmallStat label="Yêu cầu AI/tháng" value={num.format(metrics.ai.soRequestChatAi + metrics.ai.soRequestDuDoanGia)} />
            <SmallStat label="Độ chính xác model" value={`${metrics.ai.doChinhXacModel}%`} />
            <Button type="primary" block>Cấu hình AI Agent</Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
        <Col xs={24} lg={10}>
          <TopList title="Thị trường trọng điểm" rows={metrics.advanced.topKhuVucHot} currency />
        </Col>
        <Col xs={24} lg={14}>
          <Card className="enterprise-panel" variant="borderless" title="Sản phẩm bất động sản nổi bật">
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
    </>
  );

  const renderRevenue = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}>
        <Card className="enterprise-panel" variant="borderless" title="Doanh thu theo loại bất động sản">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={metrics.revenue.doanhThuTheoLoai}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000_000)}B`} />
              <Tooltip formatter={(value) => money.format(toNumber(value))} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {metrics.revenue.doanhThuTheoLoai.map((item) => (
                  <Cell key={item.key} fill={getPropertyColor(item.key)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} xl={8}>
        <Card className="enterprise-panel" variant="borderless" title="Thông số tài chính">
          <SmallStat label="AOV" value={money.format(metrics.revenue.aov)} />
          <SmallStat label="Commission earned" value={money.format(metrics.revenue.commissionEarned)} />
          {metrics.revenue.feeBreakdown.map((item) => (
            <SmallStat key={item.key} label={item.label} value={money.format(item.value)} />
          ))}
        </Card>
      </Col>
    </Row>
  );

  const renderUsers = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
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
      <Col xs={24} lg={8}>
        <Card className="enterprise-panel" variant="borderless" title="Xác thực & Rủi ro">
          <Progress type="circle" percent={metrics.moderation.tiLeKycVerified} strokeColor="#9a3412" size={120} />
          <div className="enterprise-risk-list">
            <SmallStat label="Đã xác minh" value={num.format(metrics.moderation.kycVerified)} />
            <SmallStat label="Đang chờ" value={num.format(metrics.moderation.kycPending)} />
            <SmallStat label="Báo cáo vi phạm" value={num.format(metrics.moderation.tinBiReport)} />
            <SmallStat label="Tài khoản bị khóa" value={num.format(metrics.moderation.userBiKhoa)} />
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderRequests = () => (
    <Card className="enterprise-panel" variant="borderless" title="Yêu cầu thuê chờ xử lý">
      {metrics.requests.funnel.map((item) => (
        <div key={item.buoc} className="enterprise-request-row">
          <div>
            <p>{item.buoc}</p>
            <span>Luồng xử lý yêu cầu</span>
          </div>
          <strong>{num.format(item.value)}</strong>
          <small>{item.value > 0 ? "Đã cập nhật" : "Chưa phát sinh"}</small>
        </div>
      ))}
    </Card>
  );

  const renderProperties = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card className="enterprise-panel" variant="borderless" title="Xu hướng giá theo loại hình">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.propertyType.giaTrungBinhTheoLoai}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} />
              <Tooltip formatter={(value) => money.format(toNumber(value))} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {metrics.propertyType.giaTrungBinhTheoLoai.map((item) => (
                  <Cell key={item.key} fill={getPropertyColor(item.key)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card className="enterprise-panel" variant="borderless" title="Heatmap giá theo khu vực">
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
  );

  const renderContracts = () => (
    <Card className="enterprise-panel" variant="borderless" title="Phân bố trạng thái hợp đồng">
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={metrics.contracts.theoTrangThai}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(value) => num.format(toNumber(value))} />
          <Area type="monotone" dataKey="value" stroke="#0f4bd8" fill="#d9e6ff" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderLocation = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={14}>
        <Card className="enterprise-panel" variant="borderless" title="Doanh thu theo khu vực">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={metrics.location.doanhThuTheoKhuVuc} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1_000_000_000)}B`} />
              <YAxis type="category" dataKey="label" width={120} />
              <Tooltip formatter={(value) => money.format(toNumber(value))} />
              <Bar dataKey="value" fill="#0f4bd8" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} xl={10}>
        <TopList title="Khu vực hot" rows={metrics.location.khuVucHot} currency />
      </Col>
    </Row>
  );

  const renderModeration = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card className="enterprise-panel" variant="borderless"><Statistic title="Tin bị report" value={metrics.moderation.tinBiReport} formatter={(v) => num.format(Number(v))} /></Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="enterprise-panel" variant="borderless"><Statistic title="User bị khóa" value={metrics.moderation.userBiKhoa} formatter={(v) => num.format(Number(v))} /></Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="enterprise-panel" variant="borderless"><Statistic title="Tỷ lệ gian lận" value={metrics.moderation.tiLeGianLan} suffix="%" /></Card>
      </Col>
    </Row>
  );

  const renderAi = () => (
    <Card className="enterprise-panel enterprise-ai-banner" variant="borderless" title="AI Advanced Insights">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><Statistic title="Request dự đoán giá" value={metrics.ai.soRequestDuDoanGia} formatter={(v) => num.format(Number(v))} /></Col>
        <Col xs={24} md={8}><Statistic title="Request mô tả tự động" value={metrics.ai.soRequestMoTaTuDong} formatter={(v) => num.format(Number(v))} /></Col>
        <Col xs={24} md={8}><Statistic title="Độ chính xác model" value={metrics.ai.doChinhXacModel} suffix="%" /></Col>
      </Row>
    </Card>
  );

  const panel = useMemo(() => {
    if (tab === "tong-quan") return renderOverview();
    if (tab === "doanh-thu") return renderRevenue();
    if (tab === "nguoi-dung") return renderUsers();
    if (tab === "yeu-cau") return renderRequests();
    if (tab === "bat-dong-san") return renderProperties();
    if (tab === "hop-dong") return renderContracts();
    if (tab === "khu-vuc") return renderLocation();
    if (tab === "kiem-duyet") return renderModeration();
    return renderAi();
  }, [tab, metrics]);

  return (
    <div className="admin-page-shell enterprise-dashboard">
      <Card className="hero-surface enterprise-header-card" variant="borderless">
        {/* Thêm một cái div bọc trực tiếp ở đây và set display flex */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%' // Đảm bảo nó chiếm hết chiều ngang của Card
        }}>
          
          {/* Cụm bên trái: Chữ */}
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Thống kê Tài chính & Hiệu suất
            </Typography.Title>
            <Typography.Text type="secondary">
              Dữ liệu tổng hợp theo thời gian thực.
            </Typography.Text>
          </div>

          {/* Cụm bên phải: Button */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button icon={<ReloadOutlined />} onClick={loadMetrics}>Làm mới</Button>
            <Button type="primary">Xuất báo cáo</Button>
          </div>

        </div>
      </Card>
      {usingFallback && (
        <Alert
          className="enterprise-sample-alert"
          style={{ marginTop: 14 }}
          type="info"
          showIcon
          message="Đang hiển thị dữ liệu mẫu"
          description="Hệ thống chưa đủ dữ liệu backend cho toàn bộ analytics. Các thẻ và biểu đồ vẫn hiển thị theo dataset mô phỏng để phục vụ demo giao diện."
        />
      )}

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
          {panel}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

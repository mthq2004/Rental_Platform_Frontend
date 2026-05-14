import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  InputNumber,
  Progress,
  Radio,
  Row,
  Select,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  Spin,
} from "antd";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ExperimentOutlined,
  ReloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  ShopOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  ShoppingCartOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import envConfig from "../../config";
import provinceService from "../../services/province.service";
import type { Province, District } from "../../types/province.type";
import "../complaints/disputes.css";

const { Title, Text } = Typography;

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("vi-VN");

const propertyTypeColors: Record<string, string> = {
  "Căn hộ": "#2563eb",
  "Nhà nguyên căn": "#f97316",
  "Đất": "#16a34a",
  "Văn phòng": "#7c3aed",
  "Phòng trọ": "#dc2626",
};

interface PricePrediction {
  propertyType: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  predictedAvg: number;
  sampleCount: number;
  avgPricePerSqm?: number;
}

interface DistrictInsight {
  district: string;
  province?: string;
  propertyType?: string;
  avgPrice: number;
  count: number;
}

interface PriceAnalytics {
  predictions: PricePrediction[];
  modelAccuracy: number;
  totalSamples: number;
  lastTrainedAt: string;
  districtInsights?: DistrictInsight[];
}

interface PredictResult {
  predictedPrice: number;
  minPrice?: number;
  maxPrice?: number;
  confidence?: number;
  comparableCount?: number;
  marketAdjusted?: boolean;
}

const AI_BASE = `${envConfig.API_ENDPOINT}/api/ai/api/v1`;

const AiAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [analytics, setAnalytics] = useState<PriceAnalytics | null>(null);

  // Province / District selector state
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // District insights filter
  const [districtFilterType, setDistrictFilterType] = useState<string>("");

  // Predict form
  const [predictForm, setPredictForm] = useState({
    area: 50,
    rooms: 2,
    floors: 1,
    streetFacing: null as boolean | null,
    location: "",
    propertyType: "apartment" as string,
    furnitureStatus: "none" as string,
    nearCityCenter: false,
    nearShoppingMall: false,
    nearMarket: false,
    nearSchool: false,
    nearHospital: false,
  });
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${AI_BASE}/price-analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await fetch(`${AI_BASE}/train`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        message.success(`Train thành công: ${data.sampleCount} mẫu, độ chính xác ${data.accuracy}%`);
        await fetchAnalytics();
      } else {
        const err = await res.json();
        message.error(err.detail || "Train thất bại");
      }
    } catch {
      message.error("Không thể kết nối AI service");
    }
    setTraining(false);
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const body: Record<string, unknown> = {
        area: predictForm.area,
        rooms: predictForm.rooms,
        location: predictForm.location,
        propertyType: predictForm.propertyType,
        furnitureStatus: predictForm.furnitureStatus,
        nearCityCenter: predictForm.nearCityCenter,
        nearShoppingMall: predictForm.nearShoppingMall,
        nearMarket: predictForm.nearMarket,
        nearSchool: predictForm.nearSchool,
        nearHospital: predictForm.nearHospital,
      };
      if (predictForm.propertyType === "house") {
        body.floors = predictForm.floors;
        body.streetFacing = predictForm.streetFacing;
      }
      const res = await fetch(`${AI_BASE}/predict-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setPredictResult(data);
      } else {
        message.error("Dự đoán thất bại");
      }
    } catch {
      message.error("Không thể kết nối AI service");
    }
    setPredicting(false);
  };

  useEffect(() => {
    fetchAnalytics();
    provinceService.getProvinces().then(setProvinces).catch(() => {});
  }, []);

  const handleProvinceChange = async (code: number) => {
    setSelectedProvinceCode(code);
    setDistricts([]);
    setPredictForm((p) => ({ ...p, location: "" }));
    setLoadingDistricts(true);
    try {
      const prov = await provinceService.getProvinceWithDistricts(code);
      setDistricts(prov.districts ?? []);
    } catch {
      // ignore
    }
    setLoadingDistricts(false);
  };

  const chartData = analytics?.predictions.filter((p) => p.sampleCount > 0) || [];

  const comparisonData = chartData.map((p) => ({
    name: p.propertyType,
    "Giá thực tế TB": p.avgPrice,
    "AI dự đoán": p.predictedAvg,
  }));

  const radarData = chartData.map((p) => ({
    subject: p.propertyType,
    "Số mẫu": p.sampleCount,
    fullMark: analytics?.totalSamples || 100,
  }));

  const tableColumns = [
    {
      title: "Loại BĐS",
      dataIndex: "propertyType",
      key: "propertyType",
      render: (text: string) => (
        <Tag color={propertyTypeColors[text] || "#666"} style={{ fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Số mẫu",
      dataIndex: "sampleCount",
      key: "sampleCount",
      render: (v: number) => num.format(v),
    },
    {
      title: "Giá thấp nhất",
      dataIndex: "minPrice",
      key: "minPrice",
      render: (v: number) => money.format(v),
    },
    {
      title: "Giá trung bình",
      dataIndex: "avgPrice",
      key: "avgPrice",
      render: (v: number) => money.format(v),
    },
    {
      title: "Giá cao nhất",
      dataIndex: "maxPrice",
      key: "maxPrice",
      render: (v: number) => money.format(v),
    },
    {
      title: "Giá/m² TB",
      dataIndex: "avgPricePerSqm",
      key: "avgPricePerSqm",
      render: (v: number) => v ? <span style={{ color: "#7c3aed", fontWeight: 600 }}>{money.format(v)}</span> : "—",
    },
    {
      title: "AI dự đoán TB",
      dataIndex: "predictedAvg",
      key: "predictedAvg",
      render: (v: number) => (
        <span style={{ color: "#2563eb", fontWeight: 600 }}>{money.format(v)}</span>
      ),
    },
  ];

  return (
    <div className="dispute-management-page">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>
            <RobotOutlined style={{ marginRight: 8 }} />
            Dự báo & AI Analytics
          </Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Phân tích giá thuê bằng Machine Learning từ dữ liệu thực tế</Text>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-stat-icon-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DatabaseOutlined style={{ color: "#2563eb", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>Mẫu dữ liệu</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "var(--dm-title)", lineHeight: 1.2 }}>{num.format(analytics?.totalSamples || 0)}</div>
              </div>
            </div>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-tag-green-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircleOutlined style={{ color: "#059669", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>R² Accuracy</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: (analytics?.modelAccuracy || 0) > 70 ? "#059669" : "#f97316", lineHeight: 1.2 }}>{analytics?.modelAccuracy || 0}%</div>
              </div>
            </div>
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={fetchAnalytics}
              loading={loading}
              style={{ height: "auto", borderRadius: 8, fontWeight: 500, borderColor: "var(--dm-refresh-border)", color: "var(--dm-refresh-text)", background: "var(--dm-refresh-bg)" }}
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="large"
              onClick={handleTrain}
              loading={training}
              style={{ height: "auto", borderRadius: 8, fontWeight: 500, background: "#f97316", borderColor: "#f97316" }}
            >
              {training ? "Đang train..." : "Train Model từ DB"}
            </Button>
          </div>
        </Col>
      </Row>

      {loading ? (
        <Card variant="borderless" style={{ borderRadius: 8, border: "1px solid var(--dm-border)" }}><Skeleton active paragraph={{ rows: 8 }} /></Card>
      ) : (
        <>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} lg={8}>
              <Card variant="borderless" style={{ borderRadius: 8, border: "1px solid var(--dm-border)" }}>
                <Statistic
                  title="Loại BĐS phân tích"
                  value={chartData.length}
                  prefix={<ExperimentOutlined style={{ color: "#7c3aed" }} />}
                  suffix={`/ 5`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card variant="borderless" style={{ borderRadius: 8, border: "1px solid var(--dm-border)" }}>
                <Statistic
                  title="Train lần cuối"
                  value={analytics?.lastTrainedAt && analytics.lastTrainedAt !== "Chưa train"
                    ? new Date(analytics.lastTrainedAt).toLocaleDateString("vi-VN")
                    : "Chưa train"}
                  prefix={<LineChartOutlined style={{ color: "#dc2626" }} />}
                  valueStyle={{ fontSize: 18 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <Card variant="borderless" style={{ borderRadius: 8, border: "1px solid var(--dm-border)" }}>
                <Statistic
                  title="Giá thuê trung bình"
                  value={chartData.length > 0 ? chartData.reduce((sum, p) => sum + p.avgPrice, 0) / chartData.length : 0}
                  prefix={<DollarOutlined style={{ color: "#2563eb" }} />}
                  formatter={(v) => money.format(Number(v))}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} xl={16}>
              <Card title="So sánh: Giá thực tế vs AI dự đoán" variant="borderless" style={{ borderRadius: 12 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={comparisonData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4ebfb" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} />
                    <Tooltip formatter={(value) => money.format(Number(value))} />
                    <Bar dataKey="Giá thực tế TB" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="AI dự đoán" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card title="Phân bố mẫu theo loại BĐS" variant="borderless" style={{ borderRadius: 12 }}>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar name="Số mẫu" dataKey="Số mẫu" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Data Table */}
          <Card title="Chi tiết dự đoán giá theo loại BĐS" variant="borderless" style={{ borderRadius: 12, marginBottom: 16 }}>
            <Table
              columns={tableColumns}
              dataSource={analytics?.predictions || []}
              rowKey="propertyType"
              pagination={false}
              size="middle"
            />
          </Card>

          {/* Price Prediction Tool */}
          <Card
            title={
              <span>
                <DollarOutlined style={{ color: "#f97316", marginRight: 8 }} />
                Công cụ dự đoán giá thuê
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 12 }}
          >
            {/* Row 1: core fields */}
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={5}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Loại BĐS</label>
                <Select
                  style={{ width: "100%" }}
                  value={predictForm.propertyType}
                  onChange={(v) =>
                    setPredictForm((p) => ({
                      ...p,
                      propertyType: v,
                      // reset fields không phù hợp khi đổi loại
                      rooms: v === "land" || v === "office" ? 0 : p.rooms,
                      floors: v === "house" ? p.floors : 1,
                      streetFacing: v === "house" ? p.streetFacing : null,
                      furnitureStatus: v === "land" || v === "office" ? "none" : p.furnitureStatus,
                    }))
                  }
                  options={[
                    { value: "apartment", label: "Căn hộ" },
                    { value: "house", label: "Nhà nguyên căn" },
                    { value: "room", label: "Phòng trọ" },
                    { value: "office", label: "Văn phòng" },
                    { value: "land", label: "Đất" },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Diện tích (m²)</label>
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  value={predictForm.area}
                  onChange={(v) => setPredictForm((p) => ({ ...p, area: v || 50 }))}
                />
              </Col>
              {/* Phòng ngủ — ẩn cho đất và văn phòng */}
              {predictForm.propertyType !== "land" && predictForm.propertyType !== "office" && (
                <Col xs={24} sm={12} md={3}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Phòng ngủ</label>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    value={predictForm.rooms}
                    onChange={(v) => setPredictForm((p) => ({ ...p, rooms: v || 0 }))}
                  />
                </Col>
              )}
              {/* Số tầng — chỉ cho nhà nguyên căn */}
              {predictForm.propertyType === "house" && (
                <Col xs={24} sm={12} md={3}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Số tầng</label>
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    max={20}
                    value={predictForm.floors}
                    onChange={(v) => setPredictForm((p) => ({ ...p, floors: v || 1 }))}
                  />
                </Col>
              )}
              <Col xs={24} sm={12} md={5}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Tỉnh / Thành phố</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder="Chọn tỉnh/thành phố"
                  showSearch
                  filterOption={(input, opt) =>
                    String(opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  value={selectedProvinceCode ?? undefined}
                  onChange={handleProvinceChange}
                  options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                />
              </Col>
              <Col xs={24} sm={12} md={5}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Quận / Huyện</label>
                <Select
                  style={{ width: "100%" }}
                  placeholder={loadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
                  showSearch
                  filterOption={(input, opt) =>
                    String(opt?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  disabled={districts.length === 0}
                  loading={loadingDistricts}
                  value={predictForm.location || undefined}
                  onChange={(v) => setPredictForm((p) => ({ ...p, location: v }))}
                  options={districts.map((d) => ({ value: d.name, label: d.name }))}
                />
              </Col>
              {/* Nội thất — ẩn cho đất và văn phòng */}
              {predictForm.propertyType !== "land" && predictForm.propertyType !== "office" && (
                <Col xs={24} sm={12} md={6}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>
                    <HomeOutlined style={{ marginRight: 4 }} />
                    Tình trạng nội thất
                  </label>
                  <Select
                    style={{ width: "100%" }}
                    value={predictForm.furnitureStatus}
                    onChange={(v) => setPredictForm((p) => ({ ...p, furnitureStatus: v }))}
                    options={[
                      { value: "none", label: "Không có nội thất" },
                      { value: "basic", label: "Nội thất cơ bản" },
                      { value: "full", label: "Nội thất đầy đủ / cao cấp" },
                    ]}
                  />
                </Col>
              )}
              {/* Mặt tiền / hẻm — chỉ cho nhà nguyên căn */}
              {predictForm.propertyType === "house" && (
                <Col xs={24}>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 13, color: "#666" }}>
                    <EnvironmentOutlined style={{ marginRight: 4, color: "#f97316" }} />
                    Vị trí nhà
                  </label>
                  <Radio.Group
                    value={predictForm.streetFacing}
                    onChange={(e) => setPredictForm((p) => ({ ...p, streetFacing: e.target.value }))}
                    optionType="button"
                    buttonStyle="solid"
                  >
                    <Radio.Button value={null}>Chưa rõ</Radio.Button>
                    <Radio.Button value={true}>Mặt tiền (+20%)</Radio.Button>
                    <Radio.Button value={false}>Trong hẻm</Radio.Button>
                  </Radio.Group>
                </Col>
              )}
            </Row>

            {/* Row 2: proximity checkboxes */}
            <Divider style={{ margin: "16px 0 12px" }} />
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#666", fontWeight: 500 }}>
                <EnvironmentOutlined style={{ marginRight: 6, color: "#16a34a" }} />
                Vị trí lân cận (ảnh hưởng đến giá)
              </span>
            </div>
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={8} md={5}>
                <Checkbox
                  checked={predictForm.nearCityCenter}
                  onChange={(e) => setPredictForm((p) => ({ ...p, nearCityCenter: e.target.checked }))}
                >
                  <BankOutlined style={{ color: "#2563eb", marginRight: 4 }} />
                  Gần trung tâm thành phố
                </Checkbox>
              </Col>
              <Col xs={12} sm={8} md={5}>
                <Checkbox
                  checked={predictForm.nearShoppingMall}
                  onChange={(e) => setPredictForm((p) => ({ ...p, nearShoppingMall: e.target.checked }))}
                >
                  <ShoppingCartOutlined style={{ color: "#7c3aed", marginRight: 4 }} />
                  Gần trung tâm thương mại
                </Checkbox>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Checkbox
                  checked={predictForm.nearMarket}
                  onChange={(e) => setPredictForm((p) => ({ ...p, nearMarket: e.target.checked }))}
                >
                  <ShopOutlined style={{ color: "#f97316", marginRight: 4 }} />
                  Gần chợ
                </Checkbox>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Checkbox
                  checked={predictForm.nearSchool}
                  onChange={(e) => setPredictForm((p) => ({ ...p, nearSchool: e.target.checked }))}
                >
                  <ReadOutlined style={{ color: "#16a34a", marginRight: 4 }} />
                  Gần trường học
                </Checkbox>
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Checkbox
                  checked={predictForm.nearHospital}
                  onChange={(e) => setPredictForm((p) => ({ ...p, nearHospital: e.target.checked }))}
                >
                  <MedicineBoxOutlined style={{ color: "#dc2626", marginRight: 4 }} />
                  Gần bệnh viện
                </Checkbox>
              </Col>
            </Row>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                icon={<ExperimentOutlined />}
                onClick={handlePredict}
                loading={predicting}
                size="large"
                style={{ paddingInline: 32, height: 44, fontSize: 15, borderRadius: 8 }}
              >
                Dự đoán
              </Button>
            </div>

            {/* Prediction result */}
            {(predicting || predictResult) && (
              <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
                {predicting ? (
                  <div style={{ textAlign: "center", padding: 16 }}><Spin tip="Đang tính toán..." /></div>
                ) : predictResult ? (
                  <>
                    <Row gutter={[16, 12]} align="middle">
                      <Col xs={24} md={6}>
                        <div style={{ textAlign: "center", background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", borderRadius: 12, padding: "16px 20px", color: "#fff" }}>
                          <div style={{ fontSize: 12, opacity: 0.85 }}>Giá dự đoán</div>
                          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                            {money.format(predictResult.predictedPrice)}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.7 }}>/tháng</div>
                        </div>
                      </Col>
                      {predictResult.minPrice != null && predictResult.maxPrice != null && (
                        <Col xs={24} md={6}>
                          <div style={{ background: "#f0f7ff", borderRadius: 10, padding: "12px 16px" }}>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                              <DollarOutlined style={{ marginRight: 4 }} />
                              Khoảng giá dự kiến
                            </div>
                            <div style={{ fontWeight: 600, color: "#1e40af" }}>
                              {money.format(predictResult.minPrice)}
                            </div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>đến</div>
                            <div style={{ fontWeight: 600, color: "#1e40af" }}>
                              {money.format(predictResult.maxPrice)}
                            </div>
                          </div>
                        </Col>
                      )}
                      {predictResult.confidence != null && (
                        <Col xs={24} md={6}>
                          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 16px" }}>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                              <SafetyOutlined style={{ marginRight: 4 }} />
                              Độ tin cậy
                            </div>
                            <Progress
                              percent={Math.round(predictResult.confidence)}
                              strokeColor={
                                predictResult.confidence >= 75
                                  ? "#16a34a"
                                  : predictResult.confidence >= 55
                                  ? "#f97316"
                                  : "#dc2626"
                              }
                              size="small"
                            />
                          </div>
                        </Col>
                      )}
                      {predictResult.comparableCount != null && (
                        <Col xs={24} md={6}>
                          <div style={{ background: "#fdf4ff", borderRadius: 10, padding: "12px 16px" }}>
                            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                              <ShopOutlined style={{ marginRight: 4 }} />
                              So sánh thị trường
                            </div>
                            <div style={{ fontWeight: 600, color: "#7c3aed" }}>
                              {predictResult.comparableCount} BĐS tương đương
                            </div>
                            {predictResult.marketAdjusted && (
                              <Tag color="purple" style={{ marginTop: 4, fontSize: 11 }}>
                                Đã điều chỉnh theo thị trường
                              </Tag>
                            )}
                          </div>
                        </Col>
                      )}
                    </Row>
                    {/* Amenity tags applied */}
                    {((predictForm.propertyType !== "land" && predictForm.propertyType !== "office" && predictForm.furnitureStatus !== "none") ||
                      (predictForm.propertyType === "house" && (predictForm.floors ?? 1) > 1) ||
                      predictForm.streetFacing === true ||
                      predictForm.nearCityCenter || predictForm.nearShoppingMall || predictForm.nearMarket || predictForm.nearSchool || predictForm.nearHospital) ? (
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8", marginRight: 8 }}>Yếu tố đã áp dụng:</span>
                        {predictForm.propertyType !== "land" && predictForm.propertyType !== "office" && predictForm.furnitureStatus === "full" && <Tag color="orange">Nội thất cao cấp +15%</Tag>}
                        {predictForm.propertyType !== "land" && predictForm.propertyType !== "office" && predictForm.furnitureStatus === "basic" && <Tag color="gold">Nội thất cơ bản +7%</Tag>}
                        {predictForm.propertyType === "house" && (predictForm.floors ?? 1) > 1 && <Tag color="volcano">{predictForm.floors} tầng +{Math.min(((predictForm.floors ?? 1) - 1), 5) * 5}%</Tag>}
                        {predictForm.streetFacing === true && <Tag color="magenta">Mặt tiền +20%</Tag>}
                        {predictForm.streetFacing === false && <Tag color="default">Trong hẻm</Tag>}
                        {predictForm.nearCityCenter && <Tag color="blue">Trung tâm TP +8%</Tag>}
                        {predictForm.nearShoppingMall && <Tag color="purple">Gần TTTM +5%</Tag>}
                        {predictForm.nearMarket && <Tag color="green">Gần chợ +3%</Tag>}
                        {predictForm.nearSchool && <Tag color="cyan">Gần trường +3%</Tag>}
                        {predictForm.nearHospital && <Tag color="red">Gần bệnh viện +2%</Tag>}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            )}
          </Card>

          {/* District Insights */}
          {analytics?.districtInsights && analytics.districtInsights.length > 0 && (
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span>
                    <EnvironmentOutlined style={{ color: "#16a34a", marginRight: 8 }} />
                    Top khu vực có giá thuê cao nhất
                  </span>
                  <Select
                    style={{ width: 200, fontWeight: 400 }}
                    placeholder="Lọc theo loại BĐS"
                    allowClear
                    value={districtFilterType || undefined}
                    onChange={(v) => setDistrictFilterType(v ?? "")}
                    options={[
                      { value: "apartment", label: "Căn hộ" },
                      { value: "house", label: "Nhà nguyên căn" },
                      { value: "room", label: "Phòng trọ" },
                      { value: "office", label: "Văn phòng" },
                      { value: "land", label: "Đất" },
                    ]}
                  />
                </div>
              }
              variant="borderless"
              style={{ borderRadius: 12, marginTop: 16 }}
            >
              <Row gutter={[12, 12]}>
                {(districtFilterType
                  ? analytics.districtInsights.filter((d) => d.propertyType === districtFilterType)
                  : analytics.districtInsights
                )
                  .sort((a, b) => b.avgPrice - a.avgPrice)
                  .slice(0, 10)
                  .map((d, idx) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={`${d.district}-${d.propertyType}-${idx}`}>
                    <div
                      style={{
                        background: idx === 0 ? "#fef9c3" : idx === 1 ? "#f8fafc" : "#fff",
                        border: `1px solid ${idx === 0 ? "#fde68a" : "#e2e8f0"}`,
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                          <Tag color={idx === 0 ? "gold" : idx === 1 ? "orange" : "default"}>
                            #{idx + 1}
                          </Tag>
                          {d.propertyType && !districtFilterType && (
                            <Tag color="blue" style={{ fontSize: 11 }}>
                              {{
                                apartment: "Căn hộ",
                                house: "Nhà nguyên căn",
                                room: "Phòng trọ",
                                office: "Văn phòng",
                                land: "Đất",
                              }[d.propertyType] ?? d.propertyType}
                            </Tag>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>
                          {d.district}
                          {d.province && (
                            <span style={{ fontWeight: 400, color: "#64748b", fontSize: 12 }}>
                              {", "}{d.province}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {num.format(d.count)} tin đăng
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 14 }}>
                          {money.format(d.avgPrice)}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>trung bình</div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AiAnalyticsPage;

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
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
  Cell,
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
} from "@ant-design/icons";
import envConfig from "../../config";

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
}

interface PriceAnalytics {
  predictions: PricePrediction[];
  modelAccuracy: number;
  totalSamples: number;
  lastTrainedAt: string;
}

interface PredictResult {
  predictedPrice: number;
}

const AI_BASE = `${envConfig.API_ENDPOINT}/api/ai/api/v1`;

const AiAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [analytics, setAnalytics] = useState<PriceAnalytics | null>(null);

  // Predict form
  const [predictForm, setPredictForm] = useState({
    area: 50,
    rooms: 2,
    location: "Quận 7",
    propertyType: "apartment" as string,
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
      const res = await fetch(`${AI_BASE}/predict-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictForm),
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
  }, []);

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
      title: "AI dự đoán TB",
      dataIndex: "predictedAvg",
      key: "predictedAvg",
      render: (v: number) => (
        <span style={{ color: "#2563eb", fontWeight: 600 }}>{money.format(v)}</span>
      ),
    },
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Header */}
      <Card variant="borderless" style={{ marginBottom: 16, background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", color: "#fff", borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0, color: "#fff" }}>
              <RobotOutlined /> Dự báo & AI Analytics
            </Typography.Title>
            <Typography.Text style={{ color: "rgba(255,255,255,0.8)" }}>
              Phân tích giá thuê bằng Machine Learning từ dữ liệu thực tế
            </Typography.Text>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button icon={<ReloadOutlined />} onClick={fetchAnalytics} loading={loading}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleTrain}
              loading={training}
              style={{ background: "#f97316", borderColor: "#f97316" }}
            >
              {training ? "Đang train..." : "Train Model từ DB"}
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
      ) : (
        <>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12 }}>
                <Statistic
                  title="Tổng mẫu dữ liệu"
                  value={analytics?.totalSamples || 0}
                  prefix={<DatabaseOutlined style={{ color: "#2563eb" }} />}
                  formatter={(v) => num.format(Number(v))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12 }}>
                <Statistic
                  title="Độ chính xác Model (R²)"
                  value={analytics?.modelAccuracy || 0}
                  suffix="%"
                  prefix={<CheckCircleOutlined style={{ color: "#16a34a" }} />}
                  valueStyle={{ color: (analytics?.modelAccuracy || 0) > 70 ? "#16a34a" : "#f97316" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12 }}>
                <Statistic
                  title="Loại BĐS phân tích"
                  value={chartData.length}
                  prefix={<ExperimentOutlined style={{ color: "#7c3aed" }} />}
                  suffix={`/ 5`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="borderless" style={{ borderRadius: 12 }}>
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
            <Row gutter={[16, 16]} align="bottom">
              <Col xs={24} sm={12} md={5}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Loại BĐS</label>
                <Select
                  style={{ width: "100%" }}
                  value={predictForm.propertyType}
                  onChange={(v) => setPredictForm((p) => ({ ...p, propertyType: v }))}
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
              <Col xs={24} sm={12} md={4}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Số phòng</label>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  value={predictForm.rooms}
                  onChange={(v) => setPredictForm((p) => ({ ...p, rooms: v || 0 }))}
                />
              </Col>
              <Col xs={24} sm={12} md={5}>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#666" }}>Khu vực</label>
                <Input
                  value={predictForm.location}
                  onChange={(e) => setPredictForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="VD: Quận 7, Thủ Đức..."
                />
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Button
                  type="primary"
                  icon={<ExperimentOutlined />}
                  onClick={handlePredict}
                  loading={predicting}
                  block
                  size="large"
                >
                  Dự đoán
                </Button>
              </Col>
              <Col xs={24} sm={12} md={3}>
                {predicting ? (
                  <Spin />
                ) : predictResult ? (
                  <div style={{ textAlign: "center", padding: "4px 0" }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Giá dự đoán</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#2563eb" }}>
                      {money.format(predictResult.predictedPrice)}
                    </div>
                    <div style={{ fontSize: 11, color: "#999" }}>/tháng</div>
                  </div>
                ) : null}
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default AiAnalyticsPage;

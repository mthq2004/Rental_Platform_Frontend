import { useEffect, useState, useCallback } from "react";
import {
  BellOutlined,
  GlobalOutlined,
  LockOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
  DollarOutlined,
  EditOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  Table,
  Tag,
  Modal,
  InputNumber,
  message,
  Spin,
} from "antd";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { useTheme } from "../../contexts/ThemeContext";
import http from "../../utils/api";
import "../complaints/disputes.css";

const { Title, Text } = Typography;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  room: "Phòng trọ",
  house: "Nhà nguyên căn",
  apartment: "Căn hộ",
  office: "Văn phòng",
  land: "Đất nền",
};

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  // Listing Fee Configuration States
  const [configs, setConfigs] = useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [submittingConfig, setSubmittingConfig] = useState(false);
  const [seedingConfigs, setSeedingConfigs] = useState(false);

  const [form] = Form.useForm();

  // Fetch listing fee configurations
  const fetchConfigs = useCallback(async () => {
    setLoadingConfigs(true);
    try {
      const res = await http.get("/estate/listing-fee/configs");
      if (Array.isArray(res.data)) {
        setConfigs(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch listing fee configs:", err);
      message.error("Không thể lấy cấu hình phí đăng tin.");
    } finally {
      setLoadingConfigs(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Seed default configs
  const handleSeedConfigs = async () => {
    setSeedingConfigs(true);
    try {
      const res = await http.post("/estate/listing-fee/admin/seed");
      message.success(res.data?.message || "Đã khởi tạo cấu hình phí mặc định thành công.");
      fetchConfigs();
    } catch (err: any) {
      console.error("Failed to seed configs:", err);
      message.error(err.response?.data?.message || "Khởi tạo thất bại.");
    } finally {
      setSeedingConfigs(false);
    }
  };

  // Open Edit Config Modal
  const handleOpenEdit = (record: any) => {
    setEditingConfig(record);
    form.setFieldsValue({
      feeAmount: Number(record.feeAmount),
      durationDays: record.durationDays,
      freeTrialDays: record.freeTrialDays,
      isActive: record.isActive,
      description: record.description,
    });
    setIsEditModalOpen(true);
  };

  // Submit Edited Config
  const handleEditSubmit = async () => {
    if (!editingConfig) return;

    try {
      const values = await form.validateFields();
      setSubmittingConfig(true);

      await http.put(`/estate/listing-fee/admin/config/${editingConfig.id}`, values);
      message.success(`Đã cập nhật cấu hình phí cho ${PROPERTY_TYPE_LABELS[editingConfig.propertyType] || editingConfig.propertyType} thành công.`);
      setIsEditModalOpen(false);
      setEditingConfig(null);
      fetchConfigs();
    } catch (err: any) {
      console.error("Edit failed:", err);
      message.error(err.response?.data?.message || "Cập nhật cấu hình thất bại.");
    } finally {
      setSubmittingConfig(false);
    }
  };

  const columns = [
    {
      title: "Loại bất động sản",
      dataIndex: "propertyType",
      key: "propertyType",
      render: (text: string) => (
        <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>
          {PROPERTY_TYPE_LABELS[text] || text}
        </span>
      ),
    },
    {
      title: "Phí gia hạn (VND)",
      dataIndex: "feeAmount",
      key: "feeAmount",
      render: (val: any) => (
        <Text strong style={{ color: "var(--dm-title)" }}>
          {Number(val).toLocaleString("vi-VN")} đ
        </Text>
      ),
    },
    {
      title: "Thời hạn hiển thị",
      dataIndex: "durationDays",
      key: "durationDays",
      render: (val: number) => (
        <Tag color="blue" style={{ borderRadius: 4 }}>
          {val} ngày
        </Tag>
      ),
    },
    {
      title: "Dùng thử miễn phí",
      dataIndex: "freeTrialDays",
      key: "freeTrialDays",
      render: (val: number) => (
        <Tag color="green" style={{ borderRadius: 4 }}>
          {val} ngày
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (val: boolean) => (
        <Tag
          style={
            val
              ? { background: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", border: 0 }
              : { background: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", border: 0 }
          }
        >
          {val ? "Hoạt động" : "Tạm khóa"}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <span style={{ fontSize: 13, color: "var(--dm-subtitle)" }}>
          {text || "—"}
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EditOutlined style={{ color: "#2563eb" }} />}
          onClick={() => handleOpenEdit(record)}
        />
      ),
    },
  ];

  return (
    <div className="dispute-management-page">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>Cài đặt hệ thống</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Quản lý các thông số cấu hình chung, giao diện quản trị sáng/tối và cấu hình phí hiển thị đăng tin của hệ thống.</Text>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-refresh-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SettingOutlined style={{ color: "var(--dm-refresh-text)", fontSize: 20, margin: "auto" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>Chế độ hiện tại</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "var(--dm-title)", lineHeight: 1.2 }}>{theme === "dark" ? "Tối" : "Sáng"}</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Listing Fee Configuration Card */}
          <Card
            variant="borderless"
            style={{ borderRadius: 8, border: "1px solid var(--dm-border)", marginBottom: 24 }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DollarOutlined style={{ fontSize: 18, color: "var(--dm-refresh-text)" }} />
                <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>Cấu hình phí tin đăng</span>
              </div>
            }
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchConfigs}
                  loading={loadingConfigs}
                  size="small"
                >
                  Làm mới
                </Button>
                {configs.length === 0 && (
                  <Button
                    type="primary"
                    onClick={handleSeedConfigs}
                    loading={seedingConfigs}
                    size="small"
                  >
                    Khởi tạo cấu hình mặc định
                  </Button>
                )}
              </Space>
            }
          >
            <Spin spinning={loadingConfigs}>
              <Table
                dataSource={configs}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="middle"
                locale={{ emptyText: "Chưa có cấu hình phí đăng tin. Vui lòng bấm 'Khởi tạo cấu hình mặc định'." }}
              />
            </Spin>
          </Card>

          {/* General Settings Card */}
          <Card
            variant="borderless"
            style={{ borderRadius: 8, border: "1px solid var(--dm-border)", marginBottom: 24 }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GlobalOutlined style={{ fontSize: 18, color: "var(--dm-refresh-text)" }} />
                <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>Thiết lập chung</span>
              </div>
            }
          >
            <Form layout="vertical" requiredMark={false}>
              <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Tên cổng quản trị</span>}>
                <Input placeholder="Rental Platform Admin" defaultValue="Rental Platform Admin" size="large" />
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Múi giờ mặc định</span>}>
                <Select
                  defaultValue="Asia/Ho_Chi_Minh"
                  size="large"
                  options={[
                    { label: "Asia/Ho_Chi_Minh (GMT+7)", value: "Asia/Ho_Chi_Minh" },
                    { label: "UTC", value: "UTC" },
                  ]}
                />
              </Form.Item>
              <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Ngôn ngữ</span>}>
                <Select
                  defaultValue="vi"
                  size="large"
                  options={[
                    { label: "Tiếng Việt", value: "vi" },
                    { label: "English", value: "en" },
                  ]}
                />
              </Form.Item>
            </Form>
          </Card>

          {/* Notifications Card */}
          <Card
            variant="borderless"
            style={{ borderRadius: 8, border: "1px solid var(--dm-border)" }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BellOutlined style={{ fontSize: 18, color: "var(--dm-refresh-text)" }} />
                <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>Thông báo</span>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Thông báo tài khoản bị ban / mở ban", defaultChecked: true },
                { label: "Thông báo thay đổi trạng thái eKYC", defaultChecked: true },
                { label: "Cảnh báo đăng nhập đáng ngờ", defaultChecked: false },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed var(--dm-dashed)" }}>
                  <Text style={{ color: "var(--dm-label)", fontSize: 14 }}>{item.label}</Text>
                  <Switch defaultChecked={item.defaultChecked} />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Appearance Card */}
          <Card
            variant="borderless"
            style={{ borderRadius: 8, border: "1px solid var(--dm-border)", marginBottom: 24 }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {theme === "dark" ? <MoonOutlined style={{ fontSize: 18, color: "var(--dm-refresh-text)" }} /> : <SunOutlined style={{ fontSize: 18, color: "var(--dm-refresh-text)" }} />}
                <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>Giao diện</span>
              </div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed var(--dm-dashed)" }}>
                <Space>
                  <SunOutlined style={{ color: "#f59e0b" }} />
                  <Text style={{ color: "var(--dm-label)" }}>Sáng</Text>
                </Space>
                <Button
                  onClick={() => setTheme("light")}
                  disabled={theme === "light"}
                  style={theme === "light"
                    ? { background: "var(--dm-tag-green-bg)", borderColor: "transparent", color: "var(--dm-tag-green-text)", borderRadius: 6, fontWeight: 500 }
                    : { borderRadius: 6 }}
                >
                  {theme === "light" ? "Đang dùng" : "Chọn"}
                </Button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed var(--dm-dashed)" }}>
                <Space>
                  <MoonOutlined style={{ color: "#6366f1" }} />
                  <Text style={{ color: "var(--dm-label)" }}>Tối</Text>
                </Space>
                <Button
                  onClick={() => setTheme("dark")}
                  disabled={theme === "dark"}
                  style={theme === "dark"
                    ? { background: "var(--dm-tag-green-bg)", borderColor: "transparent", color: "var(--dm-tag-green-text)", borderRadius: 6, fontWeight: 500 }
                    : { borderRadius: 6 }}
                >
                  {theme === "dark" ? "Đang dùng" : "Chọn"}
                </Button>
              </div>

              <Divider style={{ margin: "8px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ color: "var(--dm-label)" }}>Toggle nhanh</Text>
                <ThemeToggle />
              </div>
            </div>
          </Card>

          {/* Security Card */}
          <Card
            variant="borderless"
            style={{ borderRadius: 8, border: "1px solid var(--dm-border)" }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LockOutlined style={{ fontSize: 18, color: "var(--dm-refresh-text)" }} />
                <span style={{ fontWeight: 600, color: "var(--dm-title)" }}>Bảo mật</span>
              </div>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <Button block size="large" style={{ borderRadius: 8, fontWeight: 500 }}>Đổi mật khẩu tài khoản hiện tại</Button>
              <Button block size="large" style={{ borderRadius: 8, fontWeight: 500 }}>Xem lịch sử đăng nhập</Button>
              <Button block danger size="large" style={{ borderRadius: 8, fontWeight: 500 }}>
                Đăng xuất khỏi tất cả phiên
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Edit Config Modal */}
      <Modal
        title={
          <div style={{ fontWeight: 600, fontSize: 16, borderBottom: "1px solid var(--dm-border)", paddingBottom: 12 }}>
            Cấu hình phí: {editingConfig ? PROPERTY_TYPE_LABELS[editingConfig.propertyType] : ""}
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingConfig(null);
        }}
        onOk={handleEditSubmit}
        confirmLoading={submittingConfig}
        okText="Lưu thay đổi"
        cancelText="Hủy bỏ"
        width={450}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="feeAmount"
            label="Phí gia hạn (VND)"
            rules={[{ required: true, message: "Vui lòng nhập phí gia hạn" }]}
          >
            <InputNumber
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "") as any}
              style={{ width: "100%" }}
              min={0 as number}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="durationDays"
            label="Thời gian hiển thị (Ngày)"
            rules={[{ required: true, message: "Vui lòng nhập số ngày hiển thị" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} size="large" />
          </Form.Item>

          <Form.Item
            name="freeTrialDays"
            label="Số ngày dùng thử miễn phí"
            rules={[{ required: true, message: "Vui lòng nhập số ngày dùng thử" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} size="large" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái kích hoạt"
            valuePropName="checked"
          >
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm khóa" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} placeholder="Mô tả cho loại phí này..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;

import {
  BellOutlined,
  GlobalOutlined,
  LockOutlined,
  MoonOutlined,
  SettingOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Button, Card, Col, Divider, Form, Input, Row, Select, Space, Switch, Typography } from "antd";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { useTheme } from "../../contexts/ThemeContext";
import "../complaints/disputes.css";

const { Title, Text } = Typography;

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="dispute-management-page">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>Cài đặt hệ thống</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Trung tâm cấu hình cho giao diện quản trị. Chế độ sáng/tối được lưu localStorage và đồng bộ toàn trang.</Text>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-refresh-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SettingOutlined style={{ color: "var(--dm-refresh-text)", fontSize: 20 }} />
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
    </div>
  );
};

export default SettingsPage;

import { BellOutlined, GlobalOutlined, LockOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Form, Input, Row, Select, Space, Switch, Typography } from "antd";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { useTheme } from "../../contexts/ThemeContext";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="admin-page-shell">
      <Card className="hero-surface" variant="borderless">
        <Typography.Title level={2} style={{ marginBottom: 0 }}>
          Cài đặt hệ thống
        </Typography.Title>
        <Typography.Text type="secondary">
          Trung tâm cấu hình cho giao diện quản trị. Chế độ sáng/tối được lưu localStorage và đồng bộ toàn trang.
        </Typography.Text>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card variant="borderless" title={<Space><GlobalOutlined /> Thiết lập chung</Space>}>
            <Form layout="vertical" requiredMark={false}>
              <Form.Item label="Tên cổng quản trị">
                <Input placeholder="Rental Platform Admin" defaultValue="Rental Platform Admin" />
              </Form.Item>
              <Form.Item label="Múi giờ mặc định">
                <Select
                  defaultValue="Asia/Ho_Chi_Minh"
                  options={[
                    { label: "Asia/Ho_Chi_Minh (GMT+7)", value: "Asia/Ho_Chi_Minh" },
                    { label: "UTC", value: "UTC" },
                  ]}
                />
              </Form.Item>
              <Form.Item label="Ngôn ngữ">
                <Select
                  defaultValue="vi"
                  options={[
                    { label: "Tiếng Việt", value: "vi" },
                    { label: "English", value: "en" },
                  ]}
                />
              </Form.Item>
            </Form>
          </Card>

          <Card variant="borderless" title={<Space><BellOutlined /> Thông báo</Space>} style={{ marginTop: 16 }}>
            <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
              <Row justify="space-between" align="middle">
                <Typography.Text>Thông báo tài khoản bị ban / mở ban</Typography.Text>
                <Switch defaultChecked />
              </Row>
              <Row justify="space-between" align="middle">
                <Typography.Text>Thông báo thay đổi trạng thái eKYC</Typography.Text>
                <Switch defaultChecked />
              </Row>
              <Row justify="space-between" align="middle">
                <Typography.Text>Cảnh báo đăng nhập đáng ngờ</Typography.Text>
                <Switch />
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card variant="borderless" title="Giao diện">
            <Space orientation="vertical" style={{ width: "100%" }} size="middle">
              <Row justify="space-between" align="middle">
                <Space>
                  <SunOutlined />
                  <Typography.Text>Sáng</Typography.Text>
                </Space>
                <Button onClick={() => setTheme("light")} disabled={theme === "light"}>
                  Chọn
                </Button>
              </Row>

              <Row justify="space-between" align="middle">
                <Space>
                  <MoonOutlined />
                  <Typography.Text>Tối</Typography.Text>
                </Space>
                <Button onClick={() => setTheme("dark")} disabled={theme === "dark"}>
                  Chọn
                </Button>
              </Row>

              <Divider style={{ margin: "8px 0" }} />
              <Row justify="space-between" align="middle">
                <Typography.Text strong>Toggle nhanh</Typography.Text>
                <ThemeToggle />
              </Row>
            </Space>
          </Card>

          <Card variant="borderless" title={<Space><LockOutlined /> Bảo mật</Space>} style={{ marginTop: 16 }}>
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Button block>Đổi mật khẩu tài khoản hiện tại</Button>
              <Button block>Xem lịch sử đăng nhập</Button>
              <Button block danger>
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

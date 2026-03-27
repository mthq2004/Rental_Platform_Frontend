import React from "react";
import { Card, Col, Row, Statistic, Typography } from "antd";
import { HomeOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";

const DashboardPage: React.FC = () => {
  return (
    <div className="admin-page-shell">
      <Card className="hero-surface" variant="borderless">
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Bảng điều khiển
        </Typography.Title>
        <Typography.Text type="secondary">Theo dõi nhanh hoạt động quản trị và chất lượng tài khoản trên hệ thống.</Typography.Text>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic title="Tài khoản đang hoạt động" value={128} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic title="Bất động sản chờ duyệt" value={42} prefix={<HomeOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless">
            <Statistic title="eKYC đã xác thực" value={91} prefix={<SafetyCertificateOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;

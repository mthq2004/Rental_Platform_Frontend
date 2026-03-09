"use client";

import { Card, Form, Input, Button, Upload, DatePicker, Row, Col } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";

export default function KycPage() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log(values);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card title="Xác thực danh tính (KYC)">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="idNumber"
                label="Số CCCD"
                rules={[{ required: true }]}
              >
                <Input placeholder="0123456789" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dob"
            label="Ngày sinh"
            rules={[{ required: true }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="front"
                label="Ảnh CCCD mặt trước"
                valuePropName="fileList"
              >
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="back"
                label="Ảnh CCCD mặt sau"
                valuePropName="fileList"
              >
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="selfie"
            label="Ảnh selfie"
            valuePropName="fileList"
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload Selfie</Button>
            </Upload>
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Gửi xác thực
          </Button>
        </Form>
      </Card>
    </div>
  );
}
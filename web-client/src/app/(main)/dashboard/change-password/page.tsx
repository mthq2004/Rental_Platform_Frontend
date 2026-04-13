"use client";

import React from "react";
import { Form, Input, Button, Alert, App } from "antd";
import { LockOutlined, KeyOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { changePassword } from "@/stores/slices/auth.slice";

export default function ChangePasswordPage() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { loading, authProvider } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();

  const isOAuthUser = authProvider === "google" || authProvider === "facebook";

  const handleSubmit = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      form.setFields([
        {
          name: "confirmPassword",
          errors: ["Mật khẩu xác nhận không khớp"],
        },
      ]);
      return;
    }

    try {
      await dispatch(
        changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      ).unwrap();
      message.success("Đổi mật khẩu thành công!");
      form.resetFields();
    } catch (err: any) {
      message.error(
        typeof err === "string" ? err : "Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại."
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col items-center">
      {/* Phần Header - Canh giữa Text */}
      <div className="text-center w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đổi mật khẩu</h2>
        <p className="text-gray-500 text-sm m-0">
          Bảo vệ tài khoản của bạn bằng một mật khẩu mạnh
        </p>
      </div>

      {/* Đường gạch ngang phân cách */}
      <hr className="my-5 border-t border-gray-200 w-full" />

      {/* Phần Nội dung - Bọc trong flex để đưa ra giữa */}
      <div className="w-full flex justify-center">
        {isOAuthUser ? (
          <Alert
            type="info"
            icon={<InfoCircleOutlined className="text-lg" />}
            showIcon
            title={
              <span className="font-semibold text-base">
                {authProvider === "google" ? "Tài khoản Google" : "Tài khoản Facebook"}
              </span>
            }
            description={
              <span className="text-gray-600 block mt-1">
                Bạn đã đăng nhập qua {authProvider === "google" ? "Google" : "Facebook"}. 
                Tài khoản đăng nhập qua mạng xã hội không thể đổi mật khẩu tại đây. 
                Vui lòng quản lý mật khẩu thông qua tài khoản {authProvider === "google" ? "Google" : "Facebook"} của bạn.
              </span>
            }
            // Khối alert giới hạn độ rộng và canh giữa
            className="w-full max-w-md rounded-xl border-none bg-blue-50 p-5 shadow-sm text-left"
          />
        ) : (
          <div className="w-full max-w-md">
            
            <Form 
              form={form} 
              layout="vertical" 
              onFinish={handleSubmit}
              className="w-full"
            >
              <Form.Item
                label={<span className="font-medium text-gray-700">Mật khẩu hiện tại</span>}
                name="currentPassword"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
                ]}
              >
                <Input.Password
                  prefix={<KeyOutlined className="text-gray-400" />}
                  placeholder="Nhập mật khẩu hiện tại"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-gray-700">Mật khẩu mới</span>}
                name="newPassword"
                rules={[
                  { required: true, message: "Vui lòng nhập mật khẩu mới" },
                  { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                label={<span className="font-medium text-gray-700">Xác nhận mật khẩu mới</span>}
                name="confirmPassword"
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập lại mật khẩu mới"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              {/* Khối gợi ý */}
              <div className="mt-6 mb-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-800 text-left border border-blue-100">
                <strong className="block mb-2 text-blue-900">Gợi ý mật khẩu mạnh:</strong>
                <ul className="ml-5 list-disc space-y-1 mb-0 text-blue-700">
                  <li>Ít nhất 8 ký tự</li>
                  <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                  <li>Không dùng thông tin cá nhân dễ đoán</li>
                </ul>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full rounded-lg h-12 font-medium text-base"
                icon={<LockOutlined />}
              >
                Xác nhận đổi mật khẩu
              </Button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
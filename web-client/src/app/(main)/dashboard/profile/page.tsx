"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Radio,
  DatePicker,
  Avatar,
  Row,
  Col,
  App,
  Spin,
  Modal,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PhoneOutlined,
  SafetyOutlined,
  CameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getProfileUser,
  updateProfile,
  updateAvatar,
  requestPhoneUpdateOtp,
  verifyPhoneUpdateOtp,
} from "@/stores/slices/auth.slice";

const GENDER_MAP: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

export default function ProfilePage() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  // OTP states
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPhone = Form.useWatch("phone", form);
  const phoneChanged = currentPhone !== user?.phone;

  useEffect(() => {
    dispatch(getProfileUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
      });
      setPhoneVerified(false);
    }
  }, [user]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetOtpState = useCallback(() => {
    setOtp("");
    setOtpModalOpen(false);
    setPendingPhone("");
    setCountdown(0);
  }, []);

  // Send OTP to the new phone
  const handleSendOtp = async (phone: string) => {
    if (!phone || !/^[0-9]{9,11}$/.test(phone)) {
      return message.error("Số điện thoại không hợp lệ");
    }
    try {
      setOtpLoading(true);
      await dispatch(requestPhoneUpdateOtp(phone)).unwrap();
      setPendingPhone(phone);
      setOtp("");
      setCountdown(120);
      setOtpModalOpen(true);
      message.success("Mã OTP đã được gửi!");
    } catch (err: any) {
      message.error(err || "Gửi OTP thất bại");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    try {
      setOtpLoading(true);
      await dispatch(
        verifyPhoneUpdateOtp({ phone: pendingPhone, otp })
      ).unwrap();
      message.success("Xác thực thành công!");
      setPhoneVerified(true);
      setOtpModalOpen(false);
    } catch (err: any) {
      message.error(err || "Mã OTP không chính xác");
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      setOtpLoading(true);
      await dispatch(requestPhoneUpdateOtp(pendingPhone)).unwrap();
      setCountdown(120);
      setOtp("");
      message.success("Đã gửi lại OTP!");
    } catch (err: any) {
      message.error(err || "Gửi lại thất bại");
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "");
    if (digit.length > 1) return;
    const arr = otp.split("");
    while (arr.length < 6) arr.push("");
    arr[index] = digit;
    setOtp(arr.join(""));
    if (digit && index < 5) {
      document.getElementById(`profile-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`profile-otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setOtp(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    document.getElementById(`profile-otp-${focusIdx}`)?.focus();
  };

  // Profile submit
  const handleSubmit = async (values: any) => {
    const phoneChanged = values.phone !== user?.phone;

    if (phoneChanged && !phoneVerified) {
      handleSendOtp(values.phone);
      return;
    }

    try {
      const payload = {
        fullName: values.fullName,
        phone: phoneChanged ? values.phone : user?.phone,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth).format("YYYY-MM-DD")
          : undefined,
      };

      await dispatch(updateProfile(payload)).unwrap();
      message.success("Cập nhật thành công");
      setEditing(false);
      setPhoneVerified(false);
      dispatch(getProfileUser());
    } catch (err: any) {
      message.error(err || "Cập nhật thất bại");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      message.error("Chỉ chấp nhận file ảnh JPEG, PNG hoặc WEBP");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error("Kích thước ảnh tối đa 5MB");
      return;
    }

    try {
      setAvatarUploading(true);
      await dispatch(updateAvatar(file)).unwrap();
      message.success("Cập nhật avatar thành công");
      dispatch(getProfileUser());
    } catch (err: any) {
      message.error(err || "Cập nhật avatar thất bại");
    } finally {
      setAvatarUploading(false);
      // Reset input to allow re-uploading same file
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setPhoneVerified(false);
    resetOtpState();
    form.resetFields();
  };

  if (!user && loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6">

      {/* Phần 1: Header - Avatar & Tên */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Tooltip title="Nhấn để thay đổi avatar">
            <div className="relative cursor-pointer group" onClick={handleAvatarClick}>
              <Avatar
                size={72}
                src={user?.avatarUrl}
                icon={avatarUploading ? <LoadingOutlined /> : <UserOutlined />}
                className="shadow-sm group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraOutlined className="text-white text-lg" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </Tooltip>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 m-0">
              {user?.fullName || "Chưa cập nhật"}
            </h2>
            <p className="text-gray-500 text-sm mt-1 mb-0">
              Quản lý thông tin cá nhân
            </p>
          </div>
        </div>

        {!editing ? (
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditing(true)}
            size="large"
            className="rounded-lg"
          >
            Chỉnh sửa
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button icon={<CloseOutlined />} onClick={cancelEdit} size="large" className="rounded-lg">
              Hủy
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
              size="large"
              className="rounded-lg"
            >
              Lưu
            </Button>
          </div>
        )}
      </div>

      {/* Đường gạch ngang phân cách */}
      <hr className="my-8 border-t border-gray-200" />

      {/* Phần 2: Thông tin cá nhân */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {!editing ? "Thông tin cá nhân" : "Chỉnh sửa thông tin"}
        </h3>

        {!editing ? (
          /* Chế độ xem thông tin */
          <Row gutter={[24, 32]}>
            <Col span={12}>
              <p className="text-gray-500 text-sm mb-1">Họ và tên</p>
              <p className="font-medium text-base text-gray-800">{user?.fullName || "-"}</p>
            </Col>

            <Col span={12}>
              <p className="text-gray-500 text-sm mb-1">Số điện thoại</p>
              <p className="font-medium text-base text-gray-800">{user?.phone || "-"}</p>
            </Col>

            <Col span={12}>
              <p className="text-gray-500 text-sm mb-1">Giới tính</p>
              <p className="font-medium text-base text-gray-800">
                {GENDER_MAP[user?.gender || ""] || "-"}
              </p>
            </Col>

            <Col span={12}>
              <p className="text-gray-500 text-sm mb-1">Ngày sinh</p>
              <p className="font-medium text-base text-gray-800">
                {user?.dateOfBirth
                  ? dayjs(user.dateOfBirth).format("DD/MM/YYYY")
                  : "-"}
              </p>
            </Col>
          </Row>
        ) : (
          /* Chế độ chỉnh sửa thông tin */
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="max-w-2xl"
          >
            <Form.Item
              label={<span className="font-medium text-gray-700">Họ và tên</span>}
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} size="large" className="rounded-lg" />
            </Form.Item>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  label={<span className="font-medium text-gray-700">Số điện thoại</span>}
                  name="phone"
                  rules={[
                    { pattern: /^[0-9]{9,11}$/, message: "Số điện thoại không hợp lệ" },
                  ]}
                >
                  <Input
                    size="large"
                    className="rounded-lg"
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    suffix={
                      phoneChanged && !phoneVerified ? (
                        <Button
                          type="link"
                          size="small"
                          loading={otpLoading}
                          className="!p-0 !h-auto text-blue-600"
                          onClick={() => {
                            const phone = form.getFieldValue("phone");
                            handleSendOtp(phone);
                          }}
                        >
                          Xác thực
                        </Button>
                      ) : phoneChanged && phoneVerified ? (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                          <SafetyOutlined /> Đã xác thực
                        </span>
                      ) : null
                    }
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label={<span className="font-medium text-gray-700">Ngày sinh</span>} name="dateOfBirth">
                  <DatePicker
                    className="w-full rounded-lg"
                    format="DD/MM/YYYY"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label={<span className="font-medium text-gray-700">Giới tính</span>} name="gender">
              <Radio.Group className="flex gap-4 mt-1">
                <Radio value="male">Nam</Radio>
                <Radio value="female">Nữ</Radio>
                <Radio value="other">Khác</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        )}
      </div>

      {/* OTP Verification Modal */}
      <Modal
        open={otpModalOpen}
        onCancel={() => {
          resetOtpState();
          setPhoneVerified(false);
        }}
        footer={null}
        centered
        width={400}
        destroyOnHidden
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <SafetyOutlined className="text-2xl text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Xác thực số điện thoại
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Mã OTP đã gửi đến số <strong>{pendingPhone}</strong>
          </p>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`profile-otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ""}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                onFocus={(e) => e.target.select()}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-gray-50 hover:bg-white"
              />
            ))}
          </div>

          {/* Countdown / Resend */}
          <div className="text-sm text-gray-500 mb-5">
            {countdown > 0 ? (
              <span>
                Gửi lại OTP sau{" "}
                <span className="text-blue-500 font-semibold">{countdown}s</span>
              </span>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-medium"
              >
                Gửi lại OTP
              </button>
            )}
          </div>

          <Button
            type="primary"
            size="large"
            block
            loading={otpLoading}
            disabled={otp.length !== 6}
            onClick={handleVerifyOtp}
            className="!rounded-lg !h-12"
          >
            Xác nhận
          </Button>
        </div>
      </Modal>
    </div>
  );
}
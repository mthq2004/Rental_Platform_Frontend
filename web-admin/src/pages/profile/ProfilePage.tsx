import {
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  EditOutlined,
  LockOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  Row,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  getProfileUser,
  updateProfileUser,
  updateAvatarUser,
} from "../../stores/slices/auth.slice";
import "../complaints/disputes.css";

const { Title, Text } = Typography;

const ProfilePage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!user) dispatch(getProfileUser());
  }, [dispatch, user]);

  useEffect(() => {
    if (user && isEditing) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [user, isEditing, form]);

  const beforeUpload = async (file: File) => {
    try {
      setAvatarLoading(true);
      await dispatch(updateAvatarUser(file)).unwrap();
      messageApi.success("Cập nhật ảnh đại diện thành công");
      dispatch(getProfileUser());
    } catch {
      messageApi.error("Không thể cập nhật ảnh đại diện");
    } finally {
      setAvatarLoading(false);
    }
    return false;
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
    form.setFieldsValue(user);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(updateProfileUser(values)).unwrap();
      messageApi.success("Đã lưu thay đổi");
      setIsEditing(false);
    } catch {
      messageApi.error("Vui lòng kiểm tra lại thông tin");
    }
  };

  const roleLabel = user?.role === "admin" ? "Quản trị viên" : "Người dùng";
  const initials = user?.fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <div className="dispute-resolution-page">
      {contextHolder}

      {/* Header Tags */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{
          background: user?.role === "admin" ? "#e0e7ff" : "#dbeafe",
          color: user?.role === "admin" ? "#3730a3" : "#1e40af",
          padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <SafetyCertificateOutlined style={{ fontSize: 12 }} />
          {roleLabel.toUpperCase()}
        </span>
      </div>

      {/* Title Row */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>Hồ sơ cá nhân</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Xem và quản lý thông tin tài khoản của bạn.</Text>
        </Col>
        <Col>
          {!isEditing ? (
            <Button
              icon={<EditOutlined />}
              size="large"
              onClick={() => setIsEditing(true)}
              style={{ borderRadius: 8, fontWeight: 500, borderColor: "var(--dm-refresh-border)", color: "var(--dm-refresh-text)", background: "var(--dm-refresh-bg)" }}
            >
              Chỉnh sửa
            </Button>
          ) : (
            <Space size={12}>
              <Button size="large" onClick={handleCancel} style={{ borderRadius: 8 }}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
                onClick={handleSave}
                style={{ borderRadius: 8, fontWeight: 500, background: "#4f46e5" }}
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </Space>
          )}
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Left Column — Identity Card */}
        <Col xs={24} lg={8}>
          <Card className="dispute-action-card" variant="borderless" style={{ textAlign: "center" }}>
            {/* Avatar */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                border: "3px solid #e5e7eb", overflow: "hidden",
                background: "var(--dm-tag-gray-bg)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {user?.avatarUrl ? (
                  <>
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }}
                      onClick={() => setIsPreviewOpen(true)}
                    />
                    <Image
                      src={user.avatarUrl}
                      alt="avatar-preview"
                      style={{ display: "none" }}
                      preview={{
                        open: isPreviewOpen,
                        onOpenChange: (open) => setIsPreviewOpen(open),
                      }}
                    />
                  </>
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700, color: "var(--dm-refresh-text)", userSelect: "none" }}>
                    {initials || <UserOutlined />}
                  </span>
                )}
                {avatarLoading && (
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "rgba(0,0,0,0.35)", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff", fontSize: 12 }}>...</span>
                  </div>
                )}
              </div>
              <Upload showUploadList={false} accept="image/*" beforeUpload={beforeUpload}>
                <button
                  title="Đổi ảnh đại diện"
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#4f46e5", border: "2px solid #fff", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  <CameraOutlined style={{ fontSize: 12 }} />
                </button>
              </Upload>
            </div>

            {/* Name & Role */}
            <Title level={4} style={{ margin: "0 0 8px", color: "var(--dm-title)" }}>{user?.fullName || "—"}</Title>
            <span style={{
              background: "var(--dm-refresh-bg)", color: "var(--dm-refresh-text)", padding: "4px 14px",
              borderRadius: 16, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <SafetyCertificateOutlined style={{ fontSize: 10 }} />
              {roleLabel}
            </span>

            {/* Divider */}
            <div style={{ height: 1, background: "var(--dm-border)", margin: "20px 0 16px" }} />

            {/* Quick meta list */}
            <div style={{ textAlign: "left" }}>
              {[
                { icon: <MailOutlined />, value: user?.email },
                { icon: <PhoneOutlined />, value: user?.phone },
                { icon: <LockOutlined />, value: roleLabel, muted: true },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px dashed var(--dm-dashed)" }}>
                  <span style={{ fontSize: 13, color: "var(--dm-subtitle)", minWidth: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: item.muted ? "#6b7280" : "#111827", fontStyle: item.muted ? "italic" : "normal" }}>
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right Column — Detail Panel */}
        <Col xs={24} lg={16}>
          <Card className="dispute-info-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <IdcardOutlined style={{ fontSize: 20, color: "var(--dm-refresh-text)" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Thông tin tài khoản</Title>
              <Text style={{ color: "var(--dm-subtitle)", fontSize: 12, marginLeft: "auto" }}>
                {isEditing ? "Đang chỉnh sửa — điền thông tin bên dưới" : "Xem và quản lý thông tin của bạn"}
              </Text>
            </div>

            {!isEditing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                {[
                  { label: "Họ và tên", value: user?.fullName },
                  { label: "Địa chỉ Email", value: user?.email },
                  { label: "Số điện thoại", value: user?.phone },
                  { label: "Vai trò hệ thống", value: roleLabel },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "16px 0", borderBottom: "1px dashed var(--dm-dashed)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 15, color: "var(--dm-title)", fontWeight: 500 }}>{item.value || "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 4 }}>
                <Row gutter={[24, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="fullName"
                      label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Họ và tên</span>}
                    >
                      <Input size="large" prefix={<UserOutlined style={{ color: "var(--dm-input-icon)" }} />} placeholder="Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="email"
                      label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Email</span>}
                      rules={[{ type: "email", message: "Email không hợp lệ" }]}
                    >
                      <Input size="large" prefix={<MailOutlined style={{ color: "var(--dm-input-icon)" }} />} placeholder="email@congty.vn" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="phone"
                      label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Số điện thoại</span>}
                    >
                      <Input size="large" prefix={<PhoneOutlined style={{ color: "var(--dm-input-icon)" }} />} placeholder="0901 234 567" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={<span style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)" }}>Vai trò</span>}>
                      <Input size="large" value={roleLabel} disabled prefix={<LockOutlined style={{ color: "#bbb" }} />} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}

            {/* Security hint row */}
            {!isEditing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--dm-border)" }}>
                <LockOutlined style={{ fontSize: 13, color: "var(--dm-input-icon)" }} />
                <span style={{ fontSize: 12, color: "var(--dm-input-icon)" }}>
                  Thông tin được bảo mật và mã hóa theo tiêu chuẩn doanh nghiệp.
                </span>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
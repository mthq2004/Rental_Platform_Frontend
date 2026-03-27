import {
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  EditOutlined,
  CheckCircleFilled,
  LockOutlined,
} from "@ant-design/icons";
import {
  Col,
  Form,
  Image,
  Input,
  Row,
  Space,
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
    <div style={styles.pageWrapper}>
      {contextHolder}

      {/* Sidebar stripe */}
      <div style={styles.sidebar} />

      {/* Content */}
      <div style={styles.content}>

        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.breadcrumb}>Tài khoản</p>
            <h1 style={styles.pageTitle}>Hồ sơ cá nhân</h1>
          </div>
          {!isEditing ? (
            <button
              style={styles.btnOutline}
              onClick={() => setIsEditing(true)}
            >
              <EditOutlined style={{ fontSize: 13 }} />
              Chỉnh sửa
            </button>
          ) : (
            <Space size={12}>
              <button style={styles.btnGhost} onClick={handleCancel}>
                Hủy bỏ
              </button>
              <button
                style={styles.btnPrimary}
                onClick={handleSave}
                disabled={loading}
              >
                <SaveOutlined style={{ fontSize: 13 }} />
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </Space>
          )}
        </div>

        {/* Main grid */}
        <div style={styles.grid}>

          {/* Left column — identity card */}
          <div style={styles.identityCard}>
            {/* Avatar area */}
            <div style={styles.avatarSection}>
              <div style={styles.avatarRing}>
                {user?.avatarUrl ? (
                  <>
                    <img
                      src={user.avatarUrl}
                      alt="avatar"
                      style={styles.avatarImg}
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
                  <div style={styles.avatarFallback}>{initials || <UserOutlined />}</div>
                )}
                {avatarLoading && <div style={styles.avatarOverlay}><span style={{ color: "#fff", fontSize: 12 }}>...</span></div>}
              </div>
              <Upload showUploadList={false} accept="image/*" beforeUpload={beforeUpload}>
                <button style={styles.cameraBtn} title="Đổi ảnh đại diện">
                  <CameraOutlined style={{ fontSize: 12 }} />
                </button>
              </Upload>
            </div>

            {/* Name & role */}
            <div style={styles.identityInfo}>
              <h2 style={styles.userName}>{user?.fullName || "—"}</h2>
              <div style={styles.roleBadge}>
                <SafetyCertificateOutlined style={{ fontSize: 10 }} />
                {roleLabel}
              </div>
              {user?.phoneVerified && (
                <div style={styles.verifiedTag}>
                  <CheckCircleFilled style={{ fontSize: 11, color: "#16a34a" }} />
                  <span>Đã xác thực</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Quick meta list */}
            <div style={styles.metaList}>
              <MetaRow icon={<MailOutlined />} label={user?.email} />
              <MetaRow icon={<PhoneOutlined />} label={user?.phone} />
              <MetaRow icon={<LockOutlined />} label={roleLabel} muted />
            </div>
          </div>

          {/* Right column — detail panel */}
          <div style={styles.detailCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardLabel}>Thông tin tài khoản</span>
              <span style={styles.cardSublabel}>
                {isEditing ? "Đang chỉnh sửa — điền thông tin bên dưới" : "Xem và quản lý thông tin của bạn"}
              </span>
            </div>

            {!isEditing ? (
              <div style={styles.infoGrid}>
                <InfoField label="Họ và tên" value={user?.fullName} />
                <InfoField label="Địa chỉ Email" value={user?.email} />
                <InfoField label="Số điện thoại" value={user?.phone} />
                <InfoField label="Vai trò hệ thống" value={roleLabel} />
              </div>
            ) : (
              <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 4 }}>
                <Row gutter={[24, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="fullName"
                      label={<FieldLabel>Họ và tên</FieldLabel>}
                    >
                      <Input
                        size="large"
                        prefix={<UserOutlined style={styles.inputIcon} />}
                        style={styles.input}
                        placeholder="Nguyễn Văn A"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="email"
                      label={<FieldLabel>Email</FieldLabel>}
                      rules={[{ type: "email", message: "Email không hợp lệ" }]}
                    >
                      <Input
                        size="large"
                        prefix={<MailOutlined style={styles.inputIcon} />}
                        style={styles.input}
                        placeholder="email@congty.vn"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="phone"
                      label={<FieldLabel>Số điện thoại</FieldLabel>}
                    >
                      <Input
                        size="large"
                        prefix={<PhoneOutlined style={styles.inputIcon} />}
                        style={styles.input}
                        placeholder="0901 234 567"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={<FieldLabel>Vai trò</FieldLabel>}>
                      <Input
                        size="large"
                        value={roleLabel}
                        disabled
                        prefix={<LockOutlined style={{ color: "#bbb" }} />}
                        style={{ ...styles.input, backgroundColor: "#fafafa", color: "#aaa" }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            )}

            {/* Security hint row */}
            {!isEditing && (
              <div style={styles.securityRow}>
                <LockOutlined style={{ fontSize: 13, color: "#94a3b8" }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Thông tin được bảo mật và mã hóa theo tiêu chuẩn doanh nghiệp.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */

const MetaRow = ({ icon, label, muted }: { icon: React.ReactNode; label?: string; muted?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
    <span style={{ fontSize: 13, color: muted ? "var(--text-secondary)" : "var(--text-secondary)", minWidth: 16 }}>{icon}</span>
    <span style={{ fontSize: 13, color: muted ? "var(--text-secondary)" : "var(--text-primary)", fontStyle: muted ? "italic" : "normal" }}>
      {label || "—"}
    </span>
  </div>
);

const InfoField = ({ label, value }: { label: string; value?: string }) => (
  <div style={styles.infoField}>
    <span style={styles.infoLabel}>{label}</span>
    <span style={styles.infoValue}>{value || "—"}</span>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
    {children}
  </span>
);

/* ─── Styles ─── */

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    height: "100%",
    minHeight: "100%",
    background: "var(--bg)",
    display: "flex",
    overflow: "hidden",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  sidebar: {
    width: 4,
    minHeight: "100vh",
    background: "linear-gradient(180deg, #1e3a5f 0%, #2563eb 100%)",
    flexShrink: 0,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: "none",
    margin: "0 auto",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    padding: "48px 48px 48px",
  },
  pageHeader: {
    display: "flex",
    width: "100%",
    maxWidth: 1040,
    margin: "0 auto 40px",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  breadcrumb: {
    margin: 0,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--accent)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  pageTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  grid: {
    display: "grid",
    flex: 1,
    minHeight: 0,
    width: "100%",
    maxWidth: 1040,
    margin: "0 auto",
    gridTemplateColumns: "260px 1fr",
    gap: 24,
    alignItems: "start",
  },
  identityCard: {
    background: "var(--surface)",
    borderRadius: 16,
    border: "1px solid var(--border)",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
  },
  avatarSection: {
    position: "relative",
    marginBottom: 20,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: "50%",
    border: "3px solid var(--border)",
    overflow: "hidden",
    background: "var(--muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    cursor: "zoom-in",
  },
  avatarFallback: {
    fontSize: 28,
    fontWeight: 700,
    color: "#2563eb",
    userSelect: "none",
  },
  avatarOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#1e3a5f",
    border: "2px solid #fff",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    transition: "background 0.15s",
  },
  identityInfo: {
    textAlign: "center",
    width: "100%",
    marginBottom: 20,
  },
  userName: {
    margin: "0 0 8px",
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.3px",
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    background: "var(--muted)",
    color: "var(--accent)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "4px 12px",
    borderRadius: 100,
    marginBottom: 10,
  },
  verifiedTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    color: "#16a34a",
    fontWeight: 500,
  },
  divider: {
    width: "100%",
    height: 1,
    background: "var(--border)",
    margin: "4px 0 16px",
  },
  metaList: {
    width: "100%",
  },
  detailCard: {
    background: "var(--surface)",
    borderRadius: 16,
    border: "1px solid var(--border)",
    padding: "32px 36px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: "1px solid var(--border)",
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.2px",
  },
  cardSublabel: {
    fontSize: 12,
    color: "var(--text-secondary)",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 24px",
  },
  infoField: {
    padding: "16px 0",
    borderBottom: "1px solid var(--border)",
  },
  infoLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--text-secondary)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    color: "var(--text-primary)",
    fontWeight: 500,
  },
  securityRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
    paddingTop: 20,
    borderTop: "1px solid var(--border)",
  },
  input: {
    borderRadius: 10,
    background: "var(--muted)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
    fontSize: 14,
  },
  inputIcon: {
    color: "var(--text-secondary)",
    fontSize: 14,
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "#1e3a5f",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "9px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "background 0.15s",
  },
  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "transparent",
    color: "var(--text-primary)",
    border: "1.5px solid var(--border)",
    borderRadius: 10,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
  },
  btnGhost: {
    background: "transparent",
    border: "none",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    padding: "8px 12px",
  },
};

export default ProfilePage;
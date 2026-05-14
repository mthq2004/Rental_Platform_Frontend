import { useEffect, useState } from "react";
import { Avatar, Button, Card, Col, DatePicker, Descriptions, Image, Input, Modal, Row, Select, Space, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, LockOutlined, SafetyCertificateOutlined, UnlockOutlined, UserOutlined, IdcardOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { Role } from "../../types/user.type";
import type { AccountItem } from "../../types/user.type";
import { useAppDispatch } from "../../stores/hooks";
import { approveKyc, banAccount, getAccountDetail, rejectKyc, unbanAccount } from "../../stores/slices/user.slice";
import "../../pages/complaints/disputes.css";

const { Text, Title, Paragraph } = Typography;

const kycText: Record<string, string> = {
  pending: "Chờ xác thực",
  in_review: "Đang thẩm định",
  verified: "Đã xác thực",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

const kycStatusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  pending: { bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", dot: "#6b7280" },
  in_review: { bg: "var(--dm-tag-yellow-bg)", color: "var(--dm-tag-yellow-text)", dot: "#f59e0b" },
  verified: { bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", dot: "#10b981" },
  rejected: { bg: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", dot: "#ef4444" },
  expired: { bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", dot: "#6b7280" },
};

const latestKycStatusText: Record<string, string> = {
  pending: "Chờ xử lý",
  in_review: "Đang thẩm định",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const toDisplayDate = (value?: unknown) => {
  if (typeof value !== "string" || !value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("vi-VN");
};

const extractOcrFields = (ocrData?: Record<string, unknown> | null) => {
  if (!ocrData) return { name: "—", dob: "—" };
  const maybeArray = Array.isArray((ocrData as { data?: unknown }).data)
    ? ((ocrData as { data: unknown[] }).data[0] as Record<string, unknown> | undefined)
    : undefined;
  const source = maybeArray ?? ocrData;
  return {
    name: typeof source?.name === "string" ? source.name : "—",
    dob: typeof source?.dob === "string" ? source.dob : "—",
  };
};

const AccountDetailView = ({ role }: { role: Role }) => {
  const dispatch = useAppDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountItem | null>(null);
  const [openBanModal, setOpenBanModal] = useState(false);
  const [openRejectKycModal, setOpenRejectKycModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [banUntil, setBanUntil] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await dispatch(getAccountDetail(id)).unwrap();
      setData(response);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không tải được chi tiết tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const toggleBan = async () => {
    if (!data) return;
    try {
      if (data.isBanned) {
        await dispatch(unbanAccount(data.id)).unwrap();
        messageApi.success("Đã gỡ ban tài khoản");
      }
      await fetchDetail();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không cập nhật được trạng thái ban");
    }
  };

  const submitBan = async () => {
    if (!data) return;
    const normalizedReason = banReason.trim();
    if (!normalizedReason) { messageApi.warning("Vui lòng nhập lý do khóa tài khoản"); return; }
    try {
      await dispatch(banAccount({ id: data.id, reason: normalizedReason, until: banUntil })).unwrap();
      messageApi.success("Đã ban tài khoản");
      setOpenBanModal(false); setBanReason(""); setBanUntil(undefined);
      await fetchDetail();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không cập nhật được trạng thái ban");
    }
  };

  const latestKyc = data?.latestKycDocument;
  const latestStatus = latestKyc?.status;
  const canReviewKycStatus = latestStatus === "in_review" || latestStatus === "pending";
  const canReviewKyc = !!latestKyc?.kycId && (canReviewKycStatus || data?.kycStatus === "in_review");
  const ocr = extractOcrFields((latestKyc?.ocrData as Record<string, unknown> | undefined) ?? null);

  const handleApproveKyc = async () => {
    if (!latestKyc?.kycId) return;
    try {
      await dispatch(approveKyc(latestKyc.kycId)).unwrap();
      messageApi.success("Đã duyệt hồ sơ KYC");
      await fetchDetail();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể duyệt KYC");
    }
  };

  const handleRejectKyc = async () => {
    if (!latestKyc?.kycId) return;
    const reason = kycRejectReason.trim();
    if (!reason) { messageApi.warning("Vui lòng nhập lý do từ chối KYC"); return; }
    try {
      await dispatch(rejectKyc({ kycId: latestKyc.kycId, rejectionReason: reason })).unwrap();
      messageApi.success("Đã từ chối hồ sơ KYC");
      setOpenRejectKycModal(false); setKycRejectReason("");
      await fetchDetail();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể từ chối KYC");
    }
  };

  if (loading) {
    return <div className="dispute-management-page"><Card loading style={{ borderRadius: 12 }} /></div>;
  }

  if (!data) {
    return <div className="dispute-management-page"><Paragraph>Không tìm thấy tài khoản.</Paragraph></div>;
  }

  const kycStyle = kycStatusStyle[data.kycStatus] || kycStatusStyle.pending;

  return (
    <div className="dispute-resolution-page">
      {contextHolder}

      {/* Header Tags */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <span style={{ background: data.role === "admin" ? "#e0e7ff" : "#dbeafe", color: data.role === "admin" ? "#3730a3" : "#1e40af", padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>
          {data.role === "admin" ? "QUẢN TRỊ VIÊN" : "NGƯỜI DÙNG"}
        </span>
        {data.isBanned ? (
          <span style={{ background: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>ĐANG BỊ KHÓA</span>
        ) : (
          <span style={{ background: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600 }}>BÌNH THƯỜNG</span>
        )}
        {data.role !== "admin" && (
          <span style={{ background: kycStyle.bg, color: kycStyle.color, padding: "4px 14px", borderRadius: 16, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: kycStyle.dot }} />
            eKYC: {kycText[data.kycStatus] || "—"}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <Avatar size={56} src={data.avatarUrl || undefined} style={{ backgroundColor: "#6366f1", flexShrink: 0 }}>{data.fullName.slice(0, 1)}</Avatar>
        <div>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>{data.fullName}</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>{data.email || "Chưa có email"}</Text>
        </div>
      </div>

      <Row gutter={24} style={{ marginTop: 24 }}>
        {/* Left Column */}
        <Col xs={24} lg={16} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Account Info Card */}
          <Card className="dispute-info-card" variant="borderless">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <UserOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
              <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Thông tin tài khoản</Title>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { label: "Email", value: data.email || "—" },
                { label: "Số điện thoại", value: data.phone || "—" },
                { label: "Email xác thực", value: data.isEmailVerified ? "Đã xác thực" : "Chưa xác thực" },
                { label: "SĐT xác thực", value: data.phoneVerified ? "Đã xác thực" : "Chưa xác thực" },
                { label: "Ngày tạo", value: new Date(data.createdAt).toLocaleString("vi-VN") },
                { label: "Lý do khóa", value: data.bannedReason || "Không có" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>{item.label}</div>
                  <div style={{ fontWeight: 500, color: "var(--dm-title)", fontSize: 14 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* KYC Detail Card */}
          {data.role !== "admin" && (
            <Card className="dispute-info-card" variant="borderless">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <IdcardOutlined style={{ fontSize: 20, color: "#4f46e5" }} />
                <Title level={4} style={{ margin: 0, color: "var(--dm-title)" }}>Chi tiết KYC</Title>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Trạng thái hồ sơ", value: latestKyc?.status ? latestKycStatusText[latestKyc.status] || latestKyc.status : "—" },
                  { label: "Điểm AI", value: typeof latestKyc?.score === "number" ? String(Math.round(latestKyc.score)) : "—" },
                  { label: "OCR - Họ tên", value: ocr.name },
                  { label: "OCR - Ngày sinh", value: ocr.dob },
                  { label: "Ngày gửi", value: toDisplayDate(latestKyc?.submittedAt) },
                  { label: "Ngày xử lý", value: toDisplayDate(latestKyc?.reviewedAt) },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>{item.label}</div>
                    <div style={{ fontWeight: 500, color: "var(--dm-title)", fontSize: 14 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Flags */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>Cảnh báo</div>
                {latestKyc?.flags && latestKyc.flags.length > 0 ? (
                  <Space wrap>{latestKyc.flags.map((flag) => <Tag key={flag} color="volcano">{flag}</Tag>)}</Space>
                ) : (
                  <span style={{ background: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 500 }}>Không có</span>
                )}
              </div>

              {/* Rejection Reason */}
              {(latestKyc?.rejectionReason || data.kycRejectionReason) && (
                <div style={{ background: "var(--dm-tag-red-bg)", border: "1px solid #fecaca", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--dm-tag-red-text)", marginBottom: 4 }}>Lý do từ chối</div>
                  <div style={{ color: "var(--dm-label)" }}>{latestKyc?.rejectionReason || data.kycRejectionReason}</div>
                </div>
              )}

              {/* KYC Images */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>Hình ảnh giấy tờ</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                {[
                  { label: "Mặt trước CCCD", url: latestKyc?.frontImageUrl },
                  { label: "Mặt sau CCCD", url: latestKyc?.backImageUrl },
                  { label: "Ảnh chân dung", url: latestKyc?.selfieUrl },
                ].map((item) => (
                  <div key={item.label} style={{ background: "var(--dm-surface-soft)", border: "1px dashed #d1d5db", borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--dm-subtitle)", marginBottom: 8 }}>{item.label}</div>
                    {item.url ? (
                      <Image src={item.url} width="100%" height={100} style={{ objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dm-input-icon)", fontSize: 12, fontStyle: "italic" }}>Không có ảnh</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Col>

        {/* Right Column: Actions */}
        <Col xs={24} lg={8} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* KYC Actions */}
          {data.role !== "admin" && canReviewKyc && (
            <Card className="dispute-action-card" variant="borderless">
              <Title level={4} style={{ margin: "0 0 8px 0", color: "var(--dm-title)" }}>Xử lý KYC</Title>
              <Text style={{ color: "var(--dm-subtitle)", fontSize: 13, display: "block", marginBottom: 16 }}>
                Duyệt hoặc từ chối hồ sơ xác thực danh tính của người dùng.
              </Text>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<SafetyCertificateOutlined />}
                  style={{ background: "#4f46e5", height: 48, fontWeight: 600, borderRadius: 8 }}
                  onClick={handleApproveKyc}
                >
                  Duyệt KYC
                </Button>
                <Button
                  danger
                  size="large"
                  block
                  icon={<LockOutlined />}
                  style={{ height: 48, fontWeight: 600, borderRadius: 8 }}
                  onClick={() => setOpenRejectKycModal(true)}
                >
                  Từ chối KYC
                </Button>
              </Space>
            </Card>
          )}

          {/* Ban/Unban Actions */}
          <Card className="dispute-action-card" variant="borderless">
            <Title level={4} style={{ margin: "0 0 8px 0", color: "var(--dm-title)" }}>Quản lý tài khoản</Title>
            <Text style={{ color: "var(--dm-subtitle)", fontSize: 13, display: "block", marginBottom: 16 }}>
              Khóa hoặc mở khóa tài khoản này.
            </Text>
            <Space direction="vertical" style={{ width: "100%" }}>
              {data.isBanned ? (
                <Button
                  size="large"
                  block
                  icon={<UnlockOutlined />}
                  onClick={toggleBan}
                  style={{ height: 48, fontWeight: 600, borderRadius: 8, background: "var(--dm-tag-green-bg)", borderColor: "transparent", color: "var(--dm-tag-green-text)" }}
                >
                  Mở khóa tài khoản
                </Button>
              ) : (
                <Button
                  danger
                  size="large"
                  block
                  icon={<LockOutlined />}
                  onClick={() => setOpenBanModal(true)}
                  style={{ height: 48, fontWeight: 600, borderRadius: 8 }}
                >
                  Khóa tài khoản
                </Button>
              )}
              <Button block type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(role === "user" ? "/dashboard/users" : "/dashboard/admins")}>
                Quay lại danh sách
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Ban Modal */}
      <Modal title="Nhập lý do khóa tài khoản" open={openBanModal} onCancel={() => { setOpenBanModal(false); setBanReason(""); setBanUntil(undefined); }} onOk={submitBan} okText="Xác nhận khóa" cancelText="Huỷ">
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Select placeholder="Chọn lý do gợi ý" options={[
            { label: "Vi phạm chính sách cộng đồng", value: "Vi phạm chính sách cộng đồng" },
            { label: "Spam và nội dung quảng cáo lặp lại", value: "Spam và nội dung quảng cáo lặp lại" },
            { label: "Cung cấp thông tin sai lệch", value: "Cung cấp thông tin sai lệch" },
            { label: "Lạm dụng hệ thống nhắn tin", value: "Lạm dụng hệ thống nhắn tin" },
          ]} onChange={(value) => setBanReason(value)} allowClear />
          <Input.TextArea rows={4} placeholder="Nhập lý do khóa tài khoản (bắt buộc)" value={banReason} onChange={(event) => setBanReason(event.target.value)} />
          <DatePicker showTime style={{ width: "100%" }} placeholder="Thời gian hết hạn khóa (không bắt buộc)" onChange={(value) => setBanUntil(value ? value.toISOString() : undefined)} />
        </Space>
      </Modal>

      {/* Reject KYC Modal */}
      <Modal title="Từ chối hồ sơ KYC" open={openRejectKycModal} onCancel={() => { setOpenRejectKycModal(false); setKycRejectReason(""); }} onOk={handleRejectKyc} okText="Xác nhận từ chối" cancelText="Hủy">
        <Input.TextArea rows={4} value={kycRejectReason} onChange={(event) => setKycRejectReason(event.target.value)} placeholder="Nhập lý do từ chối hồ sơ" />
      </Modal>
    </div>
  );
};

export default AccountDetailView;

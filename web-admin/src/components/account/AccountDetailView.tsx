import { useEffect, useState } from "react";
import { Avatar, Button, Card, DatePicker, Descriptions, Divider, Image, Input, Modal, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { LockOutlined, SafetyCertificateOutlined, UnlockOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { Role } from "../../types/user.type";
import type { AccountItem } from "../../types/user.type";
import { useAppDispatch } from "../../stores/hooks";
import { approveKyc, banAccount, getAccountDetail, rejectKyc, unbanAccount } from "../../stores/slices/user.slice";

const kycText: Record<string, string> = {
  pending: "Chờ xác thực",
  in_review: "Đang thẩm định",
  verified: "Đã xác thực",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

const getKycTagColor = (status: string) => {
  if (status === "verified") return "success";
  if (status === "in_review") return "gold";
  if (status === "rejected") return "error";
  return "default";
};

const latestKycStatusText: Record<string, string> = {
  pending: "Chờ xử lý",
  in_review: "Đang thẩm định",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const toDisplayDate = (value?: unknown) => {
  if (typeof value !== "string" || !value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("vi-VN");
};

const extractOcrFields = (ocrData?: Record<string, unknown> | null) => {
  if (!ocrData) {
    return { name: "-", dob: "-" };
  }

  const maybeArray = Array.isArray((ocrData as { data?: unknown }).data)
    ? ((ocrData as { data: unknown[] }).data[0] as Record<string, unknown> | undefined)
    : undefined;

  const source = maybeArray ?? ocrData;

  return {
    name: typeof source?.name === "string" ? source.name : "-",
    dob: typeof source?.dob === "string" ? source.dob : "-",
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

  useEffect(() => {
    fetchDetail();
  }, [id]);

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
    if (!data) {
      return;
    }

    const normalizedReason = banReason.trim();
    if (!normalizedReason) {
      messageApi.warning("Vui lòng nhập lý do khóa tài khoản");
      return;
    }

    try {
      await dispatch(
        banAccount({
          id: data.id,
          reason: normalizedReason,
          until: banUntil,
        }),
      ).unwrap();
      messageApi.success("Đã ban tài khoản");
      setOpenBanModal(false);
      setBanReason("");
      setBanUntil(undefined);
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
    if (!latestKyc?.kycId) {
      return;
    }

    try {
      await dispatch(approveKyc(latestKyc.kycId)).unwrap();
      messageApi.success("Đã duyệt hồ sơ KYC");
      await fetchDetail();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể duyệt KYC");
    }
  };

  const handleRejectKyc = async () => {
    if (!latestKyc?.kycId) {
      return;
    }

    const reason = kycRejectReason.trim();
    if (!reason) {
      messageApi.warning("Vui lòng nhập lý do từ chối KYC");
      return;
    }

    try {
      await dispatch(rejectKyc({ kycId: latestKyc.kycId, rejectionReason: reason })).unwrap();
      messageApi.success("Đã từ chối hồ sơ KYC");
      setOpenRejectKycModal(false);
      setKycRejectReason("");
      await fetchDetail();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể từ chối KYC");
    }
  };

  if (loading) {
    return <Skeleton active />;
  }

  if (!data) {
    return <Typography.Text>Không tìm thấy tài khoản.</Typography.Text>;
  }

  return (
    <div className="admin-page-shell">
      {contextHolder}
      <Card variant="borderless" className="hero-surface">
        <Space size={16} align="center" wrap>
          <Avatar size={72} src={data.avatarUrl || undefined}>
            {data.fullName.slice(0, 1)}
          </Avatar>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 2 }}>
              {data.fullName}
            </Typography.Title>
            <Space wrap>
              <Tag color={data.role === "admin" ? "purple" : "blue"}>{data.role === "admin" ? "Quản trị viên" : "Người dùng"}</Tag>
              {data.role !== "admin" && (
                <Tag color={getKycTagColor(data.kycStatus)} icon={<SafetyCertificateOutlined />}>
                  eKYC: {kycText[data.kycStatus] || "Chưa cập nhật"}
                </Tag>
              )}
              
              <Tag color={data.isBanned ? "error" : "success"}>{data.isBanned ? "Đang bị khóa" : "Bình thường"}</Tag>
            </Space>
          </div>
        </Space>
      </Card>

      <Card variant="borderless" style={{ marginTop: 16 }}>
        <Descriptions column={1} bordered title="Thông tin tài khoản">
        <Descriptions.Item label="Email">{data.email || "-"}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{data.phone || "-"}</Descriptions.Item>
        <Descriptions.Item label="Email xác thực">{data.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại xác thực">{data.phoneVerified ? "Đã xác thực" : "Chưa xác thực"}</Descriptions.Item>

        {/* 👇 thêm điều kiện ở đây */}
        {data.role !== "admin" && (
          <Descriptions.Item label="Trạng thái eKYC">
            {kycText[data.kycStatus] || data.kycStatus}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Lý do khóa">{data.bannedReason || "-"}</Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">{new Date(data.createdAt).toLocaleString("vi-VN")}</Descriptions.Item>
      </Descriptions>

        {data.role !== "admin" && (
          <>
            <Divider />
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Chi tiết KYC
            </Typography.Title>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Trạng thái hồ sơ KYC mới nhất">
                {latestKyc?.status ? latestKycStatusText[latestKyc.status] || latestKyc.status : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm AI">{typeof latestKyc?.score === "number" ? Math.round(latestKyc.score) : "-"}</Descriptions.Item>
              <Descriptions.Item label="OCR - Họ tên">{ocr.name}</Descriptions.Item>
              <Descriptions.Item label="OCR - Ngày sinh">{ocr.dob}</Descriptions.Item>
              <Descriptions.Item label="Cảnh báo">
                {latestKyc?.flags && latestKyc.flags.length > 0 ? (
                  <Space wrap>
                    {latestKyc.flags.map((flag) => (
                      <Tag key={flag} color="volcano">{flag}</Tag>
                    ))}
                  </Space>
                ) : (
                  <Tag color="success">Không có</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Lý do từ chối">
                {latestKyc?.rejectionReason || data.kycRejectionReason || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">{toDisplayDate(latestKyc?.submittedAt)}</Descriptions.Item>
              <Descriptions.Item label="Ngày xử lý">{toDisplayDate(latestKyc?.reviewedAt)}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 12 }}>
              <Space align="start" wrap>
                <div>
                  <Typography.Text type="secondary">Mặt trước CCCD/CMND</Typography.Text>
                  <div>
                    {latestKyc?.frontImageUrl ? (
                      <Image src={latestKyc.frontImageUrl} width={180} height={120} style={{ objectFit: "cover" }} />
                    ) : (
                      <Typography.Text type="secondary">Không có ảnh</Typography.Text>
                    )}
                  </div>
                </div>
                <div>
                  <Typography.Text type="secondary">Mặt sau CCCD/CMND</Typography.Text>
                  <div>
                    {latestKyc?.backImageUrl ? (
                      <Image src={latestKyc.backImageUrl} width={180} height={120} style={{ objectFit: "cover" }} />
                    ) : (
                      <Typography.Text type="secondary">Không có ảnh</Typography.Text>
                    )}
                  </div>
                </div>
                <div>
                  <Typography.Text type="secondary">Ảnh chân dung</Typography.Text>
                  <div>
                    {latestKyc?.selfieUrl ? (
                      <Image src={latestKyc.selfieUrl} width={180} height={120} style={{ objectFit: "cover" }} />
                    ) : (
                      <Typography.Text type="secondary">Không có ảnh</Typography.Text>
                    )}
                  </div>
                </div>
              </Space>
            </div>

            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={handleApproveKyc}
                disabled={!canReviewKyc}
                style={{
                  borderRadius: 999,
                  height: 38,
                  paddingInline: 18,
                  fontWeight: 600,
                  background: "linear-gradient(90deg, #1677ff 0%, #0958d9 100%)",
                  border: "none",
                }}
              >
                Duyệt KYC
              </Button>
              <Button
                danger
                icon={<LockOutlined />}
                onClick={() => setOpenRejectKycModal(true)}
                disabled={!canReviewKyc}
                style={{
                  borderRadius: 999,
                  height: 38,
                  paddingInline: 18,
                  fontWeight: 600,
                }}
              >
                Từ chối KYC
              </Button>
              {!canReviewKyc && (
                <Typography.Text type="secondary">
                  Chỉ xử lý khi hồ sơ mới nhất ở trạng thái Chờ xử lý hoặc Đang thẩm định. Hiện tại: {latestKyc?.status ? latestKycStatusText[latestKyc.status] || latestKyc.status : "Không xác định"}
                </Typography.Text>
              )}
            </Space>
          </>
        )}

        <Space style={{ marginTop: 16, marginLeft: 5 }} wrap>
          <Button onClick={() => navigate(role === "user" ? "/dashboard/users" : "/dashboard/admins")}>Quay lại</Button>
          {data.isBanned ? (
            <Button icon={<UnlockOutlined />} type="default" onClick={toggleBan}>
              Mở khóa
            </Button>
          ) : (
            <Button icon={<LockOutlined />} danger type="primary" onClick={() => setOpenBanModal(true)}>
              Khóa tài khoản
            </Button>
          )}
        </Space>
      </Card>

      <Modal
        title="Nhập lý do khóa tài khoản"
        open={openBanModal}
        onCancel={() => {
          setOpenBanModal(false);
          setBanReason("");
          setBanUntil(undefined);
        }}
        onOk={submitBan}
        okText="Xác nhận khóa"
        cancelText="Huỷ"
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Select
            placeholder="Chọn lý do gợi ý"
            options={[
              { label: "Vi phạm chính sách cộng đồng", value: "Vi phạm chính sách cộng đồng" },
              { label: "Spam và nội dung quảng cáo lặp lại", value: "Spam và nội dung quảng cáo lặp lại" },
              { label: "Cung cấp thông tin sai lệch", value: "Cung cấp thông tin sai lệch" },
              { label: "Lạm dụng hệ thống nhắn tin", value: "Lạm dụng hệ thống nhắn tin" },
            ]}
            onChange={(value) => setBanReason(value)}
            allowClear
          />
          <Input.TextArea
            rows={4}
            placeholder="Nhập lý do khóa tài khoản (bắt buộc)"
            value={banReason}
            onChange={(event) => setBanReason(event.target.value)}
          />
          <DatePicker
            showTime
            style={{ width: "100%" }}
            placeholder="Thời gian hết hạn khóa (không bắt buộc)"
            onChange={(value) => setBanUntil(value ? value.toISOString() : undefined)}
          />
        </Space>
      </Modal>

      <Modal
        title="Từ chối hồ sơ KYC"
        open={openRejectKycModal}
        onCancel={() => {
          setOpenRejectKycModal(false);
          setKycRejectReason("");
        }}
        onOk={handleRejectKyc}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
      >
        <Input.TextArea
          rows={4}
          value={kycRejectReason}
          onChange={(event) => setKycRejectReason(event.target.value)}
          placeholder="Nhập lý do từ chối hồ sơ"
        />
      </Modal>
    </div>
  );
};

export default AccountDetailView;

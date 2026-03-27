import { useEffect, useState } from "react";
import { Avatar, Button, Card, DatePicker, Descriptions, Input, Modal, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { LockOutlined, SafetyCertificateOutlined, UnlockOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import type { Role } from "../../types/user.type";
import type { AccountItem } from "../../types/user.type";
import { useAppDispatch } from "../../stores/hooks";
import { banAccount, getAccountDetail, unbanAccount } from "../../stores/slices/user.slice";

const kycText: Record<string, string> = {
  pending: "Chờ xác thực",
  in_review: "Đang thẩm định",
  verified: "Đã xác thực",
  rejected: "Từ chối",
  expired: "Hết hạn",
};

const AccountDetailView = ({ role }: { role: Role }) => {
  const dispatch = useAppDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountItem | null>(null);
  const [openBanModal, setOpenBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
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
                <Tag color={data.kycStatus === "verified" ? "success" : "gold"} icon={<SafetyCertificateOutlined />}>
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

        <Space style={{ marginTop: 16 }}>
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
    </div>
  );
};

export default AccountDetailView;

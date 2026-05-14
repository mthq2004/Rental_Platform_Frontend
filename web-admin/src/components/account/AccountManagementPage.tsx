import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  DatePicker,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  LockOutlined,
  PlusOutlined,
  SearchOutlined,
  UnlockOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  FilterOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../stores/hooks";
import { banAccount, createAdminAccount, createUserAccount, getAdmins, getUsers, unbanAccount } from "../../stores/slices/user.slice";
import type { AccountItem, KycStatus, Role } from "../../types/user.type";
import "../../pages/dashboard/dashboard-enterprise.css";
import "../../pages/complaints/disputes.css";

const { Text, Title } = Typography;

type Props = {
  role: Role;
  title: string;
  detailBasePath: string;
};

type FilterState = {
  search: string;
  kycStatus: KycStatus | "all";
  isBanned: "all" | "true" | "false";
  page: number;
  limit: number;
};

const kycStatusConfig: Record<KycStatus, { dot: string; bg: string; color: string; label: string }> = {
  pending: { dot: "#6b7280", bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", label: "Chờ xác thực" },
  in_review: { dot: "#f59e0b", bg: "var(--dm-tag-yellow-bg)", color: "var(--dm-tag-yellow-text)", label: "Đang thẩm định" },
  verified: { dot: "#10b981", bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", label: "Đã xác thực" },
  rejected: { dot: "#ef4444", bg: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", label: "Từ chối" },
  expired: { dot: "#6b7280", bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", label: "Hết hạn" },
};

const AccountManagementPage = ({ role, title, detailBasePath }: Props) => {
  const dispatch = useAppDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [banTarget, setBanTarget] = useState<AccountItem | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banUntil, setBanUntil] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [tableScrollY, setTableScrollY] = useState(320);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    kycStatus: "all",
    isBanned: "all",
    page: 1,
    limit: 10,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data =
        role === "user"
          ? await dispatch(getUsers({
              search: filters.search,
              kycStatus: filters.kycStatus,
              isBanned: filters.isBanned === "all" ? undefined : filters.isBanned === "true",
              page: filters.page,
              limit: filters.limit,
            })).unwrap()
          : await dispatch(getAdmins({
              search: filters.search,
              kycStatus: filters.kycStatus,
              isBanned: filters.isBanned === "all" ? undefined : filters.isBanned === "true",
              page: filters.page,
              limit: filters.limit,
            })).unwrap();

      setItems(data.items);
      setTotal(data.meta.total);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không tải được danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.limit]);

  useEffect(() => {
    const updateTableScrollY = () => {
      const top = tableContainerRef.current?.getBoundingClientRect().top;
      if (typeof top !== "number") {
        return;
      }

      // Fill the remaining viewport while reserving space for pagination and bottom padding.
      setTableScrollY(Math.max(window.innerHeight - top - 120, 160));
    };

    const frameId = window.requestAnimationFrame(updateTableScrollY);
    window.addEventListener("resize", updateTableScrollY);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateTableScrollY);
    };
  }, [filters.page, filters.limit, role]);

  const stats = useMemo(() => {
    const banned = items.filter((item) => item.isBanned).length;
    const verified = items.filter((item) => item.kycStatus === "verified").length;

    return { banned, verified };
  }, [items]);

  const onSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const onCreate = async () => {
    try {
      const payload = await form.validateFields();
      setSubmitting(true);

      if (role === "user") {
        await dispatch(createUserAccount(payload)).unwrap();
      } else {
        await dispatch(createAdminAccount(payload)).unwrap();
      }

      messageApi.success("Tạo tài khoản thành công");
      setOpenCreate(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onBanToggle = async (record: AccountItem) => {
    try {
      if (record.isBanned) {
        await dispatch(unbanAccount(record.id)).unwrap();
        messageApi.success("Đã gỡ ban tài khoản");
      }
      fetchData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái ban");
    }
  };

  const openBanModal = (record: AccountItem) => {
    setBanTarget(record);
    setBanReason("");
    setBanUntil(undefined);
  };

  const submitBan = async () => {
    if (!banTarget) {
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
          id: banTarget.id,
          reason: normalizedReason,
          until: banUntil,
        }),
      ).unwrap();
      messageApi.success("Đã ban tài khoản");
      setBanTarget(null);
      setBanReason("");
      setBanUntil(undefined);
      fetchData();
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái ban");
    }
  };

  const columns: ColumnsType<AccountItem> = [
    {
      title: "Tài khoản",
      dataIndex: "fullName",
      key: "fullName",
      width: 280,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar size={40} src={record.avatarUrl || undefined} style={{ flexShrink: 0, backgroundColor: "#6366f1" }}>
            {record.fullName.slice(0, 1)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "var(--dm-title)", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
              {record.fullName}
            </div>
            <div style={{ color: "var(--dm-subtitle)", fontSize: 12, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
              {record.email || "Chưa có email"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone) => (
        <span style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>{phone || "—"}</span>
      ),
    },
    ...(role !== "admin"
      ? [
          {
            title: "eKYC",
            dataIndex: "kycStatus",
            key: "kycStatus",
            width: 150,
            render: (kycStatus: KycStatus) => {
              const config = kycStatusConfig[kycStatus] || kycStatusConfig.pending;
              const iconMap: Record<string, React.ReactNode> = {
                pending: <ClockCircleOutlined style={{ fontSize: 12 }} />,
                in_review: <SyncOutlined spin style={{ fontSize: 12 }} />,
                verified: <CheckCircleOutlined style={{ fontSize: 12 }} />,
                rejected: <CloseCircleOutlined style={{ fontSize: 12 }} />,
                expired: <ExclamationCircleOutlined style={{ fontSize: 12 }} />,
              };
              return (
                <span style={{
                  background: config.bg, color: config.color, padding: "4px 12px",
                  borderRadius: 16, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  {iconMap[kycStatus]}
                  {config.label}
                </span>
              );
            },
          },
          {
            title: "AI Score",
            key: "kycScore",
            width: 90,
            render: (_: unknown, record: AccountItem) => {
              const score = record.kycScore ?? record.latestKycDocument?.score;
              const displayScore = typeof score === "number" ? Math.round(score) : null;
              if (displayScore === null) return <span style={{ color: "var(--dm-input-icon)" }}>—</span>;

              const scoreColor = displayScore >= 80 ? "#065f46" : displayScore >= 50 ? "#92400e" : "#991b1b";
              const scoreBg = displayScore >= 80 ? "#d1fae5" : displayScore >= 50 ? "#fef3c7" : "#fee2e2";
              return (
                <span style={{
                  background: scoreBg, color: scoreColor, padding: "4px 10px",
                  borderRadius: 16, fontSize: 12, fontWeight: 600,
                }}>
                  {displayScore}
                </span>
              );
            },
          },
        ]
      : []),
    {
      title: "Trạng thái",
      key: "status",
      width: 200,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          <span style={{
            background: record.isActive ? "#d1fae5" : "#f3f4f6",
            color: record.isActive ? "#065f46" : "#374151",
            padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 500,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            {record.isActive ? <CheckCircleOutlined style={{ fontSize: 12 }} /> : <StopOutlined style={{ fontSize: 12 }} />}
            {record.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
          </span>
          {record.isBanned && (
            <span style={{
              background: "var(--dm-stat-icon-red-bg)", color: "var(--dm-tag-red-text)",
              padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 500,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <LockOutlined style={{ fontSize: 12 }} />
              Đang bị khóa
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 110,
      render: (value: string) => (
        <span style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>
          {new Date(value).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            style={{ background: "var(--dm-tag-blue-bg)", borderColor: "transparent", color: "#2563eb", borderRadius: 6, fontWeight: 500 }}
            onClick={() => navigate(`${detailBasePath}/${record.id}`)}
          >
            Chi tiết
          </Button>
          {record.isBanned ? (
            <Popconfirm
              title="Gỡ ban tài khoản này?"
              onConfirm={() => onBanToggle(record)}
              okText="Xác nhận"
              cancelText="Huỷ"
            >
              <Button
                icon={<UnlockOutlined />}
                style={{ background: "var(--dm-tag-green-bg)", borderColor: "transparent", color: "var(--dm-tag-green-text)", borderRadius: 6, fontWeight: 500 }}
              >
                Mở khóa
              </Button>
            </Popconfirm>
          ) : (
            <Button
              icon={<LockOutlined />}
              style={{ background: "var(--dm-tag-red-bg)", borderColor: "transparent", color: "#ef4444", borderRadius: 6, fontWeight: 500 }}
              onClick={() => openBanModal(record)}
            >
              Khóa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="dispute-management-page">
      {contextHolder}

      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>{title}</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Quản lý toàn bộ tài khoản {role === "user" ? "người dùng" : "quản trị viên"} trên hệ thống.</Text>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-refresh-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TeamOutlined style={{ color: "var(--dm-refresh-text)", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>Tổng tài khoản</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "var(--dm-title)", lineHeight: 1.2 }}>{total}</div>
              </div>
            </div>
            {role !== "admin" && (
              <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-tag-green-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SafetyCertificateOutlined style={{ color: "#059669", fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>Đã xác thực eKYC</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: "var(--dm-title)", lineHeight: 1.2 }}>{stats.verified}</div>
                </div>
              </div>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              style={{ height: "auto", background: "#4f46e5", borderRadius: 8, fontWeight: 500 }}
              onClick={() => setOpenCreate(true)}
            >
              Thêm tài khoản
            </Button>
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={onSearch}
              loading={loading}
              style={{ height: "auto", borderRadius: 8, fontWeight: 500, borderColor: "var(--dm-refresh-border)", color: "var(--dm-refresh-text)", background: "var(--dm-refresh-bg)" }}
            >
              Làm mới
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card variant="borderless" className="dispute-filter-card" style={{ marginBottom: 24, borderRadius: 8, border: "1px solid var(--dm-border)" }}>
        <Row gutter={16} align="bottom">
          <Col xs={24} md={role !== "admin" ? 8 : 10}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Tìm kiếm tài khoản</div>
            <Input
              value={filters.search}
              placeholder="Tìm theo tên, email, số điện thoại"
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              onPressEnter={onSearch}
              prefix={<SearchOutlined style={{ color: "var(--dm-input-icon)" }} />}
              size="large"
            />
          </Col>
          {role !== "admin" && (
            <Col xs={12} md={5}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Trạng thái eKYC</div>
              <Select
                value={filters.kycStatus}
                style={{ width: "100%" }}
                size="large"
                onChange={(value) => setFilters((prev) => ({ ...prev, kycStatus: value }))}
                options={[
                  { label: "Tất cả eKYC", value: "all" },
                  { label: "Đã xác thực", value: "verified" },
                  { label: "Chờ xác thực", value: "pending" },
                  { label: "Đang thẩm định", value: "in_review" },
                  { label: "Từ chối", value: "rejected" },
                  { label: "Hết hạn", value: "expired" },
                ]}
              />
            </Col>
          )}
          <Col xs={12} md={role !== "admin" ? 5 : 6}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Trạng thái ban</div>
            <Select
              value={filters.isBanned}
              style={{ width: "100%" }}
              size="large"
              onChange={(value) => setFilters((prev) => ({ ...prev, isBanned: value }))}
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Đang hoạt động", value: "false" },
                { label: "Đang bị ban", value: "true" },
              ]}
            />
          </Col>
          <Col xs={24} md={role !== "admin" ? 6 : 8} style={{ textAlign: "right" }}>
            <Button size="large" onClick={onSearch} icon={<FilterOutlined />} style={{ color: "var(--dm-refresh-text)", borderColor: "var(--dm-refresh-border)", background: "var(--dm-refresh-bg)", width: "100%" }}>
              Lọc dữ liệu
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table Card */}
      <Card variant="borderless" className="dispute-table-card" style={{ borderRadius: 8, border: "1px solid var(--dm-border)", padding: 0, overflow: "hidden" }}>
        <div ref={tableContainerRef}>
          <Table
            className="custom-dispute-table"
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={loading}
            onRow={(record) => ({
              style: record.kycStatus === "in_review" ? { background: "var(--dm-tag-yellow-bg)" } : undefined,
            })}
            scroll={{ y: tableScrollY }}
            tableLayout="fixed"
            pagination={false}
          />
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--dm-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dm-surface-soft)" }}>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>Đang hiển thị {items.length} / {total} mục</Text>
          <Space>
            <Button disabled={filters.page === 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>Trước</Button>
            <Button disabled={items.length < filters.limit} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Tiếp</Button>
          </Space>
        </div>
      </Card>

      <Modal
        title={banTarget ? `Khóa tài khoản: ${banTarget.fullName}` : "Khóa tài khoản"}
        open={!!banTarget}
        onCancel={() => {
          setBanTarget(null);
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
        title={`Thêm tài khoản ${role === "user" ? "người dùng" : "quản trị"}`}
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onOk={onCreate}
        confirmLoading={submitting}
        okText="Tạo"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: "Nhập họ tên" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Email không hợp lệ" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, min: 6, message: "Tối thiểu 6 ký tự" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Đường dẫn ảnh đại diện" name="avatarUrl">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountManagementPage;

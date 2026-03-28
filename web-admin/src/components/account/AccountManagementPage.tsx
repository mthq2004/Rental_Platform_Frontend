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
  Statistic,
  Table,
  DatePicker,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined, LockOutlined, PlusOutlined, SearchOutlined, UnlockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../stores/hooks";
import { banAccount, createAdminAccount, createUserAccount, getAdmins, getUsers, unbanAccount } from "../../stores/slices/user.slice";
import type { AccountItem, KycStatus, Role } from "../../types/user.type";


const { Text } = Typography;

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

const getKycTag = (kycStatus: KycStatus) => {
  const map: Record<KycStatus, { color: string; label: string }> = {
    pending: { color: "default", label: "Chờ xác thực" },
    in_review: { color: "gold", label: "Đang thẩm định" },
    verified: { color: "success", label: "Đã xác thực" },
    rejected: { color: "error", label: "Từ chối" },
    expired: { color: "default", label: "Hết hạn" },
  };

  return (
    <Tag color={map[kycStatus].color} icon={<SafetyCertificateOutlined />}>
      {map[kycStatus].label}
    </Tag>
  );
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
    const active = items.filter((item) => item.isActive).length;

    return { banned, verified, active };
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
      width: 300,
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatarUrl || undefined}>{record.fullName.slice(0, 1)}</Avatar>
          <div style={{ minWidth: 0 }}>
            <Text strong ellipsis={{ tooltip: record.fullName }} style={{ maxWidth: 200 }}>
              {record.fullName}
            </Text>
            <div>
              <Text type="secondary" ellipsis={{ tooltip: record.email || "Chưa có email" }} style={{ maxWidth: 220 }}>
                {record.email || "Chưa có email"}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (phone) => phone || "-",
    },
     ...(role !== "admin"
    ? [
        {
          title: "eKYC",
          dataIndex: "kycStatus",
          key: "kycStatus",
          width: 140,
          render: (kycStatus: KycStatus) => getKycTag(kycStatus),
        },
        {
          title: "AI Score",
          key: "kycScore",
          width: 100,
          render: (_: unknown, record: AccountItem) => {
            const score = record.kycScore ?? record.latestKycDocument?.score;
            return typeof score === "number" ? Math.round(score) : "-";
          },
        },
      ]
    : []),
    {
      title: "Trạng thái",
      key: "status",
      width: 210,
      render: (_, record) => (
        <Space>
          <Tag color={record.isActive ? "success" : "default"}>{record.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}</Tag>
          {record.isBanned ? <Tag color="error">Đang bị khóa</Tag> : <Tag color="processing">Bình thường</Tag>}
        </Space>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 260,
      render: (_, record) => (
        <Space wrap size={[8, 8]}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`${detailBasePath}/${record.id}`)}>
            Chi tiết
          </Button>
          {record.isBanned ? (
            <Popconfirm
              title="Gỡ ban tài khoản này?"
              onConfirm={() => onBanToggle(record)}
              okText="Xác nhận"
              cancelText="Huỷ"
            >
              <Button icon={<UnlockOutlined />} type="default">
                Mở khóa
              </Button>
            </Popconfirm>
          ) : (
            <Button icon={<LockOutlined />} danger type="primary" onClick={() => openBanModal(record)}>
              Khóa tài khoản
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page-shell">
      {contextHolder}

      <Card className="hero-surface" variant="borderless">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              {title}
            </Typography.Title>
            <Text type="secondary">Quản lý các tài khoản </Text>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreate(true)}>
              Thêm tài khoản
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Tổng tài khoản đang hiển thị" value={items.length} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Đã xác thực eKYC" value={stats.verified} styles={{ content: { color: "#2f9e44" } }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Đang bị ban" value={stats.banned} styles={{ content: { color: "#d6336c" } }} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input
              value={filters.search}
              placeholder="Tìm theo tên, email, số điện thoại"
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              onPressEnter={onSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
            {role !== "admin" && (
              <Col xs={12} md={6}>
                <Select
                  value={filters.kycStatus}
                  style={{ width: "100%" }}
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
          
          <Col xs={12} md={4}>
            <Select
              value={filters.isBanned}
              style={{ width: "100%" }}
              onChange={(value) => setFilters((prev) => ({ ...prev, isBanned: value }))}
              options={[
                { label: "Tất cả trạng thái", value: "all" },
                { label: "Đang hoạt động", value: "false" },
                { label: "Đang bị ban", value: "true" },
              ]}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} block>
              Tìm kiếm
            </Button>
          </Col>
        </Row>

        <div ref={tableContainerRef} style={{ marginTop: 16 }}>
          <Table
            className="management-table-no-x"
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={loading}
            onRow={(record) => ({
              style: record.kycStatus === "in_review" ? { background: "#fffbe6" } : undefined,
            })}
            scroll={{ y: tableScrollY }}
            tableLayout="fixed"
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total,
              showSizeChanger: true,
              onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, limit: pageSize })),
            }}
          />
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

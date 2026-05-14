import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Typography,
  App,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  HomeFilled,
  FilterOutlined,
  EyeInvisibleOutlined,
  BankOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Property } from "../../types/property-new.type";
import "../../pages/dashboard/dashboard-enterprise.css";
import "../../pages/complaints/disputes.css";

const { Title, Text } = Typography;

type ApprovalStatus = "pending" | "approved" | "rejected";

type Props = {
  status: ApprovalStatus;
  title: string;
  properties: Property[];
  loading: boolean;
  onRefresh?: () => void;
  onView?: (id: string) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onBatchApprove?: (ids: string[]) => void;
  onBatchReject?: (ids: string[], reason: string) => void;
};

const statusConfig: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  pending: { dot: "#f59e0b", bg: "var(--dm-tag-yellow-bg)", color: "var(--dm-tag-yellow-text)", label: "Chờ duyệt" },
  approved: { dot: "#10b981", bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", label: "Đã duyệt" },
  rejected: { dot: "#ef4444", bg: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", label: "Từ chối" },
};

const typeConfig: Record<string, { bg: string; color: string; label: string }> = {
  apartment: { bg: "var(--dm-tag-blue-bg)", color: "var(--dm-tag-blue-text)", label: "Căn hộ" },
  house: { bg: "var(--dm-tag-indigo-bg)", color: "var(--dm-tag-indigo-text)", label: "Nhà ở" },
  land: { bg: "var(--dm-tag-yellow-bg)", color: "var(--dm-tag-yellow-text)", label: "Đất nền" },
  office: { bg: "var(--dm-tag-purple-bg)", color: "var(--dm-tag-purple-text)", label: "Văn phòng" },
  room: { bg: "var(--dm-tag-red-bg)", color: "var(--dm-tag-red-text)", label: "Phòng trọ" },
};

const visibilityConfig: Record<string, { dot: string; bg: string; color: string; label: string }> = {
  active: { dot: "#10b981", bg: "var(--dm-tag-green-bg)", color: "var(--dm-tag-green-text)", label: "Đang hiển thị" },
  inactive: { dot: "#6b7280", bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", label: "Đã ẩn" },
  hidden: { dot: "#6b7280", bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", label: "Đã ẩn" },
};

const PropertyModerationBoard = ({
  status,
  title,
  properties,
  loading,
  onRefresh,
  onView,
  onToggleVisibility,
  onApprove,
  onReject,
  onBatchApprove,
  onBatchReject,
}: Props) => {
  const { message, modal } = App.useApp();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedType, setSelectedType] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [batchRejectReason, setBatchRejectReason] = useState("");
  const [batchRejectOpen, setBatchRejectOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [tableScrollY, setTableScrollY] = useState(320);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const updateTableScrollY = () => {
      const top = tableContainerRef.current?.getBoundingClientRect().top;
      if (typeof top !== "number") {
        return;
      }

      setTableScrollY(Math.max(window.innerHeight - top - 120, 160));
    };

    const frameId = window.requestAnimationFrame(updateTableScrollY);
    window.addEventListener("resize", updateTableScrollY);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateTableScrollY);
    };
  }, [search, sort, selectedType, status]);

  const filtered = useMemo(() => {
    const items = properties.filter((item) => {
      const keyword = search.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(keyword) || item.address.toLowerCase().includes(keyword);
      const matchesType = selectedType === "all" || item.propertyType === selectedType;
      return matchesSearch && matchesType;
    });

    if (sort === "newest") {
      return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    if (sort === "oldest") {
      return [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    if (sort === "price_high") {
      return [...items].sort((a, b) => b.pricePerMonth - a.pricePerMonth);
    }

    return [...items].sort((a, b) => a.pricePerMonth - b.pricePerMonth);
  }, [properties, search, sort, selectedType]);

  const stats = useMemo(
    () => ({
      total: filtered.length,
      verifiedLandlords: filtered.filter((item) => item.landlord?.email).length,
    }),
    [filtered],
  );

  // ====== BATCH ACTIONS ======
  const handleSelectAll = () => {
    if (selectedRowKeys.length === filtered.length) {
      setSelectedRowKeys([]);
    } else {
      setSelectedRowKeys(filtered.map((p) => p.propertyId));
    }
  };

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 bất động sản");
      return;
    }

    modal.confirm({
      title: "Duyệt hàng loạt",
      content: `Bạn có chắc chắn muốn duyệt ${selectedRowKeys.length} bất động sản đã chọn?`,
      okText: "Duyệt tất cả",
      cancelText: "Hủy",
      onOk: () => {
        if (onBatchApprove) {
          onBatchApprove(selectedRowKeys as string[]);
        } else {
          // Fallback: approve one by one
          (selectedRowKeys as string[]).forEach((id) => onApprove?.(id));
        }
        setSelectedRowKeys([]);
      },
    });
  };

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 bất động sản");
      return;
    }
    setBatchRejectReason("");
    setBatchRejectOpen(true);
  };

  const confirmBatchReject = () => {
    if (!batchRejectReason.trim()) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }

    if (onBatchReject) {
      onBatchReject(selectedRowKeys as string[], batchRejectReason);
    } else {
      // Fallback: reject one by one
      (selectedRowKeys as string[]).forEach((id) => onReject?.(id, batchRejectReason));
    }
    setBatchRejectOpen(false);
    setBatchRejectReason("");
    setSelectedRowKeys([]);
  };

  // ====== TABLE COLUMNS ======
  const columns: ColumnsType<Property> = [
    {
      title: "Bất động sản",
      key: "title",
      width: 300,
      render: (_, record) => (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Avatar shape="square" size={48} src={record.images?.[0]?.uri} style={{ borderRadius: 8, flexShrink: 0 }}>
            {record.title.slice(0, 1)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "var(--dm-title)", fontSize: 14 }}>{record.title}</div>
            <div style={{ color: "var(--dm-subtitle)", fontSize: 12, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>
              {record.address}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Loại BĐS",
      dataIndex: "propertyType",
      key: "propertyType",
      width: 120,
      render: (value: string) => {
        const config = typeConfig[value] || { bg: "var(--dm-tag-gray-bg)", color: "var(--dm-label)", label: value };
        const iconMap: Record<string, React.ReactNode> = {
          apartment: <ApartmentOutlined style={{ fontSize: 12 }} />,
          house: <HomeOutlined style={{ fontSize: 12 }} />,
          land: <EnvironmentOutlined style={{ fontSize: 12 }} />,
          office: <ShopOutlined style={{ fontSize: 12 }} />,
          room: <BankOutlined style={{ fontSize: 12 }} />,
        };
        return (
          <span style={{
            background: config.bg, color: config.color, padding: "4px 12px",
            borderRadius: 16, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            {iconMap[value]}
            {config.label}
          </span>
        );
      },
    },
    {
      title: "Chủ nhà",
      key: "landlord",
      width: 160,
      render: (_, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 500, color: "var(--dm-title)", fontSize: 13 }}>{record.landlord?.fullName || "—"}</span>
          <span style={{ color: "var(--dm-subtitle)", fontSize: 12 }}>{record.landlord?.email || ""}</span>
        </div>
      ),
    },
    {
      title: "Giá / tháng",
      dataIndex: "pricePerMonth",
      key: "pricePerMonth",
      width: 140,
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: "var(--dm-title)", fontSize: 14 }}>
          {value.toLocaleString("vi-VN")} <span style={{ fontWeight: 400, color: "var(--dm-subtitle)", fontSize: 12 }}>VND</span>
        </span>
      ),
    },
    ...(status === "approved"
      ? [
          {
            title: "Hiển thị",
            key: "visibility",
            width: 140,
            render: (_: unknown, record: Property) => {
              const config = visibilityConfig[record.status] || visibilityConfig.inactive;
              const visIcon = record.status === "active"
                ? <EyeOutlined style={{ fontSize: 12 }} />
                : <EyeInvisibleOutlined style={{ fontSize: 12 }} />;
              return (
                <span style={{
                  background: config.bg, color: config.color, padding: "4px 12px",
                  borderRadius: 16, fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  {visIcon}
                  {config.label}
                </span>
              );
            },
          },
        ]
      : []),
    {
      title: "Ngày đăng",
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
      key: "action",
      width: status === "pending" ? 240 : 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            style={{ background: "var(--dm-tag-blue-bg)", borderColor: "transparent", color: "#2563eb", borderRadius: 6 }}
            onClick={() => onView?.(record.propertyId)}
          >
            Xem
          </Button>
          {status === "pending" && (
            <>
              <Button
                type="primary"
                ghost
                icon={<CheckOutlined />}
                style={{ background: "var(--dm-tag-green-bg)", borderColor: "transparent", color: "var(--dm-tag-green-text)", borderRadius: 6 }}
                onClick={() => onApprove?.(record.propertyId)}
              >
                Duyệt
              </Button>
              <Button
                type="primary"
                danger
                ghost
                icon={<CloseOutlined />}
                style={{ background: "var(--dm-tag-red-bg)", borderColor: "transparent", color: "#ef4444", borderRadius: 6 }}
                onClick={() => setRejectingId(record.propertyId)}
              >
                Từ chối
              </Button>
            </>
          )}
          {status === "approved" && (
            <Button
              type="primary"
              ghost
              icon={record.status === "active" ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              style={{
                background: record.status === "active" ? "#fef2f2" : "#d1fae5",
                borderColor: "transparent",
                color: record.status === "active" ? "#ef4444" : "#065f46",
                borderRadius: 6,
              }}
              onClick={() => onToggleVisibility?.(record.propertyId, record.status !== "active")}
            >
              {record.status === "active" ? "Ẩn tin" : "Hiện tin"}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // ====== ROW SELECTION CONFIG ======
  const rowSelection = status === "pending"
    ? {
      selectedRowKeys,
      onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    }
    : undefined;

  const isAllSelected = filtered.length > 0 && selectedRowKeys.length === filtered.length;

  return (
    <div className="dispute-management-page">
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "var(--dm-title)" }}>{title}</Title>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 15 }}>Quản lý duyệt và kiểm duyệt bất động sản trên hệ thống.</Text>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ border: "1px solid var(--dm-border)", borderRadius: 8, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", background: "var(--dm-stat-bg)", boxShadow: "var(--dm-shadow)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dm-stat-icon-blue-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HomeFilled style={{ color: "#2563eb", fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--dm-subtitle)", letterSpacing: 0.5, textTransform: "uppercase" }}>Tổng bài đăng</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "var(--dm-title)", lineHeight: 1.2 }}>{stats.total}</div>
              </div>
            </div>
            <Button
              icon={<ReloadOutlined />}
              size="large"
              onClick={onRefresh}
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
          <Col xs={24} md={8}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Tìm kiếm bất động sản</div>
            <Input
              prefix={<SearchOutlined style={{ color: "var(--dm-input-icon)" }} />}
              placeholder="VD: Căn hộ 2PN Quận 7..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="large"
            />
          </Col>
          <Col xs={12} md={5}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Loại bất động sản</div>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: "100%" }}
              size="large"
              options={[
                { label: "Tất cả loại", value: "all" },
                { label: "Căn hộ", value: "apartment" },
                { label: "Nhà ở", value: "house" },
                { label: "Đất nền", value: "land" },
                { label: "Văn phòng", value: "office" },
                { label: "Phòng trọ", value: "room" },
              ]}
            />
          </Col>
          <Col xs={12} md={7}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--dm-label)", marginBottom: 6 }}>Sắp xếp theo</div>
            <Select
              value={sort}
              onChange={setSort}
              style={{ width: "100%" }}
              size="large"
              options={[
                { label: "Mới nhất", value: "newest" },
                { label: "Cũ nhất", value: "oldest" },
                { label: "Giá cao → thấp", value: "price_high" },
                { label: "Giá thấp → cao", value: "price_low" },
              ]}
            />
          </Col>
          <Col xs={24} md={4} style={{ textAlign: "right" }}>
            <Button size="large" icon={<FilterOutlined />} style={{ color: "var(--dm-refresh-text)", borderColor: "var(--dm-refresh-border)", background: "var(--dm-refresh-bg)", width: "100%" }}>
              Bộ lọc khác
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Batch Action Bar — only visible on pending status */}
      {status === "pending" && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 20px",
            background: selectedRowKeys.length > 0 ? "var(--dm-tag-indigo-bg)" : "var(--dm-surface-soft)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            border: "1px solid var(--dm-border)",
          }}
        >
          <Space>
            <Button size="small" onClick={handleSelectAll} style={{ borderRadius: 6 }}>
              {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>
            <Text style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>
              Đã chọn <Text strong>{selectedRowKeys.length}</Text> / {filtered.length} bất động sản
            </Text>
          </Space>
          <Space>
            <Button
              type="primary"
              ghost
              icon={<CheckOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchApprove}
              style={{ background: "var(--dm-tag-green-bg)", borderColor: "transparent", color: "var(--dm-tag-green-text)", borderRadius: 6, fontWeight: 500 }}
            >
              Duyệt đã chọn
            </Button>
            <Button
              type="primary"
              danger
              ghost
              icon={<CloseOutlined />}
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchReject}
              style={{ background: "var(--dm-tag-red-bg)", borderColor: "transparent", color: "#ef4444", borderRadius: 6, fontWeight: 500 }}
            >
              Từ chối đã chọn
            </Button>
          </Space>
        </div>
      )}

      {/* Table Card */}
      <Card variant="borderless" className="dispute-table-card" style={{ borderRadius: 8, border: "1px solid var(--dm-border)", padding: 0, overflow: "hidden" }}>
        <div ref={tableContainerRef}>
          <Table
            rowKey="propertyId"
            className="custom-dispute-table"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            scroll={{ y: tableScrollY }}
            tableLayout="fixed"
            rowSelection={rowSelection}
            pagination={false}
          />
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--dm-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--dm-surface-soft)" }}>
          <Text style={{ color: "var(--dm-subtitle)", fontSize: 13 }}>Đang hiển thị {filtered.length} / {properties.length} mục</Text>
          <Space>
            <Button disabled>Trước</Button>
            <Button disabled>Tiếp</Button>
          </Space>
        </div>
      </Card>

      {/* Single reject modal */}
      <Modal
        title="Lý do từ chối"
        open={!!rejectingId}
        onCancel={() => {
          setRejectingId(null);
          setRejectReason("");
        }}
        onOk={() => {
          if (!rejectingId || !rejectReason.trim()) return;
          onReject?.(rejectingId, rejectReason);
          setRejectingId(null);
          setRejectReason("");
        }}
        okText="Xác nhận từ chối"
      >
        <Input.TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối bất động sản..." />
      </Modal>

      {/* Batch reject modal */}
      <Modal
        title={`Từ chối ${selectedRowKeys.length} bất động sản`}
        open={batchRejectOpen}
        onCancel={() => {
          setBatchRejectOpen(false);
          setBatchRejectReason("");
        }}
        onOk={confirmBatchReject}
        okText="Xác nhận từ chối tất cả"
        okButtonProps={{ danger: true }}
      >
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Lý do từ chối sẽ được áp dụng cho tất cả {selectedRowKeys.length} bất động sản đã chọn.
        </Typography.Text>
        <Input.TextArea
          rows={4}
          value={batchRejectReason}
          onChange={(e) => setBatchRejectReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
        />
      </Modal>
    </div>
  );
};

export default PropertyModerationBoard;

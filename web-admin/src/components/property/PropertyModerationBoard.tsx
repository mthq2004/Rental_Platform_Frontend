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
  Statistic,
  Table,
  Tag,
  Typography,
  App,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Property } from "../../types/property-new.type";

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
      avgPrice: filtered.length ? Math.round(filtered.reduce((sum, item) => sum + item.pricePerMonth, 0) / filtered.length) : 0,
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
      render: (_, record) => (
        <Space>
          <Avatar shape="square" size={44} src={record.images?.[0]?.uri}>
            {record.title.slice(0, 1)}
          </Avatar>
          <div>
            <Typography.Text strong>{record.title}</Typography.Text>
            <div>
              <Typography.Text type="secondary">{record.address}</Typography.Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "Loại",
      dataIndex: "propertyType",
      key: "propertyType",
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: "Chủ nhà",
      key: "landlord",
      render: (_, record) => record.landlord?.fullName || "-",
    },
    {
      title: "Giá / tháng",
      dataIndex: "pricePerMonth",
      key: "pricePerMonth",
      render: (value: number) => `${value.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Ngày đăng",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => onView?.(record.propertyId)}>Xem</Button>
          {status === "pending" && (
            <>
              <Button type="primary" icon={<CheckOutlined />} onClick={() => onApprove?.(record.propertyId)}>
                Duyệt
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => setRejectingId(record.propertyId)}>
                Từ chối
              </Button>
            </>
          )}
          {status === "approved" && (
            <Button
              type={record.status === "active" ? "default" : "primary"}
              danger={record.status === "active"}
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
    <div className="admin-page-shell">
      <Card className="hero-surface" variant="borderless">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Typography.Title level={3} style={{ marginBottom: 2 }}>
              {title}
            </Typography.Title>
            <Typography.Text type="secondary">
              Thiết kế bảng điều phối theo chuẩn enterprise, đồng bộ theme với toàn hệ thống.
            </Typography.Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Làm mới
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card variant="borderless">
            <Statistic title="Tổng bài đăng" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card variant="borderless">
            <Statistic title="Có thông tin landlord" value={stats.verifiedLandlords} />
          </Card>
        </Col>
        {/* <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Giá trung bình" value={stats.avgPrice} suffix="VND" />
          </Card>
        </Col> */}
      </Row>

      <Card variant="borderless" style={{ marginTop: 16 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} prefix={<SearchOutlined />} placeholder="Tìm theo tiêu đề hoặc địa chỉ" />
          </Col>
          <Col xs={12} md={6}>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: "100%" }}
              options={[
                { label: "Tất cả loại", value: "all" },
                { label: "Apartment", value: "apartment" },
                { label: "House", value: "house" },
                { label: "Land", value: "land" },
                { label: "Office", value: "office" },
                { label: "Room", value: "room" },
              ]}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              value={sort}
              onChange={setSort}
              style={{ width: "100%" }}
              options={[
                { label: "Mới nhất", value: "newest" },
                { label: "Cũ nhất", value: "oldest" },
                { label: "Giá cao", value: "price_high" },
                { label: "Giá thấp", value: "price_low" },
              ]}
            />
          </Col>
        </Row>

        {/* Batch Action Bar — only visible on pending status */}
        {status === "pending" && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 16px",
              background: selectedRowKeys.length > 0 ? "#EEF2FF" : "#F8FAFC",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              border: "1px solid #E2E8F0",
            }}
          >
            <Space>
              <Button size="small" onClick={handleSelectAll}>
                {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </Button>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Đã chọn <Typography.Text strong>{selectedRowKeys.length}</Typography.Text> / {filtered.length} bất động sản
              </Typography.Text>
            </Space>
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchApprove}
              >
                Duyệt đã chọn
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchReject}
              >
                Từ chối đã chọn
              </Button>
            </Space>
          </div>
        )}

        <div ref={tableContainerRef} style={{ marginTop: 16 }}>
          <Table
            rowKey="propertyId"
            className="management-table-no-x"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            scroll={{ y: tableScrollY }}
            tableLayout="fixed"
            rowSelection={rowSelection}
          />
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

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
} from "antd";
import { CheckOutlined, CloseOutlined, EyeOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Property } from "../../types/property-new.type";

type ApprovalStatus = "pending" | "approved" | "rejected";

type Props = {
  status: ApprovalStatus;
  title: string;
  properties: Property[];
  loading: boolean;
  onView?: (id: string) => void;
  onToggleVisibility?: (id: string, visible: boolean) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
};

const PropertyModerationBoard = ({ status, title, properties, loading, onView, onToggleVisibility, onApprove, onReject }: Props) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [selectedType, setSelectedType] = useState("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
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

  return (
    <div className="admin-page-shell">
      <Card className="hero-surface" variant="borderless">
        <Typography.Title level={3} style={{ marginBottom: 2 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">
          Thiết kế bảng điều phối theo chuẩn enterprise, đồng bộ theme với toàn hệ thống.
        </Typography.Text>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Tổng bài đăng" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Có thông tin landlord" value={stats.verifiedLandlords} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic title="Giá trung bình" value={stats.avgPrice} suffix="VND" />
          </Card>
        </Col>
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

        <div ref={tableContainerRef} style={{ marginTop: 16 }}>
          <Table
            rowKey="propertyId"
            className="management-table-no-x"
            loading={loading}
            columns={columns}
            dataSource={filtered}
            scroll={{ y: tableScrollY }}
            tableLayout="fixed"
          />
        </div>
      </Card>

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
    </div>
  );
};

export default PropertyModerationBoard;

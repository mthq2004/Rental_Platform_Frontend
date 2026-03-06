"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Empty,
  Spin,
  Avatar,
  Typography,
  Tooltip,
  Badge,
  Image,
  App,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  ToolOutlined,
  FileTextOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getPostStatusCounts,
  getPropertiesByStatus,
  type PropertyData,
  type StatusCount,
} from "@/stores/slices/property.slice";
import { PROPERTY_META } from "@/constants/property.constant";
import type { PropertyType } from "@/types/property.type";

const { Text, Paragraph } = Typography;

// ====== Status config ======
type PostStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "rented"
  | "maintenance"
  | "inactive"
  | "rejected";

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: {
    label: "Nháp",
    color: "default",
    icon: <FileTextOutlined />,
  },
  pending_approval: {
    label: "Chờ duyệt",
    color: "processing",
    icon: <ClockCircleOutlined />,
  },
  active: {
    label: "Đang hiển thị",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
  rented: {
    label: "Đã cho thuê",
    color: "blue",
    icon: <HomeOutlined />,
  },
  maintenance: {
    label: "Bảo trì",
    color: "warning",
    icon: <ToolOutlined />,
  },
  inactive: {
    label: "Đã ẩn",
    color: "default",
    icon: <StopOutlined />,
  },
  rejected: {
    label: "Bị từ chối",
    color: "error",
    icon: <CloseCircleOutlined />,
  },
};

// ====== Format helpers ======
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === "string" ? parseInt(price) : price;
  if (!numPrice || isNaN(numPrice)) return "Liên hệ";
  if (numPrice >= 1000000) {
    return `${(numPrice / 1000000).toFixed(1)} triệu/tháng`;
  }
  return `${numPrice.toLocaleString("vi-VN")} đ/tháng`;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ====== Component ======
const PostsPage = () => {
  const { message } = App.useApp();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { statusCount, properties, loadingPropertyStatus, loading } =
    useAppSelector((state) => state.property);

  const [activeTab, setActiveTab] = useState<PostStatus>("active");
  const [searchText, setSearchText] = useState("");

  // Fetch status counts on mount
  useEffect(() => {
    dispatch(getPostStatusCounts());
  }, [dispatch]);

  // Fetch properties when tab changes
  useEffect(() => {
    dispatch(getPropertiesByStatus(activeTab));
  }, [activeTab, dispatch]);

  // Refresh
  const handleRefresh = useCallback(() => {
    dispatch(getPostStatusCounts());
    dispatch(getPropertiesByStatus(activeTab));
  }, [dispatch, activeTab]);

  // Build tab items from status counts
  const tabs = Array.isArray(statusCount) ? statusCount : [];

  // Filter properties by search text
  const filteredProperties = (Array.isArray(properties) ? properties : []).filter(
    (p) => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return (
        p.title?.toLowerCase().includes(search) ||
        p.address?.toLowerCase().includes(search) ||
        p.district?.toLowerCase().includes(search) ||
        p.city?.toLowerCase().includes(search)
      );
    }
  );

  // ====== Table columns ======
  const columns: ColumnsType<PropertyData> = [
    {
      title: "Tin đăng",
      key: "property",
      width: 400,
      render: (_, record) => {
        const primaryImage = record.images?.find((img: any) => img.isPrimary) || record.images?.[0];
        const meta = PROPERTY_META[record.propertyType as PropertyType];
        return (
          <div className="flex gap-3 py-1">
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
              {primaryImage?.uri ? (
                <Image
                  src={primaryImage.uri}
                  alt={record.title}
                  width={80}
                  height={80}
                  className="object-cover"
                  style={{ width: 80, height: 80, objectFit: "cover" }}
                  preview={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HomeOutlined className="text-2xl text-gray-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Paragraph
                className="mb-1! font-medium text-gray-800"
                ellipsis={{ rows: 2 }}
                style={{ marginBottom: 4 }}
              >
                {record.title || "Chưa có tiêu đề"}
              </Paragraph>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <EnvironmentOutlined />
                <span className="truncate">
                  {[record.district, record.city].filter(Boolean).join(", ") || "Chưa có địa chỉ"}
                </span>
              </div>
              {meta && (
                <Tag color="blue" className="text-xs">
                  {meta.label}
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Giá thuê",
      key: "price",
      width: 160,
      render: (_, record) => (
        <Text strong className="text-red-500 text-sm">
          {formatPrice(record.pricePerMonth)}
        </Text>
      ),
      sorter: (a, b) => {
        const priceA = typeof a.pricePerMonth === "string" ? parseInt(a.pricePerMonth) : a.pricePerMonth;
        const priceB = typeof b.pricePerMonth === "string" ? parseInt(b.pricePerMonth) : b.pricePerMonth;
        return (priceA || 0) - (priceB || 0);
      },
    },
    {
      title: "Diện tích",
      key: "area",
      width: 100,
      render: (_, record) => (
        <Text className="text-sm">{record.areaSqm ? `${record.areaSqm} m²` : "—"}</Text>
      ),
      sorter: (a, b) => {
        const areaA = typeof a.areaSqm === "string" ? parseFloat(a.areaSqm) : a.areaSqm;
        const areaB = typeof b.areaSqm === "string" ? parseFloat(b.areaSqm) : b.areaSqm;
        return (areaA || 0) - (areaB || 0);
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      render: (_, record) => {
        const status = (record.status as PostStatus) || "draft";
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        return (
          <Tag color={config.color} icon={config.icon} className="text-xs">
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 100,
      align: "center",
      render: (val) => (
        <Space size={4}>
          <EyeOutlined className="text-gray-400" />
          <Text className="text-sm">{val || 0}</Text>
        </Space>
      ),
      sorter: (a, b) => ((a as any).viewCount || 0) - ((b as any).viewCount || 0),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (val) => <Text className="text-sm text-gray-500">{formatDate(val)}</Text>,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => {
        const status = record.status as PostStatus;
        const propertyId = record.id || (record as any).propertyId;
        return (
          <Space size={4}>
            <Tooltip title="Xem chi tiết">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() =>
                  router.push(`/property/${propertyId}`)
                }
              />
            </Tooltip>
            {(status === "draft" || status === "active" || status === "inactive" || status === "rejected") && (
              <Tooltip title="Chỉnh sửa">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() =>
                    router.push(`/post/create?id=${propertyId}&mode=edit`)
                  }
                />
              </Tooltip>
            )}
            {status === "draft" && (
              <Tooltip title="Đăng tin">
                <Button
                  type="primary"
                  size="small"
                  className="text-xs"
                  onClick={() =>
                    router.push(`/post/create?id=${propertyId}&mode=edit`)
                  }
                >
                  Đăng tin
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Tab items config
  const tabItems = tabs.map((tab: StatusCount) => {
    const statusKey = tab.id as PostStatus;
    const config = STATUS_CONFIG[statusKey];
    if (!config) return null;
    return {
      key: tab.id,
      label: (
        <span className="flex items-center gap-1.5">
          {config.icon}
          <span>{config.label}</span>
          <Badge
            count={tab.count}
            showZero
            size="small"
            color={
              tab.count === 0
                ? "#d9d9d9"
                : statusKey === "active"
                ? "#52c41a"
                : statusKey === "pending_approval"
                ? "#1890ff"
                : statusKey === "rejected"
                ? "#ff4d4f"
                : "#8c8c8c"
            }
            style={{ marginLeft: 4 }}
          />
        </span>
      ),
    };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  // Fallback tab items if statusCount hasn't loaded yet
  const defaultTabItems = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    key,
    label: (
      <span className="flex items-center gap-1.5">
        {config.icon}
        <span>{config.label}</span>
      </span>
    ),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Quản lý tin đăng
          </h2>
          <p className="text-sm text-gray-500">
            Tổng cộng{" "}
            <strong>
              {tabs.reduce((sum: number, t: StatusCount) => sum + (t.count || 0), 0)}
            </strong>{" "}
            tin đăng
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/post/create")}
          >
            Đăng tin mới
          </Button>
        </Space>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-lg">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as PostStatus)}
          items={tabItems.length > 0 ? tabItems : defaultTabItems}
          tabBarExtraContent={
            <Input
              placeholder="Tìm kiếm tin đăng..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-60"
              allowClear
            />
          }
          className="px-2"
          tabBarStyle={{ marginBottom: 0 }}
        />

        <Table
          dataSource={filteredProperties}
          columns={columns}
          loading={loadingPropertyStatus}
          rowKey={(record) => record.id || (record as any).propertyId || Math.random().toString()}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            showTotal: (total) => `Tổng ${total} tin đăng`,
          }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="py-8">
                    <p className="text-gray-500 mb-3">
                      {activeTab === "draft"
                        ? "Bạn chưa có tin nháp nào"
                        : activeTab === "pending_approval"
                        ? "Không có tin đăng nào đang chờ duyệt"
                        : activeTab === "active"
                        ? "Bạn chưa có tin đăng nào đang hiển thị"
                        : activeTab === "rented"
                        ? "Chưa có bất động sản nào đã cho thuê"
                        : activeTab === "rejected"
                        ? "Không có tin đăng nào bị từ chối"
                        : "Không có tin đăng nào cho trạng thái này"}
                    </p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => router.push("/post/create")}
                    >
                      Tạo tin đăng mới
                    </Button>
                  </div>
                }
              />
            ),
          }}
          className="[&_.ant-table-thead_th]:bg-gray-50! [&_.ant-table-thead_th]:text-gray-600! [&_.ant-table-thead_th]:font-medium! [&_.ant-table-thead_th]:text-xs! [&_.ant-table-thead_th]:uppercase!"
        />
      </div>
    </div>
  );
};

export default PostsPage;
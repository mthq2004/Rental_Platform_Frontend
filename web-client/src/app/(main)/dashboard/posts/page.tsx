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
  Modal,
  Alert,
  Divider,
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
  UploadOutlined,
  WalletOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getPostStatusCounts,
  getPropertiesByStatus,
  updatePropertyVisibility,
  type PropertyData,
  type StatusCount,
} from "@/stores/slices/property.slice";
import { checkEligibility } from "@/stores/slices/bulk-import.slice";
import { getWalletOverview } from "@/stores/slices/wallet.slice";
import { PROPERTY_META } from "@/constants/property.constant";
import type { PropertyType } from "@/types/property.type";
import apiClient from "@/utils/api";

const { Text, Paragraph, Title } = Typography;

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

  const walletOverview = useAppSelector((state) => state.wallet.overview);
  const [activeTab, setActiveTab] = useState<PostStatus>("active");
  const [searchText, setSearchText] = useState("");

  // States for Listing Expiry Renewal
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingProperty, setRenewingProperty] = useState<PropertyData | null>(null);
  const [feeConfig, setFeeConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submittingRenew, setSubmittingRenew] = useState(false);

  const bulkImportEligible = useAppSelector((s) => s.bulkImport.eligibility?.eligible);

  // Fetch status counts on mount
  useEffect(() => {
    dispatch(getPostStatusCounts());
    dispatch(checkEligibility());
    dispatch(getWalletOverview());
  }, [dispatch]);

  // Fetch properties when tab changes
  useEffect(() => {
    dispatch(getPropertiesByStatus(activeTab));
  }, [activeTab, dispatch]);

  // Refresh
  const handleRefresh = useCallback(() => {
    dispatch(getPostStatusCounts());
    dispatch(getPropertiesByStatus(activeTab));
    dispatch(getWalletOverview());
  }, [dispatch, activeTab]);

  // Handle Open Expiry Renew Modal
  const handleOpenRenewModal = async (record: PropertyData) => {
    setRenewingProperty(record);
    setIsRenewModalOpen(true);
    setLoadingConfig(true);
    dispatch(getWalletOverview());

    try {
      const type = record.propertyType;
      const res = await apiClient.get(`/estate/listing-fee/config/${type}`);
      if (res.data) {
        setFeeConfig(res.data);
      }
    } catch (err) {
      console.error("Error fetching listing fee config:", err);
      // Mặc định config nếu lỗi API hoặc chưa seed
      setFeeConfig({
        feeAmount: record.propertyType === "room" ? 50000 : 100000,
        durationDays: 30,
        freeTrialDays: 30,
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  // Submit Listing Expiry Renewal
  const handleSubmitRenew = async () => {
    if (!renewingProperty || !feeConfig) return;

    // Check balance
    const walletBalance = Number(walletOverview?.availableBalance || 0);
    const requiredAmount = Number(feeConfig.feeAmount || 0);

    if (walletBalance < requiredAmount) {
      message.error("Số dư ví của bạn không đủ. Vui lòng nạp thêm tiền vào ví.");
      return;
    }

    setSubmittingRenew(true);
    const propertyId = renewingProperty.id || (renewingProperty as any).propertyId;

    try {
      const res = await apiClient.post(`/estate/listing-fee/renew/${propertyId}`, {
        paymentMethod: "wallet",
      });

      if (res.data) {
        message.success("Gia hạn thời gian hiển thị tin đăng thành công!");
        setIsRenewModalOpen(false);
        setRenewingProperty(null);
        handleRefresh();
      }
    } catch (err: any) {
      console.error("Renewal failed:", err);
      message.error(err.response?.data?.message || err.message || "Gia hạn thất bại.");
    } finally {
      setSubmittingRenew(false);
    }
  };

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
      width: 350,
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
      width: 150,
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
      title: "Trạng thái hiển thị",
      key: "status",
      width: 170,
      render: (_, record) => {
        const status = (record.status as PostStatus) || "draft";
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        const expiry = (record as any).listingExpiresAt ? new Date((record as any).listingExpiresAt) : null;
        const isExpired = (record as any).isListingExpired;

        return (
          <div className="flex flex-col gap-0.5 w-full">
            <Tag color={isExpired ? "error" : config.color} icon={isExpired ? <ExclamationCircleOutlined /> : config.icon} className="text-xs m-0">
              {isExpired ? "Hết hạn đăng tin" : config.label}
            </Tag>
            {expiry && (
              <span className={`text-[11px] block whitespace-nowrap ${isExpired ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {isExpired ? 'Hết hạn: ' : 'Hạn hiển thị: '}
                {expiry.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: "Lượt xem",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 90,
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
      width: 110,
      render: (val) => <Text className="text-sm text-gray-500">{formatDate(val)}</Text>,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, record) => {
        const status = record.status as PostStatus;
        const propertyId = record.id || (record as any).propertyId;
        const isExpired = (record as any).isListingExpired;
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
            {(status === "draft" || status === "active" || status === "inactive" || status === "rejected" || isExpired) && (
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
            {(status === "active" || status === "inactive" || isExpired) && (
              <Tooltip title="Gia hạn tin đăng hiển thị">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined className="text-blue-500" />}
                  onClick={() => handleOpenRenewModal(record)}
                />
              </Tooltip>
            )}
            {(status === "active" || status === "inactive") && !isExpired && (
              <Tooltip title={status === "active" ? "Ẩn tin" : "Hiện tin"}>
                <Button
                  type="text"
                  size="small"
                  icon={status === "active" ? <StopOutlined /> : <CheckCircleOutlined />}
                  onClick={async () => {
                    try {
                      await dispatch(
                         updatePropertyVisibility({
                           id: propertyId,
                           visible: status !== "active",
                         }),
                      ).unwrap();
                      message.success(status === "active" ? "Đã ẩn tin" : "Đã hiển thị lại tin");
                      dispatch(getPostStatusCounts());
                    } catch (error) {
                      message.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái hiển thị");
                    }
                  }}
                />
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

  const walletBalance = Number(walletOverview?.availableBalance || 0);
  const renewFee = Number(feeConfig?.feeAmount || 0);
  const isBalanceEnough = walletBalance >= renewFee;

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
          {bulkImportEligible && (
            <Button
              icon={<UploadOutlined />}
              onClick={() => router.push("/dashboard/posts/bulk-import")}
            >
              Nhập Excel
            </Button>
          )}
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

      {/* Expiry Renewal Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 border-b pb-3 text-lg font-semibold">
            <CalendarOutlined className="text-blue-500" />
            <span>Gia hạn tin đăng hiển thị</span>
          </div>
        }
        open={isRenewModalOpen}
        onCancel={() => {
          setIsRenewModalOpen(false);
          setRenewingProperty(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsRenewModalOpen(false);
              setRenewingProperty(null);
            }}
          >
            Đóng
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<WalletOutlined />}
            loading={submittingRenew}
            disabled={loadingConfig || !isBalanceEnough}
            onClick={handleSubmitRenew}
          >
            Thanh toán & Gia hạn
          </Button>,
        ]}
        width={500}
        destroyOnHidden
      >
        <Spin spinning={loadingConfig}>
          {renewingProperty && (
            <div className="space-y-4 py-3">
              {/* Property Details */}
              <div className="bg-gray-50 p-3 rounded-lg border">
                <Text type="secondary" className="text-xs block mb-1">
                  Bất động sản gia hạn:
                </Text>
                <Title level={5} style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                  {renewingProperty.title}
                </Title>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Loại:{" "}
                    <Tag color="cyan" className="m-0 text-[11px]">
                      {PROPERTY_META[renewingProperty.propertyType as PropertyType]?.label || renewingProperty.propertyType}
                    </Tag>
                  </span>
                  {((renewingProperty as any).listingExpiresAt) && (
                    <span>
                      Hạn cũ: <strong>{formatDate((renewingProperty as any).listingExpiresAt)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Renewal Options / Pricing Config */}
              {feeConfig && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="border p-3 rounded-lg flex flex-col justify-center">
                    <Text type="secondary" className="text-xs block mb-1">
                      Thời gian gia hạn:
                    </Text>
                    <Text strong className="text-base text-gray-800">
                      {feeConfig.durationDays} ngày
                    </Text>
                  </div>
                  <div className="border p-3 rounded-lg flex flex-col justify-center">
                    <Text type="secondary" className="text-xs block mb-1">
                      Chi phí:
                    </Text>
                    <Text strong className="text-base text-red-500">
                      {renewFee.toLocaleString("vi-VN")} đ
                    </Text>
                  </div>
                </div>
              )}

              <Divider className="my-2" />

              {/* Payment Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <WalletOutlined />
                    <span>Số dư Ví sàn hiện tại:</span>
                  </span>
                  <Tag color={isBalanceEnough ? "success" : "error"} className="font-semibold text-sm px-2 py-0.5 m-0">
                    {walletBalance.toLocaleString("vi-VN")} đ
                  </Tag>
                </div>

                {!isBalanceEnough && (
                  <Alert
                    type="warning"
                    showIcon
                    title="Số dư không đủ"
                    description={
                      <div className="text-xs space-y-1.5 mt-1">
                        <div>
                          Bạn cần thêm{" "}
                          <strong>{(renewFee - walletBalance).toLocaleString("vi-VN")} đ</strong> để
                          thực hiện gia hạn tin đăng.
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            setIsRenewModalOpen(false);
                            router.push("/dashboard/wallet");
                          }}
                        >
                          Nạp tiền vào ví
                        </Button>
                      </div>
                    }
                  />
                )}

                {isBalanceEnough && (
                  <Alert
                    type="info"
                    showIcon
                    title="Thanh toán an toàn"
                    description="Chi phí sẽ được khấu trừ trực tiếp từ số dư ví sàn của bạn. Sau khi thanh toán, tin đăng hiển thị của bạn sẽ được tự động kích hoạt hiển thị ngay lập tức."
                    className="text-xs"
                  />
                )}
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default PostsPage;
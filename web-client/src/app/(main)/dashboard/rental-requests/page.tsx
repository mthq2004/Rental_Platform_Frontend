"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Tabs,
  Tag,
  Button,
  Empty,
  Typography,
  Modal,
  Input,
  App,
  Descriptions,
  Checkbox,
  Pagination,
} from "antd";
import {
  EyeOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  FileTextOutlined,
  SendOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getMyRequests,
  getOwnerRequests,
  reviewRequest,
  cancelRequest,
  openHoldingDepositWindow,
  payHoldingDeposit,
} from "@/stores/slices/contract.slice";
import type { RentalRequest, RentalRequestStatus } from "@/types/contract.type";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import TopupMethodModal, { type MethodOption } from "@/components/wallet/TopupMethodModal";

const { Text } = Typography;
const { TextArea } = Input;

// ====== Status config ======
const STATUS_CONFIG: Record<
  RentalRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: "Chờ xử lý", color: "processing", icon: <ClockCircleOutlined /> },
  under_review: { label: "Đang xem xét", color: "warning", icon: <EyeOutlined /> },
  approved: { label: "Chờ đặt cọc", color: "processing", icon: <ClockCircleOutlined /> },
  holding_deposit_open: { label: "Mở đặt cọc", color: "processing", icon: <ClockCircleOutlined /> },
  holding_deposit_paid: { label: "Đã đặt cọc", color: "success", icon: <CheckCircleOutlined /> },
  holding_deposit_locked: { label: "Đã có người giữ chỗ", color: "default", icon: <StopOutlined /> },
  holding_deposit_expired: { label: "Hết hạn đặt cọc", color: "default", icon: <ClockCircleOutlined /> },
  holding_deposit_refunded: { label: "Đã hoàn cọc", color: "default", icon: <CheckCircleOutlined /> },
  rejected: { label: "Đã từ chối", color: "error", icon: <CloseCircleOutlined /> },
  cancelled: { label: "Đã hủy", color: "default", icon: <StopOutlined /> },
  expired: { label: "Hết hạn", color: "default", icon: <ClockCircleOutlined /> },
  contract_created: { label: "Đã tạo HĐ", color: "cyan", icon: <FileTextOutlined /> },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("HH:mm DD/MM/YYYY");
};

const getHoldingDepositHelperText = (expiresAt?: string) => {
  if (!expiresAt) {
    return "Thời hạn giữ chỗ được hệ thống thiết lập theo loại bất động sản.";
  }

  return `Vui lòng thanh toán trước ${formatDateTime(expiresAt)} để giữ chỗ đúng hạn.`;
};

const formatHoldingDepositWindow = (expiresAt?: string) => {
  if (!expiresAt) return "trong thời gian hệ thống quy định";

  const diffMinutes = Math.max(1, Math.round(dayjs(expiresAt).diff(dayjs(), "minute", true)));

  if (diffMinutes >= 1440) {
    const days = Math.round(diffMinutes / 1440);
    return `${days} ngày`;
  }

  if (diffMinutes >= 60) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }

  return `${diffMinutes} phút`;
};

const normalizeRentMagnitude = (value: number): number => {
  if (value >= 1e11) {
    return value / 1e6;
  }
  return value;
};

const toNumberSafe = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? normalizeRentMagnitude(value) : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const dotGrouped = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed);
    const normalized = dotGrouped
      ? trimmed.replace(/\./g, "").replace(/,/g, ".")
      : trimmed.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? normalizeRentMagnitude(parsed) : null;
  }
  return null;
};

const formatCurrency = (amount: unknown) => {
  const numericAmount = toNumberSafe(amount);
  if (numericAmount === null) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(numericAmount);
};

const getStatusLabel = (status: RentalRequestStatus) =>
  STATUS_CONFIG[status]?.label || "—";

export default function RentalRequestsPage() {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const { myRequests, ownerRequests, requestsLoading, actionLoading } =
    useAppSelector((state) => state.contract);

  const [activeTab, setActiveTab] = useState<"my" | "received">("my");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [landlordNotes, setLandlordNotes] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState("vnpay");
  const [payingRequest, setPayingRequest] = useState<RentalRequest | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const router = useRouter();

  useEffect(() => {
    dispatch(getMyRequests());
    dispatch(getOwnerRequests());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(getMyRequests());
    dispatch(getOwnerRequests());
  }, [dispatch]);

  const handleViewDetail = (record: RentalRequest) => {
    setSelectedRequest(record);
    setDetailOpen(true);
  };

  const handleReview = async (
    requestId: string,
    status: "under_review" | "rejected"
  ) => {
    if (status === "rejected" && !rejectReason.trim()) {
      return message.warning("Vui lòng nhập lý do từ chối");
    }

    try {
      await dispatch(
        reviewRequest({
          requestId,
          data: {
            status,
            rejectionReason: status === "rejected" ? rejectReason : undefined,
            landlordNotes: landlordNotes || undefined,
          },
        })
      ).unwrap();

      message.success(
        status === "rejected"
          ? "Đã từ chối yêu cầu"
          : "Đã chuyển sang trạng thái xem xét"
      );

      setDetailOpen(false);
      setRejectReason("");
      setLandlordNotes("");
      handleRefresh();

    } catch (err: any) {
      message.error(err || "Thao tác thất bại");
    }
  };

  const handleOpenHoldingDeposit = async (requestIds: string[]) => {
    if (requestIds.length === 0) return;

    try {
      const result = await dispatch(
        openHoldingDepositWindow({ requestIds })
      ).unwrap();
      const payload = (result as any)?.data ?? result ?? {};
      const expiresAt = payload?.expiresAt;

      message.success(`Đã mở đặt cọc giữ chỗ ${formatHoldingDepositWindow(expiresAt)}`);
      setDetailOpen(false);
      setSelectedRowKeys([]);
      handleRefresh();
    } catch (err: any) {
      message.error(err || "Mở đặt cọc thất bại");
    }
  };

  const confirmOpenHoldingDeposit = (requestIds: string[]) => {
    const countLabel = requestIds.length === 1 ? "1 yêu cầu" : `${requestIds.length} yêu cầu`;

    modal.confirm({
      title: "Xác nhận mở đặt cọc giữ chỗ",
      icon: <ExclamationCircleOutlined />,
      content: (
        <div className="space-y-1">
          <div>Bạn sắp mở đặt cọc cho {countLabel}.</div>
          <div>Thời hạn giữ chỗ sẽ được hệ thống tự động thiết lập theo loại bất động sản.</div>
        </div>
      ),
      okText: "Xác nhận mở",
      okType: "primary",
      cancelText: "Đóng",
      onOk: () => handleOpenHoldingDeposit(requestIds),
    });
  };

  const handleOpenHoldingDepositForSelection = () => {
    const selected = ownerRequests.filter((req) =>
      selectedRowKeys.includes(req.requestId)
    );
    const propertyIds = Array.from(
      new Set(selected.map((req) => req.propertyId))
    );

    if (selected.length === 0) {
      message.warning("Bạn chưa chọn yêu cầu nào");
      return;
    }

    if (propertyIds.length > 1) {
      message.warning("Chỉ được mở đặt cọc cho cùng một bất động sản");
      return;
    }

    const invalid = selected.filter(
      (req) => !["pending", "under_review"].includes(req.status)
    );
    if (invalid.length > 0) {
      message.warning("Có yêu cầu không hợp lệ để mở đặt cọc");
      return;
    }

    confirmOpenHoldingDeposit(selected.map((req) => req.requestId));
  };

  const handleOpenPayModal = (request: RentalRequest) => {
    setPayingRequest(request);
    setPayMethod("vnpay");
    setPayModalOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!payingRequest) return;

    try {
      const result = await dispatch(
        payHoldingDeposit({ requestId: payingRequest.requestId, method: payMethod })
      ).unwrap();

      const payload = (result as any)?.data ?? result ?? {};
      const redirectUrl = payload?.paymentUrl || payload?.redirectUrl || payload?.payUrl;

      message.success("Đã tạo thanh toán giữ chỗ");
      setPayModalOpen(false);
      setPayingRequest(null);
      handleRefresh();

      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      message.error(err || "Thanh toán giữ chỗ thất bại");
    }
  };

  const ownerRequestCounts = useMemo(() => {
    const map = new Map<string, number>();
    ownerRequests.forEach((req) => {
      map.set(req.propertyId, (map.get(req.propertyId) || 0) + 1);
    });
    return map;
  }, [ownerRequests]);

  const getPropertyLabel = (request: RentalRequest) =>
    request.property?.title || request.propertyId || "—";

  const getPropertyAddress = (request: RentalRequest) =>
    request.property?.address || "";

  const getPropertyImage = (request: RentalRequest) =>
    request.property?.imageUrl || "";

  const summaryItems = useMemo(() => {
    if (activeTab === "my") {
      const counts = myRequests.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      return [
        {
          key: "total",
          title: "Tổng yêu cầu",
          value: myRequests.length,
          icon: <TeamOutlined />,
        },
        {
          key: "pending",
          title: "Chờ xử lý",
          value: counts.pending || 0,
          icon: <ClockCircleOutlined />,
        },
        {
          key: "holding",
          title: "Đang giữ chỗ",
          value: (counts.holding_deposit_open || 0) + (counts.holding_deposit_paid || 0),
          icon: <ThunderboltOutlined />,
        },
        {
          key: "closed",
          title: "Đã chốt/khóa",
          value: (counts.holding_deposit_locked || 0) + (counts.contract_created || 0),
          icon: <CheckCircleOutlined />,
        },
      ];
    }

    const counts = ownerRequests.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return [
      {
        key: "total",
        title: "Tổng yêu cầu",
        value: ownerRequests.length,
        icon: <TeamOutlined />,
      },
      {
        key: "pending",
        title: "Chờ xử lý",
        value: (counts.pending || 0) + (counts.under_review || 0),
        icon: <ClockCircleOutlined />,
      },
      {
        key: "holding",
        title: "Đang giữ chỗ",
        value: (counts.holding_deposit_open || 0) + (counts.holding_deposit_paid || 0),
        icon: <ThunderboltOutlined />,
      },
      {
        key: "closed",
        title: "Đã chốt/khóa",
        value: (counts.holding_deposit_locked || 0) + (counts.contract_created || 0),
        icon: <CheckCircleOutlined />,
      },
    ];
  }, [activeTab, myRequests, ownerRequests]);

  const HOLDING_PAYMENT_OPTIONS: MethodOption[] = [
    { value: "momo", label: "MoMo", description: "Thanh toán nhanh bằng ứng dụng MoMo." },
    { value: "vnpay", label: "VNPay", description: "Chuyển sang cổng thanh toán VNPay." },
    { value: "zalopay", label: "ZaloPay", description: "Thanh toán bằng ví ZaloPay." },
    { value: "bank_transfer", label: "Chuyển khoản ngân hàng", description: "Hiển thị thông tin chuyển khoản ngân hàng." },
    { value: "wallet", label: "Ví nội bộ", description: "Thanh toán nhanh bằng số dư ví nội bộ." },
  ];


  const handleCancel = (requestId: string) => {
    modal.confirm({
      title: "Hủy yêu cầu thuê",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn hủy yêu cầu này?",
      okText: "Hủy yêu cầu",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        try {
          await dispatch(cancelRequest(requestId)).unwrap();
          message.success("Đã hủy yêu cầu");
          handleRefresh();
        } catch (err: any) {
          message.error(err || "Hủy thất bại");
        }
      },
    });
  };

  const data = activeTab === "my" ? myRequests : ownerRequests;

  const ownerGroups = useMemo(() => {
    const map = new Map<
      string,
      { propertyId: string; property: RentalRequest["property"] | null; requests: RentalRequest[] }
    >();

    ownerRequests.forEach((req) => {
      const existing = map.get(req.propertyId);
      if (existing) {
        existing.requests.push(req);
      } else {
        map.set(req.propertyId, {
          propertyId: req.propertyId,
          property: req.property ?? null,
          requests: [req],
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const aTime = a.requests[0]?.createdAt ? new Date(a.requests[0].createdAt).getTime() : 0;
      const bTime = b.requests[0]?.createdAt ? new Date(b.requests[0].createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [ownerRequests]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, data.length]);

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const pagedOwnerGroups = useMemo(() => {
    const start = (page - 1) * pageSize;
    return ownerGroups.slice(start, start + pageSize);
  }, [ownerGroups, page, pageSize]);

  const totalItems = activeTab === "my" ? data.length : ownerGroups.length;

  const statusBadge = (status: RentalRequestStatus) => {
    const label = getStatusLabel(status);
    const config = {
      pending: "bg-blue-50 text-blue-700 ring-blue-100",
      under_review: "bg-blue-50 text-blue-700 ring-blue-100",
      holding_deposit_open: "bg-blue-50 text-blue-700 ring-blue-100",
      holding_deposit_expired: "bg-slate-100 text-slate-500 ring-slate-200",
      expired: "bg-slate-100 text-slate-500 ring-slate-200",
      holding_deposit_locked: "bg-slate-100 text-slate-500 ring-slate-200",
      holding_deposit_paid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      contract_created: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      rejected: "bg-rose-50 text-rose-700 ring-rose-100",
      cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
      holding_deposit_refunded: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      approved: "bg-blue-50 text-blue-700 ring-blue-100",
    } as Record<string, string>;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${config[status] || "bg-slate-100 text-slate-500 ring-slate-200"}`}
      >
        <InfoCircleOutlined className="text-[10px]" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white px-6 py-6 shadow-sm">
        <div className="absolute inset-0">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#FFE8D6] opacity-70 blur-3xl" />
          <div className="absolute -left-10 top-8 h-48 w-48 rounded-full bg-[#D7E8FF] opacity-80 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
              <FileTextOutlined /> Quy trình thuê
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#0F172A]">
              Yêu cầu thuê nhà
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#475569]">
              Tập trung quản lý ứng viên, giữ chỗ và hợp đồng theo đúng quy trình doanh nghiệp.
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={requestsLoading}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.key} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[#64748B]">{item.title}</div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF2FF] text-[#3B82F6]">
                {item.icon}
              </div>
            </div>
            <div className="mt-3 text-2xl font-semibold text-[#0F172A]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs + Cards */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "my" | "received")}
          items={[
            {
              key: "my",
              label: (
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${activeTab === "my" ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#6B7280]"
                    }`}
                >
                  <SendOutlined />
                  Yêu cầu của tôi
                  <Tag className="ml-1">{myRequests.length}</Tag>
                </span>
              ),
            },
            {
              key: "received",
              label: (
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition ${activeTab === "received" ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-[#6B7280]"
                    }`}
                >
                  <FileTextOutlined />
                  Yêu cầu nhận được
                  <Tag className="ml-1">{ownerRequests.length}</Tag>
                </span>
              ),
            },
          ]}
          className="px-2"
          tabBarStyle={{ marginBottom: 0 }}
        />

        {activeTab === "received" && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b">
            <div className="text-sm text-gray-600">
              Đã chọn <Text strong>{selectedRowKeys.length}</Text> yêu cầu
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                disabled={selectedRowKeys.length === 0}
                onClick={handleOpenHoldingDepositForSelection}
                loading={actionLoading}
              >
                Mở đặt cọc giữ chỗ
              </Button>
              <Button
                disabled={selectedRowKeys.length === 0}
                onClick={() => setSelectedRowKeys([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        <div className="px-4 pb-5 pt-4">
          {requestsLoading ? (
            <div className="py-10 text-center text-sm text-[#6B7280]">Đang tải dữ liệu...</div>
          ) : (activeTab === "my" ? pagedData.length === 0 : pagedOwnerGroups.length === 0) ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                activeTab === "my"
                  ? "Bạn chưa có yêu cầu thuê nào"
                  : "Bạn chưa nhận được yêu cầu thuê nào"
              }
            />
          ) : (
            <div className="space-y-4">
              {activeTab === "my"
                ? pagedData.map((record) => (
                  // Thay thế toàn bộ nội dung bên trong pagedData.map((record) => (...))
                  <div
                    key={record.requestId}
                    className="group rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:border-[#C7D2FE] hover:shadow-md"
                  >
                    {/* Header: ảnh + tên property + badge trạng thái */}
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F3F4F6]">
                        {getPropertyImage(record) ? (
                          <img src={getPropertyImage(record)} alt={getPropertyLabel(record)} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]"><HomeOutlined /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#111827]">{getPropertyLabel(record)}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]">
                          <EnvironmentOutlined />
                          <span className="truncate">{getPropertyAddress(record) || "Chưa cập nhật địa chỉ"}</span>
                        </div>
                        <div className="mt-1 text-xs text-[#6B7280]">
                          <span className="font-medium text-[#4B5563]">Mã yêu cầu:</span> {record.requestCode}
                        </div>
                        <div className="mt-2">{statusBadge(record.status)}</div>
                      </div>
                    </div>

                    {/* Meta grid — luôn nằm dưới, full width */}
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.1em] text-[#94A3B8]">Giá đề xuất</div>
                        <div className="mt-1 text-sm font-semibold text-[#4F46E5]">{formatCurrency(record.proposedRent)}</div>
                      </div>
                      <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.1em] text-[#94A3B8]">Thời hạn thuê</div>
                        <div className="mt-1 text-xs text-[#111827]">{formatDate(record.startDate)} → {formatDate(record.endDate)}</div>
                      </div>
                      <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.1em] text-[#94A3B8]">Hạn đặt cọc</div>
                        <div className="mt-1 text-xs text-[#111827]">{record.holdingDepositExpiresAt ? formatDateTime(record.holdingDepositExpiresAt) : "—"}</div>
                      </div>
                      <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                        <div className="text-[10px] uppercase tracking-[0.1em] text-[#94A3B8]">Ngày tạo</div>
                        <div className="mt-1 text-xs text-[#111827]">{formatDate(record.createdAt)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="middle" className="rounded-lg border-[#E2E8F0]" onClick={() => handleViewDetail(record)}>
                        Xem chi tiết
                      </Button>
                      {(record.status === "approved" || record.status === "holding_deposit_open") && (
                        <Button type="primary" size="middle" className="rounded-lg" style={{ background: "#4F46E5", borderColor: "#4F46E5" }} onClick={() => handleOpenPayModal(record)}>
                          Đặt cọc
                        </Button>
                      )}
                      {(record.status === "pending" || record.status === "under_review") && (
                        <Button danger size="middle" className="rounded-lg" onClick={() => handleCancel(record.requestId)}>
                          Hủy yêu cầu
                        </Button>
                      )}
                    </div>
                  </div>
                ))
                : pagedOwnerGroups.map((group) => {
                  const groupLabel = group.property?.title || group.propertyId || "—";
                  const groupAddress = group.property?.address || "";
                  const groupImage =
                    group.property?.imageUrl ||
                    group.requests.find((req) => req.property?.imageUrl)?.property?.imageUrl ||
                    "";

                  const statusOrder: RentalRequestStatus[] = [
                    "contract_created",
                    "holding_deposit_locked",
                    "holding_deposit_paid",
                    "holding_deposit_open",
                    "under_review",
                    "pending",
                  ];
                  const topStatus =
                    statusOrder.find((status) => group.requests.some((req) => req.status === status)) ||
                    group.requests[0]?.status;

                  return (
                    <div key={group.propertyId} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F3F4F6]">
                            {groupImage ? (
                              <img
                                src={groupImage}
                                alt={groupLabel}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#9CA3AF]">
                                <HomeOutlined />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="text-base font-semibold text-[#111827]">{groupLabel}</div>
                              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                <EnvironmentOutlined />
                                <span>{groupAddress || "Chưa cập nhật địa chỉ"}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {topStatus ? statusBadge(topStatus) : null}
                              <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                                {group.requests.length} yêu cầu
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {group.requests.map((record) => (
                          <div
                            key={record.requestId}
                            className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                                <div className="pt-1">
                                  <Checkbox
                                    checked={selectedRowKeys.includes(record.requestId)}
                                    disabled={!['pending', 'under_review'].includes(record.status)}
                                    onChange={(event) => {
                                      const checked = event.target.checked;
                                      setSelectedRowKeys((prev) =>
                                        checked
                                          ? [...prev, record.requestId]
                                          : prev.filter((id) => id !== record.requestId)
                                      );
                                    }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <div className="text-xs text-[#6B7280]">
                                    <span className="font-medium text-[#4B5563]">Mã yêu cầu:</span> {record.requestCode}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {statusBadge(record.status)}
                                  </div>
                                </div>

                                <div className="flex-1">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
                                      <div className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">Giá đề xuất</div>
                                      <div className="text-sm font-semibold text-[#4F46E5]">{formatCurrency(record.proposedRent)}</div>
                                    </div>
                                    <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
                                      <div className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">Thời hạn thuê</div>
                                      <div className="flex items-center gap-2 text-sm text-[#111827]">
                                        <CalendarOutlined className="text-[#06B6D4]" />
                                        {formatDate(record.startDate)} → {formatDate(record.endDate)}
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
                                      <div className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">Hạn đặt cọc</div>
                                      <div className="text-sm text-[#111827]">
                                        {record.holdingDepositExpiresAt ? formatDateTime(record.holdingDepositExpiresAt) : "—"}
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
                                      <div className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">Ngày tạo</div>
                                      <div className="text-sm text-[#111827]">{formatDate(record.createdAt)}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
                                <Button
                                  type="default"
                                  size="middle"
                                  className="rounded-lg border-[#E2E8F0] text-[#111827]"
                                  onClick={() => handleViewDetail(record)}
                                >
                                  Xem chi tiết
                                </Button>

                                {record.status === "holding_deposit_paid" && (
                                  <Button
                                    type="primary"
                                    size="middle"
                                    className="rounded-lg"
                                    style={{ background: "#4F46E5", borderColor: "#4F46E5" }}
                                    onClick={() => router.push(`/template-contracts?requestId=${record.requestId}`)}
                                  >
                                    Tạo hợp đồng
                                  </Button>
                                )}

                                {record.status === "contract_created" && (
                                  <Button
                                    size="middle"
                                    className="rounded-lg"
                                    onClick={() => router.push(`/template-contracts/${record.contract?.templateId}?requestId=${record.requestId}`)}
                                  >
                                    Chỉnh sửa HĐ
                                  </Button>
                                )}

                                {(record.status === "pending" || record.status === "under_review") && (
                                  <div className="flex gap-2">
                                    <Button
                                      type="primary"
                                      size="middle"
                                      className="rounded-lg"
                                      style={{ background: "#4F46E5", borderColor: "#4F46E5" }}
                                      onClick={() => confirmOpenHoldingDeposit([record.requestId])}
                                      loading={actionLoading}
                                    >
                                      Mở đặt cọc
                                    </Button>
                                    <Button
                                      size="middle"
                                      danger
                                      className="rounded-lg"
                                      onClick={() => {
                                        setSelectedRequest(record);
                                        setDetailOpen(true);
                                      }}
                                    >
                                      Từ chối
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {totalItems > pageSize && (
            <div className="mt-6 flex justify-end">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={totalItems}
                showSizeChanger
                pageSizeOptions={[6, 12, 24]}
                onChange={(next, size) => {
                  setPage(next);
                  if (size) setPageSize(size);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail / Review Modal */}
      <Modal
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedRequest(null);
          setRejectReason("");
          setLandlordNotes("");
        }}
        title="Chi tiết yêu cầu thuê"
        footer={null}
        width={640}
        destroyOnHidden
      >
        {selectedRequest && (
          <div className="space-y-4 pt-2">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Bất động sản" span={2}>
                <Text strong>{getPropertyLabel(selectedRequest)}</Text>
                {getPropertyAddress(selectedRequest) && (
                  <div className="text-xs text-gray-500">{getPropertyAddress(selectedRequest)}</div>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Mã yêu cầu" span={2}>
                <Text strong>{selectedRequest.requestCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(selectedRequest.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {formatDate(selectedRequest.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Giá đề xuất" span={2}>
                <Text strong className="text-red-500">
                  {formatCurrency(selectedRequest.proposedRent)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                {(() => {
                  const cfg = STATUS_CONFIG[selectedRequest.status];
                  return (
                    <Tag color={cfg.color} icon={cfg.icon}>
                      {cfg.label}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
              {selectedRequest.holdingDepositAmount != null && (
                <Descriptions.Item label="Tiền giữ chỗ" span={2}>
                  <Text strong className="text-red-500">
                    {formatCurrency(selectedRequest.holdingDepositAmount)}
                  </Text>
                </Descriptions.Item>
              )}
              {selectedRequest.holdingDepositExpiresAt && (
                <Descriptions.Item label="Hạn đặt cọc" span={2}>
                  {formatDateTime(selectedRequest.holdingDepositExpiresAt)}
                </Descriptions.Item>
              )}
              {selectedRequest.message && (
                <Descriptions.Item label="Lời nhắn" span={2}>
                  {selectedRequest.message}
                </Descriptions.Item>
              )}
              {selectedRequest.rejectionReason && (
                <Descriptions.Item label="Lý do từ chối" span={2}>
                  <Text type="danger">{selectedRequest.rejectionReason}</Text>
                </Descriptions.Item>
              )}
              {selectedRequest.landlordNotes && (
                <Descriptions.Item label="Ghi chú chủ nhà" span={2}>
                  {selectedRequest.landlordNotes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Owner review actions */}
            {activeTab === "received" &&
              (selectedRequest.status === "pending" ||
                selectedRequest.status === "under_review") && (
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="font-medium text-gray-700">Xem xét yêu cầu</h4>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Ghi chú (tùy chọn)</label>
                    <TextArea
                      rows={2}
                      value={landlordNotes}
                      onChange={(e) => setLandlordNotes(e.target.value)}
                      placeholder="Ghi chú cho người thuê..."
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Lý do từ chối (bắt buộc nếu từ chối)</label>
                    <TextArea
                      rows={2}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      danger
                      loading={actionLoading}
                      onClick={() => handleReview(selectedRequest.requestId, "rejected")}
                    >
                      Từ chối
                    </Button>
                    <Button
                      type="primary"
                      loading={actionLoading}
                      onClick={() => confirmOpenHoldingDeposit([selectedRequest.requestId])}
                    >
                      Mở đặt cọc giữ chỗ
                    </Button>
                  </div>
                </div>
              )}

            {/* Approved / Contract Created -> Edit contract (if already reviewed) */}
            {activeTab === "received" &&
              (selectedRequest.status === "holding_deposit_paid" ||
                selectedRequest.status === "contract_created") && (
                <div className="flex justify-end pt-3 border-t">
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={() => {
                      setDetailOpen(false);
                      router.push(
                        `/template-contracts?requestId=${selectedRequest.requestId}`
                      );
                    }}
                  >
                    Tạo hợp đồng
                  </Button>
                </div>
              )}

            {activeTab === "my" &&
              (selectedRequest.status === "approved" ||
                selectedRequest.status === "holding_deposit_open") && (
                <div className="flex justify-end pt-3 border-t">
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleOpenPayModal(selectedRequest)}
                  >
                    Đặt cọc giữ chỗ
                  </Button>
                </div>
              )}
          </div>
        )}
      </Modal>

      <TopupMethodModal
        open={payModalOpen}
        amount={payingRequest?.holdingDepositAmount ?? null}
        selectedMethod={payMethod}
        loading={actionLoading}
        title="Đặt cọc giữ chỗ"
        amountLabel="Tiền giữ chỗ"
        helperText={getHoldingDepositHelperText(payingRequest?.holdingDepositExpiresAt)}
        confirmText="Thanh toán giữ chỗ"
        options={HOLDING_PAYMENT_OPTIONS}
        onCancel={() => {
          setPayModalOpen(false);
          setPayingRequest(null);
        }}
        onBack={() => {
          setPayModalOpen(false);
          setPayingRequest(null);
        }}
        onConfirm={handleConfirmPay}
        onChangeMethod={setPayMethod}
      />
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { App, Avatar, Button, Card, Col, DatePicker, Descriptions, Divider, Empty, Form, Input, InputNumber, Modal, Progress, Row, Select, Space, Spin, Tag, Timeline, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  HomeOutlined,
  MessageOutlined,
  ReloadOutlined,
  WalletOutlined,
  DollarOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  activateContract,
  cancelContract,
  clearContractDetail,
  confirmPayment,
  getContractDetail,
  getInvoicePayments,
  getMyPayments,
  createTerminationRequest,
  getTerminationRequests,
  reviewTerminationRequest,
  createReport,
  getReportsByContract,
  updateReportStatus,
} from "@/stores/slices/contract.slice";
import { createConversation } from "@/stores/slices/conversation.slice";
import { getPropertyDetailThunk } from "@/stores/slices/estate.slice";
import type {
  Payment,
  PaymentStatus,
  RentalContract,
  RentalContractStatus,
  TerminationReason,
  TerminationRequest,
  ReportItem,
  ReportPriority,
  ReportStatus,
  ReportType,
} from "@/types/contract.type";
import type { UserType } from "@/types/user.type";
import type { PropertyDetailApiData } from "@/types/property.type";
import { STATUS_CONFIG, formatCurrency, formatDate } from "@/components/contracts/ContractStatusConfig";
import TopupMethodModal, { type MethodOption } from "@/components/wallet/TopupMethodModal";
import InvoiceModal from "@/components/payments/InvoiceModal";
import http from "@/utils/api";

const { Text, Paragraph } = Typography;

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: "Chờ thanh toán", color: "processing", icon: <ClockCircleOutlined /> },
  paid: { label: "Đã thanh toán", color: "success", icon: <CheckCircleOutlined /> },
  overdue: { label: "Quá hạn", color: "error", icon: <ExclamationCircleOutlined /> },
  partial: { label: "Thanh toán một phần", color: "warning", icon: <ExclamationCircleOutlined /> },
  cancelled: { label: "Đã hủy", color: "default", icon: <ExclamationCircleOutlined /> },
  refunded: { label: "Đã hoàn tiền", color: "purple", icon: <DollarOutlined /> },
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  rent: "Tiền thuê",
  deposit: "Tiền cọc",
  electricity: "Tiền điện",
  water: "Tiền nước",
  internet: "Internet",
  parking: "Giữ xe",
  management_fee: "Phí quản lý",
  service_fee: "Phí dịch vụ",
  late_fee: "Phí trễ hạn",
  damage_fee: "Phí hư hỏng",
  early_termination: "Phí chấm dứt sớm",
  other: "Khác",
};

const PAYMENT_METHOD_OPTIONS: MethodOption[] = [
  { value: "momo", label: "MoMo", description: "Thanh toán nhanh bằng ứng dụng MoMo." },
  { value: "vnpay", label: "VNPay", description: "Chuyển sang cổng thanh toán VNPay." },
  { value: "zalopay", label: "ZaloPay", description: "Thanh toán bằng ví ZaloPay." },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng", description: "Hiển thị thông tin chuyển khoản ngân hàng." },
  { value: "other", label: "Ví nội bộ của bạn", description: "Thanh toán bằng số dư ví nội bộ trong hệ thống." },
];

const TERMINATION_REASON_LABELS: Record<TerminationReason, string> = {
  lease_end: "Hết hạn hợp đồng",
  unilateral_termination: "Đơn phương chấm dứt",
  mutual_agreement: "Hai bên thỏa thuận",
  breach_of_contract: "Vi phạm hợp đồng (sử dụng sai mục đích, làm hư hỏng)",
  non_payment: "Không thanh toán (quá hạn)",
  force_majeure: "Bất khả kháng",
  other: "Khác",
};

const TERMINATION_REASON_OPTIONS = Object.entries(TERMINATION_REASON_LABELS).map(
  ([value, label]) => ({ value, label })
);

const getTerminationPolicyHint = (reason?: TerminationReason) => {
  if (!reason) return "";

  if (reason === "unilateral_termination") {
    return "Bên đơn phương chấm dứt sẽ mất tiền cọc.";
  }

  if (reason === "breach_of_contract") {
    return "Bên vi phạm chịu mất tiền cọc và có thể phải trả thêm phí chấm dứt (nếu có).";
  }

  if (reason === "non_payment") {
    return "Không thanh toán: tiền cọc bị tịch thu để bù công nợ.";
  }

  if (reason === "force_majeure" || reason === "mutual_agreement") {
    return "Bất khả kháng/Thỏa thuận: tiền cọc hoàn lại cho người thuê.";
  }

  if (reason === "lease_end") {
    return "Hết hạn: tiền cọc hoàn lại cho người thuê.";
  }

  return "Tiền cọc và phí chấm dứt xử lý theo thỏa thuận hai bên.";
};

const TERMINATION_STATUS_LABELS: Record<TerminationRequest["status"], { label: string; color: string }> = {
  pending: { label: "Đang chờ", color: "processing" },
  approved: { label: "Đã chấp thuận", color: "success" },
  rejected: { label: "Bị từ chối", color: "error" },
  cancelled: { label: "Đã hủy", color: "default" },
};

const REPORT_STATUS_LABELS: Record<ReportStatus, { label: string; color: string }> = {
  open: { label: "Mới tạo", color: "processing" },
  negotiating: { label: "Đang thương lượng", color: "warning" },
  admin: { label: "Chờ admin xử lý", color: "purple" },
  resolved: { label: "Đã giải quyết", color: "success" },
};

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  payment: "Thanh toán",
  deposit: "Tiền cọc",
  property: "Tài sản",
  contract: "Hợp đồng",
  other: "Khác",
};

const REPORT_PRIORITY_OPTIONS: Array<{ value: ReportPriority; label: string }> = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
];

const SIGNATURE_ACTION_LABELS: Record<string, string> = {
  CREATED: "Khởi tạo hợp đồng",
  SENT_TO_TENANT: "Gửi hợp đồng cho người thuê",
  SIGN_REQUESTED: "Yêu cầu ký hợp đồng",
  TENANT_SIGNED: "Người thuê đã ký xác nhận",
  LANDLORD_SIGNED: "Chủ nhà đã ký xác nhận",
  SIGNED_SUCCESS: "Ký hợp đồng thành công",
  ACTIVATED: "Hợp đồng đã được kích hoạt",
  CANCELLED: "Hợp đồng bị hủy",
  BLOCKCHAIN_FAILED: "Lỗi ghi nhận blockchain",
};

const formatMoney = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(parsed);
};

const getPropertyImage = (property?: PropertyDetailApiData | null) => property?.images?.[0]?.uri || null;

const getPropertyTitle = (property?: PropertyDetailApiData | null) => property?.title || "Bất động sản";

const getPropertyAddress = (property?: PropertyDetailApiData | null) =>
  [property?.address, property?.ward, property?.district, property?.city].filter(Boolean).join(", ") || "Chưa có địa chỉ";

const getUserDisplayName = (user?: { fullName?: string; name?: string } | null) =>
  user?.fullName || user?.name || "Chưa có thông tin";

const getInitials = (name?: string | null) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const getUserPhone = (user?: { phone?: string | null; phoneRaw?: string | null } | null, showRaw = false) => {
  if (!user) return "Chưa có SĐT";
  if (showRaw) return user.phoneRaw || user.phone || "Chưa có SĐT";
  return user.phone || user.phoneRaw || "Chưa có SĐT";
};

const normalizeUser = (payload?: UserType | null) => {
  if (!payload) return null;
  return {
    fullName: payload.fullName,
    phone: payload.phone,
    phoneRaw: payload.phone ?? undefined,
    avatarUrl: payload.avatarUrl ?? undefined,
  };
};

const getPaymentStatus = (payment?: Payment | null) => {
  if (!payment) {
    return { label: "Chưa phát sinh", color: "default", icon: <ClockCircleOutlined /> };
  }
  return PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.pending;
};

const getCurrentPayment = (payments: Payment[]) => {
  const sorted = [...payments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return (
    sorted.find((payment) => ["pending", "overdue", "partial"].includes(payment.status)) ||
    sorted.find((payment) => payment.status === "paid") ||
    null
  );
};

const getContractProgress = (contract?: RentalContract | null) => {
  if (!contract) return 0;
  const totalDays = dayjs(contract.endDate).diff(dayjs(contract.startDate), "day");
  if (totalDays <= 0) return 0;
  const passedDays = dayjs().diff(dayjs(contract.startDate), "day");
  return Math.max(0, Math.min(100, Math.round((passedDays / totalDays) * 100)));
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { message, modal } = App.useApp();
  const contractId = params?.id?.toString() || "";

  const { user } = useAppSelector((state) => state.auth);
  const {
    contractDetail,
    contractsLoading,
    payments,
    paymentsLoading,
    actionLoading,
    invoicePayments,
    invoicePaymentsLoading,
    terminationRequests,
    terminationLoading,
    terminationActionLoading,
    reports,
    reportsLoading,
    reportActionLoading,
  } = useAppSelector((state) => state.contract);
  const { detail: propertyDetail } = useAppSelector((state) => state.estate);

  const [payOpen, setPayOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("other");
  const [terminationOpen, setTerminationOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedTermination, setSelectedTermination] = useState<TerminationRequest | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState<Payment | null>(null);
  const [terminationForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm] = Form.useForm();
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [showTenantPhone, setShowTenantPhone] = useState(false);
  const [showOwnerPhone, setShowOwnerPhone] = useState(false);
  const [tenantUser, setTenantUser] = useState<ReturnType<typeof normalizeUser> | null>(null);
  const [ownerUser, setOwnerUser] = useState<ReturnType<typeof normalizeUser> | null>(null);

  useEffect(() => {
    if (!contractId) return;

    dispatch(getContractDetail(contractId));
    dispatch(getMyPayments({ rentalId: contractId, page: 1 }));
    dispatch(getTerminationRequests(contractId));
    dispatch(getReportsByContract(contractId));

    return () => {
      dispatch(clearContractDetail());
    };
  }, [contractId, dispatch]);

  useEffect(() => {
    const propertyId = contractDetail?.propertyId;
    if (!propertyId) return;
    dispatch(getPropertyDetailThunk(propertyId));
  }, [contractDetail?.propertyId, dispatch]);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async (userId?: string, setter?: (value: ReturnType<typeof normalizeUser> | null) => void) => {
      if (!userId || !setter) return;
      try {
        const response = await http.get(`/estate/user/${userId}`);
        const payload = (response as any)?.data ?? response;
        if (!isMounted) return;
        setter(normalizeUser(payload));
      } catch {
        if (!isMounted) return;
        setter(null);
      }
    };

    fetchUser(contractDetail?.tenantId, setTenantUser);
    fetchUser(contractDetail?.ownerId, setOwnerUser);

    return () => {
      isMounted = false;
    };
  }, [contractDetail?.ownerId, contractDetail?.tenantId]);

  const contract = contractDetail;
  const property = propertyDetail.data;
  const paymentItems = useMemo(
    () => (Array.isArray(payments) ? payments.filter((payment) => payment.rentalId === contractId) : []),
    [contractId, payments]
  );
  const currentPayment = useMemo(() => getCurrentPayment(paymentItems), [paymentItems]);
  const paidCount = paymentItems.filter((payment) => payment.status === "paid").length;
  const paymentProgress = paymentItems.length ? Math.round((paidCount / paymentItems.length) * 100) : 0;
  const contractStatus = contract ? (STATUS_CONFIG[contract.status as RentalContractStatus] || STATUS_CONFIG.draft) : null;
  const paymentStatus = getPaymentStatus(currentPayment);
  const isTenantSide = contract?.tenantId === user?.id;
  const isOwnerSide = contract?.ownerId === user?.id;
  const canPay = Boolean(isTenantSide && currentPayment && ["pending", "overdue", "partial"].includes(currentPayment.status));
  const tenantInfo = tenantUser || contract?.tenant || null;
  const ownerInfo = ownerUser || contract?.owner || null;
  const tenantDisplayName = getUserDisplayName(tenantInfo);
  const ownerDisplayName = getUserDisplayName(ownerInfo);
  const terminationList = useMemo(
    () => (Array.isArray(terminationRequests) ? terminationRequests : []),
    [terminationRequests]
  );
  const latestTermination = terminationList[0] || null;
  const hasPendingTermination = terminationList.some((item) => item.status === "pending");
  const canRequestTermination = contract?.status === "active" && !hasPendingTermination;
  const canReviewTermination = Boolean(
    latestTermination && latestTermination.status === "pending" && latestTermination.requestedBy !== user?.id
  );
  const reportItems = useMemo(
    () => (Array.isArray(reports) ? reports.filter((item) => item.rentalId === contractId) : []),
    [contractId, reports]
  );
  const latestReport = reportItems[0] || null;

  const invoiceItems = useMemo(() => {
    if (!invoicePayment) return [] as Payment[];
    if (invoicePayment.paymentType === "deposit" || invoicePayment.paymentType === "early_termination") {
      return [invoicePayment];
    }
    const source = Array.isArray(invoicePayments) && invoicePayments.length ? invoicePayments : paymentItems;
    const targetMonth = dayjs(invoicePayment.dueDate).format("YYYY-MM");
    const items = source.filter(
      (item) =>
        item.rentalId === invoicePayment.rentalId
        && item.paymentType !== "deposit"
        && item.paymentType !== "early_termination"
        && dayjs(item.dueDate).format("YYYY-MM") === targetMonth
    );
    return items.length ? items : [invoicePayment];
  }, [invoicePayment, invoicePayments, paymentItems]);

  const handleRefresh = useCallback(() => {
    if (!contractId) return;
    dispatch(getContractDetail(contractId));
    dispatch(getMyPayments({ rentalId: contractId, page: 1 }));
    dispatch(getReportsByContract(contractId));
    if (contractDetail?.propertyId) {
      dispatch(getPropertyDetailThunk(contractDetail.propertyId));
    }
  }, [contractDetail?.propertyId, contractId, dispatch]);

  const handleOpenChat = async (targetUserId?: string) => {
    if (!targetUserId) return;
    try {
      const conversation = await dispatch(createConversation(targetUserId)).unwrap();
      router.push(`/chat?conversationId=${conversation.id}`);
    } catch (error) {
      message.error("Không thể mở chat");
    }
  };

  const handleActivate = () => {
    if (!contract) return;
    modal.confirm({
      title: "Kích hoạt hợp đồng",
      icon: <CheckCircleOutlined />,
      content: "Kích hoạt sẽ tạo các kỳ thanh toán theo điều khoản hiện tại.",
      okText: "Kích hoạt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(activateContract(contract.rentalId)).unwrap();
          message.success("Đã kích hoạt hợp đồng");
          handleRefresh();
        } catch (error: any) {
          message.error(error || "Kích hoạt thất bại");
        }
      },
    });
  };

  const handleCancel = () => {
    if (!contract) return;
    modal.confirm({
      title: "Hủy hợp đồng",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn hủy hợp đồng này?",
      okText: "Hủy hợp đồng",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        try {
          await dispatch(cancelContract(contract.rentalId)).unwrap();
          message.success("Đã hủy hợp đồng");
          handleRefresh();
        } catch (error: any) {
          message.error(error || "Hủy thất bại");
        }
      },
    });
  };

  const openPaymentModal = () => {
    if (!currentPayment) return;
    setSelectedMethod("other");
    setPayOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!currentPayment) return;

    try {
      const payload = await dispatch(
        confirmPayment({
          paymentId: currentPayment.paymentId,
          data: {
            paymentMethod: selectedMethod,
            paymentType: currentPayment.paymentType,
            paidAmount: currentPayment.remainingAmount || currentPayment.amount,
            transactionId: undefined,
            transactionRef: undefined,
          },
        })
      ).unwrap();

      const result = (payload as any)?.data ?? payload;

      if (result?.paymentUrl || result?.payUrl) {
        const redirectUrl = result.paymentUrl || result.payUrl;
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
        message.success("Đã tạo giao dịch. Vui lòng hoàn tất thanh toán trên cổng thanh toán.");
      } else if (result?.type === "bank_transfer") {
        modal.info({
          title: "Thông tin chuyển khoản",
          content: (
            <div className="space-y-1">
              <div>Ngân hàng: {result.bankName}</div>
              <div>Số tài khoản: {result.accountNumber}</div>
              <div>Chủ tài khoản: {result.accountName}</div>
              <div>Số tiền: {formatMoney(Number(result.amount || 0))}</div>
              <div>Nội dung CK: {result.content}</div>
            </div>
          ),
        });
      } else {
        message.success("Thanh toán đã được ghi nhận");
      }

      setPayOpen(false);
      handleRefresh();
    } catch (error: any) {
      message.error(error || "Thanh toán thất bại");
    }
  };

  const handleOpenInvoice = async (payment: Payment) => {
    setInvoicePayment(payment);
    setInvoiceOpen(true);
    if (contract?.rentalId) {
      dispatch(getInvoicePayments({ rentalId: contract.rentalId, limit: 200 }));
    }
  };

  const handleOpenTermination = () => {
    if (!contract?.rentalId) return;
    const defaultReason = "unilateral_termination";
    terminationForm.resetFields();
    terminationForm.setFieldsValue({
      reason: defaultReason,
      requestedTerminationDate: dayjs().add(30, "day"),
      earlyTerminationFee: contract.earlyTerminationFee || 0,
    });
    setTerminationOpen(true);
  };

  const handleSubmitTermination = async () => {
    if (!contract?.rentalId) return;
    try {
      const values = await terminationForm.validateFields();
      await dispatch(
        createTerminationRequest({
          rentalId: contract.rentalId,
          reason: values.reason,
          note: values.note,
          requestedTerminationDate: values.requestedTerminationDate.format("YYYY-MM-DD"),
          earlyTerminationFee: values.earlyTerminationFee ? Number(values.earlyTerminationFee) : undefined,
        })
      ).unwrap();
      message.success("Đã gửi yêu cầu chấm dứt hợp đồng");
      setTerminationOpen(false);
      dispatch(getTerminationRequests(contract.rentalId));
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error || "Gửi yêu cầu thất bại");
    }
  };

  const handleOpenReview = (request: TerminationRequest) => {
    setSelectedTermination(request);
    reviewForm.resetFields();
    reviewForm.setFieldsValue({ status: "approved" });
    setReviewOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedTermination) return;
    try {
      const values = await reviewForm.validateFields();
      await dispatch(
        reviewTerminationRequest({
          terminationId: selectedTermination.terminationRequestId,
          data: {
            status: values.status,
            reviewNote: values.reviewNote,
          },
        })
      ).unwrap();
      message.success("Đã xử lý yêu cầu chấm dứt");
      setReviewOpen(false);
      if (contract?.rentalId) {
        dispatch(getTerminationRequests(contract.rentalId));
        dispatch(getContractDetail(contract.rentalId));
      }
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error || "Xử lý yêu cầu thất bại");
    }
  };

  const handleOpenReport = (prefill?: { title?: string; description?: string; type?: ReportType }) => {
    if (!contract) return;
    reportForm.resetFields();
    reportForm.setFieldsValue({
      type: prefill?.type || "contract",
      priority: "medium",
      title: prefill?.title || `Tranh chấp hợp đồng ${contract.contractCode}`,
      description: prefill?.description || "",
    });
    setReportOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!contract) return;
    const againstId = isOwnerSide ? contract.tenantId : contract.ownerId;
    if (!againstId) return;

    try {
      const values = await reportForm.validateFields();
      await dispatch(
        createReport({
          rentalId: contract.rentalId,
          againstId,
          type: values.type,
          priority: values.priority,
          title: values.title,
          description: values.description,
        })
      ).unwrap();
      message.success("Đã gửi khiếu nại");
      setReportOpen(false);
      dispatch(getReportsByContract(contract.rentalId));
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error || "Gửi khiếu nại thất bại");
    }
  };

  const handleUpdateReportStatus = async (report: ReportItem, status: ReportStatus, note?: string) => {
    try {
      await dispatch(
        updateReportStatus({
          reportId: report.id,
          data: { status, note },
        })
      ).unwrap();
      message.success("Đã cập nhật khiếu nại");
      dispatch(getReportsByContract(report.rentalId));
    } catch (error: any) {
      message.error(error || "Cập nhật khiếu nại thất bại");
    }
  };

  const timelineItems = useMemo(
    () =>
      (contract?.signatureLog || []).map((log) => ({
        color: log.action.includes("SIGNED") || log.action === "ACTIVATED" ? "green" : log.action === "CANCELLED" ? "red" : "blue",
        children: (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">
              {SIGNATURE_ACTION_LABELS[log.action] || log.action.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400">{dayjs(log.createdAt).format("HH:mm:ss · DD/MM/YYYY")}</span>
          </div>
        ),
      })) || [],
    [contract?.signatureLog]
  );

  let content: React.ReactNode;

  if (contractsLoading && !contract) {
    content = (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  } else if (!contract) {
    content = (
      <div className="space-y-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Quay lại
        </Button>
        <Empty description="Không tìm thấy hợp đồng" />
      </div>
    );
  } else {
    const sidebarImage = getPropertyImage(property);
    content = (
      <div className="space-y-6 pb-6">
      <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-6 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Button ghost icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="border-white/20 text-white hover:border-white/40 hover:text-white">
              Quay lại danh sách
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase text-slate-100">
                <FileTextOutlined />
                Contract Detail
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">{contract.contractCode}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Trang chi tiết hợp đồng, theo dõi tiến trình ký kết, kích hoạt và thanh toán theo dữ liệu thực từ hệ thống.
              </p>
            </div>
          </div>

          <Space wrap>
            {(contract.signedContractUrl || contract.contractPdfUrl) && (
              <Button icon={<DownloadOutlined />} href={contract.signedContractUrl || contract.contractPdfUrl || undefined} target="_blank">
                Tải hợp đồng
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={contractsLoading || paymentsLoading}>
              Làm mới
            </Button>
            {contract.status === "fully_signed" && isOwnerSide && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleActivate} loading={actionLoading}>
                Kích hoạt hợp đồng
              </Button>
            )}
            {canPay && (
              <Button type="primary" icon={<WalletOutlined />} onClick={openPaymentModal} loading={actionLoading}>
                Thanh toán ngay
              </Button>
            )}
          </Space>
        </div>

        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Trạng thái hợp đồng</Text>
              <div className="mt-2 flex items-center gap-2">
                <Tag color={contractStatus?.color || "default"} icon={contractStatus?.icon} className="m-0 border-0">
                  {contractStatus?.label || contract.status}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Thanh toán</Text>
              <div className="mt-2 flex items-center gap-2">
                <Tag color={paymentStatus.color} icon={paymentStatus.icon} className="m-0 border-0">
                  {paymentStatus.label}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Tiền thuê / tháng</Text>
              <div className="mt-2 text-2xl font-semibold">{formatMoney(contract.monthlyRent)}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless" className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Tiến độ hợp đồng</Text>
              <Progress percent={getContractProgress(contract)} showInfo={false} strokeColor="#60a5fa" trailColor="rgba(255,255,255,0.15)" className="mt-3" />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} xl={16}>
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tổng quan hợp đồng</Text>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{contract.contractCode}</h2>
                  <Paragraph className="mb-0 mt-2 max-w-3xl text-slate-500">
                    Hợp đồng thuê giữa {ownerDisplayName} và {tenantDisplayName}.
                  </Paragraph>
                </div>
                <Space wrap>
                  {contract.status === "draft" && isOwnerSide && (
                    <Button danger icon={<ExclamationCircleOutlined />} onClick={handleCancel} loading={actionLoading}>
                      Hủy hợp đồng
                    </Button>
                  )}
                </Space>
              </div>

              <Divider />

              <Descriptions column={{ xs: 1, sm: 2, xl: 2 }} bordered size="small">
                <Descriptions.Item label="Bên cho thuê">{ownerDisplayName}</Descriptions.Item>
                <Descriptions.Item label="Bên thuê">{tenantDisplayName}</Descriptions.Item>
                <Descriptions.Item label="Ngày bắt đầu">{formatDate(contract.startDate)}</Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc">{formatDate(contract.endDate)}</Descriptions.Item>
                <Descriptions.Item label="Tiền đặt cọc">{formatMoney(contract.depositAmount)}</Descriptions.Item>
                <Descriptions.Item label="Ngày thanh toán">Ngày {contract.paymentDueDay} hàng tháng</Descriptions.Item>
                <Descriptions.Item label="Phí quản lý">{formatMoney(contract.managementFee || 0)}</Descriptions.Item>
                <Descriptions.Item label="Phí giữ xe">{formatMoney(contract.parkingFee || 0)}</Descriptions.Item>
                <Descriptions.Item label="Phí internet">{formatMoney(contract.internetFee || 0)}</Descriptions.Item>
                <Descriptions.Item label="Phí trễ hạn">{formatMoney(contract.lateFeePerDay || 0)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lịch sử thanh toán</Text>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Các kỳ thanh toán của hợp đồng</h3>
                </div>
                <Tag color={paymentStatus.color} icon={paymentStatus.icon}>
                  {paymentStatus.label}
                </Tag>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{paidCount}/{paymentItems.length || 0} kỳ đã thanh toán</span>
                  <span>{paymentProgress}%</span>
                </div>
                <Progress percent={paymentProgress} strokeColor="#2563eb" className="mt-2" />
              </div>

              <div className="mt-6">
                {paymentItems.length ? (
                  <div className="space-y-3">
                    {paymentItems.map((payment) => {
                      const cfg = PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.pending;
                      return (
                        <div key={payment.paymentId} className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Text className="font-semibold text-slate-900">{payment.paymentCode}</Text>
                                <Tag color={cfg.color} icon={cfg.icon} className="m-0">
                                  {cfg.label}
                                </Tag>
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {PAYMENT_TYPE_LABELS[payment.paymentType] || payment.paymentType} · Hạn {formatDate(payment.dueDate)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-500">Tổng tiền</div>
                              <div className="text-lg font-semibold text-slate-900">{formatMoney(payment.amount)}</div>
                              <div className="text-sm text-emerald-600">Đã trả: {formatMoney(payment.paidAmount)}</div>
                              <Button
                                size="small"
                                className="mt-2"
                                icon={<FileTextOutlined />}
                                onClick={() => handleOpenInvoice(payment)}
                                loading={invoicePaymentsLoading}
                              >
                                Xem hóa đơn
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty description="Chưa có dữ liệu thanh toán cho hợp đồng này" />
                )}
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Chấm dứt hợp đồng</Text>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Quản lý yêu cầu chấm dứt</h3>
                </div>
                {latestTermination && (
                  <Tag color={TERMINATION_STATUS_LABELS[latestTermination.status].color}>
                    {TERMINATION_STATUS_LABELS[latestTermination.status].label}
                  </Tag>
                )}
              </div>

              <div className="mt-5">
                {!terminationList.length && (
                  <Empty description="Chưa có yêu cầu chấm dứt" />
                )}

                {latestTermination && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Text strong>Yêu cầu gần nhất</Text>
                      <Text className="text-xs text-slate-500">{formatDate(latestTermination.createdAt)}</Text>
                    </div>
                    <Descriptions column={1} size="small" className="mt-3">
                      <Descriptions.Item label="Lý do">{TERMINATION_REASON_LABELS[latestTermination.reason] || latestTermination.reason}</Descriptions.Item>
                      <Descriptions.Item label="Ngày chấm dứt dự kiến">{formatDate(latestTermination.requestedTerminationDate)}</Descriptions.Item>
                      <Descriptions.Item label="Phí chấm dứt sớm">{formatMoney(latestTermination.earlyTerminationFee || 0)}</Descriptions.Item>
                      <Descriptions.Item label="Ghi chú">{latestTermination.note || "—"}</Descriptions.Item>
                      <Descriptions.Item label="Ghi chú phản hồi">{latestTermination.reviewNote || "—"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {canRequestTermination && (
                  <Button type="primary" icon={<ExclamationCircleOutlined />} onClick={handleOpenTermination} loading={terminationActionLoading}>
                    Gửi yêu cầu chấm dứt
                  </Button>
                )}
                {canReviewTermination && latestTermination && (
                  <Button onClick={() => handleOpenReview(latestTermination)} loading={terminationActionLoading}>
                    Xử lý yêu cầu
                  </Button>
                )}
                {latestTermination?.status === "rejected" && (
                  <Button onClick={() => handleOpenReport({ title: `Tranh chấp chấm dứt hợp đồng ${contract.contractCode}` })}>
                    Gửi tranh chấp lên admin
                  </Button>
                )}
                {terminationLoading && <Text className="text-xs text-slate-400">Đang tải yêu cầu...</Text>}
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Khiếu nại</Text>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">Tranh chấp & xử lý admin</h3>
                </div>
                {latestReport && (
                  <Tag color={REPORT_STATUS_LABELS[latestReport.status].color}>
                    {REPORT_STATUS_LABELS[latestReport.status].label}
                  </Tag>
                )}
              </div>

              <div className="mt-5">
                {!reportItems.length && <Empty description="Chưa có khiếu nại" />}

                {latestReport && (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Text strong>{latestReport.title}</Text>
                      <Text className="text-xs text-slate-500">{formatDate(latestReport.createdAt)}</Text>
                    </div>
                    <Descriptions column={1} size="small" className="mt-3">
                      <Descriptions.Item label="Loại">{REPORT_TYPE_LABELS[latestReport.type] || latestReport.type}</Descriptions.Item>
                      <Descriptions.Item label="Mức độ">{latestReport.priority}</Descriptions.Item>
                      <Descriptions.Item label="Nội dung">{latestReport.description}</Descriptions.Item>
                      <Descriptions.Item label="Ghi chú admin">{latestReport.adminNote || "—"}</Descriptions.Item>
                    </Descriptions>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="primary" onClick={() => handleOpenReport()} loading={reportActionLoading}>
                  Tạo khiếu nại
                </Button>
                {latestReport?.status === "open" && latestReport.createdBy === user?.id && (
                  <Button onClick={() => handleUpdateReportStatus(latestReport, "negotiating")}>Bắt đầu thương lượng</Button>
                )}
                {latestReport?.status === "negotiating" && (
                  <Button onClick={() => handleUpdateReportStatus(latestReport, "admin")}>Gửi admin xử lý</Button>
                )}
                {latestReport?.status === "admin" && user?.role === "ADMIN" && (
                  <Button onClick={() => handleUpdateReportStatus(latestReport, "resolved")}>Đã giải quyết</Button>
                )}
                {reportsLoading && <Text className="text-xs text-slate-400">Đang tải khiếu nại...</Text>}
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lịch sử ký kết</Text>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Dòng thời gian xử lý hợp đồng</h3>
              <div className="mt-6">
                {timelineItems.length ? <Timeline items={timelineItems} /> : <Empty description="Chưa có sự kiện ký kết nào" />}
              </div>
            </Card>
          </div>
        </Col>

        <Col xs={24} xl={8}>
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl shadow-sm" styles={{ body: { padding: 0 } }}>
              <div className="relative h-56 w-full bg-slate-100">
                {sidebarImage ? (
                  <img src={sidebarImage} alt={getPropertyTitle(property)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                    <HomeOutlined style={{ fontSize: 56 }} />
                  </div>
                )}
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                  APARTMENT
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Bất động sản</Text>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">{getPropertyTitle(property)}</h3>
                  <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                    <EnvironmentOutlined className="mt-1" />
                    <span>{getPropertyAddress(property)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Diện tích</div>
                    <div className="mt-1 font-semibold text-slate-900">{property?.areaSqm ? `${property.areaSqm} m²` : "—"}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Phòng ngủ</div>
                    <div className="mt-1 font-semibold text-slate-900">{property?.bedrooms ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Phòng tắm</div>
                    <div className="mt-1 font-semibold text-slate-900">{property?.bathrooms ?? "—"}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Giá thuê</div>
                    <div className="mt-1 font-semibold text-slate-900">{property?.pricePerMonth ? formatMoney(property.pricePerMonth) : formatMoney(contract.monthlyRent)}</div>
                  </div>
                </div>

                <Divider className="my-3" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <Avatar size={44} src={tenantInfo?.avatarUrl || undefined}>
                      {getInitials(tenantInfo?.fullName) || <UserOutlined />}
                    </Avatar>
                    <div>
                      <div className="font-semibold text-slate-900">{tenantDisplayName}</div>
                      <div className="text-sm text-slate-500">Bên thuê hiện tại</div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{getUserPhone(tenantInfo, showTenantPhone)}</span>
                      </div>
                    </div>
                    {isOwnerSide && (
                      <Button
                        size="small"
                        icon={<MessageOutlined />}
                        onClick={() => handleOpenChat(contract.tenantId)}
                        className="ml-auto"
                      >
                        Liên hệ
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <Avatar size={44} src={ownerInfo?.avatarUrl || undefined}>
                      {getInitials(ownerInfo?.fullName) || <HomeOutlined />}
                    </Avatar>
                    <div>
                      <div className="font-semibold text-slate-900">{ownerDisplayName}</div>
                      <div className="text-sm text-slate-500">Chủ nhà / Bên cho thuê</div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>{getUserPhone(ownerInfo, showOwnerPhone)}</span>
                      </div>
                    </div>
                    {isTenantSide && (
                      <Button
                        size="small"
                        icon={<MessageOutlined />}
                        onClick={() => handleOpenChat(contract.ownerId)}
                        className="ml-auto"
                      >
                        Liên hệ
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Thanh toán hiện tại</Text>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{paymentStatus.label}</h3>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                {currentPayment ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-slate-500">Kỳ thanh toán</div>
                        <div className="font-semibold text-slate-900">{currentPayment.paymentCode}</div>
                      </div>
                      <Tag color={paymentStatus.color} icon={paymentStatus.icon}>{paymentStatus.label}</Tag>
                    </div>
                    <Divider className="my-4" />
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Số tiền">{formatMoney(currentPayment.amount)}</Descriptions.Item>
                      <Descriptions.Item label="Đã thanh toán">{formatMoney(currentPayment.paidAmount)}</Descriptions.Item>
                      <Descriptions.Item label="Còn lại">{formatMoney(currentPayment.remainingAmount)}</Descriptions.Item>
                      <Descriptions.Item label="Hạn thanh toán">{formatDate(currentPayment.dueDate)}</Descriptions.Item>
                    </Descriptions>
                    <div className="mt-4 flex flex-col gap-2">
                      <Button block icon={<FileTextOutlined />} onClick={() => handleOpenInvoice(currentPayment)} loading={invoicePaymentsLoading}>
                        Xem hóa đơn
                      </Button>
                      {canPay && (
                        <Button type="primary" block icon={<WalletOutlined />} onClick={openPaymentModal} loading={actionLoading}>
                          Thanh toán ngay
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kỳ thanh toán nào" />
                )}
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" styles={{ body: { padding: 24 } }}>
              <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Thông tin nhanh</Text>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Ngày ký</span>
                  <span className="font-medium text-slate-900">{contract.signedDate ? formatDate(contract.signedDate) : "—"}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Ngày tạo</span>
                  <span className="font-medium text-slate-900">{formatDate(contract.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Cập nhật gần nhất</span>
                  <span className="font-medium text-slate-900">{formatDate(contract.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Phí quản lý</span>
                  <span className="font-medium text-slate-900">{formatMoney(contract.managementFee || 0)}</span>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
    );
  }

  return (
    <>
      {content}

      <TopupMethodModal
        open={payOpen}
        amount={Number(currentPayment?.amount || 0)}
        selectedMethod={selectedMethod}
        loading={actionLoading}
        title="Thanh toán hợp đồng"
        amountLabel="Số tiền cần thanh toán"
        helperText={`Kỳ thanh toán ${currentPayment ? currentPayment.paymentCode : ""}`}
        confirmText="Xác nhận thanh toán"
        options={PAYMENT_METHOD_OPTIONS}
        onCancel={() => setPayOpen(false)}
        onBack={() => setPayOpen(false)}
        onConfirm={handleConfirmPayment}
        onChangeMethod={setSelectedMethod}
      />

      <Modal
        open={terminationOpen}
        onCancel={() => setTerminationOpen(false)}
        onOk={handleSubmitTermination}
        okText="Gửi yêu cầu"
        cancelText="Đóng"
        confirmLoading={terminationActionLoading}
        title="Yêu cầu chấm dứt hợp đồng"
      >
        <Form form={terminationForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: "Vui lòng chọn lý do" }]}
          >
            <Select options={TERMINATION_REASON_OPTIONS} />
          </Form.Item>
          <Form.Item shouldUpdate>
            {() => {
              const reason = terminationForm.getFieldValue("reason") as TerminationReason | undefined;
              const hint = getTerminationPolicyHint(reason);
              return hint ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                  {hint}
                </div>
              ) : null;
            }}
          </Form.Item>
          <Form.Item
            name="requestedTerminationDate"
            label="Ngày chấm dứt dự kiến"
            rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="earlyTerminationFee" label="Phí chấm dứt sớm">
            <InputNumber className="w-full" min={0} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Thông tin bổ sung (nếu có)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={reviewOpen}
        onCancel={() => setReviewOpen(false)}
        onOk={handleSubmitReview}
        okText="Xác nhận"
        cancelText="Đóng"
        confirmLoading={terminationActionLoading}
        title="Xử lý yêu cầu chấm dứt"
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="status"
            label="Kết quả"
            rules={[{ required: true, message: "Vui lòng chọn kết quả" }]}
          >
            <Select
              options={[
                { value: "approved", label: "Chấp thuận" },
                { value: "rejected", label: "Từ chối" },
              ]}
            />
          </Form.Item>
          <Form.Item name="reviewNote" label="Ghi chú phản hồi">
            <Input.TextArea rows={3} placeholder="Ghi chú cho đối tác" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={reportOpen}
        onCancel={() => setReportOpen(false)}
        onOk={handleSubmitReport}
        okText="Gửi khiếu nại"
        cancelText="Đóng"
        confirmLoading={reportActionLoading}
        title="Tạo khiếu nại"
      >
        <Form form={reportForm} layout="vertical">
          <Form.Item name="type" label="Loại khiếu nại" rules={[{ required: true, message: "Vui lòng chọn loại" }]}>
            <Select options={Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="priority" label="Mức độ" rules={[{ required: true, message: "Vui lòng chọn mức độ" }]}>
            <Select options={REPORT_PRIORITY_OPTIONS} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}> 
            <Input placeholder="Ví dụ: Khiếu nại thanh toán" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}> 
            <Input.TextArea rows={4} placeholder="Mô tả chi tiết vấn đề" />
          </Form.Item>
        </Form>
      </Modal>

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => {
          setInvoiceOpen(false);
          setInvoicePayment(null);
        }}
        payment={invoicePayment}
        items={invoiceItems}
        contract={contract}
      />
    </>
  );
}

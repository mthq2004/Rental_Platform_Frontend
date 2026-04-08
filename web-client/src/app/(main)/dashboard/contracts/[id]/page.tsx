"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { App, Avatar, Button, Card, Col, Descriptions, Divider, Empty, Progress, Row, Space, Spin, Tag, Timeline, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  HomeOutlined,
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
  getMyPayments,
} from "@/stores/slices/contract.slice";
import { getPropertyDetailThunk } from "@/stores/slices/estate.slice";
import type { Payment, PaymentStatus, RentalContract, RentalContractStatus } from "@/types/contract.type";
import type { PropertyDetailApiData } from "@/types/property.type";
import { STATUS_CONFIG, formatCurrency, formatDate } from "@/components/contracts/ContractStatusConfig";
import TopupMethodModal, { type MethodOption } from "@/components/wallet/TopupMethodModal";

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

const formatMoney = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(parsed);
};

const getPropertyImage = (property?: PropertyDetailApiData | null) => property?.images?.[0]?.uri || null;

const getPropertyTitle = (property?: PropertyDetailApiData | null) => property?.title || "Bất động sản";

const getPropertyAddress = (property?: PropertyDetailApiData | null) =>
  [property?.address, property?.ward, property?.district, property?.city].filter(Boolean).join(", ") || "Chưa có địa chỉ";

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
  const { contractDetail, contractsLoading, payments, paymentsLoading, actionLoading } = useAppSelector((state) => state.contract);
  const { detail: propertyDetail } = useAppSelector((state) => state.estate);

  const [payOpen, setPayOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("other");

  useEffect(() => {
    if (!contractId) return;

    dispatch(getContractDetail(contractId));
    dispatch(getMyPayments({ rentalId: contractId, page: 1 }));

    return () => {
      dispatch(clearContractDetail());
    };
  }, [contractId, dispatch]);

  useEffect(() => {
    const propertyId = contractDetail?.propertyId;
    if (!propertyId) return;
    dispatch(getPropertyDetailThunk(propertyId));
  }, [contractDetail?.propertyId, dispatch]);

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

  const handleRefresh = useCallback(() => {
    if (!contractId) return;
    dispatch(getContractDetail(contractId));
    dispatch(getMyPayments({ rentalId: contractId, page: 1 }));
    if (contractDetail?.propertyId) {
      dispatch(getPropertyDetailThunk(contractDetail.propertyId));
    }
  }, [contractDetail?.propertyId, contractId, dispatch]);

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

  const timelineItems = useMemo(
    () =>
      (contract?.signatureLog || []).map((log) => ({
        color: log.action.includes("SIGNED") || log.action === "ACTIVATED" ? "green" : log.action === "CANCELLED" ? "red" : "blue",
        children: (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-700">
              {log.action === "SENT_TO_TENANT" && "Gửi hợp đồng cho người thuê"}
              {log.action === "TENANT_SIGNED" && "Người thuê đã ký xác nhận"}
              {log.action === "LANDLORD_SIGNED" && "Chủ nhà đã ký xác nhận"}
              {log.action === "ACTIVATED" && "Hợp đồng đã được kích hoạt"}
              {log.action === "CANCELLED" && "Hợp đồng bị hủy"}
              {!['SENT_TO_TENANT', 'TENANT_SIGNED', 'LANDLORD_SIGNED', 'ACTIVATED', 'CANCELLED'].includes(log.action) && log.action}
            </span>
            <span className="text-xs text-slate-400">{dayjs(log.createdAt).format("HH:mm:ss · DD/MM/YYYY")}</span>
          </div>
        ),
      })) || [],
    [contract?.signatureLog]
  );

  if (contractsLoading && !contract) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Quay lại
        </Button>
        <Empty description="Không tìm thấy hợp đồng" />
      </div>
    );
  }

  const sidebarImage = getPropertyImage(property);

  return (
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
            <Card bordered={false} className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Trạng thái hợp đồng</Text>
              <div className="mt-2 flex items-center gap-2">
                <Tag color={contractStatus?.color || "default"} icon={contractStatus?.icon} className="m-0 border-0">
                  {contractStatus?.label || contract.status}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Thanh toán</Text>
              <div className="mt-2 flex items-center gap-2">
                <Tag color={paymentStatus.color} icon={paymentStatus.icon} className="m-0 border-0">
                  {paymentStatus.label}
                </Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Tiền thuê / tháng</Text>
              <div className="mt-2 text-2xl font-semibold">{formatMoney(contract.monthlyRent)}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} className="rounded-2xl bg-white/10 text-white">
              <Text className="text-xs uppercase tracking-[0.16em] text-slate-300">Tiến độ hợp đồng</Text>
              <Progress percent={getContractProgress(contract)} showInfo={false} strokeColor="#60a5fa" trailColor="rgba(255,255,255,0.15)" className="mt-3" />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} xl={16}>
          <div className="space-y-6">
            <Card className="rounded-3xl shadow-sm" bodyStyle={{ padding: 24 }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Text className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tổng quan hợp đồng</Text>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{contract.contractCode}</h2>
                  <Paragraph className="mb-0 mt-2 max-w-3xl text-slate-500">
                    Hợp đồng thuê giữa {contract.owner?.name || contract.ownerId} và {contract.tenant?.name || contract.tenantId}.
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
                <Descriptions.Item label="Bên cho thuê">{contract.owner?.name || contract.ownerId}</Descriptions.Item>
                <Descriptions.Item label="Bên thuê">{contract.tenant?.name || contract.tenantId}</Descriptions.Item>
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

            <Card className="rounded-3xl shadow-sm" bodyStyle={{ padding: 24 }}>
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

            <Card className="rounded-3xl shadow-sm" bodyStyle={{ padding: 24 }}>
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
            <Card className="overflow-hidden rounded-3xl shadow-sm" bodyStyle={{ padding: 0 }}>
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
                    <Avatar size={44} icon={<UserOutlined />} />
                    <div>
                      <div className="font-semibold text-slate-900">{contract.tenant?.name || contract.tenantId}</div>
                      <div className="text-sm text-slate-500">Bên thuê hiện tại</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                    <Avatar size={44} icon={<HomeOutlined />} />
                    <div>
                      <div className="font-semibold text-slate-900">{contract.owner?.name || contract.ownerId}</div>
                      <div className="text-sm text-slate-500">Chủ nhà / Bên cho thuê</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" bodyStyle={{ padding: 24 }}>
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
                    {canPay && (
                      <Button type="primary" block className="mt-4" icon={<WalletOutlined />} onClick={openPaymentModal} loading={actionLoading}>
                        Thanh toán ngay
                      </Button>
                    )}
                  </>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có kỳ thanh toán nào" />
                )}
              </div>
            </Card>

            <Card className="rounded-3xl shadow-sm" bodyStyle={{ padding: 24 }}>
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
    </div>
  );
}

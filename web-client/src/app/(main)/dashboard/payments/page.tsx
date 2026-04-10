"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Typography,
  Tooltip,
  Modal,
  Descriptions,
  Select,
  App,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getContractDetail, getInvoicePayments, getMyPayments, confirmPayment } from "@/stores/slices/contract.slice";
import TopupMethodModal, { type MethodOption } from "@/components/wallet/TopupMethodModal";
import InvoiceModal from "@/components/payments/InvoiceModal";
import type { Payment, PaymentStatus, PaymentType } from "@/types/contract.type";
import dayjs from "dayjs";

const { Text } = Typography;

// ====== Status config ======
const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: "Chờ thanh toán", color: "processing", icon: <ClockCircleOutlined /> },
  paid: { label: "Đã thanh toán", color: "success", icon: <CheckCircleOutlined /> },
  overdue: { label: "Quá hạn", color: "error", icon: <WarningOutlined /> },
  partial: { label: "Thanh toán một phần", color: "warning", icon: <ExclamationCircleOutlined /> },
  cancelled: { label: "Đã hủy", color: "default", icon: <CloseCircleOutlined /> },
  refunded: { label: "Đã hoàn tiền", color: "purple", icon: <DollarOutlined /> },
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
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

const TOPUP_METHOD_OPTIONS: MethodOption[] = [
  { value: "momo", label: "MoMo", description: "Thanh toán nhanh bằng ứng dụng MoMo." },
  { value: "vnpay", label: "VNPay", description: "Chuyển sang cổng thanh toán VNPay." },
  { value: "zalopay", label: "ZaloPay", description: "Thanh toán bằng ví ZaloPay." },
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng", description: "Hiển thị thông tin chuyển khoản ngân hàng." },
  { value: "other", label: "Ví nội bộ của bạn", description: "Thanh toán bằng số dư ví nội bộ trong hệ thống." }
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatCurrency = (amount: number) => {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export default function PaymentsPage() {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    payments,
    paymentsLoading,
    actionLoading,
    invoicePayments,
    contractDetail,
  } = useAppSelector((state) => state.contract);

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [methodDraft, setMethodDraft] = useState<string>("other");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [topupMethodOpen, setTopupMethodOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePayment, setInvoicePayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(
    (status?: string) => {
      dispatch(getMyPayments({ status }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchPayments();
  }, [dispatch]);

  useEffect(() => {
    fetchPayments(statusFilter);
  }, [statusFilter]);

  const handleRefresh = useCallback(() => {
    fetchPayments(statusFilter);
  }, [fetchPayments, statusFilter]);

  const handleOpenConfirm = (record: Payment) => {
    setSelectedPayment(record);
    const ownerSide = isOwner(record);
    setMethodDraft(ownerSide ? "cash" : "other");
    setConfirmOpen(true);
  };

  const getAvailableMethodOptions = useCallback(
    (ownerSide: boolean): MethodOption[] => {
      const values = ownerSide
        ? ["cash", "bank_transfer"]
        : ["other", "momo", "vnpay", "zalopay", "bank_transfer"];

      return values
        .map((value) => {
          const method = TOPUP_METHOD_OPTIONS.find((item) => item.value === value);
          if (!method) return null;
          return {
            value: method.value,
            label: method.label,
            description: method.description || "",
          };
        })
        .filter((item): item is MethodOption => item !== null);
    },
    []
  );

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    try {

      console.log("Xác nhận thanh toán: ", {
          paymentId: selectedPayment.paymentId,
          data: {
            paymentMethod: methodDraft,
            paymentType: selectedPayment.paymentType,
            paidAmount: selectedPayment.remainingAmount || selectedPayment.amount,
            transactionId: undefined,
            transactionRef: undefined,
          },
        });
      
      const payload = await dispatch(
        confirmPayment({
          paymentId: selectedPayment.paymentId,
          data: {
            paymentMethod: methodDraft,
            paymentType: selectedPayment.paymentType,
            paidAmount: selectedPayment.remainingAmount || selectedPayment.amount,
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
              <div>Số tiền: {formatCurrency(Number(result.amount || 0))}</div>
              <div>Nội dung CK: {result.content}</div>
            </div>
          ),
        });
      } else {
        message.success("Xử lý thanh toán thành công");
      }

      setConfirmOpen(false);
      setSelectedPayment(null);
      handleRefresh();
    } catch (err: any) {
      message.error(err || "Xác nhận thất bại");
    }
  };

  const handleViewDetail = (record: Payment) => {
    setSelectedPayment(record);
    setDetailOpen(true);
  };

  const handleViewInvoice = async (record: Payment) => {
    setInvoicePayment(record);
    setInvoiceOpen(true);
    if (record?.rentalId) {
      dispatch(getContractDetail(record.rentalId));
      dispatch(getInvoicePayments({ rentalId: record.rentalId, limit: 200 }));
    }
  };

  const isOwner = (record: Payment) => record.contract?.ownerId === user?.id;
  const isTenant = (record: Payment) => record.contract?.tenantId === user?.id;

  const invoiceItems = useMemo(() => {
    if (!invoicePayment) return [] as Payment[];
    if (invoicePayment.paymentType === "deposit" || invoicePayment.paymentType === "early_termination") {
      return [invoicePayment];
    }
    const source = Array.isArray(invoicePayments) && invoicePayments.length ? invoicePayments : payments;
    const targetMonth = dayjs(invoicePayment.dueDate).format("YYYY-MM");
    const items = source.filter(
      (item) =>
        item.rentalId === invoicePayment.rentalId
        && item.paymentType !== "deposit"
        && item.paymentType !== "early_termination"
        && dayjs(item.dueDate).format("YYYY-MM") === targetMonth
    );
    return items.length ? items : [invoicePayment];
  }, [invoicePayment, invoicePayments, payments]);

  const invoiceContract = useMemo(() => {
    if (!invoicePayment) return null;
    if (contractDetail?.rentalId === invoicePayment.rentalId) return contractDetail;
    return null;
  }, [contractDetail, invoicePayment]);

  // ====== Columns ======
  const columns: ColumnsType<Payment> = [
    {
      title: "Mã thanh toán",
      dataIndex: "paymentCode",
      key: "paymentCode",
      width: 170,
      render: (val) => <Text strong className="text-sm">{val}</Text>,
    },
    {
      title: "Loại",
      dataIndex: "paymentType",
      key: "paymentType",
      width: 140,
      render: (type: PaymentType) => (
        <Tag>{PAYMENT_TYPE_LABELS[type] || type}</Tag>
      ),
      filters: Object.entries(PAYMENT_TYPE_LABELS).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.paymentType === value,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (val) => <Text strong className="text-red-500 text-sm">{formatCurrency(val)}</Text>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Đã thanh toán",
      dataIndex: "paidAmount",
      key: "paidAmount",
      width: 150,
      render: (val) => <Text className="text-green-600 text-sm">{formatCurrency(val)}</Text>,
    },
    {
      title: "Hạn thanh toán",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 130,
      render: (val) => {
        const isOverdue = dayjs(val).isBefore(dayjs(), "day");
        return (
          <Text className={`text-sm ${isOverdue ? "text-red-500 font-medium" : "text-gray-500"}`}>
            {formatDate(val)}
          </Text>
        );
      },
      sorter: (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      defaultSortOrder: "ascend",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status: PaymentStatus) => {
        const cfg = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
        return (
          <Tag color={cfg.color} icon={cfg.icon} className="text-xs">
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 160,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Xem hoa don">
            <Button type="text" size="small" icon={<FileTextOutlined />} onClick={() => handleViewInvoice(record)} />
          </Tooltip>
          {isTenant(record) && (record.status === "pending" || record.status === "overdue" || record.status === "partial") && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleOpenConfirm(record)}>
              Thanh toán
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Thanh toán</h2>
          <p className="text-sm text-gray-500">Quản lý các khoản thanh toán hợp đồng</p>
        </div>
        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Lọc trạng thái"
            allowClear
            className="w-48"
            options={[
              { value: "pending", label: "Chờ thanh toán" },
              { value: "paid", label: "Đã thanh toán" },
              { value: "overdue", label: "Quá hạn" },
              { value: "partial", label: "Một phần" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={paymentsLoading}>
            Làm mới
          </Button>
        </Space>
      </div>

      <div className="bg-white rounded-lg">
        <Table
          dataSource={Array.isArray(payments) ? payments : []}
          columns={columns}
          loading={paymentsLoading}
          rowKey="paymentId"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} khoản thanh toán`,
          }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có khoản thanh toán nào" />
            ),
          }}
          className="[&_.ant-table-thead_th]:bg-gray-50! [&_.ant-table-thead_th]:text-gray-600! [&_.ant-table-thead_th]:font-medium! [&_.ant-table-thead_th]:text-xs! [&_.ant-table-thead_th]:uppercase!"
        />
      </div>
        <TopupMethodModal
          open={confirmOpen}
          amount={Number(selectedPayment?.amount)}
          selectedMethod={methodDraft}
          loading={actionLoading}
          title="Xác nhận thanh toán"
          amountLabel="Số tiền thanh toán"
          confirmText="Xác nhận"
          options={TOPUP_METHOD_OPTIONS}
          onCancel={() => {
            setConfirmOpen(false);
            setSelectedPayment(null);
          }}
          onBack={() => {
            setConfirmOpen(false);
            setSelectedPayment(null);
          }}
          onConfirm={handleConfirmPayment}
          onChangeMethod={setMethodDraft}
        />
        <InvoiceModal
          open={invoiceOpen}
          onClose={() => {
            setInvoiceOpen(false);
            setInvoicePayment(null);
          }}
          payment={invoicePayment}
          items={invoiceItems}
          contract={invoiceContract}
        />
    </div>
  );
}

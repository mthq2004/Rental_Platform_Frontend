"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Input,
  InputNumber,
  Form,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getMyPayments, confirmPayment } from "@/stores/slices/contract.slice";
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

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
  { value: "cash", label: "Tiền mặt" },
  { value: "momo", label: "MoMo" },
  { value: "zalopay", label: "ZaloPay" },
  { value: "vnpay", label: "VNPay" },
  { value: "other", label: "Khác" },
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
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { payments, paymentsLoading, actionLoading } = useAppSelector((state) => state.contract);

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmForm] = Form.useForm();

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
    confirmForm.setFieldsValue({
      paymentMethod: "bank_transfer",
      paidAmount: record.remainingAmount || record.amount,
      transactionId: "",
      transactionRef: "",
    });
    setConfirmOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    try {
      const values = await confirmForm.validateFields();
      await dispatch(
        confirmPayment({
          paymentId: selectedPayment.paymentId,
          data: {
            paymentMethod: values.paymentMethod,
            paidAmount: values.paidAmount,
            transactionId: values.transactionId || undefined,
            transactionRef: values.transactionRef || undefined,
          },
        })
      ).unwrap();
      message.success("Xác nhận thanh toán thành công");
      setConfirmOpen(false);
      setSelectedPayment(null);
      handleRefresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err || "Xác nhận thất bại");
    }
  };

  const handleViewDetail = (record: Payment) => {
    setSelectedPayment(record);
    setDetailOpen(true);
  };

  const isOwner = (record: Payment) => record.contract?.ownerId === user?.id;

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
          {isOwner(record) && (record.status === "pending" || record.status === "overdue" || record.status === "partial") && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleOpenConfirm(record)}>
              Xác nhận
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Table */}
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

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); setSelectedPayment(null); }}
        title="Chi tiết thanh toán"
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedPayment && (
          <Descriptions column={2} bordered size="small" className="pt-2">
            <Descriptions.Item label="Mã thanh toán" span={2}>
              <Text strong>{selectedPayment.paymentCode}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã hợp đồng" span={2}>
              {selectedPayment.contract?.contractCode || selectedPayment.rentalId}
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              {PAYMENT_TYPE_LABELS[selectedPayment.paymentType] || selectedPayment.paymentType}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {(() => {
                const cfg = PAYMENT_STATUS_CONFIG[selectedPayment.status];
                return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              <Text strong className="text-red-500">{formatCurrency(selectedPayment.amount)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <Text className="text-green-600">{formatCurrency(selectedPayment.paidAmount)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Còn lại">
              {formatCurrency(selectedPayment.remainingAmount)}
            </Descriptions.Item>
            <Descriptions.Item label="Phí trễ hạn">
              {selectedPayment.lateFee > 0 ? (
                <Text type="danger">{formatCurrency(selectedPayment.lateFee)}</Text>
              ) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Hạn thanh toán">{formatDate(selectedPayment.dueDate)}</Descriptions.Item>
            {selectedPayment.paidAt && (
              <Descriptions.Item label="Ngày thanh toán">{formatDate(selectedPayment.paidAt)}</Descriptions.Item>
            )}
            {selectedPayment.paymentMethod && (
              <Descriptions.Item label="Phương thức" span={2}>
                {PAYMENT_METHODS.find((m) => m.value === selectedPayment.paymentMethod)?.label || selectedPayment.paymentMethod}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Confirm Payment Modal */}
      <Modal
        open={confirmOpen}
        onCancel={() => { setConfirmOpen(false); setSelectedPayment(null); }}
        title="Xác nhận thanh toán"
        okText="Xác nhận"
        cancelText="Hủy"
        onOk={handleConfirmPayment}
        confirmLoading={actionLoading}
        destroyOnClose
      >
        {selectedPayment && (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Text className="text-sm text-gray-500">Khoản thanh toán: </Text>
              <Text strong>{selectedPayment.paymentCode}</Text>
              <br />
              <Text className="text-sm text-gray-500">Số tiền cần thu: </Text>
              <Text strong className="text-red-500">{formatCurrency(selectedPayment.remainingAmount || selectedPayment.amount)}</Text>
            </div>

            <Form form={confirmForm} layout="vertical">
              <Form.Item
                label="Phương thức thanh toán"
                name="paymentMethod"
                rules={[{ required: true, message: "Vui lòng chọn phương thức" }]}
              >
                <Select options={PAYMENT_METHODS} />
              </Form.Item>
              <Form.Item
                label="Số tiền thực nhận (VNĐ)"
                name="paidAmount"
                rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
              >
                <InputNumber min={0} className="w-full" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
              </Form.Item>
              <Form.Item label="Mã giao dịch" name="transactionId">
                <Input placeholder="Mã giao dịch từ ngân hàng / ví điện tử" />
              </Form.Item>
              <Form.Item label="Tham chiếu" name="transactionRef">
                <Input placeholder="Số tham chiếu (tùy chọn)" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}

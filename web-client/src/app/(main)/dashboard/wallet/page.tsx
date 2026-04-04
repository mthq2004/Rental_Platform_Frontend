"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Tooltip,
  Typography,
} from "antd";
import {
  WalletOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  BankOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  clearLatestTopupResult,
  createWithdrawalRequest,
  getWalletOverview,
  getTopupStatus,
  getWalletTransactions,
  getWithdrawalRequests,
  initiateWalletTopup,
} from "@/stores/slices/wallet.slice";
import TopupMethodModal from "@/components/wallet/TopupMethodModal";
import type {
  WalletTopupMethod,
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
  WithdrawalRequest,
  WithdrawalStatus,
} from "@/types/wallet.type";

const { Text } = Typography;

const TRANSACTION_TYPE_LABEL: Record<WalletTransactionType, string> = {
  deposit: "Nạp ví",
  withdraw: "Rút tiền",
  pay_rent: "Thanh toán tiền thuê",
  receive_rent: "Nhận tiền thuê",
  hold_deposit: "Giữ tiền cọc",
  refund: "Hoàn tiền",
  fee: "Phí dịch vụ",
};

const TRANSACTION_STATUS_CONFIG: Record<WalletTransactionStatus, { color: string; label: string }> = {
  pending: { color: "processing", label: "Đang xử lý" },
  success: { color: "success", label: "Thành công" },
  failed: { color: "error", label: "Thất bại" },
};

const WITHDRAWAL_STATUS_CONFIG: Record<WithdrawalStatus, { color: string; label: string }> = {
  pending: { color: "processing", label: "Chờ duyệt" },
  processing: { color: "warning", label: "Đang xử lý" },
  success: { color: "success", label: "Thành công" },
  rejected: { color: "error", label: "Từ chối" },
};

const QUICK_TOPUP_AMOUNTS = [25000, 50000, 100000, 500000];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function WalletDashboardPage() {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    overview,
    transactions,
    transactionsMeta,
    withdrawals,
    withdrawalsMeta,
    latestTopupResult,
    overviewLoading,
    transactionsLoading,
    withdrawalsLoading,
    topupLoading,
    withdrawActionLoading,
  } = useAppSelector((state) => state.wallet);

  const [statusFilter, setStatusFilter] = useState<WalletTransactionStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<WalletTransactionType | undefined>();
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState<WithdrawalStatus | undefined>();

  const [page, setPage] = useState(1);
  const [withdrawPage, setWithdrawPage] = useState(1);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupMethodOpen, setTopupMethodOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [currentTopupId, setCurrentTopupId] = useState<string | null>(null);
  const [topupForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [selectedTopupAmount, setSelectedTopupAmount] = useState<number | null>(null);
  const [selectedTopupMethod, setSelectedTopupMethod] = useState<WalletTopupMethod>("momo");
  const topupAmount = Form.useWatch("amount", topupForm);

  const fetchData = useCallback(
    async (
      nextPage = page,
      nextType = typeFilter,
      nextStatus = statusFilter,
      nextWithdrawPage = withdrawPage,
      nextWithdrawStatus = withdrawStatusFilter
    ) => {
      try {
        await Promise.all([
          dispatch(getWalletOverview()).unwrap(),
          dispatch(
            getWalletTransactions({
              page: nextPage,
              limit: 10,
              type: nextType,
              status: nextStatus,
            })
          ).unwrap(),
          dispatch(
            getWithdrawalRequests({
              page: nextWithdrawPage,
              limit: 10,
              status: nextWithdrawStatus,
            })
          ).unwrap(),
        ]);
      } catch (e: any) {
        message.error(e || "Không thể tải dữ liệu ví");
      }
    },
    [dispatch, message, page, statusFilter, typeFilter, withdrawPage, withdrawStatusFilter]
  );

  useEffect(() => {
    fetchData(1, typeFilter, statusFilter, 1, withdrawStatusFilter);
  }, [dispatch]);

  useEffect(() => {
    setPage(1);
    fetchData(1, typeFilter, statusFilter, withdrawPage, withdrawStatusFilter);
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    setWithdrawPage(1);
    fetchData(page, typeFilter, statusFilter, 1, withdrawStatusFilter);
  }, [withdrawStatusFilter]);

  const handleRefresh = () => fetchData(page, typeFilter, statusFilter, withdrawPage, withdrawStatusFilter);

  const totalIn = useMemo(
    () =>
      (transactions || [])
        .filter(
          (item) =>
            Number(item.amount) > 0 && item.status === "success"
        )
        .reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions]
  );

  const totalOut = useMemo(
    () =>
      Math.abs(
        (transactions || [])
          .filter(
            (item) =>
              Number(item.amount) < 0 && item.status === "success"
          )
          .reduce((sum, item) => sum + Number(item.amount), 0)
      ),
    [transactions]
  );

  const openTopupModal = () => {
    topupForm.resetFields();
    topupForm.setFieldsValue({ amount: 25000 });
    setSelectedTopupAmount(null);
    setSelectedTopupMethod("momo");
    setTopupMethodOpen(false);
    setTopupOpen(true);
  };

  const handleCloseTopupFlow = () => {
    setTopupOpen(false);
    setTopupMethodOpen(false);
    setSelectedTopupAmount(null);
    setSelectedTopupMethod("momo");
    topupForm.resetFields();
  };

  const handleContinueTopup = async () => {
    try {
      const values = await topupForm.validateFields();
      const amount = Number(values.amount);
      setSelectedTopupAmount(amount);
      setSelectedTopupMethod("momo");
      setTopupOpen(false);
      setTopupMethodOpen(true);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err || "Không thể khởi tạo nạp tiền");
    }
  };

  const handleConfirmTopupMethod = async () => {
    if (!selectedTopupAmount || selectedTopupAmount < 10000) {
      message.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    try {
      const res = await dispatch(
        initiateWalletTopup({
          amount: selectedTopupAmount,
          method: selectedTopupMethod,
        })
      ).unwrap();

      const result = res?.data ?? res;
      setTopupMethodOpen(false);
      setCurrentTopupId(result.transactionId || null);

      if (result?.paymentUrl) {
        window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      }

      if (result?.method === "bank_transfer" && result?.bankInfo) {
        modal.info({
          title: "Thông tin chuyển khoản nạp ví",
          content: (
            <div className="space-y-1">
              <div>Ngân hàng: {result.bankInfo.bankName}</div>
              <div>Số tài khoản: {result.bankInfo.accountNumber}</div>
              <div>Chủ tài khoản: {result.bankInfo.accountName}</div>
              <div>Nội dung CK: {result.bankInfo.transferContent}</div>
              <div>Số tiền: {formatCurrency(Number(result.amount || 0))}</div>
            </div>
          ),
          width: 560,
        });
      } else if (!result?.paymentUrl) {
        message.warning("Không nhận được đường dẫn cổng thanh toán");
      }
    } catch (err: any) {
      message.error(err || "Không thể khởi tạo nạp tiền");
    }
  };

  const handleBackToTopupAmount = () => {
    setTopupMethodOpen(false);
    setTopupOpen(true);
    if (selectedTopupAmount) {
      topupForm.setFieldsValue({ amount: selectedTopupAmount });
    }
  };

  const handleWithdraw = async () => {
    try {
      const values = await withdrawForm.validateFields();
      await dispatch(
        createWithdrawalRequest({
          amount: Number(values.amount),
          bankCode: values.bankCode,
          accountNumber: values.accountNumber,
          accountName: values.accountName,
        })
      ).unwrap();
      message.success("Đã tạo yêu cầu rút tiền");
      setWithdrawOpen(false);
      fetchData();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err || "Không thể tạo yêu cầu rút tiền");
    }
  };

  const transactionColumns: ColumnsType<WalletTransaction> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value: string) => <Text className="text-sm">{dayjs(value).format("HH:mm DD/MM/YYYY")}</Text>,
    },
    {
      title: "Loại giao dịch",
      dataIndex: "type",
      key: "type",
      width: 180,
      render: (type: WalletTransactionType) => (
        <Tag color={type === "pay_rent" || type === "withdraw" || type === "fee" ? "volcano" : "geekblue"}>
          {TRANSACTION_TYPE_LABEL[type] || type}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (_, record) => (
        <Text className="text-sm">{record.description || "Giao dịch ví"}</Text>
      ),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 180,
      align: "right",
      render: (amount: number) => {
        const positive = Number(amount) > 0;
        return (
          <Text strong className={positive ? "text-green-600" : "text-red-500"}>
            {positive ? "+" : ""}
            {formatCurrency(Number(amount))}
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: WalletTransactionStatus) => {
        const cfg = TRANSACTION_STATUS_CONFIG[status] || TRANSACTION_STATUS_CONFIG.pending;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Tham chiếu",
      key: "reference",
      width: 200,
      render: (_, record) => (
        <Tooltip title={record.referenceId || "-"}>
          <Text className="text-sm" ellipsis>
            {record.referenceId || "-"}
          </Text>
        </Tooltip>
      ),
    },
  ];

  const withdrawalColumns: ColumnsType<WithdrawalRequest> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (value: string) => dayjs(value).format("HH:mm DD/MM/YYYY"),
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 180,
      render: (value: number) => <Text strong className="text-red-500">{formatCurrency(value)}</Text>,
    },
    {
      title: "Ngân hàng",
      key: "bank",
      render: (_, record) => (
        <div className="flex flex-col">
          <Text className="text-sm">{record.bankCode}</Text>
          <Text type="secondary" className="text-xs">{record.accountNumber}</Text>
        </div>
      ),
    },
    {
      title: "Chủ tài khoản",
      dataIndex: "accountName",
      key: "accountName",
      render: (value: string) => <Text className="text-sm">{value}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: WithdrawalStatus) => {
        const cfg = WITHDRAWAL_STATUS_CONFIG[status] || WITHDRAWAL_STATUS_CONFIG.pending;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E9E6FF] bg-gradient-to-r from-[#F7F5FF] via-white to-[#EEF3FF] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Text className="text-xs uppercase tracking-[0.14em] text-[#6E63D8]">Ví tài khoản</Text>
            <h2 className="mb-1 mt-1 text-2xl font-semibold text-[#2D226B]">Nạp tiền, rút tiền và giao dịch ví</h2>
            <Text type="secondary">Hỗ trợ MoMo, VNPay, ZaloPay, chuyển khoản ngân hàng theo quy trình đối soát chuẩn.</Text>
          </div>
          <Space wrap>
            <Button icon={<PlusCircleOutlined />} type="primary" onClick={openTopupModal}>
              Nạp tiền
            </Button>
            <Button icon={<BankOutlined />} onClick={() => setWithdrawOpen(true)}>
              Rút tiền
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => router.push("/dashboard/payments")}>Thanh toán hợp đồng</Button>
            <Button icon={<SyncOutlined />} loading={overviewLoading || transactionsLoading || withdrawalsLoading} onClick={handleRefresh}>
              Làm mới
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="h-full border-[#ECE9FF]">
            <Statistic
              title="Số dư khả dụng"
              value={overview?.availableBalance || 0}
              precision={0}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<WalletOutlined className="text-[#5750F1]" />}
              valueStyle={{ color: "#2F2A7D", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="h-full border-[#E6F7EF]">
            <Statistic
              title="Tiền đang giữ (cọc)"
              value={overview?.pendingBalance || 0}
              precision={0}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<ClockCircleOutlined className="text-[#1A9A5F]" />}
              valueStyle={{ color: "#11774A", fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="h-full border-[#E8EEFF]">
            <Statistic
              title="Tổng giá trị ví"
              value={overview?.totalBalance || 0}
              precision={0}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined className="text-[#315DD4]" />}
              valueStyle={{ color: "#1E3FA0", fontWeight: 700 }}
            />
            <div className="mt-3 flex items-center gap-4 text-sm">
              <Text className="text-green-600"><ArrowUpOutlined /> Vào: {formatCurrency(totalIn)}</Text>
              <Text className="text-red-500"><ArrowDownOutlined /> Ra: {formatCurrency(totalOut)}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="border-[#ECE9FF]">
        <Tabs
          items={[
            {
              key: "transactions",
              label: "Lịch sử giao dịch ví",
              children: (
                <>
                  <div className="mb-3 flex justify-end">
                    <Space>
                      <Select
                        allowClear
                        placeholder="Lọc loại"
                        className="w-44"
                        value={typeFilter}
                        onChange={(value) => setTypeFilter(value)}
                        options={Object.entries(TRANSACTION_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
                      />
                      <Select
                        allowClear
                        placeholder="Lọc trạng thái"
                        className="w-44"
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        options={Object.entries(TRANSACTION_STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                      />
                    </Space>
                  </div>
                  <Table
                    rowKey="id"
                    dataSource={transactions || []}
                    columns={transactionColumns}
                    loading={transactionsLoading}
                    scroll={{ x: 1000 }}
                    locale={{
                      emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có giao dịch ví nào" />,
                    }}
                    pagination={{
                      current: page,
                      pageSize: transactionsMeta?.limit || 10,
                      total: transactionsMeta?.total || 0,
                      showTotal: (total) => `Tổng ${total} giao dịch`,
                      onChange: (nextPage) => {
                        setPage(nextPage);
                        fetchData(nextPage, typeFilter, statusFilter, withdrawPage, withdrawStatusFilter);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: "withdrawals",
              label: "Yêu cầu rút tiền",
              children: (
                <>
                  <div className="mb-3 flex justify-end">
                    <Select
                      allowClear
                      placeholder="Lọc trạng thái rút"
                      className="w-48"
                      value={withdrawStatusFilter}
                      onChange={(value) => setWithdrawStatusFilter(value)}
                      options={Object.entries(WITHDRAWAL_STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                    />
                  </div>
                  <Table
                    rowKey="id"
                    dataSource={withdrawals || []}
                    columns={withdrawalColumns}
                    loading={withdrawalsLoading}
                    locale={{
                      emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có yêu cầu rút tiền" />,
                    }}
                    pagination={{
                      current: withdrawPage,
                      pageSize: withdrawalsMeta?.limit || 10,
                      total: withdrawalsMeta?.total || 0,
                      showTotal: (total) => `Tổng ${total} yêu cầu`,
                      onChange: (nextPage) => {
                        setWithdrawPage(nextPage);
                        fetchData(page, typeFilter, statusFilter, nextPage, withdrawStatusFilter);
                      },
                    }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={topupOpen}
        title="Nạp tiền vào ví"
        onCancel={handleCloseTopupFlow}
        onOk={handleContinueTopup}
        okText="Tiếp tục"
        confirmLoading={topupLoading}
        width={560}
        destroyOnClose
      >
        <Form form={topupForm} layout="vertical" initialValues={{ amount: 25000 }}>
          <div className="mb-4 rounded-2xl border border-[#EBEEFF] bg-[#F8F9FF] p-4">
            <div className="mb-3 text-sm text-[#5B5B7A]">
              Chỉ cần nhập số tiền, sau đó bạn sẽ chọn cổng thanh toán ở bước tiếp theo.
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_TOPUP_AMOUNTS.map((amount) => {
                const active = Number(topupAmount || 0) === amount;
                return (
                  <Button
                    key={amount}
                    type={active ? "primary" : "default"}
                    className={`h-11 rounded-xl border transition
                    ${active
                        ? "bg-[#5B5BFF] text-white border-[#5B5BFF]"
                        : "bg-white border-[#E5E7F0] hover:border-[#5B5BFF]"
                      }
                    `}
                    onClick={() => topupForm.setFieldsValue({ amount })}
                  >
                    {formatCurrency(amount)}
                  </Button>
                );
              })}
            </div>
          </div>
          <Form.Item
            label="Số tiền nạp"
            name="amount"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              className="w-full"
              size="large"
              min={10000}
              step={10000}
              controls={false}
              placeholder="Nhập số tiền cần nạp"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>
          <div className="rounded-xl bg-[#F8F9FF] px-4 py-3 text-sm text-[#4A4F8A]">
            Bước tiếp theo sẽ mở màn hình chọn MoMo, VNPay, ZaloPay hoặc chuyển khoản ngân hàng.
          </div>
        </Form>
      </Modal>

      <TopupMethodModal
        open={topupMethodOpen}
        amount={selectedTopupAmount}
        selectedMethod={selectedTopupMethod}
        loading={topupLoading}
        amountLabel="Số tiền nạp"
        onCancel={handleCloseTopupFlow}
        onBack={handleBackToTopupAmount}
        onConfirm={handleConfirmTopupMethod}
        onChangeMethod={(method) => setSelectedTopupMethod(method as WalletTopupMethod)}
      />

      <Modal
        open={withdrawOpen}
        title="Tạo yêu cầu rút tiền"
        onCancel={() => setWithdrawOpen(false)}
        onOk={handleWithdraw}
        okText="Gửi yêu cầu"
        confirmLoading={withdrawActionLoading}
        destroyOnClose
      >
        <Form form={withdrawForm} layout="vertical">
          <Form.Item
            label="Số tiền rút"
            name="amount"
            rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
          >
            <InputNumber
              className="w-full"
              min={10000}
              step={10000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>
          <Form.Item label="Mã ngân hàng" name="bankCode" rules={[{ required: true, message: "Nhập mã ngân hàng" }]}>
            <Input placeholder="VD: VCB, TCB, ACB" />
          </Form.Item>
          <Form.Item label="Số tài khoản" name="accountNumber" rules={[{ required: true, message: "Nhập số tài khoản" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Chủ tài khoản" name="accountName" rules={[{ required: true, message: "Nhập chủ tài khoản" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}

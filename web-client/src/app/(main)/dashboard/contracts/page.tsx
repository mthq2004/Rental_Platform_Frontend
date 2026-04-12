"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Table, Badge, Button, Empty, App, Modal, Radio, Spin, Alert, Typography, Progress, Card, Input, Row, Col, Statistic, Space } from "antd";
import {
  FileTextOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ExportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getMyContracts,
  getContractDetail,
  getContractStatusCounts,
  activateContract,
  cancelContract,
  updateContract,
  clearContractDetail,
} from "@/stores/slices/contract.slice";
import type { RentalContract, RentalContractStatus, StatusCount } from "@/types/contract.type";
import { Form } from "antd";
import { STATUS_CONFIG } from "@/components/contracts/ContractStatusConfig";
import { getContractTableColumns } from "@/components/contracts/ContractTableColumns";
import ContractDetailModal from "@/components/contracts/ContractDetailModal";
import ContractEditModal from "@/components/contracts/ContractEditModal";
import { getRequestTemplateData } from "@/stores/slices/template-contract.slice";
import {
  handleSignResult,
  resetSmartCAState,
  signContract,
  tickSmartCARemaining,
} from "@/stores/slices/smartca.slice";

const SMARTCA_POLLING_MS = 4000;

const { Text } = Typography;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

const getContractTenantName = (record: RentalContract) => record.tenant?.name || record.tenantId || "—";

const getContractPropertyName = (record: RentalContract) =>
  (record as RentalContract & { property?: { title?: string }; propertyName?: string }).property?.title ||
  (record as RentalContract & { propertyName?: string }).propertyName ||
  record.propertyId ||
  "—";

const getContractSearchText = (record: RentalContract) =>
  [
    record.contractCode,
    getContractTenantName(record),
    getContractPropertyName(record),
    record.propertyId,
    record.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const buildCsv = (records: RentalContract[]) => {
  const header = ["contractCode", "tenant", "property", "startDate", "endDate", "monthlyRent", "status"];
  const rows = records.map((record) => [
    record.contractCode,
    getContractTenantName(record),
    getContractPropertyName(record),
    record.startDate,
    record.endDate,
    String(record.monthlyRent ?? 0),
    record.status,
  ]);
  return [header, ...rows]
    .map((columns) => columns.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

export default function ContractsPage() {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    contracts,
    contractDetail,
    contractStatusCounts,
    contractsLoading,
    contractsMeta,
    actionLoading,
  } = useAppSelector((state) => state.contract);
  const smartca = useAppSelector((state) => state.smartca);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [smartCAModalOpen, setSmartCAModalOpen] = useState(false);
  const [signingContractId, setSigningContractId] = useState<string | null>(null);
  const [signingRole, setSigningRole] = useState<"OWNER" | "TENANT" | null>(null);
  const [signMethod, setSignMethod] = useState<"smartca">("smartca");
  const [editForm] = Form.useForm();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const finalizedRef = useRef(false);

  const hasActiveSigningSession =
    Boolean(smartca.transactionId) &&
    ["WAITING_CONFIRM", "PENDING"].includes(smartca.signStatus);

  const fetchContracts = useCallback(
    (status?: string, p?: number) => {
      dispatch(
        getMyContracts({
          status: status === "all" ? undefined : status,
          page: p || page,
          limit: 10,
        })
      );
    },
    [dispatch, page]
  );

  useEffect(() => {
    dispatch(getContractStatusCounts());
    fetchContracts(activeTab);
  }, [dispatch]);

  useEffect(() => {
    fetchContracts(activeTab, page);
  }, [activeTab, page]);

  const handleRefresh = useCallback(() => {
    dispatch(getContractStatusCounts());
    fetchContracts(activeTab);
  }, [dispatch, activeTab, fetchContracts]);

  const handleViewDetail = async (rentalId: string) => {
    router.push(`/dashboard/contracts/${rentalId}`);
  };

  const handleTenantSign = (rentalId: string) => {
    if (hasActiveSigningSession && signingContractId && signingContractId !== rentalId) {
      message.warning("Bạn đang có phiên ký SmartCA đang chờ xác nhận. Vui lòng hoàn tất phiên hiện tại trước.");
      setSmartCAModalOpen(true);
      return;
    }
    setSigningContractId(rentalId);
    setSigningRole("TENANT");
    setSignMethod("smartca");
    if (!hasActiveSigningSession) {
      finalizedRef.current = false;
      dispatch(resetSmartCAState());
    }
    setSmartCAModalOpen(true);
  };

  const handleOwnerSign = (rentalId: string) => {
    if (hasActiveSigningSession && signingContractId && signingContractId !== rentalId) {
      message.warning("Bạn đang có phiên ký SmartCA đang chờ xác nhận. Vui lòng hoàn tất phiên hiện tại trước.");
      setSmartCAModalOpen(true);
      return;
    }
    setSigningContractId(rentalId);
    setSigningRole("OWNER");
    setSignMethod("smartca");
    if (!hasActiveSigningSession) {
      finalizedRef.current = false;
      dispatch(resetSmartCAState());
    }
    setSmartCAModalOpen(true);
  };

  const handleStartSmartCASign = async () => {
    if (!signingContractId) return;
    try {
      const result = await dispatch(signContract(signingContractId)).unwrap();
      if (result?.resumed) {
        message.info("Đã tiếp tục phiên ký SmartCA đang chờ xác nhận");
      } else {
        message.info("Vui lòng mở ứng dụng SmartCA VNPT để xác nhận ký hợp đồng");
      }
    } catch (err: any) {
      message.error(err || "Không thể khởi tạo phiên ký SmartCA");
    }
  };

  const handleCloseSmartCAModal = () => {
    setSmartCAModalOpen(false);
    if (["WAITING_CONFIRM", "PENDING"].includes(smartca.signStatus) && smartca.transactionId) {
      return;
    }
    setSigningContractId(null);
    setSigningRole(null);
    finalizedRef.current = false;
    dispatch(resetSmartCAState());
  };

  const handleActivate = (rentalId: string) => {
    modal.confirm({
      title: "Kích hoạt hợp đồng",
      icon: <PlayCircleOutlined />,
      content: "Kích hoạt hợp đồng sẽ tự động tạo các kỳ thanh toán hàng tháng.",
      okText: "Kích hoạt",
      okType: "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(activateContract(rentalId)).unwrap();
          message.success("Đã kích hoạt hợp đồng");
          handleRefresh();
          if (detailOpen) dispatch(getContractDetail(rentalId));
        } catch (err: any) {
          message.error(err || "Kích hoạt thất bại");
        }
      },
    });
  };

  const handleCancelContract = (rentalId: string) => {
    modal.confirm({
      title: "Hủy hợp đồng",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn hủy hợp đồng này?",
      okText: "Hủy hợp đồng",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        try {
          await dispatch(cancelContract(rentalId)).unwrap();
          message.success("Đã hủy hợp đồng");
          handleRefresh();
        } catch (err: any) {
          message.error(err || "Hủy thất bại");
        }
      },
    });
  };

  const handleOpenEdit = async (record: RentalContract) => {
    const templateId = record.templateId || "3c6930b3-2da9-4870-abed-fb8830150eac";
    const requestId = record.fromRequestId || record.rentalRequest?.requestId;

    if (requestId) {
      dispatch(getRequestTemplateData(requestId));
      router.push(`/template-contracts/${templateId}?requestId=${requestId}&contractId=${record.rentalId}`);
      return;
    }

    let detail: any = record;
    if (!Array.isArray((record as any).terms)) {
      const result = await dispatch(getContractDetail(record.rentalId));
      if (result.payload) {
        detail = result.payload;
      }
    }
    setEditOpen(true);

    editForm.setFieldsValue({
      monthlyRent: Number(detail?.monthlyRent ?? record.monthlyRent ?? 0),
      depositAmount: Number(detail?.depositAmount ?? record.depositAmount ?? 0),
      electricityCostPerKwh: detail?.electricityCostPerKwh != null ? Number(detail.electricityCostPerKwh) : undefined,
      waterCostPerM3: detail?.waterCostPerM3 != null ? Number(detail.waterCostPerM3) : undefined,
      managementFee: detail?.managementFee != null ? Number(detail.managementFee) : undefined,
      parkingFee: detail?.parkingFee != null ? Number(detail.parkingFee) : undefined,
      internetFee: detail?.internetFee != null ? Number(detail.internetFee) : undefined,
      paymentDueDay: detail?.paymentDueDay ?? record.paymentDueDay,
      lateFeePerDay: detail?.lateFeePerDay != null ? Number(detail.lateFeePerDay) : undefined,
      gracePeriodDays: detail?.gracePeriodDays ?? record.gracePeriodDays,
      earlyTerminationFee: detail?.earlyTerminationFee != null ? Number(detail.earlyTerminationFee) : undefined,
      autoRenewal: detail?.autoRenewal ?? record.autoRenewal,
      renewalNoticeDays: detail?.renewalNoticeDays ?? record.renewalNoticeDays,
      notes: detail?.notes ?? record.notes,
      terms: detail?.terms?.map((t: any) => t.content) ?? [],
    });
  };

  const handleEditSubmit = async () => {
    if (!contractDetail) return;
    try {
      const values = await editForm.validateFields();
      await dispatch(
        updateContract({ contractId: contractDetail.rentalId, data: values })
      ).unwrap();
      message.success("Cập nhật hợp đồng thành công");
      setEditOpen(false);
      dispatch(getContractDetail(contractDetail.rentalId));
      handleRefresh();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err || "Cập nhật thất bại");
    }
  };

  const columns = getContractTableColumns(user?.id, {
    onViewDetail: handleViewDetail,
    onEdit: handleOpenEdit,
    onTenantSign: handleTenantSign,
    onOwnerSign: handleOwnerSign,
    onActivate: handleActivate,
    onCancel: handleCancelContract,
    onPay: () => router.push('/dashboard/payments'),
  });

  useEffect(() => {
    if (!smartCAModalOpen) return;
    if (!smartca.transactionId) return;
    if (!["WAITING_CONFIRM", "PENDING"].includes(smartca.signStatus)) return;
    const timer = setInterval(() => { dispatch(tickSmartCARemaining()); }, 1000);
    return () => clearInterval(timer);
  }, [dispatch, smartCAModalOpen, smartca.transactionId, smartca.signStatus]);

  useEffect(() => {
    if (!smartCAModalOpen) return;
    if (!smartca.transactionId) return;
    if (!["WAITING_CONFIRM", "PENDING"].includes(smartca.signStatus)) return;
    const poll = () => dispatch(handleSignResult(smartca.transactionId!));
    poll();
    const intervalId = setInterval(poll, SMARTCA_POLLING_MS);
    return () => clearInterval(intervalId);
  }, [dispatch, smartCAModalOpen, smartca.transactionId, smartca.signStatus]);

  useEffect(() => {
    if (!smartCAModalOpen || !signingContractId) return;
    if (finalizedRef.current) return;
    if (smartca.signStatus === "SIGNED") {
      finalizedRef.current = true;
      message.success(signingRole === "OWNER" ? "Chủ nhà đã ký hợp đồng" : "Hợp đồng đã được ký hoàn tất");
      handleRefresh();
      if (detailOpen) dispatch(getContractDetail(signingContractId));
      setTimeout(() => { handleCloseSmartCAModal(); }, 800);
      return;
    }
    if (smartca.signStatus === "REJECTED") { finalizedRef.current = true; message.warning("Bạn đã từ chối ký hợp đồng"); return; }
    if (smartca.signStatus === "EXPIRED") { finalizedRef.current = true; message.error("Phiên ký đã hết hạn, vui lòng thử lại"); return; }
    if (smartca.signStatus === "ERROR") { finalizedRef.current = true; message.error(smartca.error || "Ký SmartCA thất bại"); }
  }, [dispatch, detailOpen, handleRefresh, message, signingContractId, signingRole, smartCAModalOpen, smartca.error, smartca.signStatus]);

  const progressPercent = smartca.initialExpiredIn > 0
    ? Math.max(0, Math.min(100, (smartca.expiredIn / smartca.initialExpiredIn) * 100))
    : 0;

  const displayContracts = useMemo(() => {
    const source = Array.isArray(contracts) ? contracts : [];
    const seen = new Set<string>();
    return source.filter((item) => {
      const id = item?.rentalId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return displayContracts;
    return displayContracts.filter((record) => getContractSearchText(record).includes(term));
  }, [displayContracts, searchTerm]);

  const contractSummary = useMemo(() => {
    const total = displayContracts.length;
    const active = displayContracts.filter((item) => item.status === "active").length;
    const inProgress = displayContracts.filter((item) =>
      ["draft", "pending_tenant", "tenant_signed", "pending_landlord", "owner_signed"].includes(item.status)
    ).length;
    const totalMonthlyRent = displayContracts.reduce((sum, item) => sum + Number(item.monthlyRent || 0), 0);
    return { total, active, inProgress, totalMonthlyRent };
  }, [displayContracts]);

  const handleExportContracts = useCallback(() => {
    if (!filteredContracts.length) { message.info("Không có hợp đồng để xuất"); return; }
    const csv = buildCsv(filteredContracts);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredContracts, message]);

  const handleCreateContract = useCallback(() => { router.push("/template-contracts"); }, [router]);

  const statusTabs = contractStatusCounts.length
    ? contractStatusCounts
    : Object.entries(STATUS_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label, count: 0 }));

  const tabItems = [
    {
      key: "all",
      label: (
        <span className="flex items-center gap-2 px-5">
          <FileTextOutlined className="text-slate-500" />
          <span className="font-medium">Tất cả</span>
          <Badge
            count={statusTabs.reduce((s: number, t: StatusCount) => s + (t.count || 0), 0)}
            showZero
            size="small"
            color="#94a3b8"
          />
        </span>
      ),
    },
    ...statusTabs
      .filter((t: StatusCount) => t.count > 0)
      .map((t: StatusCount) => {
        const cfg = STATUS_CONFIG[t.id as RentalContractStatus];
        if (!cfg) return null;
        return {
          key: t.id,
          label: (
            <span className="flex items-center gap-2 px-1">
              {cfg.icon}
              <span className="font-medium">{cfg.label}</span>
              <Badge count={t.count} showZero size="small" />
            </span>
          ),
        };
      })
      .filter(Boolean) as any[],
  ];

  return (
    <div className="space-y-5 px-1">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight mb-0.5">Hợp đồng thuê</h2>
          <p className="text-sm text-gray-400">Quản lý tất cả hợp đồng thuê nhà</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={contractsLoading}
          className="rounded-lg border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800 shadow-none"
        >
          Làm mới
        </Button>
      </div>

      {/* Main Card */}
      <Card
        className="shadow border-0 rounded-2xl overflow-hidden"
        styles={{ body: { padding: 0 } }}
      >
        {/* Hero Banner */}
        <div
          className="relative px-8 py-8 text-white overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0B1B3B 0%, #102454 50%, #1B3A7A 100%)",
          }}
        >
          {/* Subtle background texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left: Title */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/90 uppercase">
                <FileTextOutlined className="text-[10px]" />
                Contract Center
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight leading-tight">
                  Quản lý hợp đồng thuê
                </h1>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300 max-w-xl">
                  Theo dõi trạng thái ký kết, kích hoạt và thanh toán hợp đồng theo chuẩn vận hành doanh nghiệp.
                </p>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                icon={<ExportOutlined />}
                onClick={handleExportContracts}
                className="rounded-lg border-white/25 text-white bg-white/10 hover:bg-white/20 hover:border-white/40 shadow-none h-9 px-4"
              >
                Export
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateContract}
                className="rounded-lg h-9 px-4 shadow-none font-medium"
                style={{ background: "#2563eb", borderColor: "#2563eb" }}
              >
                Tạo hợp đồng mới
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="relative mt-7 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Tổng hợp đồng", value: contractSummary.total },
              { label: "Đang hiệu lực", value: contractSummary.active },
              { label: "Đang xử lý", value: contractSummary.inProgress },
              { label: "Tiền thuê / tháng", value: formatMoney(contractSummary.totalMonthlyRent) },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="rounded-xl px-5 py-4"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <p className="text-xs text-white/60 font-medium mb-1.5 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-white leading-none">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-6 space-y-5 bg-slate-50/70">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã hợp đồng, bên thuê hoặc bất động sản..."
              prefix={<SearchOutlined className="text-slate-400 text-sm" />}
              allowClear
              className="sm:max-w-[400px] rounded-lg"
              style={{ height: 38 }}
            />
            <span className="text-[13px] text-slate-400 shrink-0">
              {contractsMeta?.total
                ? `Tổng ${contractsMeta.total} hợp đồng trong hệ thống`
                : "Đang tải dữ liệu..."}
            </span>
          </div>

          {/* Tabs */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid #e8ecf0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={(key) => { setActiveTab(key); setPage(1); }}
              items={tabItems}
              className="px-4 pt-1"
              tabBarStyle={{ marginBottom: 0, borderBottom: "1px solid #f0f2f5" }}
            />
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "#fff",
              border: "1px solid #e8ecf0",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <Table
              dataSource={filteredContracts}
              columns={columns}
              loading={contractsLoading}
              rowKey={(record) => record.rentalId || record.contractCode}
              pagination={{
                current: page,
                pageSize: 10,
                total: contractsMeta?.total || 0,
                showTotal: (total) => (
                  <span className="text-slate-500 text-sm">Tổng {total} hợp đồng</span>
                ),
                onChange: (p) => setPage(p),
                className: "px-5 py-3",
              }}
              scroll={{ x: 1180 }}
              locale={{
                emptyText: (
                  <div className="py-16">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span className="text-slate-400 text-sm">Không có hợp đồng nào</span>
                      }
                    />
                  </div>
                ),
              }}
              className="
                [&_.ant-table-thead_th]:bg-slate-50
                [&_.ant-table-thead_th]:text-slate-500
                [&_.ant-table-thead_th]:font-semibold
                [&_.ant-table-thead_th]:text-[11px]
                [&_.ant-table-thead_th]:uppercase
                [&_.ant-table-thead_th]:tracking-wider
                [&_.ant-table-thead_th]:py-3
                [&_.ant-table-thead_th]:px-5
                [&_.ant-table-thead_th]:border-b
                [&_.ant-table-thead_th]:border-slate-100
                [&_.ant-table-tbody_td]:py-3.5
                [&_.ant-table-tbody_td]:px-5
                [&_.ant-table-tbody_td]:text-sm
                [&_.ant-table-tbody_td]:text-slate-700
                [&_.ant-table-tbody_tr:hover_td]:bg-slate-50/80
                [&_.ant-table-tbody_tr]:border-b
                [&_.ant-table-tbody_tr]:border-slate-50
              "
            />
          </div>
        </div>
      </Card>

      {/* Modals */}
      <ContractDetailModal
        open={detailOpen}
        contractDetail={contractDetail}
        userId={user?.id}
        onClose={() => { setDetailOpen(false); dispatch(clearContractDetail()); }}
        onEdit={handleOpenEdit}
        onTenantSign={handleTenantSign}
        onOwnerSign={handleOwnerSign}
        onActivate={handleActivate}
        onCancel={handleCancelContract}
      />

      <ContractEditModal
        open={editOpen}
        contractDetail={contractDetail}
        actionLoading={actionLoading}
        form={editForm}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <Modal
        open={smartCAModalOpen}
        title={
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-base font-semibold text-slate-800">Ký hợp đồng điện tử</span>
          </div>
        }
        onCancel={handleCloseSmartCAModal}
        footer={null}
        destroyOnHidden
        className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-slate-100 [&_.ant-modal-header]:pb-4 [&_.ant-modal-body]:pt-5"
      >
        {!smartca.transactionId && (
          <div className="space-y-4">
            <Text className="text-slate-500 text-sm">Chọn phương thức xác nhận chữ ký:</Text>
            <Radio.Group
              value={signMethod}
              onChange={(e) => setSignMethod(e.target.value)}
              className="w-full"
            >
              <div className="border border-slate-200 rounded-xl px-4 py-3.5 hover:border-blue-400 transition-colors">
                <Radio value="smartca">
                  <span className="font-medium text-slate-700">SmartCA (VNPT)</span>
                </Radio>
              </div>
            </Radio.Group>
            <Alert
              type="info"
              showIcon
              message={
                <span className="text-sm text-slate-600">
                  Sau khi xác nhận, vui lòng mở ứng dụng SmartCA VNPT để hoàn tất ký hợp đồng.
                </span>
              }
              className="rounded-xl border-blue-100 bg-blue-50"
            />
            <div className="flex justify-end gap-2.5 pt-1">
              <Button onClick={handleCloseSmartCAModal} className="rounded-lg h-9 px-5">Hủy</Button>
              <Button
                type="primary"
                loading={smartca.loading}
                onClick={handleStartSmartCASign}
                className="rounded-lg h-9 px-5"
              >
                Xác nhận ký
              </Button>
            </div>
          </div>
        )}

        {smartca.transactionId && (
          <div className="space-y-4">
            <Alert
              type={
                smartca.signStatus === "SIGNED" ? "success"
                  : ["REJECTED", "EXPIRED", "ERROR"].includes(smartca.signStatus) ? "error"
                  : "info"
              }
              showIcon
              message={
                <span className="font-medium text-sm">
                  {smartca.signStatus === "SIGNED" ? "Ký thành công"
                    : smartca.signStatus === "REJECTED" ? "Bạn đã từ chối ký hợp đồng"
                    : smartca.signStatus === "EXPIRED" ? "Phiên ký đã hết hạn, vui lòng thử lại"
                    : smartca.signStatus === "ERROR" ? smartca.error || "Có lỗi xảy ra khi ký SmartCA"
                    : "Đang chờ xác nhận..."}
                </span>
              }
              description={
                <span className="text-[13px] text-slate-500">
                  {smartca.signStatus === "SIGNED"
                    ? "Hệ thống đang cập nhật lại trạng thái hợp đồng."
                    : "Bạn có thể tạm đóng cửa sổ này. Khi mở lại sẽ tiếp tục hiển thị tiến trình ký."}
                </span>
              }
              className="rounded-xl"
            />

            {["WAITING_CONFIRM", "PENDING"].includes(smartca.signStatus) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4">
                <div className="flex items-center gap-2.5 text-blue-600 mb-2">
                  <Spin size="small" />
                  <Text className="text-blue-600 text-sm font-medium">
                    Đang chờ xác nhận trên ứng dụng SmartCA...
                  </Text>
                </div>
                <Text className="block text-[13px] text-blue-500 mb-2.5">
                  Thời gian còn lại: {Math.max(0, smartca.expiredIn)} giây
                </Text>
                <Progress
                  percent={progressPercent}
                  showInfo={false}
                  strokeColor="#3b82f6"
                  trailColor="#dbeafe"
                  status="active"
                  strokeLinecap="round"
                />
              </div>
            )}

            <div className="flex justify-end pt-1">
              {(smartca.signStatus === "SIGNED" || ["REJECTED", "EXPIRED", "ERROR"].includes(smartca.signStatus)) ? (
                <Button type="primary" onClick={handleCloseSmartCAModal} className="rounded-lg h-9 px-5">Đóng</Button>
              ) : (
                <Button onClick={handleCloseSmartCAModal} className="rounded-lg h-9 px-5">Đóng</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
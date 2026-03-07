"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Empty,
  Typography,
  Tooltip,
  Badge,
  Modal,
  Timeline,
  App,
  Input,
  InputNumber,
  Form,
  Switch,
} from "antd";
import {
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  StopOutlined,
  FileTextOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getMyContracts,
  getContractDetail,
  getContractStatusCounts,
  sendContractToTenant,
  tenantSignContract,
  ownerSignContract,
  activateContract,
  cancelContract,
  updateContract,
  clearContractDetail,
} from "@/stores/slices/contract.slice";
import type { RentalContract, RentalContractStatus, StatusCount } from "@/types/contract.type";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;

// ====== Status config ======
const STATUS_CONFIG: Record<
  RentalContractStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  draft: { label: "Bản nháp", color: "default", icon: <EditOutlined /> },
  pending_tenant: { label: "Chờ người thuê ký", color: "processing", icon: <ClockCircleOutlined /> },
  tenant_signed: { label: "Người thuê đã ký", color: "blue", icon: <CheckCircleOutlined /> },
  pending_landlord: { label: "Chờ chủ nhà ký", color: "orange", icon: <ClockCircleOutlined /> },
  fully_signed: { label: "Đã ký đầy đủ", color: "cyan", icon: <FileDoneOutlined /> },
  active: { label: "Đang hiệu lực", color: "success", icon: <PlayCircleOutlined /> },
  expired: { label: "Hết hạn", color: "default", icon: <ClockCircleOutlined /> },
  terminated: { label: "Đã chấm dứt", color: "error", icon: <StopOutlined /> },
  renewed: { label: "Đã gia hạn", color: "purple", icon: <SwapOutlined /> },
  cancelled: { label: "Đã hủy", color: "default", icon: <CloseCircleOutlined /> },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatCurrency = (amount: number | string | null | undefined) => {
  const n = Number(amount);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
};

const moneyFormatter = (v: number | undefined) => `${v ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moneyParser = (v: any) => Number((v || "").toString().replace(/,/g, "")) as any;

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

  const [activeTab, setActiveTab] = useState("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [page, setPage] = useState(1);

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
    await dispatch(getContractDetail(rentalId));
    setDetailOpen(true);
  };

  const handleSendToTenant = (rentalId: string) => {
    modal.confirm({
      title: "Gửi hợp đồng cho người thuê",
      icon: <SendOutlined />,
      content: "Sau khi gửi, người thuê sẽ có thể xem và ký hợp đồng này.",
      okText: "Gửi",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(sendContractToTenant(rentalId)).unwrap();
          message.success("Đã gửi hợp đồng cho người thuê");
          handleRefresh();
        } catch (err: any) {
          message.error(err || "Gửi thất bại");
        }
      },
    });
  };

  const handleTenantSign = (rentalId: string) => {
    modal.confirm({
      title: "Ký hợp đồng",
      icon: <CheckCircleOutlined />,
      content: "Bạn xác nhận ký hợp đồng này? Hành động này không thể hoàn tác.",
      okText: "Ký hợp đồng",
      okType: "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(tenantSignContract(rentalId)).unwrap();
          message.success("Đã ký hợp đồng thành công");
          handleRefresh();
          if (detailOpen) dispatch(getContractDetail(rentalId));
        } catch (err: any) {
          message.error(err || "Ký thất bại");
        }
      },
    });
  };

  const handleOwnerSign = (rentalId: string) => {
    modal.confirm({
      title: "Ký hợp đồng (Chủ nhà)",
      icon: <CheckCircleOutlined />,
      content: "Bạn xác nhận ký hợp đồng? Sau khi cả hai bên ký, hợp đồng sẽ chờ kích hoạt.",
      okText: "Ký hợp đồng",
      okType: "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(ownerSignContract(rentalId)).unwrap();
          message.success("Đã ký hợp đồng thành công");
          handleRefresh();
          if (detailOpen) dispatch(getContractDetail(rentalId));
        } catch (err: any) {
          message.error(err || "Ký thất bại");
        }
      },
    });
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
    let detail: any = record;
    if (!Array.isArray((record as any).terms)) {
      const result = await dispatch(getContractDetail(record.rentalId));
      detail = result.payload;
    }
    editForm.setFieldsValue({
      monthlyRent: Number(detail.monthlyRent ?? record.monthlyRent),
      depositAmount: Number(detail.depositAmount ?? record.depositAmount),
      electricityCostPerKwh: detail.electricityCostPerKwh != null ? Number(detail.electricityCostPerKwh) : undefined,
      waterCostPerM3: detail.waterCostPerM3 != null ? Number(detail.waterCostPerM3) : undefined,
      managementFee: detail.managementFee != null ? Number(detail.managementFee) : undefined,
      parkingFee: detail.parkingFee != null ? Number(detail.parkingFee) : undefined,
      internetFee: detail.internetFee != null ? Number(detail.internetFee) : undefined,
      paymentDueDay: detail.paymentDueDay ?? record.paymentDueDay,
      lateFeePerDay: detail.lateFeePerDay != null ? Number(detail.lateFeePerDay) : undefined,
      gracePeriodDays: detail.gracePeriodDays ?? record.gracePeriodDays,
      autoRenewal: detail.autoRenewal ?? record.autoRenewal,
      notes: detail.notes ?? record.notes,
      terms: detail.terms?.map((t: any) => t.content) ?? [],
    });
    setEditOpen(true);
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
      if (err?.errorFields) return; // form validation error
      message.error(err || "Cập nhật thất bại");
    }
  };

  const isOwner = (record: RentalContract) => record.ownerId === user?.id;

  // ====== Table columns ======
  const columns: ColumnsType<RentalContract> = [
    {
      title: "Mã hợp đồng",
      dataIndex: "contractCode",
      key: "contractCode",
      width: 160,
      render: (val) => <Text strong className="text-sm">{val}</Text>,
    },
    {
      title: "Thời hạn",
      key: "period",
      width: 220,
      render: (_, r) => (
        <Text className="text-sm">
          {formatDate(r.startDate)} → {formatDate(r.endDate)}
        </Text>
      ),
    },
    {
      title: "Giá thuê / tháng",
      dataIndex: "monthlyRent",
      key: "monthlyRent",
      width: 160,
      render: (val) => (
        <Text strong className="text-red-500 text-sm">{formatCurrency(val)}</Text>
      ),
      sorter: (a, b) => a.monthlyRent - b.monthlyRent,
    },
    {
      title: "Tiền cọc",
      dataIndex: "depositAmount",
      key: "depositAmount",
      width: 140,
      render: (val) => <Text className="text-sm">{formatCurrency(val)}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 170,
      render: (status: RentalContractStatus) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        return (
          <Tag color={cfg.color} icon={cfg.icon} className="text-xs">
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: "Vai trò",
      key: "role",
      width: 100,
      render: (_, r) => (
        <Tag color={isOwner(r) ? "gold" : "blue"} className="text-xs">
          {isOwner(r) ? "Chủ nhà" : "Người thuê"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 220,
      fixed: "right",
      render: (_, record) => {
        const owner = isOwner(record);
        return (
          <Space size={4} wrap>
            <Tooltip title="Xem chi tiết">
              <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.rentalId)} />
            </Tooltip>

            {/* Owner sends draft to tenant */}
            {owner && record.status === "draft" && (
              <>
                <Tooltip title="Chỉnh sửa">
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)} />
                </Tooltip>
                <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleSendToTenant(record.rentalId)}>
                  Gửi
                </Button>
              </>
            )}

            {/* Tenant signs */}
            {!owner && record.status === "pending_tenant" && (
              <Button size="small" type="primary" onClick={() => handleTenantSign(record.rentalId)}>
                Ký hợp đồng
              </Button>
            )}

            {/* Owner signs */}
            {owner && record.status === "pending_landlord" && (
              <Button size="small" type="primary" onClick={() => handleOwnerSign(record.rentalId)}>
                Ký hợp đồng
              </Button>
            )}

            {/* Owner activates */}
            {owner && record.status === "fully_signed" && (
              <Button size="small" type="primary" onClick={() => handleActivate(record.rentalId)}>
                Kích hoạt
              </Button>
            )}

            {/* Cancel */}
            {(record.status === "draft" || record.status === "pending_tenant") && owner && (
              <Tooltip title="Hủy hợp đồng">
                <Button type="text" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleCancelContract(record.rentalId)} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // Build tab items
  const statusTabs = contractStatusCounts.length
    ? contractStatusCounts
    : Object.entries(STATUS_CONFIG).map(([id, cfg]) => ({ id, label: cfg.label, count: 0 }));

  const tabItems = [
    {
      key: "all",
      label: (
        <span className="flex items-center gap-1.5">
          <FileTextOutlined />
          Tất cả
          <Badge
            count={statusTabs.reduce((s: number, t: StatusCount) => s + (t.count || 0), 0)}
            showZero
            size="small"
            color="#8c8c8c"
            style={{ marginLeft: 4 }}
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
            <span className="flex items-center gap-1.5">
              {cfg.icon}
              {cfg.label}
              <Badge count={t.count} showZero size="small" style={{ marginLeft: 4 }} />
            </span>
          ),
        };
      })
      .filter(Boolean) as any[],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Hợp đồng thuê</h2>
          <p className="text-sm text-gray-500">Quản lý tất cả hợp đồng thuê nhà</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={contractsLoading}>
          Làm mới
        </Button>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-lg">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => { setActiveTab(key); setPage(1); }}
          items={tabItems}
          className="px-2"
          tabBarStyle={{ marginBottom: 0 }}
        />

        <Table
          dataSource={Array.isArray(contracts) ? contracts : []}
          columns={columns}
          loading={contractsLoading}
          rowKey="rentalId"
          pagination={{
            current: page,
            pageSize: 10,
            total: contractsMeta?.total || 0,
            showTotal: (total) => `Tổng ${total} hợp đồng`,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có hợp đồng nào" />
            ),
          }}
          className="[&_.ant-table-thead_th]:bg-gray-50! [&_.ant-table-thead_th]:text-gray-600! [&_.ant-table-thead_th]:font-medium! [&_.ant-table-thead_th]:text-xs! [&_.ant-table-thead_th]:uppercase!"
        />
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onCancel={() => { setDetailOpen(false); dispatch(clearContractDetail()); }}
        title={null}
        footer={null}
        width={860}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        {contractDetail && (() => {
          const cfg = STATUS_CONFIG[contractDetail.status] || STATUS_CONFIG.draft;
          const ownerSide = isOwner(contractDetail);
          const tenantSigned = contractDetail.signatureLog?.some(l => l.action === "TENANT_SIGNED");
          const landlordSigned = contractDetail.signatureLog?.some(l => l.action === "LANDLORD_SIGNED");
          const tenantSignDate = contractDetail.signatureLog?.find(l => l.action === "TENANT_SIGNED")?.createdAt;
          const landlordSignDate = contractDetail.signatureLog?.find(l => l.action === "LANDLORD_SIGNED")?.createdAt;
          const hasFees = contractDetail.electricityCostPerKwh != null || contractDetail.waterCostPerM3 != null
            || contractDetail.managementFee != null || contractDetail.parkingFee != null || contractDetail.internetFee != null;

          return (
            <div>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b rounded-t-lg">
                <div className="flex items-center gap-3">
                  <FileTextOutlined className="text-blue-500 text-lg" />
                  <span className="font-semibold text-gray-700">Hợp đồng thuê nhà</span>
                  <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                </div>
                <Space>
                  {contractDetail.status === "draft" && ownerSide && (
                    <>
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEdit(contractDetail)}>Chỉnh sửa</Button>
                      <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleSendToTenant(contractDetail.rentalId)}>Gửi cho người thuê</Button>
                    </>
                  )}
                  {contractDetail.status === "pending_tenant" && !ownerSide && (
                    <Button size="small" type="primary" onClick={() => handleTenantSign(contractDetail.rentalId)}>Ký hợp đồng</Button>
                  )}
                  {contractDetail.status === "pending_landlord" && ownerSide && (
                    <Button size="small" type="primary" onClick={() => handleOwnerSign(contractDetail.rentalId)}>Ký hợp đồng</Button>
                  )}
                  {contractDetail.status === "fully_signed" && ownerSide && (
                    <Button size="small" type="primary" onClick={() => handleActivate(contractDetail.rentalId)}>Kích hoạt hợp đồng</Button>
                  )}
                </Space>
              </div>

              {/* A4 document */}
              <div className="overflow-y-auto bg-gray-100" style={{ maxHeight: "76vh" }}>
                <div
                  className="mx-auto my-6 bg-white shadow-lg"
                  style={{ maxWidth: 700, padding: "48px 64px", fontFamily: "'Times New Roman', Times, serif" }}
                >
                  {/* National header */}
                  <div className="text-center mb-5">
                    <p className="font-bold text-sm tracking-wide">CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="italic text-sm">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-gray-400 text-xs mt-1">────────────────────────</p>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-1">HỢP ĐỒNG THUÊ NHÀ Ở</h2>
                    <p className="text-sm">Số: <strong>{contractDetail.contractCode}</strong></p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ngày {dayjs(contractDetail.createdAt).format("DD")} tháng {dayjs(contractDetail.createdAt).format("MM")} năm {dayjs(contractDetail.createdAt).format("YYYY")}
                    </p>
                  </div>

                  {/* Legal basis */}
                  <div className="mb-5 text-sm text-gray-600 italic leading-relaxed">
                    <p>- Căn cứ Bộ luật Dân sự nước Cộng hoà xã hội chủ nghĩa Việt Nam;</p>
                    <p>- Căn cứ Luật Nhà ở và các văn bản hướng dẫn thi hành;</p>
                    <p>- Dựa trên nhu cầu và thoả thuận tự nguyện giữa các bên.</p>
                  </div>

                  {/* Parties */}
                  <section className="mb-5">
                    <h3 className="font-bold text-sm uppercase mb-3 pb-1" style={{ borderBottom: "1.5px solid #333" }}>
                      I. CÁC BÊN THAM GIA HỢP ĐỒNG
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="font-bold text-blue-700">BÊN A – BÊN CHO THUÊ</p>
                        {ownerSide && <span className="text-xs text-blue-500">(Bạn)</span>}
                        <p className="text-gray-400 text-xs mt-1 break-all">ID: {contractDetail.ownerId}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="font-bold text-green-700">BÊN B – BÊN THUÊ</p>
                        {!ownerSide && <span className="text-xs text-green-500">(Bạn)</span>}
                        <p className="text-gray-400 text-xs mt-1 break-all">ID: {contractDetail.tenantId}</p>
                      </div>
                    </div>
                  </section>

                  {/* Content */}
                  <section className="mb-1">
                    <h3 className="font-bold text-sm uppercase mb-3 pb-1" style={{ borderBottom: "1.5px solid #333" }}>
                      II. NỘI DUNG HỢP ĐỒNG
                    </h3>
                  </section>

                  {/* Article 1 */}
                  <section className="mb-4 text-sm">
                    <p className="font-bold mb-1">Điều 1. Đối tượng hợp đồng</p>
                    <p className="leading-relaxed">
                      Bên A đồng ý cho Bên B thuê bất động sản mã:{" "}
                      <strong>{contractDetail.propertyId}</strong>
                    </p>
                  </section>

                  {/* Article 2 */}
                  <section className="mb-4 text-sm">
                    <p className="font-bold mb-2">Điều 2. Thời hạn và giá thuê</p>
                    <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td className="py-1.5 text-gray-600 w-48">Thời gian thuê:</td>
                          <td className="py-1.5 font-medium">{formatDate(contractDetail.startDate)} — {formatDate(contractDetail.endDate)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td className="py-1.5 text-gray-600">Giá thuê hàng tháng:</td>
                          <td className="py-1.5 font-bold text-red-600">{formatCurrency(contractDetail.monthlyRent)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td className="py-1.5 text-gray-600">Tiền đặt cọc:</td>
                          <td className="py-1.5 font-medium">{formatCurrency(contractDetail.depositAmount)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td className="py-1.5 text-gray-600">Ngày thanh toán:</td>
                          <td className="py-1.5">Ngày <strong>{contractDetail.paymentDueDay}</strong> hàng tháng</td>
                        </tr>
                        {contractDetail.gracePeriodDays > 0 && (
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td className="py-1.5 text-gray-600">Gia hạn thanh toán:</td>
                            <td className="py-1.5">{contractDetail.gracePeriodDays} ngày</td>
                          </tr>
                        )}
                        {contractDetail.lateFeePerDay != null && (
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td className="py-1.5 text-gray-600">Phí chậm/ngày:</td>
                            <td className="py-1.5">{formatCurrency(contractDetail.lateFeePerDay)}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-1.5 text-gray-600">Tự động gia hạn:</td>
                          <td className="py-1.5">{contractDetail.autoRenewal ? "Có" : "Không"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  {/* Article 3: Fees */}
                  {hasFees && (
                    <section className="mb-4 text-sm">
                      <p className="font-bold mb-2">Điều 3. Chi phí dịch vụ</p>
                      <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                        <tbody>
                          {contractDetail.electricityCostPerKwh != null && (
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td className="py-1.5 text-gray-600 w-48">Tiền điện:</td>
                              <td className="py-1.5">{formatCurrency(contractDetail.electricityCostPerKwh)} / kWh</td>
                            </tr>
                          )}
                          {contractDetail.waterCostPerM3 != null && (
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td className="py-1.5 text-gray-600">Tiền nước:</td>
                              <td className="py-1.5">{formatCurrency(contractDetail.waterCostPerM3)} / m³</td>
                            </tr>
                          )}
                          {contractDetail.managementFee != null && (
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td className="py-1.5 text-gray-600">Phí quản lý:</td>
                              <td className="py-1.5">{formatCurrency(contractDetail.managementFee)}</td>
                            </tr>
                          )}
                          {contractDetail.parkingFee != null && (
                            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                              <td className="py-1.5 text-gray-600">Phí giữ xe:</td>
                              <td className="py-1.5">{formatCurrency(contractDetail.parkingFee)}</td>
                            </tr>
                          )}
                          {contractDetail.internetFee != null && (
                            <tr>
                              <td className="py-1.5 text-gray-600">Phí internet:</td>
                              <td className="py-1.5">{formatCurrency(contractDetail.internetFee)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </section>
                  )}

                  {/* Article 4: Terms */}
                  {contractDetail.terms && contractDetail.terms.length > 0 && (
                    <section className="mb-4 text-sm">
                      <p className="font-bold mb-2">Điều {hasFees ? 4 : 3}. Điều khoản và nội quy</p>
                      <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 leading-relaxed">
                        {contractDetail.terms.map((term) => (
                          <li key={term.id}>{term.content}</li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {/* Notes */}
                  {contractDetail.notes && (
                    <section className="mb-4 text-sm">
                      <p className="font-bold mb-2">Ghi chú bổ sung</p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {contractDetail.notes}
                      </div>
                    </section>
                  )}

                  {/* Signature history */}
                  {contractDetail.signatureLog && contractDetail.signatureLog.length > 0 && (
                    <section className="mb-4 text-sm">
                      <p className="font-bold mb-2">Lịch sử thao tác</p>
                      <Timeline
                        items={contractDetail.signatureLog.map((log) => ({
                          color: log.action.includes("SIGNED") ? "green" : "blue",
                          children: (
                            <span className="text-xs text-gray-600">
                              {log.action === "SENT_TO_TENANT" && "Gửi cho người thuê"}
                              {log.action === "TENANT_SIGNED" && "Người thuê đã ký"}
                              {log.action === "LANDLORD_SIGNED" && "Chủ nhà đã ký"}
                              {!["SENT_TO_TENANT", "TENANT_SIGNED", "LANDLORD_SIGNED"].includes(log.action) && log.action}
                              {" · "}{dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                            </span>
                          ),
                        }))}
                      />
                    </section>
                  )}

                  {/* Signatures */}
                  <section className="mt-8 pt-5" style={{ borderTop: "2px solid #333" }}>
                    <div className="grid grid-cols-2 gap-8 text-center text-sm">
                      <div>
                        <p className="font-bold">BÊN A – BÊN CHO THUÊ</p>
                        <p className="text-gray-400 text-xs italic mb-3">(Chủ nhà)</p>
                        {landlordSigned ? (
                          <div className="border border-green-400 rounded p-3 bg-green-50">
                            <CheckCircleOutlined className="text-green-500 text-xl" />
                            <p className="text-green-600 text-xs mt-1 font-medium">Đã ký điện tử</p>
                            <p className="text-gray-500 text-xs">{formatDate(landlordSignDate || "")}</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">
                            Chưa ký
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold">BÊN B – BÊN THUÊ</p>
                        <p className="text-gray-400 text-xs italic mb-3">(Người thuê)</p>
                        {tenantSigned ? (
                          <div className="border border-green-400 rounded p-3 bg-green-50">
                            <CheckCircleOutlined className="text-green-500 text-xl" />
                            <p className="text-green-600 text-xs mt-1 font-medium">Đã ký điện tử</p>
                            <p className="text-gray-500 text-xs">{formatDate(tenantSignDate || "")}</p>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded p-4 text-gray-400 text-xs">
                            Chưa ký
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <EditOutlined className="text-blue-500" />
            <span>Chỉnh sửa hợp đồng</span>
          </div>
        }
        okText="Lưu thay đổi"
        cancelText="Hủy"
        onOk={handleEditSubmit}
        confirmLoading={actionLoading}
        destroyOnClose
        width={660}
      >
        <Form form={editForm} layout="vertical" className="pt-3">
          {/* Finance */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
            <p className="font-semibold text-blue-700 text-sm mb-3">💰 Tài chính</p>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item label="Giá thuê / tháng (VNĐ)" name="monthlyRent" rules={[{ required: true, message: "Vui lòng nhập giá thuê" }]}>
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Tiền đặt cọc (VNĐ)" name="depositAmount">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Tiền điện / kWh" name="electricityCostPerKwh">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Tiền nước / m³" name="waterCostPerM3">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Phí quản lý" name="managementFee">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Phí giữ xe" name="parkingFee">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Phí internet" name="internetFee">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
              <Form.Item label="Phí chậm thanh toán / ngày" name="lateFeePerDay">
                <InputNumber min={0} className="w-full" formatter={moneyFormatter} parser={moneyParser} />
              </Form.Item>
            </div>
          </div>

          {/* Payment conditions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <p className="font-semibold text-gray-700 text-sm mb-3">📋 Điều kiện thanh toán</p>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item label="Ngày thanh toán hàng tháng" name="paymentDueDay">
                <InputNumber min={1} max={28} className="w-full" addonAfter="hàng tháng" />
              </Form.Item>
              <Form.Item label="Số ngày gia hạn thanh toán" name="gracePeriodDays">
                <InputNumber min={0} max={30} className="w-full" addonAfter="ngày" />
              </Form.Item>
            </div>
            <Form.Item label="Tự động gia hạn hợp đồng" name="autoRenewal" valuePropName="checked" className="mb-0">
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </div>

          {/* Terms */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <p className="font-semibold text-gray-700 text-sm mb-3">📝 Điều khoản & nội quy</p>
            <Form.List name="terms">
              {(fields, { add, remove }) => (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.key} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Form.Item {...field} noStyle>
                          <Input.TextArea
                            rows={2}
                            placeholder={`Điều khoản ${index + 1}: VD: Không được nuôi thú cưng...`}
                          />
                        </Form.Item>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(field.name)}
                        className="mt-1 shrink-0"
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    block
                    className="mt-1"
                  >
                    Thêm điều khoản
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="font-semibold text-gray-700 text-sm mb-2">🗒 Ghi chú bổ sung</p>
            <Form.Item name="notes" noStyle>
              <Input.TextArea rows={3} placeholder="Ghi chú thêm cho hợp đồng..." maxLength={1000} showCount />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

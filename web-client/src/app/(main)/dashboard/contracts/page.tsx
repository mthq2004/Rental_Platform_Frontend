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
  Descriptions,
  Timeline,
  App,
  Input,
  InputNumber,
  Form,
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

const formatCurrency = (amount: number) => {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
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

  const handleOpenEdit = (record: RentalContract) => {
    editForm.setFieldsValue({
      monthlyRent: record.monthlyRent,
      depositAmount: record.depositAmount,
      electricityCostPerKwh: record.electricityCostPerKwh,
      waterCostPerM3: record.waterCostPerM3,
      managementFee: record.managementFee,
      parkingFee: record.parkingFee,
      internetFee: record.internetFee,
      paymentDueDay: record.paymentDueDay,
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
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { handleViewDetail(record.rentalId).then(() => handleOpenEdit(record)); }} />
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
        title="Chi tiết hợp đồng"
        footer={null}
        width={740}
        destroyOnClose
      >
        {contractDetail && (
          <div className="space-y-5 pt-2">
            {/* Basic info */}
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Mã hợp đồng" span={2}>
                <Text strong>{contractDetail.contractCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={2}>
                {(() => {
                  const cfg = STATUS_CONFIG[contractDetail.status];
                  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">{formatDate(contractDetail.startDate)}</Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">{formatDate(contractDetail.endDate)}</Descriptions.Item>
              <Descriptions.Item label="Giá thuê / tháng">
                <Text strong className="text-red-500">{formatCurrency(contractDetail.monthlyRent)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatCurrency(contractDetail.depositAmount)}</Descriptions.Item>
              {contractDetail.electricityCostPerKwh != null && (
                <Descriptions.Item label="Tiền điện/kWh">{formatCurrency(contractDetail.electricityCostPerKwh)}</Descriptions.Item>
              )}
              {contractDetail.waterCostPerM3 != null && (
                <Descriptions.Item label="Tiền nước/m³">{formatCurrency(contractDetail.waterCostPerM3)}</Descriptions.Item>
              )}
              {contractDetail.managementFee != null && (
                <Descriptions.Item label="Phí quản lý">{formatCurrency(contractDetail.managementFee)}</Descriptions.Item>
              )}
              {contractDetail.parkingFee != null && (
                <Descriptions.Item label="Phí giữ xe">{formatCurrency(contractDetail.parkingFee)}</Descriptions.Item>
              )}
              {contractDetail.internetFee != null && (
                <Descriptions.Item label="Phí internet">{formatCurrency(contractDetail.internetFee)}</Descriptions.Item>
              )}
              <Descriptions.Item label="Ngày thanh toán">
                Ngày {contractDetail.paymentDueDay} hàng tháng
              </Descriptions.Item>
              <Descriptions.Item label="Tự động gia hạn">
                {contractDetail.autoRenewal ? "Có" : "Không"}
              </Descriptions.Item>
              {contractDetail.signedDate && (
                <Descriptions.Item label="Ngày ký" span={2}>{formatDate(contractDetail.signedDate)}</Descriptions.Item>
              )}
              {contractDetail.notes && (
                <Descriptions.Item label="Ghi chú" span={2}>{contractDetail.notes}</Descriptions.Item>
              )}
            </Descriptions>

            {/* Signature timeline */}
            {contractDetail.signatureLog && contractDetail.signatureLog.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Lịch sử ký kết</h4>
                <Timeline
                  items={contractDetail.signatureLog.map((log) => ({
                    color: log.action.includes("SIGNED") ? "green" : "blue",
                    children: (
                      <div>
                        <Text strong className="text-sm">
                          {log.action === "SENT_TO_TENANT" && "Gửi cho người thuê"}
                          {log.action === "TENANT_SIGNED" && "Người thuê đã ký"}
                          {log.action === "LANDLORD_SIGNED" && "Chủ nhà đã ký"}
                          {!["SENT_TO_TENANT", "TENANT_SIGNED", "LANDLORD_SIGNED"].includes(log.action) && log.action}
                        </Text>
                        <br />
                        <Text className="text-xs text-gray-400">
                          {dayjs(log.createdAt).format("DD/MM/YYYY HH:mm")}
                          {log.actorRole && ` • ${log.actorRole}`}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}

            {/* Actions in detail modal */}
            <div className="flex gap-3 justify-end pt-2 border-t">
              {contractDetail.status === "draft" && isOwner(contractDetail) && (
                <>
                  <Button icon={<EditOutlined />} onClick={() => handleOpenEdit(contractDetail)}>
                    Chỉnh sửa
                  </Button>
                  <Button type="primary" icon={<SendOutlined />} onClick={() => handleSendToTenant(contractDetail.rentalId)}>
                    Gửi cho người thuê
                  </Button>
                </>
              )}
              {contractDetail.status === "pending_tenant" && !isOwner(contractDetail) && (
                <Button type="primary" onClick={() => handleTenantSign(contractDetail.rentalId)}>
                  Ký hợp đồng
                </Button>
              )}
              {contractDetail.status === "pending_landlord" && isOwner(contractDetail) && (
                <Button type="primary" onClick={() => handleOwnerSign(contractDetail.rentalId)}>
                  Ký hợp đồng
                </Button>
              )}
              {contractDetail.status === "fully_signed" && isOwner(contractDetail) && (
                <Button type="primary" onClick={() => handleActivate(contractDetail.rentalId)}>
                  Kích hoạt hợp đồng
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        title="Chỉnh sửa hợp đồng"
        okText="Lưu"
        cancelText="Hủy"
        onOk={handleEditSubmit}
        confirmLoading={actionLoading}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="pt-2">
          <Form.Item
            label="Giá thuê / tháng (VNĐ)"
            name="monthlyRent"
            rules={[{ required: true, message: "Vui lòng nhập giá thuê" }]}
          >
            <InputNumber min={0} className="w-full" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
          </Form.Item>
          <Form.Item label="Tiền đặt cọc (VNĐ)" name="depositAmount">
            <InputNumber min={0} className="w-full" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} />
          </Form.Item>
          <Form.Item label="Tiền điện / kWh" name="electricityCostPerKwh">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Tiền nước / m³" name="waterCostPerM3">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Phí quản lý" name="managementFee">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Phí giữ xe" name="parkingFee">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Phí internet" name="internetFee">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Ngày thanh toán hàng tháng" name="paymentDueDay">
            <InputNumber min={1} max={28} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

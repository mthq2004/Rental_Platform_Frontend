"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Table, Badge, Button, Empty, App } from "antd";
import {
  FileTextOutlined,
  ReloadOutlined,
  SendOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
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
import { Form } from "antd";
import { STATUS_CONFIG } from "@/components/contracts/ContractStatusConfig";
import { getContractTableColumns } from "@/components/contracts/ContractTableColumns";
import ContractDetailModal from "@/components/contracts/ContractDetailModal";
import ContractEditModal from "@/components/contracts/ContractEditModal";
import { getRequestTemplateData } from "@/stores/slices/template-contract.slice";

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

  const router = useRouter();
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
    const templateId = record.templateId || "3c6930b3-2da9-4870-abed-fb8830150eac";
    const requestId = record.fromRequestId || record.rentalRequest?.requestId;

    if (requestId) {
      dispatch(getRequestTemplateData(requestId));
      console.log(requestId);

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
      autoRenewal: detail?.autoRenewal ?? record.autoRenewal,
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
      if (err?.errorFields) return; // form validation error
      message.error(err || "Cập nhật thất bại");
    }
  };

  const columns = getContractTableColumns(user?.id, {
    onViewDetail: handleViewDetail,
    onEdit: handleOpenEdit,
    onSendToTenant: handleSendToTenant,
    onTenantSign: handleTenantSign,
    onOwnerSign: handleOwnerSign,
    onActivate: handleActivate,
    onCancel: handleCancelContract,
  });

  const displayContracts = useMemo(() => {
    const source = Array.isArray(contracts) ? contracts : [];
    const seen = new Set<string>();

    return source.filter((item) => {
      const id = item?.rentalId;
      if (!id || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [contracts]);

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
          dataSource={displayContracts}
          columns={columns}
          loading={contractsLoading}
          rowKey={(record) => record.rentalId || record.contractCode}
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

      <ContractDetailModal
        open={detailOpen}
        contractDetail={contractDetail}
        userId={user?.id}
        onClose={() => { setDetailOpen(false); dispatch(clearContractDetail()); }}
        onEdit={handleOpenEdit}
        onSendToTenant={handleSendToTenant}
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
    </div>
  );
}

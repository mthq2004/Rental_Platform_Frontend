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
  Modal,
  Input,
  App,
  Descriptions,
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
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  getMyRequests,
  getOwnerRequests,
  reviewRequest,
  cancelRequest,
} from "@/stores/slices/contract.slice";
import type { RentalRequest, RentalRequestStatus } from "@/types/contract.type";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

const { Text } = Typography;
const { TextArea } = Input;

// ====== Status config ======
const STATUS_CONFIG: Record<
  RentalRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: { label: "Chờ xử lý", color: "processing", icon: <ClockCircleOutlined /> },
  under_review: { label: "Đang xem xét", color: "warning", icon: <EyeOutlined /> },
  approved: { label: "Đã chấp nhận", color: "success", icon: <CheckCircleOutlined /> },
  rejected: { label: "Đã từ chối", color: "error", icon: <CloseCircleOutlined /> },
  cancelled: { label: "Đã hủy", color: "default", icon: <StopOutlined /> },
  expired: { label: "Hết hạn", color: "default", icon: <ClockCircleOutlined /> },
  contract_created: { label: "Đã tạo HĐ", color: "cyan", icon: <FileTextOutlined /> },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
};

const formatCurrency = (amount: number) => {
  if (!amount) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export default function RentalRequestsPage() {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myRequests, ownerRequests, requestsLoading, actionLoading } =
    useAppSelector((state) => state.contract);

  const [activeTab, setActiveTab] = useState<"my" | "received">("my");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [landlordNotes, setLandlordNotes] = useState("");
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
    status: "under_review" | "approved" | "rejected"
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
        status === "approved"
          ? "Đã chấp nhận yêu cầu"
          : status === "rejected"
            ? "Đã từ chối yêu cầu"
            : "Đã chuyển sang trạng thái xem xét"
      );

      setDetailOpen(false);
      setRejectReason("");
      setLandlordNotes("");
      handleRefresh();

      // 👉 Nếu approve thì chuyển sang trang chọn template
      if (status === "approved") {
        router.push(`/template-contracts?requestId=${requestId}`);
      }

    } catch (err: any) {
      message.error(err || "Thao tác thất bại");
    }
  };


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

  // ====== Common columns ======
  const baseColumns: ColumnsType<RentalRequest> = [
    {
      title: "Mã yêu cầu",
      dataIndex: "requestCode",
      key: "requestCode",
      width: 160,
      render: (val) => <Text strong className="text-sm">{val}</Text>,
    },
    {
      title: "Thời hạn thuê",
      key: "period",
      width: 200,
      render: (_, r) => (
        <Text className="text-sm">
          {formatDate(r.startDate)} → {formatDate(r.endDate)}
        </Text>
      ),
    },
    {
      title: "Giá đề xuất",
      dataIndex: "proposedRent",
      key: "proposedRent",
      width: 160,
      render: (val) => <Text strong className="text-red-500 text-sm">{formatCurrency(val)}</Text>,
      sorter: (a, b) => a.proposedRent - b.proposedRent,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: RentalRequestStatus) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        let finalLabel = cfg.label;
        if (status === "contract_created") {
          finalLabel = activeTab === "my" ? "Đã tạo HĐ (Chưa gửi)" : "Đã tạo HĐ (Nháp)";
        }
        return (
          <Tag color={cfg.color} icon={cfg.icon} className="text-xs">
            {finalLabel}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (val) => <Text className="text-sm text-gray-500">{formatDate(val)}</Text>,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
    },
  ];

  // ====== My requests columns (tenant view) ======
  const myColumns: ColumnsType<RentalRequest> = [
    ...baseColumns,
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          {(record.status === "pending" || record.status === "under_review") && (
            <Tooltip title="Hủy yêu cầu">
              <Button type="text" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleCancel(record.requestId)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ====== Owner received columns ======
  const ownerColumns: ColumnsType<RentalRequest> = [
    ...baseColumns,
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>

          {record.status === "approved" && (
            <Tooltip title="Chỉnh sửa hợp đồng">
              <Button
                size="small"
                type="default"
                icon={<FileTextOutlined />}
                onClick={() => router.push(`/template-contracts/${record.contract?.templateId}?requestId=${record.requestId}`)}
              >
                Chỉnh sửa HĐ
              </Button>
            </Tooltip>
          )}

          {record.status === "pending" && (
            <Tooltip title="Xem xét">
              <Button
                size="small"
                type="default"
                onClick={() => handleReview(record.requestId, "under_review")}
                loading={actionLoading}
              >
                Xem xét
              </Button>
            </Tooltip>
          )}
          {(record.status === "pending" || record.status === "under_review") && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  setSelectedRequest(record);
                  setDetailOpen(true);
                }}
              >
                Duyệt
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const data = activeTab === "my" ? myRequests : ownerRequests;
  const columns = activeTab === "my" ? myColumns : ownerColumns;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Yêu cầu thuê</h2>
          <p className="text-sm text-gray-500">
            Quản lý các yêu cầu thuê nhà của bạn
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={requestsLoading}>
          Làm mới
        </Button>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-lg">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "my" | "received")}
          items={[
            {
              key: "my",
              label: (
                <span className="flex items-center gap-1.5">
                  <SendOutlined />
                  Yêu cầu của tôi
                  <Tag className="ml-1">{myRequests.length}</Tag>
                </span>
              ),
            },
            {
              key: "received",
              label: (
                <span className="flex items-center gap-1.5">
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

        <Table
          dataSource={Array.isArray(data) ? data : []}
          columns={columns}
          loading={requestsLoading}
          rowKey="requestId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
          }}
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  activeTab === "my"
                    ? "Bạn chưa có yêu cầu thuê nào"
                    : "Bạn chưa nhận được yêu cầu thuê nào"
                }
              />
            ),
          }}
          className="[&_.ant-table-thead_th]:bg-gray-50! [&_.ant-table-thead_th]:text-gray-600! [&_.ant-table-thead_th]:font-medium! [&_.ant-table-thead_th]:text-xs! [&_.ant-table-thead_th]:uppercase!"
        />
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
                      onClick={() => router.push(`/template-contracts?requestId=${selectedRequest.requestId}`)}
                    >
                      Chọn mẫu tạo hợp đồng
                    </Button>
                  </div>
                </div>
              )}

            {/* Approved / Contract Created -> Edit contract (if already reviewed) */}
            {activeTab === "received" &&
              (selectedRequest.status === "approved" ||
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
                    Chỉnh sửa hợp đồng
                  </Button>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}

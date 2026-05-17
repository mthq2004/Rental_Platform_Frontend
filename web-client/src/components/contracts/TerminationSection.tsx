"use client";

import React, { useEffect, useState } from "react";
import { Tag, Button, Timeline, Card, Empty, Spin, Divider, App, Modal, Input, Select } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { TerminationRequest } from "@/types/contract.type";
import {
  getTerminationRequests,
  reviewTerminationRequest,
  updateTerminationStatus,
  createReport,
} from "@/services/contract.service";
import dayjs from "dayjs";

const STATUS_MAP: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "orange", label: "Chờ phản hồi", icon: <ClockCircleOutlined /> },
  approved: { color: "green", label: "Đã chấp nhận", icon: <CheckCircleOutlined /> },
  rejected: { color: "red", label: "Đã từ chối", icon: <CloseCircleOutlined /> },
  negotiating: { color: "blue", label: "Đang thương lượng", icon: <SwapOutlined /> },
  admin_review: { color: "purple", label: "Admin xem xét", icon: <ExclamationCircleOutlined /> },
  admin_processing: { color: "purple", label: "Admin đang xử lý", icon: <ExclamationCircleOutlined /> },
  resolved: { color: "green", label: "Đã giải quyết", icon: <CheckCircleOutlined /> },
  cancelled: { color: "default", label: "Đã hủy", icon: <CloseCircleOutlined /> },
};

const REASON_MAP: Record<string, string> = {
  mutual_agreement: "Thỏa thuận chung",
  unilateral_termination: "Đơn phương chấm dứt",
  breach_of_contract: "Vi phạm hợp đồng",
  non_payment: "Không thanh toán",
  force_majeure: "Bất khả kháng",
  lease_end: "Hết hạn hợp đồng",
  other: "Lý do khác",
};

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

interface TerminationSectionProps {
  rentalId: string;
  userId?: string;
  ownerId: string;
  tenantId: string;
}

export default function TerminationSection({
  rentalId, userId, ownerId, tenantId,
}: TerminationSectionProps) {
  const [requests, setRequests] = useState<TerminationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { message } = App.useApp();

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState({
    type: "contract" as string,
    title: "",
    description: "",
    terminationRequestId: "",
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getTerminationRequests(rentalId);
      setRequests(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [rentalId]);

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    try {
      setActionLoading(true);
      await reviewTerminationRequest(id, { status });
      message.success(status === "approved" ? "Đã chấp nhận chấm dứt hợp đồng" : "Đã từ chối yêu cầu");
      fetchRequests();
    } catch (e: any) {
      message.error(e?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNegotiate = async (id: string) => {
    try {
      setActionLoading(true);
      await updateTerminationStatus(id, { status: "negotiating" });
      message.success("Đã chuyển sang thương lượng");
      fetchRequests();
    } catch (e: any) {
      message.error(e?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (id: string) => {
    try {
      setActionLoading(true);
      await updateTerminationStatus(id, { status: "admin_review" });
      message.success("Đã gửi yêu cầu lên admin xem xét");
      fetchRequests();
    } catch (e: any) {
      message.error(e?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateReport = async () => {
    if (!reportData.title.trim() || !reportData.description.trim()) {
      message.warning("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      setActionLoading(true);
      const againstId = userId === ownerId ? tenantId : ownerId;
      await createReport({
        rentalId,
        againstId,
        terminationRequestId: reportData.terminationRequestId || undefined,
        type: reportData.type,
        title: reportData.title,
        description: reportData.description,
      });
      message.success("Đã gửi khiếu nại");
      setReportModalOpen(false);
      setReportData({ type: "contract", title: "", description: "", terminationRequestId: "" });
      fetchRequests();
    } catch (e: any) {
      message.error(e?.message || "Không thể gửi khiếu nại");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spin className="py-6 w-full flex justify-center" />;

  if (!requests.length) {
    return (
      <div className="text-center py-4">
        <Empty description="Chưa có yêu cầu chấm dứt nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {requests.map((req) => {
          const st = STATUS_MAP[req.status] ?? STATUS_MAP.pending;
          const isRequester = req.requestedBy === userId;
          const isPending = req.status === "pending" && !isRequester;
          const isNegotiating = req.status === "negotiating" || req.status === "rejected";
          const canEscalate = isNegotiating && !isRequester;

          return (
            <Card
              key={req.terminationRequestId}
              size="small"
              className="border border-gray-200 shadow-sm"
              title={
                <div className="flex items-center gap-2">
                  <Tag color={st.color} icon={st.icon}>{st.label}</Tag>
                  <span className="text-xs text-gray-400">
                    {dayjs(req.createdAt).format("DD/MM/YYYY HH:mm")}
                  </span>
                </div>
              }
            >
              {/* Info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                <div><span className="text-gray-400">Lý do:</span> <strong>{REASON_MAP[req.reason] ?? req.reason}</strong></div>
                <div><span className="text-gray-400">Ngày chấm dứt:</span> <strong>{dayjs(req.requestedTerminationDate).format("DD/MM/YYYY")}</strong></div>
                {req.earlyTerminationFee != null && req.earlyTerminationFee > 0 && (
                  <div><span className="text-gray-400">Phí chấm dứt:</span> <strong className="text-red-500">{money.format(req.earlyTerminationFee)}</strong></div>
                )}
                <div><span className="text-gray-400">Người gửi:</span> <strong>{isRequester ? "Bạn" : "Bên kia"}</strong></div>
              </div>

              {req.note && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm text-gray-600">
                  <strong>Ghi chú:</strong> {req.note}
                </div>
              )}

              {req.reviewNote && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3 text-sm text-blue-700">
                  <strong>Phản hồi:</strong> {req.reviewNote}
                </div>
              )}

              {req.resolution && (
                <div className={`rounded-lg p-3 mb-3 text-sm ${req.resolution === "terminate_contract" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  <strong>Kết quả:</strong> {req.resolution === "terminate_contract" ? "Chấm dứt hợp đồng" : "Tiếp tục hợp đồng"}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {isPending && (
                  <>
                    <Button type="primary" icon={<CheckCircleOutlined />} loading={actionLoading} onClick={() => handleReview(req.terminationRequestId, "approved")}>
                      Đồng ý
                    </Button>
                    <Button danger icon={<CloseCircleOutlined />} loading={actionLoading} onClick={() => handleReview(req.terminationRequestId, "rejected")}>
                      Từ chối
                    </Button>
                    <Button icon={<SwapOutlined />} loading={actionLoading} onClick={() => handleNegotiate(req.terminationRequestId)}>
                      Thương lượng
                    </Button>
                  </>
                )}

                {canEscalate && (
                  <Button icon={<ExclamationCircleOutlined />} loading={actionLoading} onClick={() => handleEscalate(req.terminationRequestId)}>
                    Gửi admin xem xét
                  </Button>
                )}

                {isNegotiating && (
                  <Button
                    icon={<SendOutlined />}
                    onClick={() => {
                      setReportData({ ...reportData, terminationRequestId: req.terminationRequestId });
                      setReportModalOpen(true);
                    }}
                  >
                    Gửi khiếu nại
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Report Modal */}
      <Modal
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        title="Gửi khiếu nại"
        onOk={handleCreateReport}
        confirmLoading={actionLoading}
        okText="Gửi khiếu nại"
        cancelText="Hủy"
        width={520}
      >
        <div className="flex flex-col gap-3 mt-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Loại khiếu nại</label>
            <Select
              className="w-full"
              value={reportData.type}
              onChange={(v) => setReportData({ ...reportData, type: v })}
              options={[
                { value: "payment", label: "Tiền thuê / Phí" },
                { value: "deposit", label: "Tiền cọc" },
                { value: "property", label: "Hư hỏng tài sản" },
                { value: "contract", label: "Vi phạm hợp đồng" },
                { value: "other", label: "Khác" },
              ]}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tiêu đề</label>
            <Input
              value={reportData.title}
              onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
              placeholder="Tiêu đề khiếu nại..."
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mô tả chi tiết</label>
            <Input.TextArea
              value={reportData.description}
              onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
              rows={4}
              placeholder="Mô tả chi tiết vấn đề..."
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

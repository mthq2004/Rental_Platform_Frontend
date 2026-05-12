"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  InputNumber,
  Input,
  Tag,
  Empty,
  Spin,
  Timeline,
  Divider,
  App,
  Alert,
} from "antd";
import {
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FileAddOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  createRenewalRequest,
  getRenewalsByContract,
  approveRenewal,
  rejectRenewal,
  cancelRenewal,
  getContractAppendices,
  getContractDetail,
} from "@/stores/slices/contract.slice";
import type { RenewalRequestItem, ContractAppendixItem } from "@/types/contract.type";
import dayjs from "dayjs";

const { TextArea } = Input;

const RENEWAL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ duyệt", color: "processing", icon: <ClockCircleOutlined /> },
  approved: { label: "Đã duyệt", color: "success", icon: <CheckCircleOutlined /> },
  rejected: { label: "Đã từ chối", color: "error", icon: <CloseCircleOutlined /> },
  cancelled: { label: "Đã hủy", color: "default", icon: <CloseCircleOutlined /> },
};

interface RenewalSectionProps {
  rentalId: string;
  userId: string | undefined;
  ownerId: string;
  tenantId: string;
  contractStatus: string;
}

export default function RenewalSection({
  rentalId,
  userId,
  ownerId,
  tenantId,
  contractStatus,
}: RenewalSectionProps) {
  const { message, modal } = App.useApp();
  const dispatch = useAppDispatch();
  const { renewalRequests, renewalLoading, renewalActionLoading, contractAppendices, appendicesLoading } =
    useAppSelector((state) => state.contract);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [durationMonths, setDurationMonths] = useState(6);
  const [note, setNote] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [showAppendices, setShowAppendices] = useState(false);

  const isOwner = userId === ownerId;
  const isTenant = userId === tenantId;
  const canRenew = isTenant && contractStatus === "near_expiration";
  const hasPendingRequest = renewalRequests.some((r) => r.status === "pending");

  useEffect(() => {
    dispatch(getRenewalsByContract(rentalId));
  }, [dispatch, rentalId]);

  const handleCreateRequest = async () => {
    try {
      await dispatch(
        createRenewalRequest({
          contractId: rentalId,
          durationMonths,
          note: note || undefined,
        })
      ).unwrap();
      message.success("Đã gửi yêu cầu gia hạn");
      setRequestModalOpen(false);
      setNote("");
      dispatch(getRenewalsByContract(rentalId));
    } catch (err: any) {
      message.error(err || "Gửi yêu cầu thất bại");
    }
  };

  const handleApprove = (renewalId: string) => {
    modal.confirm({
      title: "Duyệt gia hạn hợp đồng",
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600">
            Xác nhận duyệt yêu cầu gia hạn hợp đồng. Hệ thống sẽ tự động tạo phụ lục gia hạn và cập nhật ngày kết thúc hợp đồng.
          </p>
          <TextArea
            placeholder="Ghi chú (tùy chọn)"
            rows={2}
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
          />
        </div>
      ),
      okText: "Duyệt gia hạn",
      okType: "primary",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(approveRenewal({ renewalId, reviewNote: approveNote || undefined })).unwrap();
          message.success("Đã duyệt gia hạn hợp đồng");
          setApproveNote("");
          dispatch(getRenewalsByContract(rentalId));
          dispatch(getContractDetail(rentalId));
        } catch (err: any) {
          message.error(err || "Duyệt thất bại");
        }
      },
    });
  };

  const handleReject = (renewalId: string) => {
    modal.confirm({
      title: "Từ chối gia hạn",
      icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div className="space-y-3">
          <p className="text-slate-600">Bạn có chắc chắn muốn từ chối yêu cầu gia hạn này?</p>
          <TextArea
            placeholder="Lý do từ chối (tùy chọn)"
            rows={2}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </div>
      ),
      okText: "Từ chối",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await dispatch(rejectRenewal({ renewalId, reviewNote: rejectNote || undefined })).unwrap();
          message.success("Đã từ chối yêu cầu gia hạn");
          setRejectNote("");
          dispatch(getRenewalsByContract(rentalId));
        } catch (err: any) {
          message.error(err || "Từ chối thất bại");
        }
      },
    });
  };

  const handleCancelRequest = (renewalId: string) => {
    modal.confirm({
      title: "Hủy yêu cầu gia hạn",
      content: "Bạn có chắc chắn muốn hủy yêu cầu gia hạn?",
      okText: "Hủy yêu cầu",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        try {
          await dispatch(cancelRenewal(renewalId)).unwrap();
          message.success("Đã hủy yêu cầu gia hạn");
          dispatch(getRenewalsByContract(rentalId));
        } catch (err: any) {
          message.error(err || "Hủy thất bại");
        }
      },
    });
  };

  const handleViewAppendices = () => {
    dispatch(getContractAppendices(rentalId));
    setShowAppendices(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  return (
    <div className="space-y-4">
      {/* Near expiration alert */}
      {contractStatus === "near_expiration" && isTenant && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          title={
            <span className="font-medium text-amber-700">
              Hợp đồng sắp hết hạn! Bạn nên gửi yêu cầu gia hạn ngay.
            </span>
          }
          className="rounded-xl border-amber-200 bg-amber-50"
        />
      )}

      {/* Action button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SyncOutlined className="text-blue-500" />
          <span className="font-semibold text-gray-700">Yêu cầu gia hạn</span>
          {renewalRequests.length > 0 && (
            <Tag className="ml-1">{renewalRequests.length}</Tag>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={handleViewAppendices}
          >
            Phụ lục
          </Button>
          {canRenew && !hasPendingRequest && (
            <Button
              type="primary"
              size="small"
              icon={<FileAddOutlined />}
              onClick={() => setRequestModalOpen(true)}
              style={{ background: "#4F46E5", borderColor: "#4F46E5" }}
            >
              Gửi yêu cầu gia hạn
            </Button>
          )}
        </div>
      </div>

      {/* Renewal requests list */}
      {renewalLoading ? (
        <div className="py-6 text-center">
          <Spin size="small" />
        </div>
      ) : renewalRequests.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className="text-slate-400 text-sm">Chưa có yêu cầu gia hạn nào</span>}
        />
      ) : (
        <div className="space-y-3">
          {renewalRequests.map((request: RenewalRequestItem) => {
            const statusCfg = RENEWAL_STATUS_CONFIG[request.status] || RENEWAL_STATUS_CONFIG.pending;
            return (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-200"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex items-center gap-3">
                      <Tag color={statusCfg.color} icon={statusCfg.icon} className="!m-0 !px-3 !py-1 !rounded-full !text-xs !font-medium">
                        {statusCfg.label}
                      </Tag>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        {dayjs(request.createdAt).format("HH:mm DD/MM/YYYY")}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thời gian</span>
                        <span className="font-semibold text-slate-800">{request.durationMonths} tháng</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Bắt đầu</span>
                        <span className="font-semibold text-slate-800">{formatDate(request.proposedStartDate)}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Kết thúc</span>
                        <span className="font-semibold text-slate-800">{formatDate(request.proposedEndDate)}</span>
                      </div>
                      {request.approvedAt && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Duyệt lúc</span>
                          <span className="font-semibold text-emerald-600">{dayjs(request.approvedAt).format("HH:mm DD/MM/YYYY")}</span>
                        </div>
                      )}
                    </div>

                    {(request.note || request.reviewNote) && (
                      <div className="space-y-2 mt-3 pl-1">
                        {request.note && (
                          <div className="flex gap-2">
                            <span className="text-sm font-medium text-slate-500 shrink-0">Ghi chú:</span>
                            <span className="text-sm text-slate-600">{request.note}</span>
                          </div>
                        )}
                        {request.reviewNote && (
                          <div className="flex gap-2">
                            <span className="text-sm font-medium text-blue-500 shrink-0">Phản hồi:</span>
                            <span className="text-sm text-blue-700">{request.reviewNote}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {request.status === "pending" && (
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 md:pl-4 md:border-l md:border-slate-100 mt-4 md:mt-0 justify-end md:justify-start w-full md:w-auto">
                      {isOwner && (
                        <>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            loading={renewalActionLoading}
                            onClick={() => handleApprove(request.id)}
                            className="!rounded-lg !font-medium !h-10 md:!w-32"
                            style={{ background: "#16a34a", borderColor: "#16a34a" }}
                          >
                            Duyệt
                          </Button>
                          <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={renewalActionLoading}
                            onClick={() => handleReject(request.id)}
                            className="!rounded-lg !font-medium !h-10 md:!w-32"
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                      {isTenant && request.requestedById === userId && (
                        <Button
                          danger
                          loading={renewalActionLoading}
                          onClick={() => handleCancelRequest(request.id)}
                          className="!rounded-lg !font-medium !h-10 md:!w-32"
                        >
                          Hủy yêu cầu
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create renewal request modal */}
      <Modal
        open={requestModalOpen}
        title={
          <div className="flex items-center gap-2 py-0.5">
            <SyncOutlined className="text-blue-500" />
            <span className="text-base font-semibold text-slate-800">Yêu cầu gia hạn hợp đồng</span>
          </div>
        }
        onCancel={() => { setRequestModalOpen(false); setNote(""); }}
        footer={null}
        destroyOnHidden
        className="[&_.ant-modal-content]:rounded-2xl"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              <CalendarOutlined className="mr-1" />
              Thời gian gia hạn (tháng)
            </label>
            <InputNumber
              min={1}
              max={36}
              value={durationMonths}
              onChange={(v) => setDurationMonths(v || 6)}
              className="w-full"
              size="large"
              addonAfter="tháng"
            />
            <p className="text-xs text-slate-400 mt-1">
              Tối thiểu 1 tháng, tối đa 36 tháng
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Ghi chú (tùy chọn)
            </label>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do gia hạn, yêu cầu đặc biệt..."
              rows={3}
              maxLength={500}
              showCount
            />
          </div>

          <Alert
            type="info"
            showIcon
            title={
              <span className="text-sm text-slate-600">
                Yêu cầu gia hạn sẽ được gửi đến chủ nhà để duyệt. Sau khi duyệt, hệ thống sẽ tự động tạo phụ lục gia hạn và cập nhật thời hạn hợp đồng.
              </span>
            }
            className="rounded-xl border-blue-100 bg-blue-50"
          />

          <div className="flex justify-end gap-2.5 pt-1">
            <Button onClick={() => { setRequestModalOpen(false); setNote(""); }} className="rounded-lg h-9 px-5">
              Hủy
            </Button>
            <Button
              type="primary"
              loading={renewalActionLoading}
              onClick={handleCreateRequest}
              className="rounded-lg h-9 px-5"
              style={{ background: "#4F46E5", borderColor: "#4F46E5" }}
            >
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Modal>

      {/* Appendices modal */}
      <Modal
        open={showAppendices}
        title={
          <div className="flex items-center gap-2 py-0.5">
            <HistoryOutlined className="text-purple-500" />
            <span className="text-base font-semibold text-slate-800">Lịch sử phụ lục hợp đồng</span>
          </div>
        }
        onCancel={() => setShowAppendices(false)}
        footer={null}
        width={600}
        destroyOnHidden
        className="[&_.ant-modal-content]:rounded-2xl"
      >
        {appendicesLoading ? (
          <div className="py-8 text-center"><Spin /></div>
        ) : contractAppendices.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span className="text-slate-400">Chưa có phụ lục nào</span>}
          />
        ) : (
          <Timeline
            className="pt-3"
            items={contractAppendices.map((appendix: ContractAppendixItem) => ({
              color: appendix.signedAt ? "green" : "blue",
              children: (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      Phụ lục #{appendix.appendixNumber}
                    </span>
                    <Tag color={appendix.type === "renewal" ? "blue" : "orange"}>
                      {appendix.type === "renewal" ? "Gia hạn" : appendix.type === "adjustment" ? "Điều chỉnh" : "Mở rộng"}
                    </Tag>
                    {appendix.signedAt && (
                      <Tag color="success" icon={<CheckCircleOutlined />}>Đã ký</Tag>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    {formatDate(appendix.startDate)} → {formatDate(appendix.endDate)}
                  </div>
                  {appendix.content && (
                    <div className="text-sm text-slate-500 italic">{appendix.content}</div>
                  )}
                  <div className="text-xs text-slate-400">
                    Tạo ngày {dayjs(appendix.createdAt).format("HH:mm DD/MM/YYYY")}
                    {appendix.blockchainTxHash && (
                      <span className="ml-2 text-emerald-500">• Blockchain: {appendix.blockchainTxHash.slice(0, 10)}...</span>
                    )}
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Modal>
    </div>
  );
}

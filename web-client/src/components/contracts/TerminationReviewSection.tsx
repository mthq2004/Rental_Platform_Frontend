"use client";

import React, { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Radio,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  ExclamationCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import type { TerminationRequest } from "@/types/contract.type";
import dayjs from "dayjs";
import { uploadMixedFiles } from "@/services/upload.service";
import { FiCalendar } from "react-icons/fi";
import "dayjs/locale/vi";

const { Text, Title, Paragraph } = Typography;

dayjs.locale("vi");

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const REASON_MAP: Record<string, string> = {
  mutual_agreement: "Thỏa thuận chung",
  unilateral_termination: "Đơn phương chấm dứt",
  breach_of_contract: "Vi phạm hợp đồng",
  non_payment: "Không thanh toán",
  force_majeure: "Bất khả kháng",
  lease_end: "Hết hạn hợp đồng",
  other: "Lý do khác",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ phản hồi", color: "orange" },
  approved: { label: "Đã chấp nhận", color: "green" },
  rejected: { label: "Đã từ chối", color: "red" },
  negotiating: { label: "Đang thương lượng", color: "blue" },
  admin_review: { label: "Admin xem xét", color: "purple" },
  admin_processing: { label: "Admin đang xử lý", color: "purple" },
  resolved: { label: "Đã giải quyết", color: "green" },
  cancelled: { label: "Đã hủy", color: "default" },
};

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;

function getFileIcon(file: UploadFile) {
  const name = file.name?.toLowerCase() || "";
  if (name.endsWith(".pdf")) return <FilePdfOutlined className="text-red-500" />;
  if (/\.(docx?|rtf)$/i.test(name)) return <FileOutlined className="text-blue-600" />;
  if (/\.(xlsx?|csv)$/i.test(name)) return <FileOutlined className="text-green-600" />;
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name)) return <FileImageOutlined className="text-blue-500" />;
  return <FileOutlined className="text-slate-400" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TerminationReviewSectionProps {
  request: TerminationRequest;
  contractCode?: string;
  onReview: (status: "approved" | "rejected", reviewNote?: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function TerminationReviewSection({
  request,
  contractCode,
  onReview,
  onBack,
  loading = false,
}: TerminationReviewSectionProps) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      message.error(`Tệp "${file.name}" vượt quá ${MAX_FILE_SIZE_MB}MB`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const handleFilesChange = (info: { fileList: UploadFile[] }) => {
    const newList = info.fileList.slice(0, MAX_FILES);
    setEvidenceFiles(newList);
  };

  const handleSubmit = async () => {
    if (!decision) {
      message.error("Vui lòng chọn quyết định phản hồi");
      return;
    }

    if (decision === "rejected") {
      if (!reviewNote.trim()) {
        message.error("Vui lòng nhập lý do từ chối");
        return;
      }
      if (evidenceFiles.length === 0) {
        message.error("Bắt buộc phải có hình ảnh/tài liệu minh chứng khi từ chối");
        return;
      }
    }

    setSubmitting(true);
    try {
      let finalNote = reviewNote.trim();

      if (decision === "rejected" && evidenceFiles.length > 0) {
        try {
          const files = evidenceFiles
            .filter((f) => f.originFileObj)
            .map((f) => f.originFileObj as File);
          if (files.length > 0) {
            const uploaded = await uploadMixedFiles(files);
            const urls = uploaded.map((att, i) => `[Bằng chứng ${i + 1}](${att.url})`).join('\n');
            finalNote += `\n\n--- TÀI LIỆU MINH CHỨNG ---\n${urls}`;
          }
        } catch (uploadErr: any) {
          message.error("Tải lên bằng chứng thất bại: " + (uploadErr?.message || ""));
          setSubmitting(false);
          return;
        }
      }

      await onReview(decision, finalNote || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const st = STATUS_MAP[request.status] || STATUS_MAP.pending;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="mb-3 text-slate-500 hover:text-slate-700 -ml-2"
        >
          Quay lại Tổng quan
        </Button>
        <Title level={3} className="!mb-1 !text-slate-900">
          Đánh giá Yêu cầu Chấm dứt
        </Title>
        <Text className="text-slate-500">
          Vui lòng xem xét thông tin chi tiết và đưa ra quyết định phản hồi.
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Request Details */}
        <div className="lg:col-span-3 space-y-4">
          {/* Request Header Card */}
          <Card className="!rounded-2xl !border-slate-200 !shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag color={st.color} className="!text-xs !px-3 !py-0.5 !rounded-full uppercase font-semibold">
                  {st.label}
                </Tag>
                <Text className="text-xs text-slate-400">
                  Mã YC: #{request.terminationRequestId.slice(0, 8).toUpperCase()}
                </Text>
              </div>
              <div className="text-right">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider block">Ngày gửi</Text>
                <Text className="text-sm font-semibold text-slate-700">
                  {dayjs(request.createdAt).format("DD [Thg] MM, YYYY")}
                </Text>
              </div>
            </div>

            <Title level={4} className="!mb-4 !text-slate-800">
              Yêu cầu chấm dứt hợp đồng
            </Title>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Người yêu cầu</Text>
                <Text className="text-sm font-semibold text-slate-700">
                  {request.requesterRole === "OWNER" ? "Chủ nhà" : "Người thuê"}
                </Text>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Hợp đồng</Text>
                <Text className="text-sm font-semibold text-slate-700">{contractCode || "—"}</Text>
              </div>
            </div>

            {/* Termination Date */}
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 mb-4 shadow-sm">

              {/* Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <FiCalendar className="text-red-600 text-lg" />
              </div>

              {/* Content */}
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                  Ngày chấm dứt đề xuất
                </span>

                <span className="text-base font-semibold text-red-600">
                  {dayjs(request.requestedTerminationDate).format("DD [tháng] M, YYYY")}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <Text className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2">Lý do chính</Text>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Text className="text-sm text-slate-700 font-medium">
                  {REASON_MAP[request.reason] || request.reason}
                </Text>
              </div>
            </div>

            {/* Note */}
            {request.note && (
              <div className="mb-4">
                <Text className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2">Ghi chú bổ sung</Text>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Paragraph className="!mb-0 text-sm text-slate-600 italic">
                    "{request.note}"
                  </Paragraph>
                </div>
              </div>
            )}

            {/* Early termination fee */}
            {request.earlyTerminationFee != null && request.earlyTerminationFee > 0 && (
              <Alert
                type="info"
                showIcon
                className="!rounded-xl !border-blue-200"
                message={
                  <Text className="text-sm font-semibold text-blue-800">Phí chấm dứt sớm</Text>
                }
                description={
                  <Text className="text-xs text-blue-700">
                    Dựa trên hợp đồng, phí chấm dứt sớm có thể lên tới{" "}
                    <strong>{money.format(Number(request.earlyTerminationFee))}</strong>.
                    Số tiền chính xác sẽ được xác nhận khi xử lý.
                  </Text>
                }
              />
            )}

            {/* Review Note if already reviewed */}
            {request.reviewNote && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <Text className="text-[10px] text-blue-500 uppercase tracking-wider block mb-1">Phản hồi trước đó</Text>
                <Paragraph className="!mb-0 text-sm text-blue-700">{request.reviewNote}</Paragraph>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Decision Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="!rounded-2xl !border-slate-200 !shadow-sm !sticky !top-4">
            <Title level={5} className="!mb-1 !text-slate-800">
              Quyết định của bạn
            </Title>
            <Text className="text-xs text-slate-500 block mb-4">
              Chọn một hành động để phản hồi yêu cầu này.
            </Text>

            {/* Decision Radio */}
            <Radio.Group
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full space-y-3"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Approve */}
              <div
                className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${decision === "approved"
                  ? "border-green-400 bg-green-50"
                  : "border-slate-200 bg-white hover:border-green-200"
                  }`}
                onClick={() => setDecision("approved")}
              >
                <Radio value="approved" className="w-full">
                  <div className="ml-1">
                    <div className="flex items-center gap-2">
                      <CheckCircleOutlined className="text-green-500" />
                      <Text className="font-semibold text-green-700">Đồng ý</Text>
                    </div>
                    <Text className="text-xs text-slate-500 block mt-0.5">
                      Chấp thuận yêu cầu và tiến hành thanh lý
                    </Text>
                  </div>
                </Radio>
              </div>

              {/* Negotiate */}
              <div
                className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${decision === null
                  ? "border-slate-200 bg-white hover:border-blue-200"
                  : "border-slate-200 bg-white"
                  }`}
              >
                <div className="flex items-center gap-2 opacity-60 px-6">
                  <SwapOutlined className="text-blue-500" />
                  <div>
                    <Text className="font-semibold text-blue-700">Thương lượng</Text>
                    <Text className="text-xs text-slate-500 block">
                      Đề xuất điều kiện hoặc ngày khác
                    </Text>
                  </div>
                </div>
              </div>

              {/* Reject */}
              <div
                className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${decision === "rejected"
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200 bg-white hover:border-red-200"
                  }`}
                onClick={() => setDecision("rejected")}
              >
                <Radio value="rejected" className="w-full">
                  <div className="ml-1">
                    <div className="flex items-center gap-2">
                      <CloseCircleOutlined className="text-red-500" />
                      <Text className="font-semibold text-red-700">Từ chối</Text>
                    </div>
                    <Text className="text-xs text-slate-500 block mt-0.5">
                      Bác bỏ yêu cầu này (Cần cung cấp lý do)
                    </Text>
                  </div>
                </Radio>
              </div>
            </Radio.Group>

            {/* Rejection fields */}
            {decision === "rejected" && (
              <div className="mt-4 space-y-3">
                <Divider className="!my-3" />
                <div>
                  <Text className="text-sm font-semibold text-red-700 block mb-2">
                    Lý do từ chối <span className="text-red-500">*</span>
                  </Text>
                  <Input.TextArea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={4}
                    placeholder="Giải thích chi tiết lý do bạn không chấp nhận yêu cầu này..."
                    className="!rounded-lg"
                    maxLength={1000}
                    showCount
                  />
                </div>

                <div className="mt-4">
                  <Text className="text-sm font-semibold text-red-700 block mb-2">
                    Hình ảnh / Tài liệu minh chứng <span className="text-red-500">*</span>
                  </Text>
                  <Upload.Dragger
                    accept={ACCEPTED_TYPES}
                    multiple
                    fileList={evidenceFiles}
                    beforeUpload={handleBeforeUpload}
                    onChange={handleFilesChange}
                    onRemove={(file) => {
                      setEvidenceFiles((prev) => prev.filter((f) => f.uid !== file.uid));
                    }}
                    maxCount={MAX_FILES}
                    className="!bg-slate-50 hover:!bg-slate-100 !border-slate-300"
                    itemRender={(originNode, file) => (
                      <div className="flex items-center justify-between p-2 mt-2 rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xl">
                            {getFileIcon(file)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-slate-700">{file.name}</div>
                            <div className="text-xs text-slate-500">{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <Button type="text" danger icon={<CloseCircleOutlined />} onClick={() => setEvidenceFiles(prev => prev.filter(f => f.uid !== file.uid))} />
                      </div>
                    )}
                  >
                    <p className="ant-upload-drag-icon text-blue-500 text-3xl mb-2">
                      <CloudUploadOutlined />
                    </p>
                    <p className="ant-upload-text text-slate-700 font-medium text-sm">
                      Nhấp hoặc kéo thả file vào đây
                    </p>
                    <p className="ant-upload-hint text-slate-500 text-xs px-4 mt-1">
                      Hỗ trợ ảnh, PDF, Word, Excel. Tối đa {MAX_FILES} file, mỗi file {MAX_FILE_SIZE_MB}MB.
                    </p>
                  </Upload.Dragger>
                </div>
              </div>
            )}

            {/* Approve note */}
            {decision === "approved" && (
              <div className="mt-4">
                <Text className="text-sm font-medium text-slate-600 block mb-2">Ghi chú (tùy chọn)</Text>
                <Input.TextArea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú thêm cho bên kia..."
                  className="!rounded-lg"
                  maxLength={500}
                />
              </div>
            )}

            {/* Submit */}
            <Button
              type="primary"
              size="large"
              block
              onClick={handleSubmit}
              loading={submitting || loading}
              disabled={!decision}
              className={`!rounded-xl !h-12 !mt-6 !font-semibold ${decision === "rejected"
                ? "!bg-red-600 hover:!bg-red-700 !border-red-600"
                : decision === "approved"
                  ? "!bg-green-600 hover:!bg-green-700 !border-green-600"
                  : ""
                }`}
              icon={decision === "rejected" ? <CloseCircleOutlined /> : decision === "approved" ? <CheckCircleOutlined /> : undefined}
            >
              {decision === "rejected"
                ? "Gửi quyết định Từ chối"
                : decision === "approved"
                  ? "Gửi quyết định Đồng ý"
                  : "Chọn quyết định"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

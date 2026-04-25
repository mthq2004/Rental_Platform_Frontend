"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  Divider,
  Input,
  Radio,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import type { TerminationRequest } from "@/types/contract.type";
import dayjs from "dayjs";

const { Text, Title, Paragraph } = Typography;

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

interface TerminationUpdateSectionProps {
  request: TerminationRequest;
  contractCode?: string;
  nextStatus: "negotiating" | "resolved";
  onUpdate: (payload: { status: string; note: string; resolution?: string }) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

export default function TerminationUpdateSection({
  request,
  contractCode,
  nextStatus,
  onUpdate,
  onBack,
  loading = false,
}: TerminationUpdateSectionProps) {
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState<"continue_contract" | "terminate_contract">("continue_contract");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim() && nextStatus === "negotiating") {
      message.error("Vui lòng nhập nội dung thương lượng");
      return;
    }

    setSubmitting(true);
    try {
      await onUpdate({
        status: nextStatus,
        note: note.trim(),
        resolution: resolution,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const st = STATUS_MAP[request.status] || STATUS_MAP.pending;

  return (
    <div className="max-w-4xl mx-auto">
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
          {nextStatus === "negotiating" ? "Bắt đầu thương lượng" : "Xác nhận giải quyết nội bộ"}
        </Title>
        <Text className="text-slate-500">
          {nextStatus === "negotiating" 
            ? "Gửi đề xuất thương lượng mới cho đối tác để tìm tiếng nói chung." 
            : "Xác nhận kết quả sau khi hai bên đã tự thỏa thuận thành công."}
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <Title level={5} className="!mb-4 !text-slate-800">
            Thông tin hiện tại
          </Title>

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

          {/* History */}
          {request.note && (
            <div className="mb-3">
              <Text className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Ghi chú gốc</Text>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {request.note}
              </div>
            </div>
          )}
          {request.reviewNote && (
            <div className="mb-3">
              <Text className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">Phản hồi / Từ chối trước đó</Text>
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {request.reviewNote.split("--- TÀI LIỆU MINH CHỨNG ---")[0].trim()}
              </div>
            </div>
          )}
        </Card>

        {/* Action Form */}
        <Card className="!rounded-2xl !border-slate-200 !shadow-sm !h-fit">
          <Title level={5} className="!mb-4 !text-slate-800">
            {nextStatus === "negotiating" ? "Nội dung thương lượng" : "Kết quả thỏa thuận"}
          </Title>

          <div className="mb-6">
            <Text className="text-sm font-semibold text-slate-700 block mb-3">
              {nextStatus === "negotiating" ? "Mục tiêu thương lượng:" : "Hai bên đã thống nhất quyết định:"}
            </Text>
            <Radio.Group
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full space-y-3 flex flex-col"
              >
                <div
                  className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
                    resolution === "continue_contract"
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                  onClick={() => setResolution("continue_contract")}
                >
                  <Radio value="continue_contract" className="w-full">
                    <div className="ml-1">
                      <Text className="font-semibold text-blue-700">Tiếp tục hợp đồng</Text>
                      <Text className="text-xs text-slate-500 block mt-0.5">
                        Xóa bỏ yêu cầu chấm dứt, hợp đồng vẫn diễn ra bình thường.
                      </Text>
                    </div>
                  </Radio>
                </div>
                
                <div
                  className={`rounded-xl border-2 px-4 py-3 cursor-pointer transition-all ${
                    resolution === "terminate_contract"
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200 bg-white hover:border-red-200"
                  }`}
                  onClick={() => setResolution("terminate_contract")}
                >
                  <Radio value="terminate_contract" className="w-full">
                    <div className="ml-1">
                      <Text className="font-semibold text-red-700">Chấm dứt hợp đồng</Text>
                      <Text className="text-xs text-slate-500 block mt-0.5">
                        Đồng ý chấm dứt theo thỏa thuận mới.
                      </Text>
                    </div>
                  </Radio>
                </div>
              </Radio.Group>
            </div>

          <div className="space-y-3">
            <div>
              <Text className="text-sm font-semibold text-slate-700 block mb-2">
                {nextStatus === "negotiating" ? "Đề xuất của bạn" : "Ghi chú thêm"} 
                {nextStatus === "negotiating" && <span className="text-red-500"> *</span>}
              </Text>
              <Input.TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder={nextStatus === "negotiating" ? "Nhập chi tiết điều kiện hoặc đề xuất mới để đối tác xem xét..." : "Ghi chú thêm về thỏa thuận này..."}
                className="!rounded-lg"
                maxLength={1000}
                showCount
              />
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleSubmit}
            loading={submitting || loading}
            className={`!rounded-xl !h-12 !mt-6 !font-semibold ${
              nextStatus === "negotiating"
                ? "!bg-blue-600 hover:!bg-blue-700 !border-blue-600"
                : "!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600"
            }`}
            icon={nextStatus === "negotiating" ? <MessageOutlined /> : <CheckCircleOutlined />}
          >
            {nextStatus === "negotiating" ? "Gửi đề xuất thương lượng" : "Xác nhận hoàn tất giải quyết"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

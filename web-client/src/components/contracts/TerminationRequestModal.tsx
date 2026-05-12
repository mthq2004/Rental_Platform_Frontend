"use client";

import React, { useState } from "react";
import { Modal, Form, Select, Input, DatePicker, InputNumber, Button, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { createTerminationRequest } from "@/services/contract.service";
import dayjs from "dayjs";

const TERMINATION_REASONS = [
  { value: "mutual_agreement", label: "Thỏa thuận chung" },
  { value: "unilateral_termination", label: "Đơn phương chấm dứt" },
  { value: "breach_of_contract", label: "Vi phạm hợp đồng" },
  { value: "non_payment", label: "Không thanh toán" },
  { value: "force_majeure", label: "Bất khả kháng" },
  { value: "lease_end", label: "Hết hạn hợp đồng" },
  { value: "other", label: "Lý do khác" },
];

interface TerminationRequestModalProps {
  open: boolean;
  rentalId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TerminationRequestModal({
  open, rentalId, onClose, onSuccess,
}: TerminationRequestModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createTerminationRequest({
        rentalId,
        reason: values.reason,
        note: values.note,
        requestedTerminationDate: values.requestedTerminationDate.format("YYYY-MM-DD"),
        earlyTerminationFee: values.earlyTerminationFee,
      });
      message.success("Đã gửi yêu cầu chấm dứt hợp đồng");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.message || "Không thể gửi yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2 text-red-600">
          <ExclamationCircleOutlined />
          <span>Yêu cầu chấm dứt hợp đồng</span>
        </div>
      }
      okText="Gửi yêu cầu"
      cancelText="Hủy"
      onOk={handleSubmit}
      confirmLoading={loading}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="reason"
          label="Lý do chấm dứt"
          rules={[{ required: true, message: "Vui lòng chọn lý do" }]}
        >
          <Select
            placeholder="Chọn lý do..."
            options={TERMINATION_REASONS}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="note"
          label="Ghi chú chi tiết"
        >
          <Input.TextArea
            rows={4}
            placeholder="Mô tả chi tiết lý do chấm dứt hợp đồng..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="requestedTerminationDate"
          label="Ngày muốn chấm dứt"
          rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
        >
          <DatePicker
            className="w-full"
            size="large"
            format="DD/MM/YYYY"
            disabledDate={(d) => d.isBefore(dayjs(), "day")}
            placeholder="Chọn ngày chấm dứt"
          />
        </Form.Item>

        <Form.Item
          name="earlyTerminationFee"
          label="Đề xuất phí chấm dứt sớm (VNĐ)"
        >
          <InputNumber
            className="w-full"
            size="large"
            min={0}
            step={100000}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => v!.replace(/,/g, "") as any}
            placeholder="Để trống nếu không đề xuất"
          />
        </Form.Item>
      </Form>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
        <p className="text-amber-700 text-xs leading-relaxed m-0">
          <strong>⚠️ Lưu ý:</strong> Sau khi gửi, bên còn lại sẽ nhận được thông báo và có thể
          chấp nhận, từ chối hoặc thương lượng. Nếu không thống nhất, có thể gửi khiếu nại lên admin.
        </p>
      </div>
    </Modal>
  );
}

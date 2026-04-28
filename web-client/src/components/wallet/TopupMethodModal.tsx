"use client";

import React from "react";
import { Button, Modal, Radio, Typography } from "antd";

const { Text } = Typography;

export interface MethodOption {
  value: string;
  label: string;
  description: string;
}

const TOPUP_METHOD_OPTIONS: MethodOption[] = [
  { value: "momo", label: "MoMo", description: "Thanh toán nhanh bằng ứng dụng MoMo." },
  { value: "vnpay", label: "VNPay", description: "Chuyển sang cổng thanh toán VNPay." },
];

export interface TopupMethodModalProps {
  open: boolean;
  amount: number | null;
  selectedMethod: string;
  loading?: boolean;
  title?: string;
  amountLabel?: string;
  helperText?: string;
  confirmText?: string;
  options?: MethodOption[];
  onCancel: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onChangeMethod: (method: string) => void;
}

export function TopupMethodModal({
  open,
  amount,
  selectedMethod,
  loading,
  title = "Chọn phương thức thanh toán",
  amountLabel = "Số tiền",
  helperText = "Chọn phương thức phù hợp để tiếp tục đến giao diện quét mã hoặc chuyển khoản.",
  confirmText = "Thanh toán",
  options = TOPUP_METHOD_OPTIONS,
  onCancel,
  onBack,
  onConfirm,
  onChangeMethod,
}: TopupMethodModalProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value || 0);

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onBack}>
          Quay lại
        </Button>,
        <Button key="pay" type="primary" loading={loading} onClick={onConfirm}>
          {confirmText}
        </Button>,
      ]}
      width={620}
      destroyOnHidden
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#E9E6FF] bg-gradient-to-r from-[#F7F5FF] via-white to-[#EEF3FF] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[#6E63D8]">{amountLabel}</div>
          <div className="mt-1 text-2xl font-semibold text-[#2D226B]">{formatCurrency(amount || 0)}</div>
          <div className="mt-1 text-sm text-[#5B5B7A]">{helperText}</div>
        </div>

        <Radio.Group className="w-full" value={selectedMethod} onChange={(event) => onChangeMethod(event.target.value)}>
          <div className="space-y-2">
            {options.map((option) => {
              const active = selectedMethod === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${active ? "border-[#5B5BFF] bg-[#F5F7FF]" : "border-[#E5E7F0] bg-white hover:border-[#B8C0FF]"
                    }`}
                >
                  <Radio value={option.value} />
                  <div className="flex-1">
                    <Text className="text-sm font-medium text-[#1F2430]">{option.label}</Text>
                    <div className="text-xs text-[#6B7280]">{option.description}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </Radio.Group>
      </div>
    </Modal>
  );
}

export default TopupMethodModal;
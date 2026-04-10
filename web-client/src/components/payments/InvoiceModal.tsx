"use client";

import React, { useMemo } from "react";
import { Modal, Tag, Divider, Typography } from "antd";
import dayjs from "dayjs";
import type { Payment, PaymentStatus, PaymentType, RentalContract } from "@/types/contract.type";

const { Text } = Typography;

type InvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  items: Payment[];
  contract?: RentalContract | null;
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  rent: "Tien phong",
  deposit: "Tien coc",
  electricity: "Dien",
  water: "Nuoc",
  internet: "Internet",
  parking: "Giu xe",
  management_fee: "Phi quan ly",
  service_fee: "Phi dich vu",
  late_fee: "Phi tre han",
  damage_fee: "Phi hu hong",
  early_termination: "Phi cham dut som",
  other: "Khac",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "Cho thanh toan", color: "processing" },
  paid: { label: "Da thanh toan", color: "success" },
  overdue: { label: "Qua han", color: "error" },
  partial: { label: "Thanh toan mot phan", color: "warning" },
  cancelled: { label: "Da huy", color: "default" },
  refunded: { label: "Da hoan tien", color: "purple" },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDate = (value?: string | null) => (value ? dayjs(value).format("DD/MM/YYYY") : "—");

const getBillingPeriod = (payment?: Payment | null) => {
  if (!payment?.dueDate) return "—";
  return dayjs(payment.dueDate).format("MM/YYYY");
};

const getInvoiceTitle = (payment: Payment) => {
  if (payment.paymentType === "deposit") {
    return "THONG BAO THANH TOAN TIEN COC";
  }
  if (payment.paymentType === "early_termination") {
    return "THONG BAO THANH TOAN PHI CHAM DUT SOM";
  }
  return "THONG BAO THANH TOAN TIEN THUE";
};

export default function InvoiceModal({ open, onClose, payment, items, contract }: InvoiceModalProps) {
  const sortedItems = useMemo(() => {
    if (!Array.isArray(items)) return [] as Payment[];
    return [...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [items]);

  const totals = useMemo(() => {
    const total = sortedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = sortedItems.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
    const remaining = sortedItems.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0);
    return { total, paid, remaining };
  }, [sortedItems]);

  if (!payment) return null;

  const statusCfg = PAYMENT_STATUS_LABELS[payment.status] || PAYMENT_STATUS_LABELS.pending;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={980}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
            GO
          </div>
          <div>
            <div className="font-semibold text-gray-800">GOHOME</div>
            <div className="text-xs text-gray-500">Thong bao thanh toan</div>
          </div>
        </div>
        <Tag color={statusCfg.color}>{statusCfg.label}</Tag>
      </div>

      <div className="overflow-y-auto bg-[#f2f4f7]" style={{ maxHeight: "80vh" }}>
        <div
          className="mx-auto my-8 bg-white contract-a4-view"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "20mm 18mm",
            fontFamily: "'Times New Roman', Times, serif",
            color: "#1a1a1a",
            lineHeight: 1.6,
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-bold">GOHOME</div>
              <div className="text-xs text-gray-500">Toa nha 460/6 Ngo Trang Long</div>
              <div className="text-xs text-gray-500">Binh Thanh, Ho Chi Minh City, Viet Nam</div>
            </div>
            <div className="text-right text-xs text-gray-600">
              <div>Ma hoa don: {payment.paymentCode}</div>
              <div>Ngay phat hanh: {formatDate(payment.createdAt || payment.dueDate)}</div>
              <div>Ngay den han: {formatDate(payment.dueDate)}</div>
              <div>
                {payment.paymentType === "deposit" || payment.paymentType === "early_termination"
                  ? `Loai hoa don: ${PAYMENT_TYPE_LABELS[payment.paymentType]}`
                  : `Ky su dung: ${getBillingPeriod(payment)}`}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-lg font-bold uppercase">{getInvoiceTitle(payment)}</div>
            <div className="text-sm text-gray-500">
              {payment.paymentType === "deposit" || payment.paymentType === "early_termination"
                ? `Ngay hach toan: ${formatDate(payment.dueDate)}`
                : `Ky hoa don: ${getBillingPeriod(payment)}`}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <div><strong>Khach hang:</strong> {contract?.tenant?.name || contract?.tenantId || payment.contract?.tenantId || "—"}</div>
              <div><strong>So dien thoai:</strong> {contract?.tenant?.phone || "—"}</div>
              <div><strong>Phong:</strong> {contract?.contractCode || payment.contract?.contractCode || "—"}</div>
            </div>
            <div className="space-y-1">
              <div><strong>Chu nha:</strong> {contract?.owner?.name || contract?.ownerId || payment.contract?.ownerId || "—"}</div>
              <div><strong>Bat dong san:</strong> {contract?.propertyId || payment.contract?.propertyId || "—"}</div>
              <div><strong>Dia chi:</strong> {contract?.notes || "—"}</div>
            </div>
          </div>

          <Divider className="my-5" />

          <table className="w-full text-xs border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-2 py-2 text-left">STT</th>
                <th className="border border-gray-200 px-2 py-2 text-left">Dich vu</th>
                <th className="border border-gray-200 px-2 py-2 text-right">So tien (VND)</th>
                <th className="border border-gray-200 px-2 py-2 text-right">Trang thai</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length ? (
                sortedItems.map((item, index) => {
                  const cfg = PAYMENT_STATUS_LABELS[item.status] || PAYMENT_STATUS_LABELS.pending;
                  return (
                    <tr key={item.paymentId}>
                      <td className="border border-gray-200 px-2 py-2">{index + 1}</td>
                      <td className="border border-gray-200 px-2 py-2">{PAYMENT_TYPE_LABELS[item.paymentType] || item.paymentType}</td>
                      <td className="border border-gray-200 px-2 py-2 text-right">{formatCurrency(Number(item.amount || 0))}</td>
                      <td className="border border-gray-200 px-2 py-2 text-right">{cfg.label}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="border border-gray-200 px-2 py-3 text-center text-gray-500">
                    Khong co du lieu hoa don
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs text-sm">
              <div className="flex items-center justify-between border-b py-2">
                <Text>Tong tien hoa don</Text>
                <Text strong>{formatCurrency(totals.total)}</Text>
              </div>
              <div className="flex items-center justify-between border-b py-2">
                <Text>Da thanh toan</Text>
                <Text strong className="text-green-600">{formatCurrency(totals.paid)}</Text>
              </div>
              <div className="flex items-center justify-between py-2">
                <Text>Con lai</Text>
                <Text strong className="text-red-500">{formatCurrency(totals.remaining)}</Text>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <div>Ghi chu: Hoa don duoc tong hop tu cac khoan thanh toan trong ky.</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

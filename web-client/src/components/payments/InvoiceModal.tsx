"use client";

import React, { useMemo } from "react";
import { Modal, Divider } from "antd";
import dayjs from "dayjs";
import type { Payment, PaymentStatus, PaymentType, RentalContract } from "@/types/contract.type";

type InvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  items: Payment[];
  contract?: RentalContract | null;
  // Explicit display data (takes priority over contract fields)
  tenantName?: string;
  tenantPhone?: string;
  ownerName?: string;
  propertyTitle?: string;
  propertyAddress?: string;
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  rent: "Tiền phòng",
  deposit: "Tiền cọc",
  electricity: "Điện",
  water: "Nước",
  internet: "Internet",
  parking: "Giữ xe",
  management_fee: "Phí quản lý",
  service_fee: "Phí dịch vụ",
  late_fee: "Phí trễ hạn",
  damage_fee: "Phí hư hỏng",
  early_termination: "Phí chấm dứt sớm",
  other: "Khác",
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; text: string }> = {
  pending: { label: "Chờ thanh toán", bg: "#FEF3C7", text: "#92400E" },
  paid: { label: "Đã thanh toán", bg: "#D1FAE5", text: "#065F46" },
  overdue: { label: "Quá hạn", bg: "#FEE2E2", text: "#991B1B" },
  partial: { label: "Thanh toán một phần", bg: "#FEF3C7", text: "#92400E" },
  cancelled: { label: "Đã hủy", bg: "#F3F4F6", text: "#6B7280" },
  refunded: { label: "Đã hoàn tiền", bg: "#EDE9FE", text: "#5B21B6" },
};

const BRAND_COLOR = "#1a2e4a";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

const formatDate = (value?: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "—";

const getBillingPeriod = (payment?: Payment | null) => {
  if (!payment?.dueDate) return "—";
  return dayjs(payment.dueDate).format("MM/YYYY");
};

const getInvoiceTitle = (payment: Payment) => {
  if (payment.paymentType === "deposit") return "THÔNG BÁO THANH TOÁN TIỀN CỌC";
  if (payment.paymentType === "early_termination") return "THÔNG BÁO THANH TOÁN PHÍ CHẤM DỨT SỚM";
  return "THÔNG BÁO THANH TOÁN TIỀN THUÊ";
};

const isSpecialType = (type: PaymentType) =>
  type === "deposit" || type === "early_termination";

export default function InvoiceModal({
  open,
  onClose,
  payment,
  items,
  contract,
  tenantName,
  tenantPhone,
  ownerName,
  propertyTitle,
  propertyAddress,
}: InvoiceModalProps) {
  const sortedItems = useMemo(() => {
    if (!Array.isArray(items)) return [] as Payment[];
    return [...items].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [items]);

  const totals = useMemo(() => {
    const total = sortedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = sortedItems.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
    const remaining = sortedItems.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0);
    return { total, paid, remaining };
  }, [sortedItems]);

  if (!payment) return null;

  const statusCfg = PAYMENT_STATUS_CONFIG[payment.status] ?? PAYMENT_STATUS_CONFIG.pending;
  const special = isSpecialType(payment.paymentType);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={740}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {/* ── Modal header bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "0.5px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#fff",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: "#111827" }}>Real Estate</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Thông báo thanh toán</div>
          </div>
        </div>

        <span
          style={{
            background: statusCfg.bg,
            color: statusCfg.text,
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 6,
            fontWeight: 500,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* ── Scrollable document area ── */}
      <div style={{ maxHeight: "80vh", overflowY: "auto", background: "#f3f4f6", padding: 16 }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            border: "0.5px solid #e5e7eb",
            padding: "32px 36px",
            fontFamily: "'Times New Roman', Times, serif",
            color: "#1a1a1a",
            lineHeight: 1.6,
          }}
        >
          {/* ── Document top: logo + meta ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  overflow: "hidden",
                }}
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ width: 56, height: 56, objectFit: "contain" }}
                />
              </div>
              <div style={{ fontWeight: 500, fontSize: 16, fontFamily: "sans-serif" }}>Real Estate</div>
              <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "sans-serif", marginTop: 2 }}>
                Cho thuê bất động sản thông minh
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "sans-serif" }}>
                UY TÍN - CHẤT LƯỢNG - CHUYÊN NGHIỆP
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: 11, fontFamily: "sans-serif", lineHeight: 2 }}>
              <div>
                <span style={{ color: "#9ca3af" }}>Mã hóa đơn: </span>
                <span style={{ fontWeight: 500, color: "#111827" }}>{payment.paymentCode}</span>
              </div>
              <div>
                <span style={{ color: "#9ca3af" }}>Ngày phát hành: </span>
                <span style={{ color: "#111827" }}>
                  {formatDate(payment.createdAt || payment.dueDate)}
                </span>
              </div>
              <div>
                <span style={{ color: "#9ca3af" }}>Ngày đến hạn: </span>
                <span style={{ color: "#dc2626", fontWeight: 500 }}>
                  {formatDate(payment.dueDate)}
                </span>
              </div>
              <div>
                <span style={{ color: "#9ca3af" }}>
                  {special ? "Loại hóa đơn: " : "Kỳ sử dụng: "}
                </span>
                <span style={{ color: "#111827" }}>
                  {special
                    ? PAYMENT_TYPE_LABELS[payment.paymentType]
                    : getBillingPeriod(payment)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Accent divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ height: 2, width: 32, background: BRAND_COLOR, borderRadius: 2 }} />
            <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
          </div>

          {/* ── Invoice title ── */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase" }}>
              {getInvoiceTitle(payment)}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "sans-serif", marginTop: 4 }}>
              {special
                ? `Ngày hạch toán: ${formatDate(payment.dueDate)}`
                : `Kỳ hóa đơn: tháng ${getBillingPeriod(payment)}`}
            </div>
          </div>

          {/* ── Tenant / landlord info cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Khách hàng */}
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: "14px 16px",
                fontFamily: "sans-serif",
                fontSize: 12,
                lineHeight: 1.9,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                Khách hàng
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Họ tên: </span>
                <span style={{ fontWeight: 500, color: "#111827" }}>
                  {tenantName || contract?.tenant?.fullName || contract?.tenant?.name || "—"}
                </span>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Điện thoại: </span>
                <span style={{ color: "#111827" }}>{tenantPhone || contract?.tenant?.phone || "—"}</span>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Hợp đồng: </span>
                <span style={{ color: "#111827" }}>
                  {contract?.contractCode || payment.contract?.contractCode || "—"}
                </span>
              </div>
            </div>

            {/* Chủ nhà */}
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: "14px 16px",
                fontFamily: "sans-serif",
                fontSize: 12,
                lineHeight: 1.9,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                }}
              >
                Chủ nhà
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Họ tên: </span>
                <span style={{ fontWeight: 500, color: "#111827" }}>
                  {ownerName || contract?.owner?.fullName || contract?.owner?.name || "—"}
                </span>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Bất động sản: </span>
                <span style={{ color: "#111827" }}>
                  {propertyTitle || "—"}
                </span>
              </div>
              <div>
                <span style={{ color: "#6b7280" }}>Địa chỉ: </span>
                <span style={{ color: "#111827" }}>{propertyAddress || "—"}</span>
              </div>
            </div>
          </div>

          {/* ── Line items table ── */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "sans-serif",
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            <thead>
              <tr style={{ background: BRAND_COLOR }}>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    color: "#fff",
                    fontWeight: 500,
                    borderRadius: "6px 0 0 0",
                    width: 40,
                  }}
                >
                  STT
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#fff", fontWeight: 500 }}>
                  Dịch vụ
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#fff", fontWeight: 500 }}>
                  Số tiền (VNĐ)
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: 500,
                    borderRadius: "0 6px 0 0",
                    width: 130,
                  }}
                >
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length ? (
                sortedItems.map((item, index) => {
                  const cfg = PAYMENT_STATUS_CONFIG[item.status] ?? PAYMENT_STATUS_CONFIG.pending;
                  return (
                    <tr
                      key={item.paymentId}
                      style={{ borderBottom: "0.5px solid #e5e7eb" }}
                    >
                      <td style={{ padding: "10px 12px", color: "#6b7280" }}>{index + 1}</td>
                      <td style={{ padding: "10px 12px", color: "#111827" }}>
                        {PAYMENT_TYPE_LABELS[item.paymentType] ?? item.paymentType}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 500, color: "#111827" }}>
                        {formatCurrency(Number(item.amount || 0))}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          style={{
                            background: cfg.bg,
                            color: cfg.text,
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 4,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{ padding: "16px 12px", textAlign: "center", color: "#9ca3af" }}
                  >
                    Không có dữ liệu hóa đơn
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ── Totals ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
            <div style={{ width: 280, fontFamily: "sans-serif", fontSize: 13 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "0.5px solid #e5e7eb",
                  color: "#6b7280",
                }}
              >
                <span>Tổng hóa đơn</span>
                <span style={{ fontWeight: 500, color: "#111827" }}>
                  {formatCurrency(totals.total)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "0.5px solid #e5e7eb",
                  color: "#6b7280",
                }}
              >
                <span>Đã thanh toán</span>
                <span style={{ fontWeight: 500, color: "#059669" }}>
                  {formatCurrency(totals.paid)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: "#f9fafb",
                  borderRadius: 6,
                  padding: "10px 12px",
                  marginTop: 6,
                }}
              >
                <span style={{ fontWeight: 500, color: "#111827" }}>Còn lại</span>
                <span style={{ fontWeight: 500, color: "#dc2626", fontSize: 15 }}>
                  {formatCurrency(totals.remaining)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Bottom accent divider ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
            <div style={{ height: 2, width: 32, background: BRAND_COLOR, borderRadius: 2 }} />
          </div>

          {/* ── Footer note ── */}
          <div style={{ fontFamily: "sans-serif", fontSize: 11, color: "#9ca3af", lineHeight: 1.7 }}>
            <div>Ghi chú: Hóa đơn được tổng hợp từ các khoản thanh toán trong kỳ.</div>
            <div>Vui lòng thanh toán trước ngày đến hạn để tránh phát sinh phí trễ hạn.</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
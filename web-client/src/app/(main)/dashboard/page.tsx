"use client";

import React, { useMemo } from "react";
import { Row, Col, Statistic, Button } from "antd";
import {
  AppstoreOutlined,
  FileTextOutlined,
  DollarOutlined,
  WalletOutlined,
  CalendarOutlined,
  SendOutlined,
  HeartOutlined,
  ArrowRightOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/stores/hooks";

interface QuickStatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  suffix?: string;
  color: string;
  bgColor: string;
  href: string;
}

const QuickStatCard = ({ icon, title, value, suffix, color, bgColor, href }: QuickStatCardProps) => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(href)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        padding: "20px 18px",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = color;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 12px ${color}22`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
          {value}
          {suffix && <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", marginLeft: 4 }}>{suffix}</span>}
        </div>
      </div>
      <ArrowRightOutlined style={{ color: "#cbd5e1", fontSize: 13 }} />
    </div>
  );
};

const DashboardPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const walletOverview = useAppSelector((state) => state.wallet.overview);
  const statusCount = useAppSelector((state) => state.property.statusCount);
  const contracts = useAppSelector((state) => state.contract.contracts);
  const payments = useAppSelector((state) => state.contract.payments);
  const myRequests = useAppSelector((state) => state.contract.myRequests);
  const ownerRequests = useAppSelector((state) => state.contract.ownerRequests);
  const customerCategories = useAppSelector((state) => state.customerCategory.customerCategories);

  const totalPosts = useMemo(
    () =>
      Array.isArray(statusCount)
        ? statusCount.reduce((sum, item) => sum + Number(item?.count ?? 0), 0)
        : 0,
    [statusCount]
  );

  const activeContracts = useMemo(
    () => contracts.filter((c: any) => c.status === "active").length,
    [contracts]
  );

  const pendingPayments = useMemo(
    () => payments.filter((p: any) => p.status === "pending" || p.status === "overdue").length,
    [payments]
  );

  const totalRequests = myRequests.length + ownerRequests.length;

  const formatMoney = (num: number) => new Intl.NumberFormat("vi-VN").format(num);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#0f172a" }}>
          Xin chào, {user?.fullName || "bạn"} 👋
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
          Đây là tổng quan nhanh về tài khoản và hoạt động của bạn.
        </p>
      </div>

      {/* Wallet overview */}
      <div
        style={{
          borderRadius: 20,
          padding: "24px 28px",
          marginBottom: 28,
          background: "linear-gradient(135deg, #0B1B3B 0%, #1B3A7A 100%)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7, marginBottom: 16 }}>
          Ví của bạn
        </div>
        <Row gutter={[24, 16]}>
          <Col xs={12} md={8}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Số dư khả dụng</span>}
              value={walletOverview ? formatMoney(walletOverview.availableBalance) : "0"}
              suffix="đ"
              valueStyle={{ color: "#fff", fontSize: 22, fontWeight: 700 }}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Tiền đang giữ</span>}
              value={walletOverview ? formatMoney(walletOverview.pendingBalance) : "0"}
              suffix="đ"
              valueStyle={{ color: "#fbbf24", fontSize: 22, fontWeight: 700 }}
            />
          </Col>
          <Col xs={24} md={8} style={{ display: "flex", alignItems: "center" }}>
            <Button
              ghost
              size="large"
              icon={<WalletOutlined />}
              href="/dashboard/wallet?action=topup"
              style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10 }}
            >
              Nạp tiền
            </Button>
          </Col>
        </Row>
      </div>

      {/* Quick stats grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <QuickStatCard
            icon={<AppstoreOutlined />}
            title="Bài đăng"
            value={totalPosts}
            suffix="tin"
            color="#2563eb"
            bgColor="#eff6ff"
            href="/dashboard/posts"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickStatCard
            icon={<FileTextOutlined />}
            title="Hợp đồng đang hoạt động"
            value={activeContracts}
            color="#059669"
            bgColor="#ecfdf5"
            href="/dashboard/contracts"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickStatCard
            icon={<DollarOutlined />}
            title="Thanh toán chờ xử lý"
            value={pendingPayments}
            color="#d97706"
            bgColor="#fffbeb"
            href="/dashboard/payments"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickStatCard
            icon={<SendOutlined />}
            title="Yêu cầu thuê"
            value={totalRequests}
            color="#7c3aed"
            bgColor="#f5f3ff"
            href="/dashboard/rental-requests"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickStatCard
            icon={<HeartOutlined />}
            title="Tin yêu thích"
            value="—"
            color="#ec4899"
            bgColor="#fdf2f8"
            href="/dashboard/favorites"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <QuickStatCard
            icon={<CalendarOutlined />}
            title="Lịch xem nhà"
            value="—"
            color="#0891b2"
            bgColor="#ecfeff"
            href="/dashboard/bookings"
          />
        </Col>
        {customerCategories.length > 0 && (
          <Col xs={24} sm={12} lg={8}>
            <QuickStatCard
              icon={<TeamOutlined />}
              title="Nhóm khách hàng"
              value={customerCategories.length}
              color="#ea580c"
              bgColor="#fff7ed"
              href="/dashboard/customers"
            />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default DashboardPage;
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Layout, Menu, Button, Space, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  LockOutlined,
  AppstoreOutlined,
  HeartOutlined,
  BarChartOutlined,
  LogoutOutlined,
  FileTextOutlined,
  SendOutlined,
  DollarOutlined,
  CalendarOutlined,
  WalletOutlined,
  PlusCircleOutlined,
  SwapOutlined,
  CreditCardOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import type { MenuProps } from "antd";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";
import { getPostStatusCounts } from "@/stores/slices/property.slice";
import {
  getMyRequests,
  getOwnerRequests,
  getMyContracts,
  getMyPayments,
} from "@/stores/slices/contract.slice";
import { getAllCustomerCategories } from "@/stores/slices/customer-category.slice";
import { getWalletOverview } from "@/stores/slices/wallet.slice";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const authProvider = useAppSelector((state) => state.auth.authProvider);
  const isOAuthUser = authProvider === "google" || authProvider === "facebook";
  const user = useAppSelector((state) => state.auth.user);
  const walletOverview = useAppSelector((state) => state.wallet.overview);
  const walletLoading = useAppSelector((state) => state.wallet.overviewLoading);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // ─── Lấy data từ Redux store để tính menu visibility reactive ───────────
  const statusCount = useAppSelector((state) => state.property.statusCount);
  const myRequests = useAppSelector((state) => state.contract.myRequests);
  const ownerRequests = useAppSelector((state) => state.contract.ownerRequests);
  const contracts = useAppSelector((state) => state.contract.contracts);
  const payments = useAppSelector((state) => state.contract.payments);
  const customerCategories = useAppSelector(
    (state) => state.customerCategory.customerCategories,
  );

  // ─── Menu visibility: reactive theo Redux state, không dùng cache ────────
  const menuVisibility = useMemo(
    () => ({
      posts:
        Array.isArray(statusCount) &&
        statusCount.some((item) => Number(item?.count ?? 0) > 0),
      rentalRequests: myRequests.length > 0 || ownerRequests.length > 0,
      contracts: contracts.length > 0,
      payments: payments.length > 0,
      customers: customerCategories.length > 0,
    }),
    [statusCount, myRequests, ownerRequests, contracts, payments, customerCategories],
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ─── Tải dữ liệu vào Redux một lần khi mount ────────────────────────────
  useEffect(() => {
    Promise.all([
      dispatch(getPostStatusCounts()),
      dispatch(getMyRequests()),
      dispatch(getOwnerRequests()),
      dispatch(getMyContracts({ page: 1, limit: 50 })),
      dispatch(getMyPayments({ page: 1 })),
      dispatch(getAllCustomerCategories()),
      dispatch(getWalletOverview()),
    ]);
  }, [dispatch]);

  const menuItems: MenuProps["items"] = [
    {
      type: "group",
      label: "TỔNG QUAN",
      children: [
        { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
        { key: "/dashboard/statistics", icon: <BarChartOutlined />, label: "Phân tích & Báo cáo" },
      ],
    },
    {
      type: "group",
      label: "QUẢN LÝ",
      children: [
        { key: "/dashboard/customers", icon: <TeamOutlined />, label: "Khách hàng" },
        ...(menuVisibility.posts
          ? [{ key: "/dashboard/posts", icon: <FileTextOutlined />, label: "Tin đăng" }]
          : []),
        { key: "/dashboard/favorites", icon: <HeartOutlined />, label: "Tin yêu thích" },
        ...(menuVisibility.rentalRequests
          ? [{ key: "/dashboard/rental-requests", icon: <SendOutlined />, label: "Yêu cầu thuê" }]
          : []),
        ...(menuVisibility.contracts
          ? [{ key: "/dashboard/contracts", icon: <FileProtectOutlined />, label: "Hợp đồng" }]
          : []),
        { key: "/dashboard/bookings", icon: <CalendarOutlined />, label: "Lịch xem nhà" },
        { key: "/dashboard/wallet", icon: <SwapOutlined />, label: "Giao dịch" },
        ...(menuVisibility.payments
          ? [{ key: "/dashboard/payments", icon: <CreditCardOutlined />, label: "Thanh toán" }]
          : []),
      ],
    },
    {
      type: "group",
      label: "HỆ THỐNG",
      children: [
        { key: "/dashboard/profile", icon: <UserOutlined />, label: "Thông tin cá nhân" },
        ...(!isHydrated || !isOAuthUser
          ? [{ key: "/dashboard/change-password", icon: <LockOutlined />, label: "Cài đặt & Mật khẩu" }]
          : []),
      ],
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    dispatch(logout());
    setIsLoggingOut(false);
    router.push("/");
  };

  return (
    <div className="flex h-[calc(100vh-64px)] min-h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={isMobile ? 0 : 80}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setIsMobile(broken);
          setCollapsed(broken);
        }}
        width={260}
        theme="light"
        style={{
          height: "calc(100vh - 64px)",
          position: "fixed",
          left: 0,
          top: 64,
          background: "#ffffff",
          borderRight: "1px solid #e6f7ff",
          boxShadow: "inset -1px 0 0 #e6f7ff",
          overflow: "hidden",
          zIndex: 1000,
        }}
      >
        {/* User + Wallet Card */}
        {!collapsed && (
          <div className="mx-3 mt-3 mb-1 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
            {/* User info */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.fullName?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.fullName || "Người dùng"}</p>
                <p className="text-[10px] text-gray-400">{user?.email || user?.phone || ""}</p>
              </div>
            </div>

            {/* Balance rows */}
            <div className="px-3 py-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tài khoản khả dụng</span>
                <span className="font-semibold text-gray-800">
                  {walletLoading ? "..." : walletOverview
                    ? new Intl.NumberFormat("vi-VN").format(walletOverview.availableBalance) + " đ"
                    : "0 đ"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Tiền đang giữ</span>
                <span className="font-semibold text-orange-500">
                  {walletLoading ? "..." : walletOverview
                    ? new Intl.NumberFormat("vi-VN").format(walletOverview.pendingBalance) + " đ"
                    : "0 đ"}
                </span>
              </div>
            </div>

            {/* Nạp tiền button */}
            <div className="px-3 pb-2.5">
              <button
                onClick={() => router.push("/dashboard/wallet?action=topup")}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-400 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white transition-all duration-200 bg-white"
              >
                <PlusCircleOutlined />
                Nạp tiền
              </button>
            </div>
          </div>
        )}

        {/* Menu */}
        <div
          style={{
            height: collapsed ? "calc(100% - 62px)" : "calc(100% - 62px - 152px)",
            overflowY: "auto",
            overflowX: "hidden",
            paddingTop: 4,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={(e) => router.push(e.key)}
            style={{ borderRight: 0, marginTop: 0, background: "#ffffff" }}
          />
        </div>

        {/* Logout bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Menu
            mode="inline"
            onClick={handleLogout}
            className="bg-transparent! [&_.ant-menu-item]:m-0! [&_.ant-menu-item]:text-black! [&_.ant-menu-item:hover]:text-red-500! [&_.ant-menu-item]:flex! [&_.ant-menu-item]:items-center!"
            style={{ background: "#ffffff", borderRight: 0 }}
            items={[
              { type: "divider", className: "!mb-2" },
              {
                key: "logout",
                icon: isLoggingOut ? undefined : <LogoutOutlined />,
                label: isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất",
                danger: true,
                style: { height: "40px" },
              },
            ]}
          />
        </div>
      </Sider>

      {isMobile && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            inset: 0,
            top: 64,
            background: "rgba(0,0,0,0.35)",
            zIndex: 999,
          }}
        />
      )}

      {/* Main */}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
          transition: "all 0.2s",
          minWidth: 0,
          height: "100%",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            height: 64,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: "#1890ff" }}
            />
          </Space>
        </Header>

        <Content
          style={{
            flex: 1,
            padding: 12,
            background: "#ffffff",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <div
            style={{
              height: "100%",
              padding: 24,
              background: "#ffffff",
              borderRadius: borderRadiusLG,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </div>
  );
}

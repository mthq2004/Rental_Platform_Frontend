"use client";

import React, { useEffect, useState } from "react";
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

const { Header, Sider, Content } = Layout;

type MenuVisibility = {
  posts: boolean;
  rentalRequests: boolean;
  contracts: boolean;
  payments: boolean;
  customers: boolean;
};

const MENU_VISIBILITY_CACHE_KEY = "dashboard_menu_visibility_v1";
const MENU_VISIBILITY_CACHE_TTL_MS = 10 * 60 * 1000;

const getCachedMenuVisibility = (): { data: MenuVisibility; isFresh: boolean } | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(MENU_VISIBILITY_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      data?: MenuVisibility;
      expiresAt?: number;
    };

    if (!parsed?.data || typeof parsed.expiresAt !== "number") {
      return null;
    }

    return {
      data: parsed.data,
      isFresh: parsed.expiresAt > Date.now(),
    };
  } catch {
    return null;
  }
};

const setCachedMenuVisibility = (data: MenuVisibility) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      MENU_VISIBILITY_CACHE_KEY,
      JSON.stringify({
        data,
        expiresAt: Date.now() + MENU_VISIBILITY_CACHE_TTL_MS,
      }),
    );
  } catch {
    // Ignore storage write failures (e.g. private mode limits)
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const authProvider = useAppSelector((state) => state.auth.authProvider);
  const isOAuthUser = authProvider === "google" || authProvider === "facebook";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuVisibility, setMenuVisibility] = useState({
    posts: false,
    rentalRequests: false,
    contracts: false,
    payments: false,
    customers: false,
  });
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    let isMounted = true;
    const cachedMenuVisibility = getCachedMenuVisibility();

    if (cachedMenuVisibility?.data) {
      setMenuVisibility(cachedMenuVisibility.data);
    }

    const fetchMenuVisibility = async () => {
      try {
        const [postCounts, myRequestsRes, ownerRequestsRes, contractsRes, paymentsRes, customerCategories] =
          await Promise.all([
            dispatch(getPostStatusCounts()).unwrap(),
            dispatch(getMyRequests()).unwrap(),
            dispatch(getOwnerRequests()).unwrap(),
            dispatch(getMyContracts({ page: 1, limit: 1 })).unwrap(),
            dispatch(getMyPayments({ page: 1 })).unwrap(),
            dispatch(getAllCustomerCategories()).unwrap(),
          ]);

        const hasPosts =
          Array.isArray(postCounts) &&
          postCounts.some((item: any) => Number(item?.count ?? 0) > 0);

        const myRequests = Array.isArray(myRequestsRes?.data) ? myRequestsRes.data : [];
        const ownerRequests = Array.isArray(ownerRequestsRes?.data) ? ownerRequestsRes.data : [];
        const hasRentalRequests = myRequests.length > 0 || ownerRequests.length > 0;

        const contracts = Array.isArray(contractsRes?.data?.items)
          ? contractsRes.data.items
          : [];
        const hasContracts = contracts.length > 0;

        const payments = Array.isArray(paymentsRes?.data?.items)
          ? paymentsRes.data.items
          : [];
        const hasPayments = payments.length > 0;

        const hasCustomers =
          Array.isArray(customerCategories) && customerCategories.length > 0;

        const nextVisibility: MenuVisibility = {
          posts: hasPosts,
          rentalRequests: hasRentalRequests,
          contracts: hasContracts,
          payments: hasPayments,
          customers: hasCustomers,
        };

        setCachedMenuVisibility(nextVisibility);

        if (isMounted) {
          setMenuVisibility(nextVisibility);
        }
      } catch {
        // Keep cached visibility if available; fallback to all hidden only when no cache exists.
        if (isMounted && !cachedMenuVisibility?.data) {
          setMenuVisibility({
            posts: false,
            rentalRequests: false,
            contracts: false,
            payments: false,
            customers: false,
          });
        }
      }
    };

    if (!cachedMenuVisibility?.isFresh) {
      fetchMenuVisibility();
    }

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const menuItems: MenuProps["items"] = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Tổng quan" },
    ...(menuVisibility.posts
      ? [{ key: "/dashboard/posts", icon: <AppstoreOutlined />, label: "Quản lý bài đăng" }]
      : []),
    { key: "/dashboard/favorites", icon: <HeartOutlined />, label: "Tin yêu thích" },
    ...(menuVisibility.rentalRequests
      ? [{ key: "/dashboard/rental-requests", icon: <SendOutlined />, label: "Yêu cầu thuê" }]
      : []),
    ...(menuVisibility.contracts
      ? [{ key: "/dashboard/contracts", icon: <FileTextOutlined />, label: "Hợp đồng" }]
      : []),
    ...(menuVisibility.payments
      ? [{ key: "/dashboard/payments", icon: <DollarOutlined />, label: "Thanh toán" }]
      : []),
    { key: "/dashboard/bookings", icon: <CalendarOutlined />, label: "Lịch xem nhà" },
    ...(menuVisibility.customers
      ? [{ key: "/dashboard/customers", icon: <TeamOutlined />, label: "Khách hàng" }]
      : []),
    { key: "/dashboard/statistics", icon: <BarChartOutlined />, label: "Thống kê" },
    { type: "divider" },
    { key: "/dashboard/profile", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    ...(!isOAuthUser
      ? [{ key: "/dashboard/change-password", icon: <LockOutlined />, label: "Đổi mật khẩu" }]
      : []),
  ];

  const handleLogout = async () => {
      console.log("Logout clicked");
      setIsLoggingOut(true);
  
      // Delay để hiển thị animation
      await new Promise(resolve => setTimeout(resolve, 800));
  
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
        {/* Menu */}
        <div
          style={{
            height: "calc(100% - 62px)",
            overflowY: "auto",
            overflowX: "hidden",
            paddingTop: 8,
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
    // Đảm bảo container này có chiều cao đủ để thấy sự căn giữa
    display: "flex",
    flexDirection: "column",
    justifyContent: "center" 
  }}
>
  <Menu
    mode="inline"
    onClick={handleLogout}
    className="bg-transparent! [&_.ant-menu-item]:m-0! [&_.ant-menu-item]:text-black! [&_.ant-menu-item:hover]:text-red-500! [&_.ant-menu-item]:flex! [&_.ant-menu-item]:items-center!"
    style={{ background: "#ffffff", borderRight: 0 }}
    items={[
      { 
        type: "divider", 
        className: "!mb-2" // Tạo khoảng cách dưới Divider
      },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true,
        style: { height: '40px' } // Tăng chiều cao item để thấy rõ việc căn giữa hàng dọc
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
"use client";

import React, { useState } from "react";
import { Layout, Menu, Button, Space, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  LockOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import type { MenuProps } from "antd";
import { useAppDispatch } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const menuItems: MenuProps["items"] = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: "Tổng quan" },
    { key: "/dashboard/posts", icon: <AppstoreOutlined />, label: "Quản lý bài đăng" },
    { key: "/dashboard/customers", icon: <TeamOutlined />, label: "Khách hàng" },
    { key: "/dashboard/statistics", icon: <BarChartOutlined />, label: "Thống kê" },
    { type: "divider" },
    { key: "/dashboard/profile", icon: <UserOutlined />, label: "Thông tin cá nhân" },
    { key: "/dashboard/change-password", icon: <LockOutlined />, label: "Đổi mật khẩu" },
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        theme="light"
        style={{
          height: "calc(100vh - 64px)",
          position: "fixed",
          left: 0,
          top: 64,
          borderRight: "1px solid #e6f7ff",
        }}
      >
        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={(e) => router.push(e.key)}
          style={{ borderRight: 0, marginTop: 8 }}
        />

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
    className="
      !bg-transparent
      [&_.ant-menu-item]:!m-0
      [&_.ant-menu-item]:!text-black
      [&_.ant-menu-item:hover]:!text-red-500
      [&_.ant-menu-item]:!flex
      [&_.ant-menu-item]:!items-center
    "
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

      {/* Main */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 260,
          transition: "all 0.2s",
          width: "100%",
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
            padding: 24,
            background: "#f0f5ff",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              minHeight: "100%",
              padding: 24,
              background: "#ffffff",
              borderRadius: borderRadiusLG,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </div>
  );
}
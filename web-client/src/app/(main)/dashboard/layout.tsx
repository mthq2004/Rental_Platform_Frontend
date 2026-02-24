"use client";

import React, { useState } from "react";
import { Layout, Menu, Button, Avatar, Space, theme, Input, Badge } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  LockOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SearchOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import type { MenuProps } from "antd";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  return (
    // Bọc toàn bộ trong một container 100vh và ẩn scroll ngoài cùng
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar - Cố định bên trái */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        theme="light"
        style={{
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            borderRight: "1px solid #e6f7ff",
            zIndex: 100,
            transition: "all 0.2s", // Đảm bảo Sider cũng có transition đồng bộ
        }}
        >
        <div style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            borderBottom: '1px solid #f0f0f0',
            padding: '0 20px',
            overflow: 'hidden', // Quan trọng: Để chữ không bị tràn ra ngoài khi đang thu nhỏ
        }}>
            <div
            className="flex items-center cursor-pointer"
            style={{ gap: collapsed ? 0 : 12, transition: 'all 0.2s' }}
            onClick={() => router.push("/")}
            >
            {/* LOGO ICON */}
            <img 
                src="/logo.png" 
                alt="Logo" 
                style={{ 
                height: 32, 
                width: 32, 
                minWidth: 32, // Giữ kích thước cố định để không bị méo
                objectFit: 'contain',
                }} 
            />
            
            {/* WRAPPER CHỮ: Dùng width và opacity để tạo hiệu ứng mượt */}
            <div style={{ 
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
                transform: collapsed ? 'translateX(-10px)' : 'translateX(0)',
                transition: 'all 0.3s ease', // Animation cho chữ
                whiteSpace: 'nowrap',
                pointerEvents: collapsed ? 'none' : 'auto',
            }}>
                <p className="text-sm font-bold text-red-600 m-0">
                Real Estate
                <span className="text-[10px] text-gray-600 align-top">.com.vn</span>
                </p>
                <span className="text-[9px] font-medium text-gray-400 tracking-tight block">
                by PropertyGuru
                </span>
            </div>
            </div>
        </div>
        
        <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={(e) => router.push(e.key)}
            style={{ borderRight: 0, marginTop: 8 }}
        />
        </Sider>

      {/* Main Layout - Đẩy sang phải để không bị đè */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 260, 
        transition: 'all 0.2s',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header - Sticky phía trên */}
        <Header
          style={{
            padding: "0 24px",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f0f0f0",
            position: 'sticky',
            top: 0,
            zIndex: 99,
            width: '100%',
            height: 64,
          }}
        >
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 18, color: '#1890ff' }}
            />
          </Space>

          
        </Header>

        {/* Content - Nơi duy nhất chứa Scroll */}
        <Content
          style={{
            flex: 1, // Tự động lấp đầy khoảng trống còn lại
            padding: 24,
            background: "#f0f5ff",
            overflowY: "auto", // Kích hoạt scroll dọc tại đây
            height: "calc(100vh - 64px)", // Chiều cao thực tế sau khi trừ Header
          }}
        >
          <div style={{ 
            minHeight: '100%',
            padding: 24,
            background: '#ffffff',
            borderRadius: borderRadiusLG,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
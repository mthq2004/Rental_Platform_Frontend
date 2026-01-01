import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, theme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  /* =========================
     ACTIVE MENU KEY
  ========================= */
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes("/properties")) return "properties";
    if (path.includes("/owners")) return "owners";
    if (path.includes("/tenants")) return "tenants";
    if (path.includes("/contracts")) return "contracts";
    if (path.includes("/reports")) return "reports";
    return "dashboard";
  };

  /* =========================
     MAIN MENU
  ========================= */
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "properties",
      icon: <HomeOutlined />,
      label: "Properties",
      onClick: () => navigate("/dashboard/properties"),
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Users",
      children: [
        {
          key: "owners",
          label: "Owners",
          onClick: () => navigate("/dashboard/owners"),
        },
        {
          key: "tenants",
          label: "Tenants",
          onClick: () => navigate("/dashboard/tenants"),
        },
      ],
    },
    {
      key: "contracts",
      icon: <FileTextOutlined />,
      label: "Contracts",
      onClick: () => navigate("/dashboard/contracts"),
    },
    {
      key: "reports",
      icon: <BarChartOutlined />,
      label: "Reports",
      onClick: () => navigate("/dashboard/reports"),
    },
  ];

  /* =========================
     FOOTER MENU
  ========================= */
  const footerMenuItems = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/dashboard/settings"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log Out",
      onClick: () => navigate("/"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* =========================
         SIDEBAR
      ========================= */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        style={{
          background: "#fff",
          position: "relative",
        }}
      >
        {/* =========================
           LOGO
        ========================= */}
        <div
          style={{
            height: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            paddingLeft: collapsed ? 0 : 24,
            transition: "all .3s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#0b50da",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <ApartmentOutlined style={{ fontSize: 20 }} />
            </div>

            {!collapsed && (
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>EstateAdmin</div>
                <div style={{ fontSize: 12, color: "#606e8a" }}>
                  Management Portal
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================
           MAIN MENU
        ========================= */}
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{
            borderRight: 0,
          }}
        />

        {/* =========================
           PUSH FOOTER DOWN
        ========================= */}
        <div style={{ flex: 1 }} />

        {/* =========================
           FOOTER MENU (STICKY BOTTOM)
        ========================= */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            borderTop: "1px solid #f0f0f0",
            background: "#fff",
            paddingBottom: collapsed ? 8 : 16,
          }}
        >
          <Menu
            mode="inline"
            theme="light"
            items={footerMenuItems}
            selectable={false}
            style={{ borderRight: 0 }}
          />
        </div>
      </Sider>

      {/* =========================
         CONTENT
      ========================= */}
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ width: 64, height: 64, fontSize: 16 }}
          />
        </Header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Sidebar;

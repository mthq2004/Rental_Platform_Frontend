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
  SearchOutlined,
  BellOutlined,
  QuestionOutlined,
} from "@ant-design/icons";
import {
  Button,
  Layout,
  Menu,
  theme,
  Input,
  Dropdown,
  Avatar,
  Badge,
  Breadcrumb,
} from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import logoImg from "../../assets/logo.png";
import { useAppDispatch } from "../../stores/hooks";
import { logout } from "../../stores/slices/auth.slice";
const { Header, Sider, Content } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const logoutUser = () => {
    dispatch(logout())
  }
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
     BREADCRUMB
  ========================= */
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [{ title: "Ứng dụng" }];

    if (path.includes("/properties")) {
      items.push({ title: "Quản lý Bất động sản" });
    } else if (path.includes("/owners")) {
      items.push({ title: "Quản lý Chủ sở hữu" });
    } else if (path.includes("/tenants")) {
      items.push({ title: "Quản lý Người thuê" });
    } else if (path.includes("/contracts")) {
      items.push({ title: "Quản lý Hợp đồng" });
    } else if (path.includes("/settings")) {
      items.push({ title: "Cài đặt" });
    } else {
      items.push({ title: "Bảng điều khiển" });
    }

    return items;
  };

  /* =========================
     USER DROPDOWN MENU
  ========================= */
  const userMenuItems = [
    {
      key: "profile",
      label: "Hồ sơ cá nhân",
      onClick: () => navigate("/dashboard/profile"),
    },
    {
      key: "settings",
      label: "Cài đặt",
      onClick: () => navigate("/dashboard/settings"),
    },
    {
      type: "divider",
      // children: [],
    },
    {
      key: "logout",
      label: "Đăng xuất",
      onClick: logoutUser,
    },
  ];

  /* =========================
     MAIN MENU
  ========================= */
  const menuItems = [
    {
      key: "dashboard",
      icon: <BarChartOutlined />,
      label: "Thống kê",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "properties",
      icon: <HomeOutlined />,
      label: "Bất động sản",
      onClick: () => navigate("/dashboard/properties"),
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: "Người dùng",
      children: [
        {
          key: "owners",
          label: "Chủ sở hữu",
          onClick: () => navigate("/dashboard/owners"),
        },
        {
          key: "tenants",
          label: "Người thuê",
          onClick: () => navigate("/dashboard/tenants"),
        },
      ],
    },
    {
      key: "contracts",
      icon: <FileTextOutlined />,
      label: "Hợp đồng",
      onClick: () => navigate("/dashboard/contracts"),
    },
  ];

  /* =========================
     FOOTER MENU
  ========================= */
  const footerMenuItems = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Cài đặt",
      onClick: () => navigate("/dashboard/settings"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Đăng xuất",
      onClick: logoutUser,
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
                width: 80,
                height: 80,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <img
                src={logoImg}
                alt="EstateAdmin Logo"
                className="w-full h-full object-contain"
              />
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
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          {/* LEFT SECTION */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ width: 64, height: 64, fontSize: 16 }}
            />

            <Breadcrumb items={getBreadcrumbItems()} />
          </div>

          {/* RIGHT SECTION */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* SEARCH */}
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              style={{ width: 250, borderRadius: 6 }}
              size="large"
            />

            {/* INFO BUTTON */}
            <Button
              type="text"
              shape="circle"
              icon={<QuestionOutlined style={{ fontSize: 18 }} />}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #d9d9d9",
              }}
            />

            {/* NOTIFICATIONS */}
            <Badge count={3} color="#ff4d4f">
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #d9d9d9",
                }}
              />
            </Badge>

            {/* DIVIDER */}
            <div style={{ width: 1, height: 32, backgroundColor: "gray" }} />

            {/* USER PROFILE */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <Avatar size={40} src={logoImg} />
                <div style={{ lineHeight: 1.4 }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "#262626" }}
                  >
                    Super Admin
                  </div>
                  <div style={{ fontSize: 12, color: "#8c8c8c" }}>
                    Quản trị viên
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
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

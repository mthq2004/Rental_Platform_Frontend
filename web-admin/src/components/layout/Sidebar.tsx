import React, { useState, useEffect, useCallback } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  BellOutlined,
  QuestionOutlined,
  AlertOutlined,
  AuditOutlined,
  PieChartOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  BankOutlined,
  TeamOutlined,
  HomeOutlined,
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
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { logout } from "../../stores/slices/auth.slice";
import {
  getNotification,
  addNotification,
  selectUnreadCount,
  removeNotificationLocally,
} from "../../stores/slices/notification.slice";
import ThemeToggle from "../theme/ThemeToggle";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationDrawer from "./NotificationDrawer";
import notificationSocketService from "../../services/notification.socket";
const { Header, Sider, Content } = Layout;

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { theme: currentTheme } = useTheme();

  const unreadCount = useAppSelector(selectUnreadCount);
  const authUser = useAppSelector((state) => state.auth.user);
  const isAuth = useAppSelector((state) => state.auth.isAuth);

  useEffect(() => {
    if (isAuth) {
      dispatch(getNotification());
    }
  }, [dispatch, isAuth]);

  // Kết nối WebSocket để nhận thông báo real-time
  const handleRealtimeNotification = useCallback(
    (notification: any) => {
      dispatch(addNotification(notification));
    },
    [dispatch],
  );

  const handleRealtimeNotificationRead = useCallback(
    (payload: any) => {
      // Khi admin khác đọc, xóa notification khỏi list (backend đã xóa recipient)
      const notificationId = payload?.notificationId || payload?.notification?.id;
      if (notificationId) {
        dispatch(removeNotificationLocally(notificationId));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isAuth) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    notificationSocketService.connect(token);
    notificationSocketService.on("notification", handleRealtimeNotification);
    notificationSocketService.on("notification:read", handleRealtimeNotificationRead);

    return () => {
      notificationSocketService.off("notification", handleRealtimeNotification);
      notificationSocketService.off("notification:read", handleRealtimeNotificationRead);
      notificationSocketService.disconnect();
    };
  }, [isAuth, handleRealtimeNotification, handleRealtimeNotificationRead]);

  const logoutUser = () => {
    dispatch(logout());
  };
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  const managementTableRoutes = new Set([
    "/dashboard/users",
    "/dashboard/admins",
    "/dashboard/contracts",
    "/dashboard/properties/pending",
    "/dashboard/properties/approved",
    "/dashboard/properties/rejected",
  ]);
  const isManagementTablePage = managementTableRoutes.has(location.pathname);

  /* =========================
     ACTIVE MENU KEY
  ========================= */
  const getSelectedKey = () => {
    const path = location.pathname;
    const queryTab = new URLSearchParams(location.search).get("tab");
    if (path.includes("/users/")) return "users";
    if (path.includes("/users")) return "users";
    if (path.includes("/admins/")) return "admins";
    if (path.includes("/admins")) return "admins";
    if (path.includes("/properties/pending")) return "pending";
    if (path.includes("/properties/approved")) return "approved";
    if (path.includes("/properties/rejected")) return "rejected";
    if (path === "/dashboard" && queryTab === "yeu-cau") return "rental-requests";
    if (path.includes("/statistics")) return "statistics";
    if (path.includes("/complaints")) return "complaints";
    if (path.includes("/news")) return "news";
    if (path === "/dashboard" && queryTab === "ai") return "ai-analytics";
    if (path.includes("/ai-analytics")) return "ai-analytics";
    if (path.includes("/settings")) return "settings";
    if (path.includes("/profile")) return "profile";
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
    const queryTab = new URLSearchParams(location.search).get("tab");
    const items = [{ title: "Ứng dụng" }];

    if (path.includes("/properties/pending")) {
      items.push({ title: "Bất động sản Chờ duyệt" });
    } else if (path.includes("/properties/approved")) {
      items.push({ title: "Bất động sản Đã duyệt" });
    } else if (path.includes("/properties/rejected")) {
      items.push({ title: "Bất động sản Bị từ chối" });
    } else if (path.includes("/users")) {
      items.push({ title: "Quản lý tài khoản người dùng" });
    } else if (path.includes("/admins")) {
      items.push({ title: "Quản lý tài khoản quản trị viên" });
    } else if (path.includes("/profile")) {
      items.push({ title: "Hồ sơ cá nhân" });
    } else if (path.includes("/owners")) {
      items.push({ title: "Quản lý Chủ sở hữu" });
    } else if (path.includes("/tenants")) {
      items.push({ title: "Quản lý Người thuê" });
    } else if (path.includes("/contracts")) {
      items.push({ title: "Quản lý Hợp đồng" });
    } else if (path.includes("/settings")) {
      items.push({ title: "Cài đặt" });
    } else if (path === "/dashboard" && queryTab === "yeu-cau") {
      items.push({ title: "Phân tích yêu cầu thuê" });
    } else if (path.includes("/statistics")) {
      items.push({ title: "Thống kê & Phân tích" });
    } else if (path.includes("/complaints")) {
      items.push({ title: "Xử lý khiếu nại" });
    } else if (path.includes("/news")) {
      items.push({ title: "Quản lý tin tức" });
    } else if (path === "/dashboard" && queryTab === "ai") {
      items.push({ title: "AI Analytics" });
    } else if (path.includes("/ai-analytics")) {
      items.push({ title: "Dự báo & AI Analytics" });
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
      type: "divider" as const,
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
      label: "Tổng quan",
      onClick: () => navigate("/dashboard"),
    },
    /* =========================
     NHÓM QUẢN LÝ CHÍNH (Đưa ra ngoài)
    ========================= */
    {
      key: "properties",
      icon: <HomeOutlined />, // Hoặc HomeOutlined
      label: "Quản lý bất động sản",
      children: [
        {
          key: "pending",
          label: "Chờ duyệt",
          onClick: () => navigate("/dashboard/properties/pending"),
        },
        {
          key: "approved",
          label: "Đã duyệt",
          onClick: () => navigate("/dashboard/properties/approved"),
        },
        {
          key: "rejected",
          label: "Từ chối",
          onClick: () => navigate("/dashboard/properties/rejected"),
        },
      ],
    },
    {
      key: "accounts",
      icon: <TeamOutlined />, // Icon nhóm người dùng
      label: "Quản lý tài khoản",
      children: [
        {
          key: "users",
          label: "Người dùng hệ thống",
          onClick: () => navigate("/dashboard/users"),
        },
        {
          key: "admins",
          label: "Quản trị viên",
          onClick: () => navigate("/dashboard/admins"),
        },
      ],
    },

    // --- NHÓM VẬN HÀNH & KIỂM SOÁT ---
    {
      key: "operations",
      icon: <AuditOutlined />, // Icon kiểm tra/giám sát
      label: "Vận hành & Hỗ trợ",
      children: [
        {
          key: "complaints",
          icon: <AlertOutlined />, // Icon cảnh báo/khiếu nại
          label: "Xử lý khiếu nại",
          onClick: () => navigate("/dashboard/complaints"),
        },
        {
          key: "news",
          icon: <BankOutlined />,
          label: "Quản lý tin tức",
          onClick: () => navigate("/dashboard/news"),
        },
        // Có thể thêm "Báo cáo vi phạm", "Hỗ trợ khách hàng" vào đây
      ],
    },
    // --- NHÓM PHÂN TÍCH DỮ LIỆU ---
    {
      key: "analytics-group",
      icon: <PieChartOutlined />,
      label: "Báo cáo & Phân tích",
      children: [
        {
          key: "statistics",
          icon: <LineChartOutlined />,
          label: "Thống kê số liệu",
          onClick: () => navigate("/dashboard/statistics"),
        },
        {
          key: "ai-analytics",
          icon: <ExperimentOutlined />, // Icon mang tính thử nghiệm/AI cao cấp
          label: "Dự báo & AI",
          onClick: () => navigate("/dashboard/ai-analytics"),
        },
      ],
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
        width={250}
        style={{
          background: "var(--surface)",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          zIndex: 100,
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
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
                alt="Logo quản trị"
                className="w-full h-full object-contain"
              />
            </div>

            {!collapsed && (
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>EstateAdmin</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Cổng quản trị hệ thống
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <Menu
            mode="inline"
            theme={currentTheme === "dark" ? "dark" : "light"}
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            style={{
              borderRight: 0,
              background: "transparent",
            }}
          />
        </div>

        {/* =========================
           FOOTER MENU (STICKY BOTTOM)
        ========================= */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            paddingBottom: collapsed ? 8 : 16,
          }}
        >
          <Menu
            mode="inline"
            theme={currentTheme === "dark" ? "dark" : "light"}
            items={footerMenuItems}
            selectable={false}
            style={{ borderRight: 0, background: "transparent" }}
          />
        </div>
      </Sider>

      {/* =========================
         CONTENT
      ========================= */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "all 0.3s",
          minHeight: "100vh",
        }}
      >

        <Header
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: collapsed ? 80 : 250,
            height: 64,
            padding: "0 24px",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 18px rgba(15, 41, 89, 0.08)",
            borderBottom: "1px solid var(--border)",
            zIndex: 99,
            transition: "all 0.3s",
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
            <ThemeToggle />

            {/* SEARCH */}
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              style={{ width: 250, borderRadius: 10 }}
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
            <Badge
              count={unreadCount}
              overflowCount={99} // Nếu > 99 sẽ hiển thị 99+
              offset={[-2, 4]}   // Căn chỉnh vị trí số badge cho đẹp hơn với nút hình tròn
            >
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 20 }} />} // Tăng nhẹ size icon cho cân đối
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--border)", // Dùng biến CSS cho đồng bộ theme
                  backgroundColor: "transparent",
                }}
                onClick={() => setNotificationDrawerOpen(true)}
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
                <Avatar size={40} src={authUser?.avatarUrl || logoImg}>
                  {authUser?.fullName?.slice(0, 1)}
                </Avatar>
                <div style={{ lineHeight: 1.4 }}>
                  <div
                    style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}
                  >
                    {authUser?.fullName || "Quản trị viên hệ thống"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {authUser?.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            marginTop: 64,
            padding: 24,
            height: "calc(100vh - 64px)",
            overflow: isManagementTablePage ? "hidden" : "auto",
            background: "var(--bg)",
            borderRadius: borderRadiusLG,
            minHeight: 0,
          }}
        >
          <Outlet />
        </Content>

      </Layout>

      <NotificationDrawer
        open={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />
    </Layout>
  );
};

export default Sidebar;

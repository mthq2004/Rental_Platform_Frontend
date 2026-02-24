"use client";
import React, { useState } from "react";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FileTextOutlined,
    DashboardOutlined,
    MessageOutlined,
    SettingOutlined,
    LogoutOutlined,
    HomeOutlined,
    BellOutlined,
    UserOutlined,
    PlusCircleOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Avatar, Badge, Tooltip, Dropdown, Drawer } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/stores/slices/auth.slice";
import { AppDispatch, RootState } from "@/stores/store";

const { Sider, Content } = Layout;

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Determine active key based on pathname
    const getActiveKey = () => {
        if (pathname.includes("/dashboard/posts")) return "posts";
        if (pathname.includes("/dashboard/chat")) return "chat";
        if (pathname.includes("/dashboard/create") || pathname.includes("/post/create")) return "create";
        if (pathname.includes("/dashboard/settings")) return "settings";
        return "overview";
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push("/");
    };

    const menuItems = [
        {
            key: "overview",
            icon: <DashboardOutlined />,
            label: "Bảng điều khiển",
            onClick: () => {
                router.push("/dashboard");
                setMobileDrawerOpen(false);
            },
        },
        {
            key: "create",
            icon: <PlusCircleOutlined />,
            label: "Đăng tin mới",
            onClick: () => {
                router.push("/post/create");
                setMobileDrawerOpen(false);
            },
        },
        {
            key: "posts",
            icon: <FileTextOutlined />,
            label: "Quản lý bài viết",
            onClick: () => {
                router.push("/dashboard/posts");
                setMobileDrawerOpen(false);
            },
        },
        {
            key: "chat",
            icon: <MessageOutlined />,
            label: "Tin nhắn",
            onClick: () => {
                router.push("/dashboard/chat");
                setMobileDrawerOpen(false);
            },
        },
        {
            type: "divider" as const,
        },
        {
            key: "settings",
            icon: <SettingOutlined />,
            label: "Cài đặt",
            onClick: () => {
                router.push("/dashboard/settings");
                setMobileDrawerOpen(false);
            },
        },
    ];

    const userMenuItems = [
        {
            key: "profile",
            icon: <UserOutlined />,
            label: "Thông tin cá nhân",
            onClick: () => router.push("/profile"),
        },
        {
            type: "divider" as const,
        },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Đăng xuất",
            danger: true,
            onClick: handleLogout,
        },
    ];

    // Sidebar Content Component
    const SidebarContent = ({ isDrawer = false }: { isDrawer?: boolean }) => (
        <>
            {/* Logo Section */}
            <div className="h-16 flex items-center justify-center border-b border-white/10">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push("/")}
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <HomeOutlined className="text-white text-lg" />
                    </div>
                    {(!collapsed || isDrawer) && (
                        <span className="text-white font-bold text-lg tracking-wide">
                            Real Estate
                        </span>
                    )}
                </div>
            </div>

            {/* Menu */}
            <div className="py-4 flex-1">
                <Menu
                    mode="inline"
                    selectedKeys={[getActiveKey()]}
                    items={menuItems}
                    style={{
                        background: "transparent",
                        borderRight: 0,
                    }}
                    className="dashboard-sidebar-menu"
                />
            </div>

            {/* User Section - Bottom */}
            <div className="p-4 border-t border-white/10">
                <Dropdown
                    menu={{ items: userMenuItems }}
                    placement="topRight"
                    trigger={["click"]}
                >
                    <div className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 transition-colors">
                        <Avatar
                            size={40}
                            src={currentUser?.avatarUrl}
                            icon={<UserOutlined />}
                            className="bg-blue-500"
                        />
                        {(!collapsed || isDrawer) && (
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">
                                    {currentUser?.fullName || "Người dùng"}
                                </p>
                                <p className="text-white/50 text-xs truncate">
                                    {currentUser?.email || ""}
                                </p>
                            </div>
                        )}
                    </div>
                </Dropdown>
            </div>
        </>
    );

    return (
        <Layout className="min-h-screen">
            {/* Desktop Sidebar */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                width={260}
                collapsedWidth={80}
                className="fixed left-0 top-0 h-screen z-50 hidden lg:flex flex-col"
                style={{
                    background: "linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%)",
                }}
            >
                <SidebarContent />
            </Sider>

            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                onClose={() => setMobileDrawerOpen(false)}
                open={mobileDrawerOpen}
                width={280}
                closable={false}
                styles={{
                    body: {
                        padding: 0,
                        background: "linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%)",
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
                className="lg:hidden"
            >
                <SidebarContent isDrawer />
            </Drawer>

            {/* Main Content Area */}
            <Layout
                className="lg:ml-[260px] transition-all duration-200"
                style={{
                    marginLeft: collapsed ? 80 : undefined,
                    minHeight: "100vh",
                }}
            >
                {/* Top Bar */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
                    {/* Left Side */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <Button
                            type="text"
                            icon={<MenuUnfoldOutlined />}
                            onClick={() => setMobileDrawerOpen(true)}
                            className="lg:hidden text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            style={{ fontSize: "18px" }}
                        />
                        {/* Desktop Toggle Button */}
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden lg:flex text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            style={{ fontSize: "18px" }}
                        />
                        <div className="hidden sm:block h-6 w-px bg-gray-200" />
                        <span className="hidden sm:block text-gray-400 text-sm">
                            {new Date().toLocaleDateString("vi-VN", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <Tooltip title="Thông báo">
                            <Badge count={3} size="small">
                                <Button
                                    type="text"
                                    icon={<BellOutlined />}
                                    className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                />
                            </Badge>
                        </Tooltip>
                        <Tooltip title="Về trang chủ">
                            <Button
                                type="text"
                                icon={<HomeOutlined />}
                                onClick={() => router.push("/")}
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                            />
                        </Tooltip>
                    </div>
                </div>

                {/* Page Content */}
                <Content className="bg-gray-50 min-h-[calc(100vh-64px)]">
                    {children}
                </Content>
            </Layout>

            {/* Custom Styles for Sidebar Menu */}
            <style jsx global>{`
                .dashboard-sidebar-menu .ant-menu-item {
                    margin: 4px 12px !important;
                    padding: 0 16px !important;
                    height: 48px !important;
                    line-height: 48px !important;
                    border-radius: 10px !important;
                    color: rgba(255, 255, 255, 0.7) !important;
                }
                .dashboard-sidebar-menu .ant-menu-item:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                }
                .dashboard-sidebar-menu .ant-menu-item-selected {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
                    color: white !important;
                }
                .dashboard-sidebar-menu .ant-menu-item .ant-menu-item-icon {
                    font-size: 18px !important;
                }
                .dashboard-sidebar-menu .ant-menu-item-divider {
                    margin: 12px !important;
                    border-color: rgba(255, 255, 255, 0.1) !important;
                }
                @media (max-width: 1023px) {
                    .lg\\:ml-\\[260px\\] {
                        margin-left: 0 !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default DashboardLayout;

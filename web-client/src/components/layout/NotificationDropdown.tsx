"use client";
import React, { useState } from "react";
import { Badge, Switch, Tabs, Popconfirm } from "antd";
import {
    BellOutlined,
    CheckOutlined,
    SoundOutlined,
    HomeOutlined,
    DeleteOutlined,
    FileTextOutlined,
    DollarOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { markAsRead, getNotification, deleteReadNotifications } from "@/stores/slices/notification.slice";
import type { Notification } from "@/stores/slices/notification.slice";
import { useRouter } from "next/navigation";

const TYPE_CONFIG: Record<string, { color: string; bg: string; borderColor: string; label: string; icon: React.ReactNode }> = {
    PROPERTY_UPDATE: { color: "#1890ff", bg: "#e6f7ff", borderColor: "#91d5ff", label: "Bất động sản", icon: <HomeOutlined style={{ fontSize: 18 }} /> },
    ADMIN_ACTION:    { color: "#fa8c16", bg: "#fff7e6", borderColor: "#ffd591", label: "Admin", icon: <SettingOutlined style={{ fontSize: 18 }} /> },
    RENTAL_REQUEST:  { color: "#52c41a", bg: "#f6ffed", borderColor: "#b7eb8f", label: "Yêu cầu thuê", icon: <FileTextOutlined style={{ fontSize: 18 }} /> },
    CONTRACT_CREATED:{ color: "#722ed1", bg: "#f9f0ff", borderColor: "#d3adf7", label: "Hợp đồng", icon: <FileTextOutlined style={{ fontSize: 18 }} /> },
    PAYMENT:         { color: "#faad14", bg: "#fffbe6", borderColor: "#ffe58f", label: "Thanh toán", icon: <DollarOutlined style={{ fontSize: 18 }} /> },
    SYSTEM:          { color: "#8c8c8c", bg: "#fafafa", borderColor: "#d9d9d9", label: "Hệ thống", icon: <SoundOutlined style={{ fontSize: 18 }} /> },
};

const NotificationDropdown = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { notifications } = useAppSelector((state) => state.notification);
    const [isOpen, setIsOpen] = useState(false);
    const [showUnread, setShowUnread] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    const filteredNotifications = showUnread
        ? notifications.filter((n) => !n.isRead)
        : (() => {
              if (activeTab === "all") return notifications;
              if (activeTab === "posts")
                  return notifications.filter(
                      (n) =>
                          n.type === "PROPERTY_UPDATE" ||
                          n.type === "ADMIN_ACTION"
                  );
              return notifications;
          })();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const tabItems = [
        { key: "all", label: "Tất cả" },
        { key: "posts", label: "Tin đăng" },
    ];

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification.id));
        }
        const link = getNotificationLink(notification);
        if (link) {
            setIsOpen(false);
            router.push(link);
        }
    };

    const getNotificationLink = (n: Notification): string | null => {
        const event = n.metadata?.event;
        const propertyId = n.metadata?.propertyId;
        if (propertyId) {
            if (event === "ESTATE_APPROVED" || event === "ESTATE_REJECTED") {
                return `/dashboard/posts`;
            }
            return `/post/create?id=${propertyId}&mode=edit`;
        }
        return null;
    };

    const handleMarkAllRead = () => {
        notifications
            .filter((n) => !n.isRead)
            .forEach((n) => dispatch(markAsRead(n.id)));
    };

    const handleDeleteRead = () => {
        dispatch(deleteReadNotifications());
    };

    const readCount = notifications.filter((n) => n.isRead).length;

    const handleOpen = () => {
        setIsOpen((prev) => {
            if (!prev) dispatch(getNotification());
            return !prev;
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getTypeConfig = (type?: string) =>
        TYPE_CONFIG[type || "SYSTEM"] || TYPE_CONFIG.SYSTEM;

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-orange-500 hover:border-orange-500 transition-colors bg-white"
            >
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                    <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden px-2">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        size="small"
                                        checked={showUnread}
                                        onChange={setShowUnread}
                                    />
                                    <span className="text-sm text-gray-600">Chưa đọc</span>
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-gray-500 hover:text-gray-700 transition-colors"
                                        title="Đánh dấu tất cả đã đọc"
                                    >
                                        <CheckOutlined style={{ fontSize: 16 }} />
                                        <CheckOutlined style={{ fontSize: 16, marginLeft: -8 }} />
                                    </button>
                                )}
                                {readCount > 0 && (
                                    <Popconfirm
                                        title="Xóa thông báo đã đọc?"
                                        description={`Sẽ xóa ${readCount} thông báo đã đọc`}
                                        onConfirm={handleDeleteRead}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                    >
                                        <button
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                            title="Xóa thông báo đã đọc"
                                        >
                                            <DeleteOutlined style={{ fontSize: 16 }} />
                                        </button>
                                    </Popconfirm>
                                )}
                            </div>
                        </div>
                        <div className="border-b border-gray-100">
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                items={tabItems}
                                className="notification-tabs px-4"
                                tabBarStyle={{ marginBottom: 0 }}
                            />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    Không có thông báo nào
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => {
                                    const cfg = getTypeConfig(notification.type);
                                    return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex gap-3 px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${!notification.isRead ? "bg-blue-50/40" : ""}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                                style={{ background: cfg.bg, border: `1px solid ${cfg.borderColor}`, color: cfg.color }}
                                            >
                                                {cfg.icon}
                                            </div>
                                            {!notification.isRead && (
                                                <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-semibold text-gray-900">
                                                    {notification.title}
                                                </h4>
                                                <span
                                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.borderColor}` }}
                                                >
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                                {notification.body}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


export default NotificationDropdown;

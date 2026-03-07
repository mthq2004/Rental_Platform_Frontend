"use client";
import React, { useState } from "react";
import { Badge, Switch, Tabs } from "antd";
import {
    BellOutlined,
    CheckOutlined,
    SoundOutlined,
    HomeOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { markAsRead, getNotification } from "@/stores/slices/notification.slice";
import type { Notification } from "@/stores/slices/notification.slice";

const NotificationDropdown = () => {
    const dispatch = useAppDispatch();
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
    };

    const handleMarkAllRead = () => {
        notifications
            .filter((n) => !n.isRead)
            .forEach((n) => dispatch(markAsRead(n.id)));
    };

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

    const getNotificationIcon = (n: Notification) => {
        if (n.type === "PROPERTY_UPDATE" || n.type === "ADMIN_ACTION")
            return <HomeOutlined style={{ fontSize: 18 }} className="text-blue-500" />;
        return <SoundOutlined style={{ fontSize: 18 }} className="text-gray-500" />;
    };

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
                    <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
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
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex gap-3 px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${!notification.isRead ? "bg-blue-50/40" : ""}`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                {getNotificationIcon(notification)}
                                            </div>
                                            {!notification.isRead && (
                                                <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                                {notification.body}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


export default NotificationDropdown;

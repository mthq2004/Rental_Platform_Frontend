"use client";
import React, { useState } from "react";
import { Badge, Switch, Tabs } from "antd";
import {
    BellOutlined,
    CheckOutlined,
    SoundOutlined,
} from "@ant-design/icons";

interface Notification {
    id: string;
    title: string;
    description: string;
    date: string;
    isRead: boolean;
    icon: "megaphone" | "announcement";
}

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showUnread, setShowUnread] = useState(false);
    const [activeTab, setActiveTab] = useState("all");

    // Mock notifications data
    const notifications: Notification[] = [
        {
            id: "1",
            title: "👏 Bạn muốn đăng tin BĐS tại Sài Gòn?",
            description:
                "Batdongsan.com.vn có gói hiển thị 15 ngày chỉ từ 1.000đ/ngày rất đáng để thử đó 😉 Tìm hiểu ngay!",
            date: "19/01/2026",
            isRead: false,
            icon: "megaphone",
        },
        {
            id: "2",
            title: "Giúp bạn tìm nhà thuê dễ hơn",
            description: "Dành 3 phút chia sẻ trải nghiệm của bạn nhé!",
            date: "15/01/2026",
            isRead: false,
            icon: "megaphone",
        },
        {
            id: "3",
            title: "Ưu đãi đặc biệt tháng 1",
            description: "Giảm 20% phí đăng tin cho khách hàng mới!",
            date: "10/01/2026",
            isRead: true,
            icon: "announcement",
        },
    ];

    const filteredNotifications = showUnread
        ? notifications.filter((n) => !n.isRead)
        : notifications;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const tabItems = [
        { key: "all", label: "Tất cả" },
        { key: "posts", label: "Tin đăng" },
        { key: "finance", label: "Tài chính" },
        { key: "promo", label: "Khuyến mãi" },
        {
            key: "more",
            label: (
                <span className="flex items-center gap-1">
                    Thêm
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        2
                    </span>
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </span>
            ),
        },
    ];

    const handleNotificationClick = (id: string) => {
        console.log("Notification clicked:", id);
    };

    const handleMarkAllRead = () => {
        console.log("Mark all as read");
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                    <BellOutlined style={{ fontSize: 20 }} />
                </Badge>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-[480px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                        {/* Header */}
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
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                    title="Đánh dấu tất cả đã đọc"
                                >
                                    <CheckOutlined style={{ fontSize: 16 }} />
                                    <CheckOutlined style={{ fontSize: 16, marginLeft: -8 }} />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-100">
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                items={tabItems}
                                className="notification-tabs px-4"
                                tabBarStyle={{ marginBottom: 0 }}
                            />
                        </div>

                        {/* Notification List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {filteredNotifications.length === 0 ? (
                                <div className="py-12 text-center text-gray-500">
                                    Không có thông báo nào
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification.id)}
                                        className="flex gap-3 px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                                    >
                                        {/* Icon */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                <SoundOutlined
                                                    style={{ fontSize: 18 }}
                                                    className="text-gray-500"
                                                />
                                            </div>
                                            {!notification.isRead && (
                                                <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                                {notification.description}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {notification.date}
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

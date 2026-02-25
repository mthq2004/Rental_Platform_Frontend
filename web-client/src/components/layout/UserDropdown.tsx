"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    AppstoreOutlined,
    ContactsOutlined,
    UserOutlined,
    LockOutlined,
    LogoutOutlined,
    DownOutlined,
} from "@ant-design/icons";

interface UserDropdownProps {
    userName: string;
    avatarUrl?: string;
    onLogout: () => void;
    isLoggingOut?: boolean;
    isDashboard?: boolean;
}

interface MenuItem {
    key: string;
    icon: React.ReactNode;
    label: string;
    badge?: string;
    badgeColor?: string;
    onClick?: () => void;
}

const UserDropdown = ({ userName, avatarUrl, onLogout, isLoggingOut = false, isDashboard = false }: UserDropdownProps) => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle smooth open/close with animation
    const openDropdown = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
        requestAnimationFrame(() => setIsAnimating(true));
    };

    const closeDropdown = () => {
        setIsAnimating(false);
        timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
    };

    const toggleDropdown = () => {
        if (isDashboard) return; // Không cho mở dropdown trong dashboard

        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isOpen]);

    const handleMenuClick = (key: string) => {
        console.log("Menu item clicked:", key);
        closeDropdown();

        // Route handling - chỉ routing hoặc console.log
        switch (key) {
            case "overview":
                router.push("/dashboard");
                break;
            case "posts":
                router.push("/dashboard/posts");
                break;
            case "customers":
                router.push("/dashboard/customers");
                break;
            case "profile":
                router.push("/dashboard/profile");
                break;
            case "change-password":
                router.push("/dashboard/change-password");
                break;
            case "logout":
                onLogout();
                break;
            default:
                console.log("Unknown menu item:", key);
        }
    };

    const menuItems: MenuItem[] = isDashboard
        ? []
        : [
            {
                key: "overview",
                icon: <AppstoreOutlined />,
                label: "Tổng quan",
                badge: "Mới",
                badgeColor: "bg-red-500",
            },
            {
                key: "customers",
                icon: <ContactsOutlined />,
                label: "Quản lý khách hàng",
            },
            {
                key: "profile",
                icon: <UserOutlined />,
                label: "Thay đổi thông tin cá nhân",
            },
            {
                key: "change-password",
                icon: <LockOutlined />,
                label: "Thay đổi mật khẩu",
            },
        ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Button */}
            <button
                onClick={toggleDropdown}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl
                    transition-all duration-300 ease-out
                    ${isDashboard ? "cursor-default opacity-90" : "cursor-pointer hover:bg-gray-50"}
                    group
                `}
            >
                {/* Avatar with ring effect */}
                <div className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={userName}
                            className={`
                                w-9 h-9 rounded-full object-cover
                                ring-2 ring-transparent
                                transition-all duration-300
                                group-hover:ring-red-200 group-hover:scale-105
                                ${isOpen ? 'ring-red-300 scale-105' : ''}
                            `}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className={`
                            w-9 h-9 rounded-full bg-linear-to-br from-red-500 to-red-600
                            flex items-center justify-center text-white font-semibold text-sm
                            ring-2 ring-transparent
                            transition-all duration-300 shadow-md
                            group-hover:ring-red-200 group-hover:scale-105 group-hover:shadow-lg
                            ${isOpen ? 'ring-red-300 scale-105' : ''}
                        `}>
                            {userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )}
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <span className="text-sm font-medium text-gray-700 min-w-0 block md:hidden lg:block truncate sm:max-w-20 md:max-w-none">
                    {userName}
                </span>
                {!isDashboard && (
                    <DownOutlined className={`
                        text-xs text-gray-400 block md:hidden lg:block
                        transition-transform duration-300 ease-out
                        ${isOpen ? 'rotate-180 text-red-500' : ''}
                    `} />
                )}
            </button>

            {/* Dropdown Panel with animations */}
            {isOpen && (
                <>
                    {/* Backdrop with fade */}
                    <div
                        className={`
                            fixed inset-0 z-40 bg-black/5
                            transition-opacity duration-200
                            ${isAnimating ? 'opacity-100' : 'opacity-0'}
                        `}
                        onClick={closeDropdown}
                    />

                    {/* Panel with scale + fade + slide */}
                    <div className={`
                        absolute right-0 top-full mt-3
                        w-screen sm:w-80 md:w-96 lg:w-80 max-w-[calc(100vw-16px)]
                        bg-white rounded-2xl shadow-2xl border border-gray-100/50 z-50 
                        overflow-hidden backdrop-blur-xl
                        transition-all duration-200 ease-out origin-top-right
                        ${isAnimating 
                            ? 'opacity-100 scale-100 translate-y-0' 
                            : 'opacity-0 scale-95 -translate-y-2'
                        }
                    `}>
                        
                        {/* Menu Items with stagger animation */}
                        <div className="py-2">
                            {menuItems.map((item, index) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleMenuClick(item.key)}
                                    onMouseEnter={() => setHoveredItem(item.key)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3 text-left
                                        transition-colors duration-200 ease-out
                                        active:scale-[0.99] active:bg-gray-100
                                        ${isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
                                    `}
                                    style={{
                                        transitionDelay: isAnimating ? `${index * 30}ms` : '0ms'
                                    }}
                                >
                                    <span className="text-lg text-gray-500 transition-colors duration-200">
                                        {item.icon}
                                    </span>
                                    <span className="text-sm flex-1 text-gray-700 transition-colors duration-200">
                                        {item.label}
                                    </span>
                                    {item.badge && (
                                        <span
                                            className={`
                                                text-xs px-2 py-0.5 rounded-full font-medium
                                                ${item.badgeColor?.startsWith("bg-")
                                                    ? `${item.badgeColor} text-white shadow-sm`
                                                    : item.badgeColor
                                                }
                                            `}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Divider with fade effect */}
                        <div className="mx-4 border-t border-gray-100" />

                        {/* Logout with special styling */}
                        <div className="py-2">
                            <button
                                onClick={() => handleMenuClick("logout")}
                                disabled={isLoggingOut}
                                onMouseEnter={() => setHoveredItem("logout")}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={`
                                    w-full flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3 text-left
                                    transition-colors duration-200 ease-out
                                    active:scale-[0.99] active:bg-red-50
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}
                                `}
                                style={{
                                    transitionDelay: isAnimating ? `${menuItems.length * 30 + 50}ms` : '0ms'
                                }}
                            >
                                <span className="text-lg text-gray-500 transition-colors duration-200">
                                    {isLoggingOut ? (
                                        <span className="inline-block">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        </span>
                                    ) : (
                                        <LogoutOutlined />
                                    )}
                                </span>
                                <span className="text-sm text-gray-700 transition-colors duration-200">
                                    {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserDropdown;

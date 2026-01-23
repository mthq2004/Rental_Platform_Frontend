"use client";
import React, { useState } from "react";
import { Button, Space, Dropdown } from "antd";
import { HeartOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

import AuthModal from "@/components/auth/AuthModal";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import UserDropdown from "@/components/layout/UserDropdown";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";

const Header = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get auth state from Redux
  const { isAuth, user } = useAppSelector((state) => state.auth);

  const openAuthModal = (view: "login" | "register") => {
    setAuthView(view);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    console.log("Logout clicked");
    setIsLoggingOut(true);
    
    // Delay để hiển thị animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    dispatch(logout());
    setIsLoggingOut(false);
    router.push("/");
  };

  const handlePostClick = () => {
    console.log("Đăng tin clicked");
    if (isAuth) {
      router.push("/post/create");
    } else {
      openAuthModal("login");
    }
  };

  const navLinks = [
    { key: "rent", label: "Nhà đất cho thuê" },
    { key: "project", label: "Dự án" },
    { key: "news", label: "Tin tức" },
    { key: "wiki", label: "Wiki BDS" },
    { key: "analysis", label: "Phân tích đánh giá" },
    { key: "directory", label: "Danh bạ" },
  ];

  const handleNavClick = (key: string) => {
    console.log("Nav clicked:", key);
    // Routing logic here
    switch (key) {
      case "rent":
        router.push("/rent");
        break;
      case "project":
        router.push("/projects");
        break;
      case "news":
        router.push("/news");
        break;
      case "wiki":
        router.push("/wiki");
        break;
      case "analysis":
        router.push("/analysis");
        break;
      case "directory":
        router.push("/directory");
        break;
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-6">
        <div className="flex h-[56px] items-center justify-between">
          {/* ===== LEFT: LOGO ===== */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => router.push("/")}
          >
            <img src="/logo.png" alt="Logo" className="h-10" />
            <div className="leading-tight hidden sm:block">
              <p className="text-sm font-bold text-red-600">
                Real Estate
                <span className="text-[10px] text-gray-600 align-top">.com.vn</span>
              </p>
              <span className="text-[9px] font-medium text-gray-400 tracking-tight">
                by PropertyGuru
              </span>
            </div>
          </div>

          {/* ===== CENTER: NAV ===== */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {navLinks.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:text-red-600 font-medium transition-colors whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* ===== RIGHT: ACTIONS ===== */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* App download */}
            <Button
              type="text"
              className="hidden lg:block text-gray-600 hover:text-red-600 text-sm font-medium"
              onClick={() => console.log("Tải ứng dụng clicked")}
            >
              Tải ứng dụng
            </Button>

            {/* Favorite */}
            <Button
              type="text"
              icon={<HeartOutlined style={{ fontSize: 18 }} />}
              className="text-gray-600 hover:text-red-600"
              onClick={() => {
                console.log("Favorites clicked");
                router.push("/favorites");
              }}
            />

            {isAuth ? (
              <>
                {/* Notification - Only show when logged in */}
                <NotificationDropdown />

                {/* User Dropdown */}
                <UserDropdown
                  userName={user?.fullName || 'User'}
                  avatarUrl={user?.avatarUrl}
                  onLogout={handleLogout}
                  isLoggingOut={isLoggingOut}
                />
              </>
            ) : (
              <>
                {/* Auth buttons - Show when logged out */}
                <div className="relative">
                  <Button
                    type="text"
                    className="text-gray-700 hover:text-red-600 font-medium px-2 text-sm"
                    onClick={() => openAuthModal("login")}
                  >
                    Đăng nhập
                  </Button>
                  <span className="text-gray-300">|</span>
                  <Button
                    type="text"
                    className="text-gray-700 hover:text-red-600 font-medium px-2 text-sm"
                    onClick={() => openAuthModal("register")}
                  >
                    Đăng ký
                  </Button>
                </div>
              </>
            )}

            {/* Post button */}
            <Button
              size="middle"
              className="bg-red-600 text-white border-none hover:bg-red-700 font-semibold px-4 lg:px-6 rounded-lg shadow-sm text-sm ml-2"
              onClick={handlePostClick}
            >
              Đăng tin
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal - No animation */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authView}
      />
    </header>
  );
};

export default Header;

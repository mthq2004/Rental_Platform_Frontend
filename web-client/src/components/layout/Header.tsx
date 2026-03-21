"use client";
import React, { useState, useEffect } from "react";
import { Button, Space, Dropdown, Tooltip, Modal } from "antd";
import { HeartOutlined, MessageOutlined, AppstoreOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";

import AuthModal from "@/components/auth/AuthModal";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import UserDropdown from "@/components/layout/UserDropdown";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";


const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;
  const dispatch = useAppDispatch();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      if (user?.kycStatus === "verified") {
        router.push("/post/create");
      } else {
        Modal.confirm({
          title: "Yêu cầu xác thực tài khoản",
          content: "Bạn cần xác thực tài khoản (KYC) để có thể đăng tin. Bạn có muốn thực hiện xác thực ngay bây giờ không?",
          okText: "Xác thực ngay",
          cancelText: "Để sau",
          onOk: () => {
            router.push("/kyc");
          },
          centered: true,
        });
      }
    } else {
      openAuthModal("login");
    }
  };

  const navLinks = [
    { key: "rent", label: "Nhà đất cho thuê" },
    { key: "news", label: "Tin tức" },
    { key: "analysis", label: "Phân tích đánh giá" },
  ];

  const handleNavClick = (key: string) => {
    console.log("Nav clicked:", key);
    // Routing logic here
    switch (key) {
      case "rent":
        router.push("/rent");
        break;

        break;
      case "news":
        router.push("/news");
        break;

      case "analysis":
        router.push("/analysis");
        break;

    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-360 px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between">
          {/* ===== LEFT: LOGO ===== */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
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

            {mounted && isAuth ? (
              <>
                {!isDashboard && (
                  <>
                    {/* Favorite - Only show when logged in */}
                    <Tooltip title="Tin đã lưu">
                      <button
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-orange-500 hover:border-orange-500 transition-colors bg-white"
                        onClick={() => {
                          console.log("Favorites clicked");
                          router.push("/favorites");
                        }}
                      >
                        <HeartOutlined style={{ fontSize: 18 }} />
                      </button>
                    </Tooltip>

                    {/* Chat - Only show when logged in */}
                    <Tooltip title="Tin nhắn">
                      <button
                        className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-orange-500 hover:border-orange-500 transition-colors bg-white"
                        onClick={() => {
                          console.log("Chat clicked");
                          router.push("/chat");
                        }}
                      >
                        <MessageOutlined style={{ fontSize: 18 }} />
                      </button>
                    </Tooltip>

                    {/* Notification - Only show when logged in */}
                    <NotificationDropdown />

                    {/* Manage Posts Button - Only show when logged in */}
                    <Button
                      size="middle"
                      icon={<AppstoreOutlined />}
                      className="hidden md:flex items-center gap-2 border border-gray-800 text-gray-800 hover:border-gray-600 hover:text-gray-600 font-medium px-4 rounded-full text-sm"
                      onClick={() => router.push("/dashboard/posts")}
                    >
                      Quản lý tin
                    </Button>
                  </>
                )}

                {/* Post button - Before User Avatar */}
                <Button
                  size="middle"
                  className="bg-gray-900 text-white border-none hover:bg-gray-800 font-semibold px-4 lg:px-6 rounded-full shadow-sm text-sm"
                  onClick={handlePostClick}
                >
                  Đăng tin
                </Button>

                {/* User Dropdown - Always show when logged in, passes isDashboard to disable dropdown */}
                <UserDropdown
                  userName={user?.fullName || 'User'}
                  avatarUrl={user?.avatarUrl}
                  onLogout={handleLogout}
                  isLoggingOut={isLoggingOut}
                  isDashboard={isDashboard}
                />
              </>
            ) : mounted ? (
              <>
                {/* Post button - Before Auth buttons */}
                <Button
                  size="middle"
                  className="bg-gray-900 text-white border-none hover:bg-gray-800 font-semibold px-4 lg:px-6 rounded-full shadow-sm text-sm"
                  onClick={handlePostClick}
                >
                  Đăng tin
                </Button>

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
            ) : null}
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

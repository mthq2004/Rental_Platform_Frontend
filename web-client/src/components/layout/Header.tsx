import React from "react";
import { Button, Space, Divider, Dropdown } from "antd";
import { HeartOutlined, DownOutlined } from "@ant-design/icons";

const Header = () => {
  const navLinks = [
    "Nhà đất bán",
    "Cho thuê",
    "Dự án",
    "Tin tức",
    "Wiki BĐS",
    "Phân tích",
    "Danh bạ",
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="flex h-[72px] items-center justify-between">
          {/* ===== LEFT: LOGO ===== */}
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/logo.png" alt="Logo" className="h-15" />
            <div className="leading-tight">
              <p className="text-[15px] font-bold text-gray-900">Group33</p>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-tighter leading-none">
                Property Platform
              </span>
            </div>
          </div>

          {/* ===== CENTER: NAV ===== */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((name) => (
              <Dropdown
                key={name}
                menu={{
                  items: [
                    { key: "1", label: `Tất cả ${name}` },
                    { key: "2", label: `${name} nổi bật` },
                    { key: "3", label: `${name} mới nhất` },
                  ],
                }}
                placement="bottom"
              >
                {/* QUAN TRỌNG: chỉ đúng 1 phần tử con */}
                <span>
                  <button
                    type="button"
                    className="
                      flex items-center gap-1 px-3 py-2
                      text-[14px] font-medium text-gray-700
                      hover:text-red-600
                      transition-colors
                    "
                  >
                    {name}
                    {/* <DownOutlined className="text-[10px] opacity-70" /> */}
                  </button>
                </span>
              </Dropdown>
            ))}
          </nav>

          {/* ===== RIGHT: ACTIONS ===== */}
          <div className="flex items-center">
            <Space size="middle">
              {/* App download */}
              <Button
                type="text"
                className="hidden lg:block text-gray-600 hover:text-red-600 font-medium"
              >
                Tải ứng dụng
              </Button>

              {/* Favorite */}
              <Button
                type="text"
                icon={<HeartOutlined style={{ fontSize: 18 }} />}
                className="text-gray-600 hover:text-red-600"
              />

              {/* Auth */}
              <div className="hidden md:flex items-center">
                <Button
                  type="text"
                  className="text-gray-700 hover:text-red-600 font-medium px-2"
                >
                  Đăng nhập
                </Button>
                <Divider orientation="vertical" className="mx-1 h-4" />
                <Button
                  type="text"
                  className="text-gray-700 hover:text-red-600 font-medium px-2"
                >
                  Đăng ký
                </Button>
              </div>

              {/* Post button */}
              <Button
                size="large"
                className="
                  bg-red-600 text-white border-none
                  hover:bg-red-700
                  font-semibold
                  px-6 rounded-lg
                  shadow-sm
                "
              >
                Đăng tin
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

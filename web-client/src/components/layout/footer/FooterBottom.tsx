import React from "react";
import { Input, Button, Divider } from "antd";
import {
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  SendOutlined,
} from "@ant-design/icons";

const FooterBottom = () => {
  const footerSections = [
    {
      title: "Công ty",
      links: ["Giới thiệu", "Tuyển dụng", "Báo chí", "Đối tác"],
    },
    {
      title: "Hỗ trợ",
      links: [
        "Trung tâm trợ giúp",
        "Chính sách bảo mật",
        "Điều khoản sử dụng",
        "Liên hệ",
      ],
    },
  ];

  return (
    <footer className="w-full bg-white pt-8 pb-8 px-6 text-gray-600 border-t border-gray-200">
      <div className="mx-auto max-w-[1440px]">
        {/* ===== TOP GRID ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* BRAND */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src="/logo.png" alt="Logo" className="h-9" />
              <div className="leading-tight">
                <p className="text-[15px] font-bold text-gray-900">Group33</p>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Property Platform
                </span>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed max-w-xs text-gray-600">
              Nền tảng bất động sản đáng tin cậy, kết nối người mua, người bán
              và người thuê một cách minh bạch, hiệu quả.
            </p>

            <div className="flex gap-3">
              {[GlobalOutlined, MailOutlined, PhoneOutlined].map(
                (Icon, idx) => (
                  <Button
                    key={idx}
                    shape="circle"
                    icon={<Icon />}
                    className="
                      bg-gray-100 border border-gray-200 text-gray-600
                      hover:bg-red-600 hover:text-white hover:border-red-600
                    "
                  />
                )
              )}
            </div>
          </div>

          {/* LINKS */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-900 text-[14px] font-semibold mb-5">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-3 text-[13px]">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-600 hover:text-red-600 transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* NEWSLETTER */}
          <div>
            <h3 className="text-gray-900 text-[14px] font-semibold mb-5">
              Nhận bản tin
            </h3>
            <p className="text-[13px] mb-5 text-gray-600">
              Cập nhật tin tức thị trường và ưu đãi mới nhất qua email.
            </p>

            <div className="flex items-stretch">
              <Input
                placeholder="Nhập email của bạn"
                className="
                  bg-white
                  border border-gray-300
                  text-gray-900
                  rounded-l-lg rounded-r-none
                  placeholder:text-gray-400
                  focus:border-red-600
                  focus:ring-1 focus:ring-red-600
                "
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                className="
                  
                  min-w-[44px]
                  bg-red-600
                  border border-red-600
                  rounded-r-lg rounded-l-none
                  px-5
                  flex items-center justify-center
                  hover:bg-red-700
                "
              />
            </div>
          </div>
        </div>

        <Divider className="border-gray-200 my-8" />

        {/* ===== BOTTOM BAR ===== */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[12px] text-gray-500">
          <p>© {new Date().getFullYear()} Group33. Bảo lưu mọi quyền.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-red-600">
              Bảo mật
            </a>
            <a href="#" className="hover:text-red-600">
              Điều khoản
            </a>
            <a href="#" className="hover:text-red-600">
              Sơ đồ site
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterBottom;

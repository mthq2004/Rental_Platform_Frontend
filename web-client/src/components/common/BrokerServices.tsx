"use client";
import React from "react";
import { CrownOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

interface BrokerServiceItem {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  href: string;
}

const BrokerServices = () => {
  const services: BrokerServiceItem[] = [
    {
      icon: <CrownOutlined className="text-2xl text-orange-500" />,
      title: "Gói Hội Viên",
      badge: "Mới",
      href: "/goi-hoi-vien",
    },
    {
      icon: <TeamOutlined className="text-2xl text-orange-500" />,
      title: "Tài khoản doanh nghiệp",
      href: "/tai-khoan-doanh-nghiep",
    },
    {
      icon: <UserOutlined className="text-2xl text-orange-500" />,
      title: "Chuyên trang môi giới",
      href: "/chuyen-trang-moi-gioi",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Dịch vụ dành cho môi giới
        </h3>
        <a
          href="/dich-vu-moi-gioi"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Xem thêm
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {services.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="
              flex flex-col items-center gap-3 p-4
              bg-gray-50 rounded-xl
              hover:bg-orange-50 hover:shadow-sm transition-all
              cursor-pointer group relative
            "
          >
            {item.badge && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {item.badge}
              </span>
            )}
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              {item.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">
              {item.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default BrokerServices;

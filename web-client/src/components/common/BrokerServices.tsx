"use client";
import React from "react";
import Image from "next/image";

interface BrokerServiceItem {
  image: string;
  title: string;
  badge?: string;
  href: string;
}

const BrokerServices = () => {
  const services: BrokerServiceItem[] = [
    {
      image: "/assets/image/hoi-vien.png",
      title: "Gói Hội Viên",
      badge: "Mới",
      href: "/goi-hoi-vien",
    },
    {
      image: "/assets/image/doanh-nghiep.png",
      title: "Tài khoản doanh nghiệp",
      href: "/tai-khoan-doanh-nghiep",
    },
    {
      image: "/assets/image/moi-gioi.png",
      title: "Chuyên trang môi giới",
      href: "/chuyen-trang-moi-gioi",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          Dịch vụ dành cho môi giới
        </h3>
        <a
          href="/dich-vu-moi-gioi"
          className="text-xs font-medium text-red-600 hover:text-red-700"
        >
          Xem thêm
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {services.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="group relative flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-gray-100 hover:bg-red-50 hover:border-red-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            {item.badge && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                {item.badge}
              </span>
            )}

            <div className="w-14 h-14 rounded-md flex items-center justify-center">
              <Image
                src={item.image}
                alt={item.title}
                width={36}
                height={36}
              />
            </div>

            <span className="text-sm font-medium text-gray-700 text-center leading-tight">
              {item.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default BrokerServices;

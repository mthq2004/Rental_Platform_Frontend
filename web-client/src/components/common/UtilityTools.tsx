"use client";
import React from "react";
import {
  LineChartOutlined,
  BankOutlined,
  ReadOutlined,
} from "@ant-design/icons";

interface UtilityItem {
  icon: React.ReactNode;
  title: string;
  href: string;
}

const UtilityTools = () => {
  const utilities: UtilityItem[] = [
    {
      icon: <LineChartOutlined className="text-3xl text-orange-500" />,
      title: "Biểu đồ giá",
      href: "/bieu-do-gia",
    },
    {
      icon: <BankOutlined className="text-3xl text-orange-500" />,
      title: "Vay mua nhà",
      href: "/vay-mua-nha",
    },
    {
      icon: <ReadOutlined className="text-3xl text-orange-500" />,
      title: "Kinh nghiệm",
      href: "/kinh-nghiem",
    },
  ];

  return (
    <div className="bg-orange-50 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Công cụ tiện ích</h3>
      <div className="grid grid-cols-3 gap-4">
        {utilities.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="
              flex flex-col items-center gap-3 p-4
              bg-white rounded-xl
              hover:shadow-md transition-shadow
              cursor-pointer group
            "
          >
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

export default UtilityTools;

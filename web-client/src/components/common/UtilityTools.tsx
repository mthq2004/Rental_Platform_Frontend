"use client";
import React from "react";
import Image from "next/image";

interface UtilityItem {
  image: string;
  title: string;
  href: string;
}

const UtilityTools = () => {
  const utilities: UtilityItem[] = [
    {
      image: "/assets/image/bieu-do-gia.png",
      title: "Biểu đồ giá",
      href: "/bieu-do-gia",
    },
    {
      image: "/assets/image/vay-mua-nha.png",
      title: "Tính tiền thuê",
      href: "/tinh-tien-thue",
    },
    {
      image: "/assets/image/kinh-nghiem.png",
      title: "Kinh nghiệm",
      href: "/kinh-nghiem",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        Công cụ tiện ích
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {utilities.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-lg
              bg-white border border-gray-100
              hover:bg-red-50 hover:border-red-200 hover:shadow-sm hover:-translate-y-0.5
              transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-md flex items-center justify-center">
              <Image
                src={item.image}
                alt={item.title}
                width={36}
                height={36}
              />
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

"use client";
import React from "react";

interface CategoryItem {
  icon: string;
  title: string;
  count: string;
  href: string;
}

const CategoryCards = () => {
  const categories: CategoryItem[] = [
    {
      icon: "/assets/icon/category-sale.png",
      title: "Mua bán",
      count: "67.998 tin mua bán",
      href: "/mua-ban",
    },
    {
      icon: "/assets/icon/category-rent.png",
      title: "Cho Thuê",
      count: "40.385 tin cho thuê",
      href: "/cho-thue",
    },
    {
      icon: "/assets/icon/category-project.png",
      title: "Dự án",
      count: "5.204 Dự án",
      href: "/du-an",
    },
    {
      icon: "/assets/icon/category-broker.png",
      title: "Môi giới",
      count: "811 chuyên trang",
      href: "/moi-gioi",
    },
  ];

  return (
    <section className="w-full bg-white  py-8">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, index) => (
              <a
                key={index}
                href={cat.href}
                className="
                  flex items-center gap-4 p-4 rounded-xl
                  hover:bg-orange-50 transition-colors
                  border border-transparent hover:border-orange-100
                  group cursor-pointer
                "
              >
                {/* Icon */}
                <div className="w-16 h-16 flex-shrink-0">
                  <img
                    src={cat.icon}
                    alt={cat.title}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.count}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;

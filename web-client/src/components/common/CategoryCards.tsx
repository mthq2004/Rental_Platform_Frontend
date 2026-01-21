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
      icon: "/assets/image/catgories/cho-thue.png",
      title: "Cho Thuê",
      count: "41.418 tin cho thuê",
      href: "/cho-thue",
    },
    {
      icon: "/assets/image/catgories/du-an.png",
      title: "Dự án",
      count: "5.204 Dự án",
      href: "/du-an",
    },
    {
      icon: "/assets/image/catgories/moi-gioi.png",
      title: "Môi giới",
      count: "738 chuyên trang",
      href: "/moi-gioi",
    },
  ];

  return (
    <section className="w-full bg-white py-6">
      <div className="mx-auto max-w-[1200px] px-4">
        {/* Category Cards - Horizontal layout matching reference */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {categories.map((cat, index) => (
            <a
              key={index}
              href={cat.href}
              className="flex items-center gap-4 bg-white rounded-xl px-6 py-4 min-w-[200px] md:min-w-[240px] border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 group cursor-pointer"
            >
              {/* Icon */}
              <div className="w-14 h-14 flex-shrink-0">
                <img
                  src={cat.icon}
                  alt={cat.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Text */}
              <div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{cat.count}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryCards;

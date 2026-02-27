"use client";

import React, { useRef } from "react";
import {
  HeartOutlined,
  LeftOutlined,
  RightOutlined,
  PictureOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface SimilarProperty {
  id: string;
  title: string;
  image: string;
  imageCount: number;
  price: string;
  bedrooms: number;
  propertyType: string;
  location: string;
  daysAgo: number;
}

const SAMPLE_SIMILAR: SimilarProperty[] = [
  {
    id: "s1",
    title: "BÁN NHÀ 290M2 VỊ TRÍ 2 ĐƯỜNG ĐỒNG KHỞI MẶ...",
    image: "/assets/image/property-1.jpg",
    imageCount: 4,
    price: "9 triệu/tháng",
    bedrooms: 9,
    propertyType: "Nhà ngõ, hẻm",
    location: "Biên Hòa, Đồng Nai",
    daysAgo: 20,
  },
  {
    id: "s2",
    title: "NHÀ 1 TRỆT 1 LẦU GẦN CỔNG 11 - SỔ HỒNG HO...",
    image: "/assets/image/property-2.jpg",
    imageCount: 6,
    price: "5 triệu/tháng",
    bedrooms: 3,
    propertyType: "Nhà mặt phố, mặt tiền",
    location: "Biên Hòa, Đồng Nai",
    daysAgo: 1,
  },
  {
    id: "s3",
    title: "BÁN NHÀ MẶT TIỀN ĐƯỜNG HƯNG ĐẠO...",
    image: "/assets/image/property-3.jpg",
    imageCount: 9,
    price: "12 triệu/tháng",
    bedrooms: 2,
    propertyType: "Nhà ngõ, hẻm",
    location: "Biên Hòa, Đồng Nai",
    daysAgo: 4,
  },
  {
    id: "s4",
    title: "Bán nhà 1 trệt 3 lầu mặt tiền công viên đường F2 k...",
    image: "/assets/image/property-4.jpg",
    imageCount: 5,
    price: "15 triệu/tháng",
    bedrooms: 4,
    propertyType: "Nhà ngõ, hẻm",
    location: "Biên Hòa, Đồng Nai",
    daysAgo: 2,
  },
  {
    id: "s5",
    title: "Bán nhà thổ 1 trệt 2 lầu khu dân cư Bửu Long 3, Tr...",
    image: "/assets/image/property-5.jpg",
    imageCount: 5,
    price: "8 triệu/tháng",
    bedrooms: 5,
    propertyType: "Nhà phố liên kế",
    location: "Biên Hòa, Đồng Nai",
    daysAgo: 1,
  },
];

interface SimilarListingsProps {
  currentPropertyId: string;
  city: string;
}

export default function SimilarListings({ currentPropertyId, city }: SimilarListingsProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Tin đăng tương tự</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 
              text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <LeftOutlined className="text-xs" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 
              text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <RightOutlined className="text-xs" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {SAMPLE_SIMILAR.map((item) => (
          <div
            key={item.id}
            onClick={() => router.push(`/property/${item.id}`)}
            className="w-[220px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 
              overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Heart */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: toggle favorite
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full 
                  flex items-center justify-center hover:bg-white transition-colors"
              >
                <HeartOutlined className="text-gray-500 text-sm" />
              </button>

              {/* Bottom badges */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                  <ClockCircleOutlined />
                  {item.daysAgo === 0 ? "Hôm nay" : `${item.daysAgo} ngày trước`}
                </span>
                <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                  <PictureOutlined />
                  {item.imageCount}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug min-h-[36px]">
                {item.title}
              </h4>
              <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                <span>{item.bedrooms} PN</span>
                <span className="text-gray-300">·</span>
                <span>{item.propertyType}</span>
              </div>
              <p className="text-blue-600 font-bold text-sm mt-1.5">{item.price}</p>
              <p className="text-xs text-gray-400 mt-1">{item.location}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View more */}
      <div className="text-center mt-2">
        <button
          onClick={() => router.push(`/search?city=${encodeURIComponent(city)}`)}
          className="border border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-500 
            px-8 py-2.5 rounded-full text-sm font-medium transition-colors"
        >
          Xem thêm
        </button>
      </div>
    </div>
  );
}

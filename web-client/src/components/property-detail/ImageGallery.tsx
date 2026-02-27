"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LeftOutlined,
  RightOutlined,
  ShareAltOutlined,
  EllipsisOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import type { PropertyImage } from "@/types/property.type";

interface ImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const total = images.length;

  const goTo = (index: number) => {
    if (index < 0) setCurrentIndex(total - 1);
    else if (index >= total) setCurrentIndex(0);
    else setCurrentIndex(index);
  };

  const goNext = () => goTo(currentIndex + 1);
  const goPrev = () => goTo(currentIndex - 1);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailRef.current) {
      const thumb = thumbnailRef.current.children[currentIndex] as HTMLElement;
      if (thumb) {
        thumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex]);

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex]);

  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        {/* Main image */}
        <div
          className="relative w-full h-[450px] bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={images[currentIndex]?.uri || "/assets/image/property-1.jpg"}
            alt={`${title} - Ảnh ${currentIndex + 1}`}
            className="w-full h-full object-contain"
          />

          {/* Navigation arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white 
              rounded-full flex items-center justify-center shadow-md 
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LeftOutlined className="text-gray-700" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white 
              rounded-full flex items-center justify-center shadow-md
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <RightOutlined className="text-gray-700" />
          </button>

          {/* Top right actions */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button className="w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors">
              <ShareAltOutlined className="text-gray-600" />
            </button>
            <button className="w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors">
              <EllipsisOutlined className="text-gray-600" />
            </button>
          </div>

          {/* Image counter */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
            <PictureOutlined />
            {currentIndex + 1} / {total}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="relative mt-3">
          <div
            ref={thumbnailRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-20 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all
                  ${idx === currentIndex
                    ? "border-blue-500 shadow-md scale-105"
                    : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"
                  }`}
              >
                <img
                  src={img.uri}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Thumbnail scroll arrows */}
          {total > 7 && (
            <button
              onClick={() => {
                if (thumbnailRef.current) {
                  thumbnailRef.current.scrollBy({ left: 200, behavior: "smooth" });
                }
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white shadow-md 
                rounded-full flex items-center justify-center hover:bg-gray-50 z-10"
            >
              <RightOutlined className="text-xs text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-10"
          >
            ✕
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 
              rounded-full flex items-center justify-center transition-colors"
          >
            <LeftOutlined className="text-white text-xl" />
          </button>

          <img
            src={images[currentIndex]?.uri}
            alt={`${title} - Ảnh ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 
              rounded-full flex items-center justify-center transition-colors"
          >
            <RightOutlined className="text-white text-xl" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm">
            {currentIndex + 1} / {total}
          </div>
        </div>
      )}
    </>
  );
}

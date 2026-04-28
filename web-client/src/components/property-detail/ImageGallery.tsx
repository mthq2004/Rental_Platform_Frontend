"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LeftOutlined,
  RightOutlined,
  ShareAltOutlined,
  EllipsisOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { PlayCircleOutlined } from "@ant-design/icons";
import type { PropertyImage, PropertyVideo } from "@/types/property.type";

type MediaItem =
  | { kind: "image"; id: string; uri: string }
  | { kind: "video"; id: string; uri: string; thumbnail?: string };

interface ImageGalleryProps {
  images: PropertyImage[];
  videos?: PropertyVideo[];
  title: string;
}

export default function ImageGallery({ images, videos = [], title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Merge: images first, then videos
  const media: MediaItem[] = [
    ...images.map((img) => ({ kind: "image" as const, id: img.id, uri: img.uri })),
    ...videos.map((v) => ({ kind: "video" as const, id: v.id, uri: v.uri, thumbnail: v.thumbnail })),
  ];

  const total = media.length;

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
        {/* Main media */}
        <div
          className="relative w-full h-[450px] bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => media[currentIndex]?.kind === "image" && setIsFullscreen(true)}
        >
          {media[currentIndex]?.kind === "video" ? (
            <video
              key={media[currentIndex].uri}
              src={media[currentIndex].uri}
              controls
              className="w-full h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={media[currentIndex]?.uri || "/assets/image/property-1.jpg"}
              alt={`${title} - Ảnh ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
          )}

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

          {/* Media counter */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
            {media[currentIndex]?.kind === "video" ? <PlayCircleOutlined /> : <PictureOutlined />}
            {currentIndex + 1} / {total}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="relative mt-2">
          <div
            ref={thumbnailRef}
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {media.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 rounded-md overflow-hidden transition-all duration-150
      ${idx === currentIndex
                    ? "opacity-100 z-10 scale-[1.02]" // Thêm z-10 để nó nổi lên trên và scale nhẹ
                    : "opacity-50 hover:opacity-80"
                  }`}
                style={{
                  width: 88,
                  height: 60,
                  // Dùng box-shadow inset thay cho ring để không bao giờ bị overflow cắt mất
                  boxShadow: idx === currentIndex ? 'inset 0 0 0 3px #3b82f6' : 'none'
                }}
              >
                {/* Nội dung img/video bên trong giữ nguyên */}
                {item.kind === "video" ? (
                  <>
                    <img src={item.thumbnail || item.uri} className="w-full h-full object-cover bg-gray-800" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <PlayCircleOutlined className="text-white text-lg" />
                    </div>
                  </>
                ) : (
                  <img src={item.uri} className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>

          {/* Thumbnail scroll arrows */}
          {total > 7 && (
            <>
              <button
                onClick={() => {
                  if (thumbnailRef.current) {
                    thumbnailRef.current.scrollBy({ left: -200, behavior: "smooth" });
                  }
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 shadow
                  rounded-full flex items-center justify-center hover:bg-white z-10"
              >
                <LeftOutlined className="text-[10px] text-gray-600" />
              </button>
              <button
                onClick={() => {
                  if (thumbnailRef.current) {
                    thumbnailRef.current.scrollBy({ left: 200, behavior: "smooth" });
                  }
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 shadow
                  rounded-full flex items-center justify-center hover:bg-white z-10"
              >
                <RightOutlined className="text-[10px] text-gray-600" />
              </button>
            </>
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

          {media[currentIndex]?.kind === "video" ? (
            <video
              key={media[currentIndex].uri}
              src={media[currentIndex].uri}
              controls
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={media[currentIndex]?.uri}
              alt={`${title} - Ảnh ${currentIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

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

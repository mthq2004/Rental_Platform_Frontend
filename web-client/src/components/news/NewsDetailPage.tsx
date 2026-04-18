"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Eye, Tag } from "lucide-react";
import { Space_Grotesk, Fraunces } from "next/font/google";
import { fetchNewsDetail } from "@/services/news.service";
import type { NewsDetail } from "@/types/news.type";

const space = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
};

interface NewsDetailPageProps {
  slug: string;
}

export default function NewsDetailPage({ slug }: NewsDetailPageProps) {
  const [data, setData] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchNewsDetail(slug);
        setData(res);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const paragraphs = useMemo(() => {
    if (!data?.content) return [];
    return data.content.split(/\n{2,}/g).filter(Boolean);
  }, [data?.content]);

  const hasHtml = useMemo(() => {
    if (!data?.content) return false;
    return /<\/?[a-z][\s\S]*>/i.test(data.content);
  }, [data?.content]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="h-8 w-2/3 rounded-full bg-slate-100" />
          <div className="mt-4 h-6 w-1/3 rounded-full bg-slate-100" />
          <div className="mt-8 h-80 rounded-3xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[70vh] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className={`${fraunces.className} text-3xl text-slate-900`}>
            Không tìm thấy tin tức
          </h1>
          <p className="mt-3 text-slate-500">
            Tin tức này có thể đã được gỡ hoặc chưa được xuất bản.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="mx-auto max-w-5xl px-6 pb-12 pt-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <Tag className="h-4 w-4" />
            {data.category || "Tin tức"}
          </div>
          <h1 className={`${fraunces.className} text-4xl font-semibold text-slate-900 md:text-5xl`}>
            {data.title}
          </h1>
          {data.summary ? (
            <p className="mt-4 text-lg text-slate-600 md:text-xl">{data.summary}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(data.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {data.viewCount ?? 0} lượt xem
            </span>
            <span>{estimateReadingTime(data.content)} phút đọc</span>
            {data.author?.fullName ? (
              <span className="text-slate-700">Bởi {data.author.fullName}</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        {data.coverImageUrl ? (
          <div className="-mt-10 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
            <img
              src={data.coverImageUrl}
              alt={data.title}
              className="h-[360px] w-full object-cover"
            />
          </div>
        ) : null}

        <div className={`${space.className} mt-10 space-y-6 text-[17px] leading-8 text-slate-700`}>
          {hasHtml ? (
            <div
              className="space-y-5"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          ) : paragraphs.length ? (
            paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))
          ) : (
            <p>{data.content}</p>
          )}
        </div>

        {data.tags?.length ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

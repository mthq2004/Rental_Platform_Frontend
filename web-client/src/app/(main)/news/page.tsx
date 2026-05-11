"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Eye, Search, Sparkles, Tag } from "lucide-react";
import { Fraunces } from "next/font/google";
import { fetchFeaturedNews, fetchNewsList } from "@/services/news.service";
import type { NewsItem } from "@/types/news.type";

const fraunces = Fraunces({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

const DEFAULT_CATEGORIES = [
  "Thị trường",
  "Đầu tư",
  "Pháp lý",
  "Tài chính",
  "Xu hướng",
];

const formatDate = (value?: string | null) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <Link
    href={`/news/${item.slug}`}
    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white transition hover:-translate-y-1 hover:shadow-2xl/10"
  >
    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
      {item.coverImageUrl ? (
        <img
          src={item.coverImageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
        {item.category || "Tin tức"}
      </div>
    </div>
    <div className="flex h-full flex-col gap-3 px-6 py-5">
      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
      {item.summary ? (
        <p className="line-clamp-3 text-sm text-slate-600">{item.summary}</p>
      ) : null}
      <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatDate(item.publishedAt)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Eye className="h-4 w-4" />
          {item.viewCount ?? 0}
        </span>
      </div>
    </div>
  </Link>
);

export default function NewsPage() {
  const [featured, setFeatured] = useState<NewsItem[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 9 });

  const categories = useMemo(() => {
    const fromData = new Set<string>();
    [...featured, ...items].forEach((news) => {
      if (news.category) fromData.add(news.category);
    });
    const merged = [...fromData];
    if (!merged.length) return DEFAULT_CATEGORIES;
    return merged.slice(0, 8);
  }, [featured, items]);

  const loadFeatured = async () => {
    try {
      const res = await fetchFeaturedNews(6);
      setFeatured(res);
    } catch {
      setFeatured([]);
    }
  };

  const loadNews = async (targetPage: number, replace: boolean) => {
    try {
      const res = await fetchNewsList({
        page: targetPage,
        limit: pagination.limit,
        search: search || undefined,
        category: category || undefined,
      });
      setPagination(res.pagination);
      setItems((prev) => (replace ? res.items : [...prev, ...res.items]));
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadFeatured(), loadNews(1, true)]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    loadNews(1, true).finally(() => setLoading(false));
  }, [search, category]);

  const handleLoadMore = async () => {
    if (page >= pagination.totalPages) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    await loadNews(nextPage, false);
    setPage(nextPage);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#e2e8f0_0,_#f8fafc_55%,_#ffffff_100%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Tin tức bất động sản cập nhật hàng ngày
              </div>
              <h1 className={`${fraunces.className} mt-4 text-4xl font-semibold text-slate-900 md:text-5xl`}>
                Bản tin thị trường đáng tin cậy cho nhà đầu tư và người thuê
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Phân tích chuyên sâu, cập nhật pháp lý và xu hướng giá thuê giúp bạn ra quyết định nhanh và chính xác.
              </p>
            </div>
            <div className="w-full max-w-lg rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl backdrop-blur">
              <p className="text-sm font-semibold text-slate-700">Tìm kiếm tin tức</p>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Từ khóa, khu vực, pháp lý..."
                  className="w-full bg-transparent text-sm text-slate-700 outline-none"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(category === item ? undefined : item)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      category === item
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className={`${fraunces.className} text-2xl text-slate-900`}>Tin nổi bật</h2>
            <p className="text-sm text-slate-500">Tổng hợp bài viết chiến lược được chọn lọc kỹ.</p>
          </div>
          <Link href="/news" className="text-sm font-semibold text-emerald-600">
            Xem tất cả
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {(loading ? (Array.from({ length: 3 }) as (NewsItem | undefined)[]) : featured).map((item, index) =>
            item ? (
              <NewsCard key={item.newsId} item={item} />
            ) : (
              <div
                key={`featured-skeleton-${index}`}
                className="h-72 rounded-3xl border border-slate-100 bg-white"
              />
            )
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className={`${fraunces.className} text-2xl text-slate-900`}>Bản tin mới nhất</h2>
            <p className="text-sm text-slate-500">Cập nhật liên tục theo từng khu vực và phân khúc.</p>
          </div>
          {category ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Tag className="h-4 w-4" />
              {category}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {((loading ? Array.from({ length: 6 }) : items) as (NewsItem | undefined)[]).map((item, index) =>
            item ? (
              <NewsCard key={item.newsId} item={item} />
            ) : (
              <div
                key={`news-skeleton-${index}`}
                className="h-72 rounded-3xl border border-slate-100 bg-white"
              />
            )
          )}
        </div>

        {pagination.totalPages > page ? (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Đang tải..." : "Xem thêm"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
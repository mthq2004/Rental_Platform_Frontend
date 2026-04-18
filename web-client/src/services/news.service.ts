import http from "@/utils/api";
import type { NewsDetail, NewsListQuery, NewsListResponse, NewsItem } from "@/types/news.type";

export const fetchNewsList = async (params: NewsListQuery) => {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.tag) query.set("tag", params.tag);

  const qs = query.toString();
  const res = await http.get(`/estate/news${qs ? `?${qs}` : ""}`);
  return res.data as NewsListResponse;
};

export const fetchFeaturedNews = async (limit = 6) => {
  const res = await http.get(`/estate/news/featured?limit=${limit}`);
  return res.data as NewsItem[];
};

export const fetchNewsDetail = async (slug: string) => {
  const res = await http.get(`/estate/news/${slug}`);
  return res.data as NewsDetail;
};

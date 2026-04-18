export type NewsStatus = "draft" | "published" | "archived";

export interface NewsAuthor {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
}

export interface NewsItem {
  newsId: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  category?: string | null;
  tags?: string[];
  publishedAt?: string | null;
  viewCount?: number;
  author?: NewsAuthor | null;
}

export interface NewsDetail extends NewsItem {
  content: string;
}

export interface NewsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tag?: string;
}

export interface NewsListResponse {
  items: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

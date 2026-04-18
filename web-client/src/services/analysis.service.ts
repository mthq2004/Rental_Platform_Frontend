import http from "@/utils/api";
import type { PriceAnalyticsQuery, PriceAnalyticsResponse } from "@/types/analysis.type";

export const fetchPriceAnalytics = async (params: PriceAnalyticsQuery) => {
  const query = new URLSearchParams();
  if (params.propertyType) query.set("propertyType", params.propertyType);
  if (params.city) query.set("city", params.city);
  if (params.district) query.set("district", params.district);
  if (params.ward) query.set("ward", params.ward);
  if (params.months) query.set("months", String(params.months));
  if (params.top) query.set("top", String(params.top));

  const qs = query.toString();
  const res = await http.get(`/estate/analytics/price${qs ? `?${qs}` : ""}`);
  return res.data as PriceAnalyticsResponse;
};

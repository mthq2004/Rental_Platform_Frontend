import type { PropertyType } from "./property.type";

export interface PriceAnalyticsQuery {
  propertyType?: PropertyType;
  city?: string;
  district?: string;
  ward?: string;
  months?: number;
  top?: number;
}

export interface PriceAnalyticsSummary {
  sampleCount: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgArea: number;
  avgPricePerSqm: number;
  popularRange: {
    min: number;
    max: number;
  };
  latestMonthLabel: string | null;
  changePercent: number;
}

export interface PriceAnalyticsTrendPoint {
  month: string;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
}

export interface PriceAnalyticsDistributionBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface PriceAnalyticsCityMetric {
  key: string;
  label: string;
  avgPrice: number;
  count: number;
  avgPricePerSqm: number;
}

export interface PriceAnalyticsResponse {
  filters: {
    propertyType: PropertyType | null;
    city: string | null;
    district: string | null;
    ward: string | null;
    months: number;
  };
  summary: PriceAnalyticsSummary;
  distribution: PriceAnalyticsDistributionBucket[];
  trend: PriceAnalyticsTrendPoint[];
  topCities: PriceAnalyticsCityMetric[];
}

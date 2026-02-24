/**
 * ===== ADVANCED PRICE SUGGESTIONS LOGIC =====
 * Custom hooks & algorithms cho price suggestions
 * Có thể expand để thêm:
 * - Competitive pricing analysis
 * - Seasonal adjustments
 * - User location-based pricing
 * - ML-based predictions
 */

import { useMemo } from "react";

export interface PriceTier {
  multiplier: number;
  label: string;
  description: string;
  strategy: "quick-sale" | "market-price" | "premium";
}

/**
 * ===== PRICE TIERS CONFIGURATION =====
 * Các tầng giá có thể tùy chỉnh theo business logic
 *
 * VD: Cho thuê nhà
 * - Quick-sale (×1K): Giá thấp, bán nhanh
 * - Market (×10K): Giá cân bằng thị trường
 * - Premium (×100K): Giá cao, chất lượng tốt
 *
 * Có thể mở rộng thành 5-10 tiers tùy business
 */
export const DEFAULT_PRICE_TIERS: PriceTier[] = [
  {
    multiplier: 1000,
    label: "Bán nhanh",
    description: "🚀 Giá thấp, khuyến khích quy trình nhanh",
    strategy: "quick-sale",
  },
  {
    multiplier: 10000,
    label: "Giá thị trường",
    description: "📊 Giá cân bằng cung và cầu",
    strategy: "market-price",
  },
  {
    multiplier: 100000,
    label: "Lợi nhuận tối ưu",
    description: "💰 Giá cao, chất lượng premium",
    strategy: "premium",
  },
];

/**
 * Custom hook: Generate price suggestions
 * Được dùng khi cần extend logic (VD: competitor pricing, seasonal...)
 *
 * @param baseNumber - Số nhập từ input (VD: 9 → [9000, 90000, 900000])
 * @param tiers - Danh sách price tiers (mặc định là DEFAULT_PRICE_TIERS)
 * @param maxPrice - Giá tối đa filter
 * @returns Danh sách suggestions
 */
export const usePriceSuggestions = (
  baseNumber: number,
  tiers: PriceTier[] = DEFAULT_PRICE_TIERS,
  maxPrice: number = 100000000
) => {
  return useMemo(() => {
    if (!baseNumber || baseNumber > 1000000) {
      return [];
    }

    return tiers
      .map((tier) => ({
        value: baseNumber * tier.multiplier,
        label: tier.label,
        description: tier.description,
        strategy: tier.strategy,
      }))
      .filter((s) => s.value <= maxPrice);
  }, [baseNumber, tiers, maxPrice]);
};

/**
 * ===== ALGORITHM: Phát hiện strategy người dùng =====
 *
 * Nếu người dùng thường chọn low price → suggest "quick-sale" first
 * Nếu người dùng thường chọn high price → suggest "premium" first
 */
export const detectUserStrategy = (
  selectedPrices: number[]
): "quick-sale" | "market-price" | "premium" | null => {
  if (selectedPrices.length === 0) return null;

  const avg = selectedPrices.reduce((a, b) => a + b) / selectedPrices.length;
  const lastPrice = selectedPrices[selectedPrices.length - 1];

  // Nếu người dùng chọn giá thấp
  if (lastPrice < avg) {
    return "quick-sale";
  }

  // Nếu người dùng chọn giá cao
  if (lastPrice > avg * 1.5) {
    return "premium";
  }

  return "market-price";
};

/**
 * ===== ALGORITHM: Competitive Pricing =====
 * Nếu có dữ liệu từ competitors, có thể adjust suggestion
 * VD: Nếu competitors bán 50K, ta suggest 49K (undercut) hoặc 55K (premium)
 *
 * @param basePrice - Giá gợi ý ban đầu
 * @param competitorPrice - Giá competitor
 * @param strategy - "undercut" | "compete" | "premium"
 * @returns Giá được adjust
 */
export const adjustForCompetitor = (
  basePrice: number,
  competitorPrice: number,
  strategy: "undercut" | "compete" | "premium" = "compete"
): number => {
  switch (strategy) {
    case "undercut":
      // Bán 5% thấp hơn competitor
      return Math.floor(competitorPrice * 0.95);

    case "premium":
      // Bán 10% cao hơn competitor
      return Math.floor(competitorPrice * 1.1);

    case "compete":
    default:
      // Bán bằng competitor
      return competitorPrice;
  }
};

/**
 * ===== ALGORITHM: Seasonal Adjustment =====
 * Điều chỉnh giá theo mùa
 * VD: Mùa hè, giá thuê nhà tăng vì demand cao
 *
 * @param basePrice - Giá gốc
 * @param seasonalMultiplier - Hệ số mùa (0.8 = -20%, 1.2 = +20%)
 * @returns Giá được điều chỉnh
 */
export const adjustForSeason = (
  basePrice: number,
  seasonalMultiplier: number = 1.0
): number => {
  return Math.floor(basePrice * seasonalMultiplier);
};

/**
 * ===== ALGORITHM: Price Optimization =====
 * Optimize giá dựa trên nhiều yếu tố
 * Score cao nhất = recommended price
 *
 * Factors:
 * - Demand (0-100): Nhu cầu cao = giá cao
 * - Competition (0-100): Cạnh tranh cao = giá thấp
 * - Margin (0-100): Lợi nhuận kỳ vọng
 */
export interface PriceOptimizationFactors {
  demand: number; // 0-100
  competition: number; // 0-100
  expectedMargin: number; // 0-100
}

export const optimizePriceScore = (
  basePrice: number,
  factors: PriceOptimizationFactors
): { price: number; score: number } => {
  // Công thức: demand * 0.4 + (100 - competition) * 0.3 + margin * 0.3
  const score =
    factors.demand * 0.4 +
    (100 - factors.competition) * 0.3 +
    factors.expectedMargin * 0.3;

  // Adjust price based on score
  // Score cao = giá cao, score thấp = giá thấp
  const priceMultiplier = 0.8 + (score / 100) * 0.4; // 0.8x - 1.2x
  const optimizedPrice = Math.floor(basePrice * priceMultiplier);

  return {
    price: optimizedPrice,
    score: Math.round(score),
  };
};

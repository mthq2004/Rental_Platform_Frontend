/**
 * ===== Price Formatter Utils =====
 * Các hàm tiện ích xử lý định dạng và parse giá tiền
 * Hỗ trợ VND, USD, EUR...
 */

/**
 * Format một số thành chuỗi tiền VND
 * VD: 1234567 → "1.234.567"
 *
 * @param price - Số cần format
 * @param decimals - Số chữ số sau dấu phẩy (mặc định: 0)
 * @returns Chuỗi đã format
 */
export const formatVND = (price: number, decimals: number = 0): string => {
  if (!price || price < 0) return "0";

  const formatter = new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return formatter.format(price);
};

/**
 * Parse chuỗi giá nhập từ input thành số
 * Xử lý:
 * - "1.234.567" → 1234567
 * - "1,234,567" → 1234567
 * - "1234567" → 1234567
 * - "" → 0
 *
 * @param value - Chuỗi giá từ input
 * @returns Số nguyên đã parse
 */
export const parsePrice = (value: string): number => {
  if (!value) return 0;

  // Bỏ tất cả non-digit characters (bao gồm dấu chấm, dấu phẩy)
  const cleaned = value.replace(/[^\d]/g, "");

  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
};

/**
 * Format giá với currency symbol
 * VD: formatPrice(1234567, "VND") → "1.234.567 ₫"
 *
 * @param price - Số tiền
 * @param currency - Loại tiền (VND, USD, EUR)
 * @returns Chuỗi đã format với symbol
 */
export const formatPrice = (
  price: number,
  currency: "VND" | "USD" | "EUR" = "VND"
): string => {
  const symbols = {
    VND: "₫",
    USD: "$",
    EUR: "€",
  };

  return `${formatVND(price)} ${symbols[currency]}`;
};

/**
 * So sánh giá để kiểm tra có trong range không
 * VD: isInRange(500000, 100000, 1000000) → true
 *
 * @param price - Giá cần kiểm tra
 * @param min - Giá tối thiểu
 * @param max - Giá tối đa
 * @returns Boolean
 */
export const isInRange = (price: number, min: number, max: number): boolean => {
  return price >= min && price <= max;
};

/**
 * Làm tròn giá lên số gần nhất
 * VD: roundPrice(1234567, 100000) → 1300000
 *
 * @param price - Giá cần làm tròn
 * @param step - Đơn vị làm tròn (100, 1000, 10000...)
 * @returns Giá đã làm tròn
 */
export const roundPrice = (price: number, step: number = 1000): number => {
  return Math.ceil(price / step) * step;
};

/**
 * Tính phần trăm thay đổi giá
 * VD: getPriceChange(1000000, 1200000) → 20 (tăng 20%)
 *
 * @param oldPrice - Giá cũ
 * @param newPrice - Giá mới
 * @returns Phần trăm thay đổi (có thể âm)
 */
export const getPriceChange = (oldPrice: number, newPrice: number): number => {
  if (oldPrice === 0) return 0;
  return Math.round(((newPrice - oldPrice) / oldPrice) * 100);
};

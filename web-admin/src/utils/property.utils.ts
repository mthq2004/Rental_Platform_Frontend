import type { FurnitureLabels, PropertyTypeLabels } from "../types/property.type";

export const propertyTypeLabels: PropertyTypeLabels = {
  apartment: 'Căn hộ',
  house: 'Nhà',
  land: 'Đất',
  office: 'Văn phòng',
  room: 'Phòng trọ'
};

export const furnitureLabels: FurnitureLabels = {
  empty: 'Trống',
  basic: 'Cơ bản',
  full: 'Đầy đủ',
  luxury: 'Cao cấp'
};

export const approvalStatusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối'
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
};
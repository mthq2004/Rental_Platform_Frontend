export const PropertyType = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  LAND: 'land',
  OFFICE: 'office',
  ROOM: 'room'
} as const;

export type PropertyType = typeof PropertyType[keyof typeof PropertyType];

export const FurnitureStatus = {
  EMPTY: 'empty',
  BASIC: 'basic',
  FULL: 'full',
  LUXURY: 'luxury'
} as const;

export type FurnitureStatus = typeof FurnitureStatus[keyof typeof FurnitureStatus];

export const PropertyStatus = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
  REJECTED: 'rejected'
} as const;

export type PropertyStatus = typeof PropertyStatus[keyof typeof PropertyStatus];

export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export type ApprovalStatus = typeof ApprovalStatus[keyof typeof ApprovalStatus];

export interface Landlord {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

export interface Property {
  propertyId: string;
  landlordId: string;
  title: string;
  description: string | null;
  propertyType: PropertyType;
  address: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  areaSqm: number;
  floorNumber: number | null;
  totalFloors: number | null;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchens: number;
  balconies: number;
  pricePerMonth: number;
  currency: string;
  depositAmount: number | null;
  depositMonths: number;
  electricityCostPerKwh: number | null;
  waterCostPerM3: number | null;
  managementFee: number | null;
  parkingFee: number | null;
  internetFee: number | null;
  availableFrom: Date | null;
  minimumLeaseMonths: number;
  maximumLeaseMonths: number | null;
  furnitureStatus: FurnitureStatus | null;
  hasFireCertificate: boolean;
  status: PropertyStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  isActive: boolean;
  viewCount: number;
  favoriteCount: number;
  contactCount: number;
  bookingCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  landlord: Landlord;
  images: string[];
  videos?: string[];
}

export type PropertyTypeFilter = 'all' | PropertyType;
export type ApprovalStatusFilter = 'all' | ApprovalStatus;
export type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low';

export interface PropertyTypeLabels {
  [key: string]: string;
}

export interface FurnitureLabels {
  [key: string]: string;
}
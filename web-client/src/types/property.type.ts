export type PropertyType =
  | 'apartment'
  | 'house'
  | 'land'
  | 'office'
  | 'room';

export type PropertyField =
  | 'areaSqm'
  | 'bedrooms'
  | 'bathrooms'
  | 'livingRooms'
  | 'kitchens'
  | 'balconies'
  | 'floorNumber'
  | 'totalFloors'
  | 'furnitureStatus'
  | 'ownershipType'
  | 'parkingFee'
  | 'managementFee'
  | 'electricityCostPerKwh'
  | 'waterCostPerM3'
  | 'minimumLeaseMonths';



export type ListingType = 'rent' | 'sale';
export type FurnitureStatus = 'empty' | 'basic' | 'full' | 'luxury';

export interface PropertyImage {
  id: string;
  uri: string;
  isPrimary: boolean;
}

export interface PropertyVideo {
  id: string;
  uri: string;
  thumbnail?: string;
  duration?: number;
}

export interface PropertyFormData {
  propertyId?: string;
  // Thông tin cơ bản
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  pricePerMonth: number;
  depositAmount: number;
  depositMonths: number;

  // Vị trí
  address: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;

  availableFrom: string;


  // Thông tin chi tiết bất động sản
  maximumLeaseMonths: number;
  minimumLeaseMonths: number;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchens: number;
  balconies: number;
  floorNumber: number;
  totalFloors: number;
  furnitureStatus: FurnitureStatus;
  parkingFee: number;
  managementFee: number;
  electricityCostPerKwh: number;
  waterCostPerM3: number;
  hasFireCertificate: boolean;

  // Hình ảnh và video
  images: PropertyImage[];
  videos: PropertyVideo[];

  // Tiện ích và quy định
  amenities: string[];
  rules: { text: string; order: number }[];
  status: string;
  approvalStatus: string;
  rejectionReason?: string;
}

export interface StepProps {
    formData: PropertyFormData,
    updateFormData: (data: Partial<PropertyFormData>) => void,
    errors: Record<string, string>
    setShowAmenityModal?: (value: boolean) => void;
}

// ─── Public / Search API types ────────────────────────────────────────────────

export interface PropertyUser {
  id: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
}

export interface PropertyListItem {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  pricePerMonth: number;
  address: string;
  ward?: string;
  district: string;
  city: string;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  furnitureStatus: string;
  createdAt: string;
  viewCount: number;
  user: PropertyUser;
  images: PropertyImage[];
  isVip?: boolean;
  vipLevel?: string;
}

export interface PropertyCountByCity {
  city: string;
  numberProperty: number;
}

export interface SearchPropertyParams {
  keyword?: string;
  propertyType?: string;
  priceMin?: number | null;
  priceMax?: number | null;
  areaMin?: number | null;
  areaMax?: number | null;
  city?: string;
  district?: string;
  bedrooms?: number | null;
  cursor?: string | null;
  limit?: number;
  sortBy?: string;
}

export interface SearchPropertyResponse {
  data: PropertyListItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface PropertyReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
}

export interface PropertyApiOwner {
  id: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  phoneRaw: string;
  totalListings: number;
  joinedYears: number;
  userType: "personal" | "broker" | "agency";
}

export interface PropertyDetailApiData {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  pricePerMonth: number;
  depositAmount: number;
  depositMonths: number;
  address: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchens: number;
  balconies: number;
  floorNumber: number;
  totalFloors: number;
  furnitureStatus: string;
  parkingFee: number;
  managementFee: number;
  electricityCostPerKwh: number;
  waterCostPerM3: number;
  minimumLeaseMonths: number;
  maximumLeaseMonths: number | null;
  availableFrom: string | null;
  hasFireCertificate: boolean;
  status: string;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  images: PropertyImage[];
  videos: { id: string; uri: string }[];
  amenities: string[];
  rules: { text: string; order: number }[];
  reviews: PropertyReview[];
  user: PropertyApiOwner;
}

export interface FeaturedPropertyItem {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  pricePerMonth: number;
  address: string;
  district: string;
  city: string;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  furnitureStatus: string;
  createdAt: string;
  user: PropertyUser;
  image: string | null;
}
import type { PropertyType, FurnitureStatus, PropertyImage, PropertyVideo } from "@/types/property.type";

export interface PropertyOwner {
  id: string;
  fullName: string;
  avatarUrl: string;
  phone: string;
  userType: "personal" | "broker" | "agency";
  totalListings: number;
  joinedYears: number;
  lastActive: string;
  responseRate?: string;
}

export interface PropertyDetailData {
  id: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: "rent" | "sale";
  pricePerMonth: number;
  depositAmount: number;
  depositMonths: number;

  // Location
  address: string;
  ward: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;

  // Details
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
  minimumLeaseMonths: number;
  maximumLeaseMonths: number;
  availableFrom: string;
  hasFireCertificate: boolean;

  // Media
  images: PropertyImage[];
  videos: PropertyVideo[];

  // Amenities & Rules
  amenities: string[];
  rules: { text: string; order: number }[];

  // Meta
  status: string;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;

  // Owner
  user: PropertyOwner;
}

export interface CommentData {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  replies?: CommentData[];
}

export interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  imageUrls: string[];
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
}

export interface ReviewListResponse {
  items: ReviewData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
  totalReviews: number;
}

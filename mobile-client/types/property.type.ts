export type PropertyType = 'apartment' | 'house' | 'villa' | 'room' | 'office' | 'shop' | 'warehouse' | 'land';

export type ListingType = 'rent' | 'sale';
export type FurnitureStatus = 'empty' | 'basic' | 'full' | 'luxury';
export type OwnershipType = 'redBook' | 'pinkBook' | 'waitingForBook' | 'saleContract';

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
  depositAmount: string;
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
  maximumLeaseMonths: string;
  minimumLeaseMonths: string;
  areaSqm: number;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  kitchens: string;
  balconies: string;
  floorNumber: string;
  totalFloors: string;
  furnitureStatus: FurnitureStatus;
  ownershipType: OwnershipType;
  parkingFee: string;
  managementFee: string;
  electricityCostPerKwh: string;
  waterCostPerM3: string;
  hasFireCertificate: boolean;

  // Hình ảnh và video
  images: PropertyImage[];
  videos: PropertyVideo[];

  // Tiện ích và quy định
  amenities: string[];
  rules: { text: string; order: number }[];
  status: string;
  approvalStatus: string
}

export interface StepProps {
    formData: PropertyFormData,
    updateFormData: (data: Partial<PropertyFormData>) => void,
    errors: Record<string, string>
    setShowAmenityModal?: (value: boolean) => void;
}
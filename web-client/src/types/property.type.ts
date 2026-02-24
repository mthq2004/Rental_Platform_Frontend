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
  approvalStatus: string
}

export interface StepProps {
    formData: PropertyFormData,
    updateFormData: (data: Partial<PropertyFormData>) => void,
    errors: Record<string, string>
    setShowAmenityModal?: (value: boolean) => void;
}
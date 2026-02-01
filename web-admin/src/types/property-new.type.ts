export interface BaseProperty {
  propertyId: string;
  title: string;
  description: string;
  propertyType: 'apartment' | 'house' | 'land' | 'office' | 'room';
  pricePerMonth: number;
  address: string;
  ward: string;
  district: string;
  city: string;
  status: string;
  approvalStatus: string;
  createdAt: string;
  landlord: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  images: Array<{
    id: string;
    uri: string;
    isPrimary: boolean;
  }>;
  viewCount?: number;
  furnitureStatus?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface ApartmentProperty extends BaseProperty {
  propertyType: 'apartment';
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  balconies: number;
  floorNumber: number;
  totalFloors: number;
}

export interface HouseProperty extends BaseProperty {
  propertyType: 'house';
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  totalFloors: number;
  gardenAreaSqm?: number;
  parkingSpaces: number;
  frontWidth?: number;
  length?: number;
}

export interface LandProperty extends BaseProperty {
  propertyType: 'land';
  areaSqm: number;
  frontWidth?: number;
  length?: number;
  landType?: string; // 'thổ cư', 'công nghiệp', 'nông nghiệp'
  direction?: string; // 'đông', 'tây', 'nam', 'bắc', 'đông nam'...
  legalStatus?: string; // 'sổ đỏ', 'sổ hồng', 'giấy tờ khác'
  roadWidth?: number;
  isCornerLot?: boolean;
}

export interface OfficeProperty extends BaseProperty {
  propertyType: 'office';
  areaSqm: number;
  floorNumber: number;
  totalFloors: number;
  officeRooms: number;
  capacity?: number;
  parkingSpaces: number;
  hasAirConditioner?: boolean;
  hasWifi?: boolean;
  hasElevator?: boolean;
  hasSecurity?: boolean;
  businessType?: string; // 'văn phòng', 'showroom', 'cửa hàng'
}

export interface RoomProperty extends BaseProperty {
  propertyType: 'room';
  areaSqm: number;
  bathrooms: number;
  kitchens: number;
  furnitureStatus: string; // 'đầy đủ', 'cơ bản', 'không nội thất'
}

export type Property =
  | ApartmentProperty
  | HouseProperty
  | LandProperty
  | OfficeProperty
  | RoomProperty;

export const isApartment = (property: Property): property is ApartmentProperty => {
  return property.propertyType === 'apartment';
};

export const isHouse = (property: Property): property is HouseProperty => {
  return property.propertyType === 'house';
};

export const isLand = (property: Property): property is LandProperty => {
  return property.propertyType === 'land';
};

export const isOffice = (property: Property): property is OfficeProperty => {
  return property.propertyType === 'office';
};

export const isRoom = (property: Property): property is RoomProperty => {
  return property.propertyType === 'room';
};
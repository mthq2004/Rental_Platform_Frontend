import { PropertyType, PropertyField } from '@/types/property.type';
import {
  Home,
  MapPin,
  Building2,
  Landmark,
  HotelIcon,
} from 'lucide-react';

export const PROPERTY_META: Record<
  PropertyType,
  {
    label: string;
    icon: any;
    amenities: string[];
    fields: PropertyField[];
  }
> = {
  apartment: {
    label: 'Chung cư / Căn hộ',
    icon: Building2,
    amenities: [
      'Hồ bơi',
      'Phòng gym',
      'Sân chơi trẻ em',
      'BBQ',
      'An ninh 24/7',
      'Thang máy',
      'Chỗ đỗ xe',
    ],
    fields: [
      'areaSqm',
      'bedrooms',
      'bathrooms',
      'livingRooms',
      'kitchens',
      'balconies',
      'floorNumber',
      'totalFloors',
      'furnitureStatus',
      'ownershipType',
      'parkingFee',
      'managementFee',
      'electricityCostPerKwh',
      'waterCostPerM3',
    ],
  },

  house: {
    label: 'Nhà ở',
    icon: Home,
    amenities: ['Sân vườn', 'Gara ô tô', 'Sân thượng', 'An ninh'],
    fields: [
      'areaSqm',
      'bedrooms',
      'bathrooms',
      'livingRooms',
      'kitchens',
      'balconies',
      'totalFloors',
      'furnitureStatus',
      'ownershipType',
    ],
  },

  land: {
    label: 'Đất',
    icon: MapPin,
    amenities: ['Vị trí đẹp', 'Gần trường học', 'Gần chợ', 'Đường rộng'],
    fields: ['areaSqm', 'ownershipType'],
  },

  office: {
    label: 'Văn phòng / Mặt bằng kinh doanh',
    icon: Landmark,
    amenities: [
      'WiFi tốc độ cao',
      'Điều hòa',
      'Thang máy',
      'Bảo vệ 24/7',
      'Chỗ đỗ xe',
    ],
    fields: [
      'areaSqm',
      'floorNumber',
      'parkingFee',
      'managementFee',
      'electricityCostPerKwh',
      'waterCostPerM3',
    ],
  },

  room: {
    label: 'Phòng trọ',
    icon: HotelIcon,
    amenities: [
      'Máy lạnh',
      'Nóng lạnh',
      'WiFi',
      'Giường',
      'Tủ lạnh',
      'Máy giặt chung',
    ],
    fields: [
      'areaSqm',
      'bathrooms',
      'furnitureStatus',
      'minimumLeaseMonths',
      'electricityCostPerKwh',
      'waterCostPerM3',
    ],
  },
};
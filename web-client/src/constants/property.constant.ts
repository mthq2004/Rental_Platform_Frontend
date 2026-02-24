import { PropertyType, PropertyField } from '@/types/property.type';
import {
  HomeOutlined,
  BankOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  ShopOutlined,
} from '@ant-design/icons';

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
    icon: BankOutlined,
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
    icon: HomeOutlined,
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
    icon: EnvironmentOutlined,
    amenities: ['Vị trí đẹp', 'Gần trường học', 'Gần chợ', 'Đường rộng'],
    fields: ['areaSqm', 'ownershipType'],
  },

  office: {
    label: 'Văn phòng / Mặt bằng kinh doanh',
    icon: ShopOutlined,
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
    icon: AppstoreOutlined,
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


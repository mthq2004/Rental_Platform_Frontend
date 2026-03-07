import { PropertyType, PropertyField, PropertyConfig } from '@/types/property.type';
import {
  Building2,
  Home,
  Landmark,
  Bed,
  Briefcase,
  AlertCircle,
} from 'lucide-react-native';

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
    icon: Landmark,
    amenities: ['Vị trí đẹp', 'Gần trường học', 'Gần chợ', 'Đường rộng'],
    fields: ['areaSqm', 'ownershipType'],
  },

  office: {
    label: 'Văn phòng / Mặt bằng kinh doanh',
    icon: Briefcase,
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
    icon: Bed,
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

export const FURNITURE_STATUS_LABELS: Record<string, string> = {
    empty: 'Trống',
    semi_furnished: 'Bán nội thất',
    furnished: 'Đầy đủ nội thất',
};

export const PROPERTY_TYPE: PropertyConfig[] = [
    {
        id: "apartment",
        label: "Chung cư / Căn hộ",
        icon: Building2,
        description: "Căn hộ chung cư",
    },
    {
        id: "house",
        label: "Nhà ở",
        icon: Home,
        description: "Nhà riêng, nhà mặt phố",
    },
    {
        id: "room",
        label: "Phòng trọ",
        icon: Bed,
        description: "Phòng cho thuê",
    },
    {
        id: "office",
        label: "Văn phòng / Mặt bằng kinh doanh",
        icon: Briefcase,
        description: "Văn phòng, showroom",
    },
    {
        id: "land",
        label: "Đất",
        icon: AlertCircle,
        description: "Đất thổ cư, đất nông nghiệp",
    },
];

export const MAX_PRICE = 50000000;

export const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];
import { PropertyFormData } from "@/types/property.type";

// Media item with Cloudinary upload support
export interface MediaItem {
    id: string;
    file?: File;
    preview: string;
    uri: string;
    uploading: boolean;
    progress: number;
    uploaded: boolean;
    error?: string;
}

export interface CreatePostContextType {
    formData: PropertyFormData;
    updateFormData: (field: keyof PropertyFormData, value: any) => void;
    images: MediaItem[];
    setImages: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    videos: MediaItem[];
    setVideos: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

export interface AddressData {
    city: string;
    cityCode: number;
    district: string;
    districtCode: number;
    ward: string;
    wardCode: number;
    streetAddress: string;
    fullAddress: string;
}

export const FIELD_CONFIG: Record<string, { label: string; placeholder: string; suffix?: string }> = {
    areaSqm: { label: "Diện tích", placeholder: "Nhập diện tích", suffix: "m²" },
    bedrooms: { label: "Số phòng ngủ", placeholder: "Số phòng ngủ" },
    bathrooms: { label: "Số phòng tắm", placeholder: "Số phòng tắm" },
    livingRooms: { label: "Số phòng khách", placeholder: "Số phòng khách" },
    kitchens: { label: "Số phòng bếp", placeholder: "Số phòng bếp" },
    balconies: { label: "Số ban công", placeholder: "Số ban công" },
    floorNumber: { label: "Tầng số", placeholder: "Tầng số" },
    totalFloors: { label: "Tổng số tầng", placeholder: "Tổng số tầng" },
    furnitureStatus: { label: "Tình trạng nội thất", placeholder: "Chọn tình trạng" },
    ownershipType: { label: "Giấy tờ pháp lý", placeholder: "Chọn loại giấy tờ" },
    parkingFee: { label: "Phí gửi xe", placeholder: "VNĐ/tháng", suffix: "VNĐ" },
    managementFee: { label: "Phí quản lý", placeholder: "VNĐ/tháng", suffix: "VNĐ" },
    electricityCostPerKwh: { label: "Giá điện", placeholder: "VNĐ/kWh", suffix: "VNĐ/kWh" },
    waterCostPerM3: { label: "Giá nước", placeholder: "VNĐ/m³", suffix: "VNĐ/m³" },
    minimumLeaseMonths: { label: "Thời gian thuê tối thiểu", placeholder: "Số tháng", suffix: "tháng" },
};

export const FURNITURE_STATUS_OPTIONS = [
    { value: "empty", label: "Không nội thất" },
    { value: "basic", label: "Nội thất cơ bản" },
    { value: "full", label: "Nội thất đầy đủ" },
    { value: "luxury", label: "Nội thất cao cấp" },
];

export const OWNERSHIP_TYPE_OPTIONS = [
    { value: "redBook", label: "Sổ đỏ / Sổ hồng" },
    { value: "saleContract", label: "Hợp đồng mua bán" },
    { value: "pending", label: "Đang chờ sổ" },
];

// Primary color theme - Blue
export const THEME = {
    primary: "#1890ff",
    primaryHover: "#40a9ff",
    primaryLight: "#e6f7ff",
    primaryBorder: "#91d5ff",
};

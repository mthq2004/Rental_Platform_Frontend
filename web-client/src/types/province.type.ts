// Ward (Xã/Phường/Thị trấn)
export interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  short_codename?: string;
}

// District (Quận/Huyện/Thị xã)
export interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  short_codename?: string;
  wards?: Ward[];
}

// Province (Tỉnh/Thành phố)
export interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts?: District[];
}

// Response types
export interface ProvinceListResponse {
  data: Province[];
  message?: string;
  success?: boolean;
}

// Selected location
export interface SelectedLocation {
  province?: Province;
  district?: District;
  ward?: Ward;
}

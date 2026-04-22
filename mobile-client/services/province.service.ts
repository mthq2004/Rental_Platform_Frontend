const PROVINCES_API_BASE = 'https://provinces.open-api.vn/api';

export interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  short_codename?: string;
}

export interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  short_codename?: string;
  wards?: Ward[];
}

export interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts?: District[];
}

export interface ProvinceItem {
  code: string | number;
  name: string;
}

const normalizeVietnamese = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

class ProvinceService {
  async getProvinces(): Promise<Province[]> {
    const response = await fetch(`${PROVINCES_API_BASE}/`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  async getProvinceWithDistricts(code: number): Promise<Province> {
    const response = await fetch(`${PROVINCES_API_BASE}/p/${code}?depth=2`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  async getDistrictWithWards(code: number): Promise<District> {
    const response = await fetch(`${PROVINCES_API_BASE}/d/${code}?depth=2`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  async searchProvinces(keyword: string): Promise<Province[]> {
    const response = await fetch(
      `${PROVINCES_API_BASE}/p/search/?q=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  async searchDistricts(keyword: string): Promise<District[]> {
    const response = await fetch(
      `${PROVINCES_API_BASE}/d/search/?q=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }
}

export const searchAddressItems = <T extends ProvinceItem>(
  items: T[],
  keyword: string
): T[] => {
  if (!keyword.trim()) return items;

  const normalizedKeyword = normalizeVietnamese(keyword);

  return items.filter((item) =>
    normalizeVietnamese(item.name).includes(normalizedKeyword)
  );
};

const provinceService = new ProvinceService();

export default provinceService;

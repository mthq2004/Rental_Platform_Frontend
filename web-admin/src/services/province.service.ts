import type { Province, District } from "../types/province.type";

const PROVINCES_API_BASE = "https://provinces.open-api.vn/api";

class ProvinceService {
  /** Lấy tất cả tỉnh/thành phố */
  async getProvinces(): Promise<Province[]> {
    const response = await fetch(`${PROVINCES_API_BASE}/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /** Lấy tỉnh/thành phố kèm danh sách quận/huyện (depth=2) */
  async getProvinceWithDistricts(code: number): Promise<Province> {
    const response = await fetch(`${PROVINCES_API_BASE}/p/${code}?depth=2`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /** Lấy quận/huyện kèm danh sách xã/phường (depth=2) */
  async getDistrictWithWards(code: number): Promise<District> {
    const response = await fetch(`${PROVINCES_API_BASE}/d/${code}?depth=2`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /** Tìm kiếm tỉnh/thành phố theo tên */
  async searchProvinces(keyword: string): Promise<Province[]> {
    const response = await fetch(
      `${PROVINCES_API_BASE}/p/search/?q=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /** Tìm kiếm quận/huyện theo tên */
  async searchDistricts(keyword: string): Promise<District[]> {
    const response = await fetch(
      `${PROVINCES_API_BASE}/d/search/?q=${encodeURIComponent(keyword)}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}

const provinceService = new ProvinceService();
export default provinceService;

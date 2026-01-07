import { Province, District } from "@/types/province.type";

const PROVINCES_API_BASE = "https://provinces.open-api.vn/api";

class ProvinceService {
  /**
   * Lấy danh sách tất cả tỉnh/thành phố
   */
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${PROVINCES_API_BASE}/`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching provinces:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin tỉnh/thành phố theo mã, bao gồm danh sách quận/huyện
   * @param code - Mã tỉnh/thành phố
   */
  async getProvinceWithDistricts(code: number): Promise<Province> {
    try {
      const response = await fetch(`${PROVINCES_API_BASE}/p/${code}?depth=2`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching province with districts:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin quận/huyện theo mã, bao gồm danh sách xã/phường
   * @param code - Mã quận/huyện
   */
  async getDistrictWithWards(code: number): Promise<District> {
    try {
      const response = await fetch(`${PROVINCES_API_BASE}/d/${code}?depth=2`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching district with wards:", error);
      throw error;
    }
  }

  /**
   * Tìm kiếm tỉnh/thành phố theo tên
   * @param keyword - Từ khóa tìm kiếm
   */
  async searchProvinces(keyword: string): Promise<Province[]> {
    try {
      const response = await fetch(
        `${PROVINCES_API_BASE}/p/search/?q=${encodeURIComponent(keyword)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error searching provinces:", error);
      throw error;
    }
  }

  /**
   * Tìm kiếm quận/huyện theo tên
   * @param keyword - Từ khóa tìm kiếm
   */
  async searchDistricts(keyword: string): Promise<District[]> {
    try {
      const response = await fetch(
        `${PROVINCES_API_BASE}/d/search/?q=${encodeURIComponent(keyword)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error searching districts:", error);
      throw error;
    }
  }
}

const provinceService = new ProvinceService();
export default provinceService;

import apiClient from "@/utils/api";
import type { PropertyCountByCity, PropertyType } from "@/types/property.type";

class PropertyService {
  async getPropertyCountByCity(type?: PropertyType): Promise<PropertyCountByCity[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    const response = await apiClient.get(`/estate/properties/number-property${query}`);
    return (response?.data ?? []) as PropertyCountByCity[];
  }
}

const propertyService = new PropertyService();
export default propertyService;

import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { clearAuthStorage, getAccessToken } from "./secureStorage";

console.log("EXPO_PUBLIC_API_URL: ", process.env.EXPO_PUBLIC_API_URL);


const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Interceptor thêm token vào header
apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Interceptor xử lý lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuthStorage();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
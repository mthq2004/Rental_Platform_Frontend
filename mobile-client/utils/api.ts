import axios from "axios";
import * as SecureStore from "expo-secure-store";

console.log("EXPO_PUBLIC_API_URL: ", process.env.EXPO_PUBLIC_API_URL);


const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Interceptor thêm token vào header
apiClient.interceptors.request.use(async (config) => {
  // const token = await SecureStore.getItemAsync("token");
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5Y2JkMzMzLWI4YzEtNGY1NS04MmU5LWY0MDgyYWNiMzc0MiIsInJvbGUiOiJhZG1pbiIsInRva2VuVHlwZSI6IkFjY2Vzc1Rva2VuIiwiaWF0IjoxNzY5MTYxOTk0LCJleHAiOjE3NjkyNDgzOTR9.vDQNOKjD7UBnlnEAVAtPOr9pseRnj8lnZcA4h8iR5pU"
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
      await SecureStore.deleteItemAsync("token");
      // Redirect về login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
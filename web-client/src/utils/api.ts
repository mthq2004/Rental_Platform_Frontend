"use client";
import envConfig from "@/config";
import Cookies from "js-cookie";

type HttpOptions = {
  headers?: Record<string, string>;
  contentType?: string;
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

class HttpClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || envConfig.NEXT_PUBLIC_API_ENDPOINT;
    // Load token from cookie on init
    this.accessToken = Cookies.get("accessToken") || null;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      // Save to Secure Cookie
      Cookies.set("accessToken", token, {
        secure: true, // Only send over HTTPS (requires HTTPS or localhost)
        sameSite: "strict",
        expires: 7 // 7 days
      });
    } else {
      Cookies.remove("accessToken");
    }
  }

  private getAccessToken(): string | null {
    // Priority: Memory -> Cookie
    return this.accessToken || Cookies.get("accessToken") || null;
  }

  private buildHeaders(
    options?: HttpOptions,
    data?: any
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    // Nếu data là FormData, không set Content-Type (browser tự động set với boundary)
    if (!(data instanceof FormData)) {
      headers["Content-Type"] = options?.contentType || "application/json";
    }

    // Thêm access token vào header nếu có
    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Merge với headers tùy chỉnh
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    options?: HttpOptions
  ) {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`
      }`;

    const headers = this.buildHeaders(options, data);

    const config: RequestInit = {
      method,
      headers,
    };

    // Thêm body cho POST, PUT, DELETE
    if (data && method !== "GET") {
      // Nếu data là FormData, gửi trực tiếp; nếu không thì JSON.stringify
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    // Timeout implementation using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    config.signal = controller.signal;

    console.log('[API] Fetching:', method, url);

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      if (networkError instanceof Error && networkError.name === 'AbortError') {
        console.error('[API] Request timed out:', url);
        throw new Error("Request timed out. Please try again.");
      }
      console.error('[API] Network error:', networkError);
      console.error('[API] URL:', url);
      console.error('[API] Config:', config);
      throw networkError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        this.setAccessToken(null);
        // Optional: Window.location.href = '/login' if strictly needed,
        // but usually handled by UI state (redux)
      }
      try {
        const error = await response.json();
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : `HTTP Error: ${response.status}`;
        throw new Error(errorMsg);
      }
    }

    try {
      return await response.json();
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      throw new Error("Invalid response format from server");
    }
  }

  get(endpoint: string, options?: HttpOptions) {
    return this.request("GET", endpoint, undefined, options);
  }

  post(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request("POST", endpoint, data, options);
  }

  put(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request("PUT", endpoint, data, options);
  }

  delete(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request("DELETE", endpoint, data, options);
  }

  patch(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request("PATCH", endpoint, data, options);
  }
}

// Export instance mặc định
const http = new HttpClient();
export default http;

// Export class để có thể tạo instance mới với baseUrl khác
export { HttpClient };

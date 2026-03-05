/**
 * Upload Service - Handles file uploads to backend (which then uploads to Cloudinary)
 */
import Cookies from "js-cookie";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

export interface UploadedMedia {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    resourceType: "image" | "video";
    width?: number;
    height?: number;
    duration?: number;
    bytes: number;
    thumbnail?: string;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface UploadResult {
    success: boolean;
    data?: UploadedMedia | UploadedMedia[];
    message?: string;
}

/**
 * Get auth token from Cookies (consistent with api.ts)
 */
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    // Get from Cookies (where the app stores auth tokens)
    try {
        const token = Cookies.get("accessToken");
        return token || null;
    } catch (error) {
        console.warn("Failed to get auth token:", error);
        return null;
    }
}

/**
 * Parse upload response - handles multiple response formats from backend
 * Backend wraps all responses: { statusCode, timestamp, message, data: <controller return> }
 * Upload controller returns: { success: true, data: { publicId, secureUrl, ... } }
 * So full response is: { statusCode, ..., data: { success: true, data: { publicId, ... } } }
 */
function parseUploadResponse(response: any): UploadedMedia | UploadedMedia[] | null {
    // Unwrap backend ResponseInterceptor wrapper: { statusCode, data: <inner> }
    let inner = response;
    if (response.statusCode !== undefined && response.data) {
        inner = response.data;
    }

    // Unwrap upload controller wrapper: { success: true, data: <media> }
    if (inner.success && inner.data) {
        return inner.data;
    }

    // Format: { data: {...} } or { data: [...] }
    if (inner.data && (typeof inner.data === 'object' || Array.isArray(inner.data))) {
        return inner.data;
    }

    // Direct media object
    if (inner.publicId && inner.secureUrl) {
        return inner;
    }

    // Array of media objects
    if (Array.isArray(inner) && inner.length > 0 && inner[0].publicId) {
        return inner;
    }

    return null;
}

/**
 * Parse error response from XHR
 */
function parseErrorResponse(xhr: XMLHttpRequest, context: string): Error {
    try {
        const errorResponse = JSON.parse(xhr.responseText);
        console.error(`[${context}] Error response:`, errorResponse);
        return new Error(errorResponse.message || `Upload thất bại (HTTP ${xhr.status})`);
    } catch (e) {
        console.error(`[${context}] Failed to parse error response:`, xhr.responseText);
        return new Error(`Upload thất bại (HTTP ${xhr.status}: ${xhr.statusText})`);
    }
}

/**
 * Upload a single image
 */
export async function uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadedMedia> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        // Timeout: 60s for images
        xhr.timeout = 60000;

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress: UploadProgress = {
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                };
                onProgress(progress);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    const data = parseUploadResponse(response);
                    if (data) {
                        resolve(data as UploadedMedia);
                    } else {
                        const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                        console.error('[Upload] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Upload] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                reject(parseErrorResponse(xhr, 'Upload'));
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Lỗi mạng khi tải ảnh lên. Vui lòng kiểm tra kết nối."));
        });

        xhr.addEventListener("timeout", () => {
            reject(new Error("Upload ảnh quá thời gian. Vui lòng thử lại."));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload đã bị hủy"));
        });

        xhr.open("POST", `${API_ENDPOINT}/api/estate/upload/image`, true);

        // Add auth token - IMPORTANT: Set headers AFTER open() but BEFORE send()
        const token = getAuthToken();
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        
        // Don't manually set Content-Type - let browser handle it for FormData

        xhr.send(formData);
    });
}

/**
 * Upload multiple images
 */
export async function uploadImages(
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadedMedia[]> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        const xhr = new XMLHttpRequest();

        // Timeout: 120s for multiple images
        xhr.timeout = 120000;

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress: UploadProgress = {
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                };
                onProgress(0, progress);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    const data = parseUploadResponse(response);
                    if (data) {
                        resolve(Array.isArray(data) ? data : [data]);
                    } else {
                        const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                        console.error('[Upload Multiple] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Upload Multiple] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                reject(parseErrorResponse(xhr, 'Upload Multiple'));
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Lỗi mạng khi tải ảnh lên. Vui lòng kiểm tra kết nối."));
        });

        xhr.addEventListener("timeout", () => {
            reject(new Error("Upload ảnh quá thời gian. Vui lòng thử lại."));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload đã bị hủy"));
        });

        xhr.open("POST", `${API_ENDPOINT}/api/estate/upload/images`, true);

        const token = getAuthToken();
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
    });
}

/**
 * Upload a single video
 */
export async function uploadVideo(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadedMedia> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();

        // Timeout: 5 minutes for video uploads (large files)
        xhr.timeout = 300000;

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress: UploadProgress = {
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                };
                onProgress(progress);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    const data = parseUploadResponse(response);
                    if (data) {
                        resolve(data as UploadedMedia);
                    } else {
                        const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                        console.error('[Video Upload] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Video Upload] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                reject(parseErrorResponse(xhr, 'Video Upload'));
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Lỗi mạng khi tải video lên. Vui lòng kiểm tra kết nối."));
        });

        xhr.addEventListener("timeout", () => {
            reject(new Error("Upload video quá thời gian (>5 phút). Vui lòng thử file nhỏ hơn."));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload đã bị hủy"));
        });

        xhr.open("POST", `${API_ENDPOINT}/api/estate/upload/video`, true);

        const token = getAuthToken();
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
    });
}

/**
 * Upload multiple videos
 */
export async function uploadVideos(
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadedMedia[]> {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        const xhr = new XMLHttpRequest();

        // Timeout: 10 minutes for multiple video uploads
        xhr.timeout = 600000;

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress: UploadProgress = {
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                };
                onProgress(0, progress);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    const data = parseUploadResponse(response);
                    if (data) {
                        resolve(Array.isArray(data) ? data : [data]);
                    } else {
                        const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                        console.error('[Video Upload Multiple] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Video Upload Multiple] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                reject(parseErrorResponse(xhr, 'Video Upload Multiple'));
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Lỗi mạng khi tải video lên. Vui lòng kiểm tra kết nối."));
        });

        xhr.addEventListener("timeout", () => {
            reject(new Error("Upload video quá thời gian. Vui lòng thử file nhỏ hơn."));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload đã bị hủy"));
        });

        xhr.open("POST", `${API_ENDPOINT}/api/estate/upload/videos`, true);

        const token = getAuthToken();
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        xhr.send(formData);
    });
}

/**
 * Get optimized Cloudinary image URL
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: "auto" | number;
        format?: "auto" | "webp" | "jpg" | "png";
    } = {}
): string {
    const { width, height, quality = "auto", format = "auto" } = options;

    // If it's already a Cloudinary URL, add transformations
    if (url.includes("cloudinary.com")) {
        const parts = url.split("/upload/");
        if (parts.length === 2) {
            let transformations = `f_${format},q_${quality}`;
            if (width) transformations += `,w_${width}`;
            if (height) transformations += `,h_${height}`;
            if (width || height) transformations += `,c_fill`;

            return `${parts[0]}/upload/${transformations}/${parts[1]}`;
        }
    }

    return url;
}

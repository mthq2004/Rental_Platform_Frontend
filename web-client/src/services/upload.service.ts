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
        
        // Enable credentials for cross-origin requests
        xhr.withCredentials = true;

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
                    console.log('[Upload] Response:', response);
                    
                    // Handle multiple response formats from backend
                    // Format 1: { success: true, data: {...} }
                    if (response.success && response.data) {
                        resolve(response.data);
                        return;
                    }
                    
                    // Format 2: { data: {...} } (success field not required)
                    if (response.data && typeof response.data === 'object') {
                        resolve(response.data);
                        return;
                    }
                    
                    // Format 3: Direct response is the media object
                    if (response.publicId && response.secureUrl) {
                        resolve(response);
                        return;
                    }
                    
                    // If none of the above, treat as error
                    const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                    console.error('[Upload] Invalid response format:', response);
                    reject(new Error(errorMsg));
                } catch (e) {
                    console.error('[Upload] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    console.error('[Upload] Error response:', errorResponse);
                    reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                } catch (e) {
                    console.error('[Upload] Failed to parse error response:', xhr.responseText);
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"));
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
        
        // Enable credentials for cross-origin requests
        xhr.withCredentials = true;

        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable && onProgress) {
                const progress: UploadProgress = {
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                };
                // Report progress for all files combined
                onProgress(0, progress);
            }
        });

        xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log('[Upload Multiple] Response:', response);
                    
                    // Handle multiple response formats from backend
                    if (response.success && Array.isArray(response.data)) {
                        resolve(response.data);
                        return;
                    }
                    
                    if (Array.isArray(response.data)) {
                        resolve(response.data);
                        return;
                    }
                    
                    if (Array.isArray(response)) {
                        resolve(response);
                        return;
                    }
                    
                    const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                    console.error('[Upload Multiple] Invalid response format:', response);
                    reject(new Error(errorMsg));
                } catch (e) {
                    console.error('[Upload Multiple] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    console.error('[Upload Multiple] Error response:', errorResponse);
                    reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                } catch (e) {
                    console.error('[Upload Multiple] Failed to parse error response:', xhr.responseText);
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"));
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
        
        // Enable credentials for cross-origin requests
        xhr.withCredentials = true;

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
                    console.log('[Video Upload] Response:', response);
                    
                    // Handle multiple response formats from backend
                    if (response.success && response.data) {
                        resolve(response.data);
                        return;
                    }
                    
                    if (response.data && typeof response.data === 'object') {
                        resolve(response.data);
                        return;
                    }
                    
                    if (response.publicId && response.secureUrl) {
                        resolve(response);
                        return;
                    }
                    
                    const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                    console.error('[Video Upload] Invalid response format:', response);
                    reject(new Error(errorMsg));
                } catch (e) {
                    console.error('[Video Upload] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    console.error('[Video Upload] Error response:', errorResponse);
                    reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                } catch (e) {
                    console.error('[Video Upload] Failed to parse error response:', xhr.responseText);
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"));
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
        
        // Enable credentials for cross-origin requests
        xhr.withCredentials = true;

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
                    console.log('[Video Upload Multiple] Response:', response);
                    
                    // Handle multiple response formats from backend
                    if (response.success && Array.isArray(response.data)) {
                        resolve(response.data);
                        return;
                    }
                    
                    if (Array.isArray(response.data)) {
                        resolve(response.data);
                        return;
                    }
                    
                    if (Array.isArray(response)) {
                        resolve(response);
                        return;
                    }
                    
                    const errorMsg = response.message || response.error || "Upload failed - invalid response format";
                    console.error('[Video Upload Multiple] Invalid response format:', response);
                    reject(new Error(errorMsg));
                } catch (e) {
                    console.error('[Video Upload Multiple] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Failed to parse response: " + (e as Error).message));
                }
            } else {
                try {
                    const errorResponse = JSON.parse(xhr.responseText);
                    console.error('[Video Upload Multiple] Error response:', errorResponse);
                    reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
                } catch (e) {
                    console.error('[Video Upload Multiple] Failed to parse error response:', xhr.responseText);
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
                }
            }
        });

        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"));
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

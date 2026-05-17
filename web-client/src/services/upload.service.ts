/**
 * Upload Service - Handles file uploads to backend (which then uploads to Cloudinary)
 */
import Cookies from "js-cookie";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000";

/**
 * Get upload URL that avoids CORS issues.
 * Uses Next.js /api-proxy rewrite when running in the browser,
 * so XHR requests stay same-origin and bypass CORS restrictions.
 */
function getUploadUrl(path: string): string {
    if (typeof window !== "undefined") {
        // Browser: use Next.js proxy to avoid CORS
        return `/api-proxy${path.startsWith("/") ? path : `/${path}`}`;
    }
    return `${API_ENDPOINT}/api${path.startsWith("/") ? path : `/${path}`}`;
}

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
 * Vietnamese error messages for common HTTP status codes
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
    413: "Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.",
    401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền tải lên tệp. Vui lòng kiểm tra tài khoản.",
    404: "Không tìm thấy dịch vụ tải lên. Vui lòng thử lại sau.",
    408: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.",
    429: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lát rồi thử lại.",
    500: "Lỗi máy chủ. Vui lòng thử lại sau.",
    502: "Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.",
    503: "Dịch vụ đang bảo trì. Vui lòng thử lại sau.",
    504: "Máy chủ phản hồi quá chậm. Vui lòng thử lại sau.",
};

/**
 * Parse error response from XHR — returns user-friendly Vietnamese error messages
 */
function parseErrorResponse(xhr: XMLHttpRequest, context: string): Error {
    // 1. Check for well-known HTTP status codes first
    const knownMessage = HTTP_ERROR_MESSAGES[xhr.status];
    if (knownMessage) {
        if (process.env.NODE_ENV === "development") {
            console.warn(`[${context}] HTTP ${xhr.status}: ${knownMessage}`);
        }
        return new Error(knownMessage);
    }

    // 2. Try to parse JSON error response from API
    const raw = xhr.responseText || "";
    const isHtml = raw.trimStart().startsWith("<");

    if (!isHtml && raw) {
        try {
            const errorResponse = JSON.parse(raw);
            const msg = errorResponse.message || errorResponse.error;
            if (msg) {
                return new Error(msg);
            }
        } catch {
            // Not JSON — fall through to generic message
        }
    }

    // 3. Generic fallback in Vietnamese
    return new Error(`Tải lên thất bại (lỗi ${xhr.status}). Vui lòng thử lại.`);
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
                        const errorMsg = response.message || response.error || "Tải ảnh lên thất bại — định dạng phản hồi không hợp lệ";
                        console.error('[Upload] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Upload] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Không thể xử lý phản hồi từ máy chủ. Vui lòng thử lại."));
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

        xhr.open("POST", getUploadUrl("/estate/upload/image"), true);

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
                        const errorMsg = response.message || response.error || "Tải ảnh lên thất bại — định dạng phản hồi không hợp lệ";
                        console.error('[Upload Multiple] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Upload Multiple] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Không thể xử lý phản hồi từ máy chủ. Vui lòng thử lại."));
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

        xhr.open("POST", getUploadUrl("/estate/upload/images"), true);

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
                        const errorMsg = response.message || response.error || "Tải video lên thất bại — định dạng phản hồi không hợp lệ";
                        console.error('[Video Upload] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Video Upload] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Không thể xử lý phản hồi từ máy chủ. Vui lòng thử lại."));
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

        xhr.open("POST", getUploadUrl("/estate/upload/video"), true);

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
                        const errorMsg = response.message || response.error || "Tải video lên thất bại — định dạng phản hồi không hợp lệ";
                        console.error('[Video Upload Multiple] Invalid response format:', response);
                        reject(new Error(errorMsg));
                    }
                } catch (e) {
                    console.error('[Video Upload Multiple] Failed to parse response:', xhr.responseText, e);
                    reject(new Error("Không thể xử lý phản hồi từ máy chủ. Vui lòng thử lại."));
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

        xhr.open("POST", getUploadUrl("/estate/upload/videos"), true);

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

// ── S3 Upload (for non-image files like PDF, DOCX) ──────────────────

export interface S3UploadResult {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
}

/**
 * Get a presigned URL from chat-service for S3 upload.
 * Uses the existing `getUploadUrl` utility which handles auth + response unwrapping.
 */
async function getS3PresignedUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
    const token = getAuthToken();
    const res = await fetch(getUploadUrl("/chat/upload-file"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileName, fileType }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Lấy URL upload thất bại: ${res.status} ${errText}`);
    }

    const json = await res.json();
    // API response may be wrapped: { data: { uploadUrl, fileUrl } } or direct { uploadUrl, fileUrl }
    const data = json.data || json;
    if (!data.uploadUrl || !data.fileUrl) {
        console.error("[S3 Upload] Unexpected response:", json);
        throw new Error("Phản hồi từ server không hợp lệ khi lấy URL upload");
    }
    return { uploadUrl: data.uploadUrl, fileUrl: data.fileUrl };
}

/**
 * Upload a single file to S3 using presigned URL
 */
export async function uploadFileToS3(file: File): Promise<S3UploadResult> {
    // 1. Get presigned URL
    const { uploadUrl, fileUrl } = await getS3PresignedUrl(file.name, file.type || "application/octet-stream");

    // 2. Upload directly to S3
    const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
    });

    if (!uploadRes.ok) {
        throw new Error(`Upload tệp lên S3 thất bại: ${uploadRes.status}`);
    }

    return {
        url: fileUrl,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
    };
}

/**
 * Upload multiple files to S3
 */
export async function uploadFilesToS3(files: File[]): Promise<S3UploadResult[]> {
    return Promise.all(files.map((file) => uploadFileToS3(file)));
}

/**
 * Helper: check if a File is an image type
 */
export function isFileImage(file: File): boolean {
    return file.type.startsWith("image/");
}

/** Maximum file size per file (5MB) — nginx server limits total request body */
const MAX_UPLOAD_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validate file size before uploading.
 * Throws a user-friendly Vietnamese error if file is too large.
 */
function validateFileSize(file: File, maxBytes: number = MAX_UPLOAD_FILE_SIZE): void {
    if (file.size > maxBytes) {
        const maxMB = Math.round(maxBytes / (1024 * 1024));
        throw new Error(
            `Tệp "${file.name}" có dung lượng ${(file.size / (1024 * 1024)).toFixed(1)}MB, vượt quá giới hạn ${maxMB}MB. Vui lòng chọn tệp nhỏ hơn.`
        );
    }
}

/**
 * Upload mixed files: images → Cloudinary (one-by-one), documents → S3
 * Returns a unified array of attachment metadata.
 *
 * Images are uploaded individually (not batched) to avoid exceeding
 * the nginx reverse-proxy body size limit on the server.
 */
export async function uploadMixedFiles(
    files: File[]
): Promise<{ url: string; type: string; fileName?: string; fileSize?: number }[]> {
    // 1. Validate all file sizes upfront
    for (const file of files) {
        validateFileSize(file);
    }

    const imageFiles = files.filter((f) => isFileImage(f));
    const docFiles = files.filter((f) => !isFileImage(f));

    const results: { url: string; type: string; fileName?: string; fileSize?: number }[] = [];

    // 2. Upload images one-by-one to avoid 413 (nginx body size limit)
    for (const imageFile of imageFiles) {
        const uploaded = await uploadImage(imageFile);
        results.push({
            url: uploaded.secureUrl || uploaded.url,
            type: "image",
            fileName: imageFile.name || uploaded.publicId || undefined,
            fileSize: uploaded.bytes || imageFile.size || undefined,
        });
    }

    // 3. Upload documents to S3
    if (docFiles.length > 0) {
        const uploaded = await uploadFilesToS3(docFiles);
        for (const u of uploaded) {
            results.push({
                url: u.url,
                type: "document",
                fileName: u.fileName,
                fileSize: u.fileSize,
            });
        }
    }

    return results;
}

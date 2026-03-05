"use client";
import React, { useRef, useState, useCallback, DragEvent } from "react";
import { App, Progress, Spin } from "antd";
import {
    CameraOutlined,
    VideoCameraOutlined,
    CloseOutlined,
    PlusOutlined,
    DeleteOutlined,
    InfoCircleFilled,
    LoadingOutlined,
    CheckCircleFilled,
    CloudUploadOutlined,
    DragOutlined,
} from "@ant-design/icons";
import {
    uploadImage,
    uploadVideo,
    UploadProgress,
} from "@/services/upload.service";
import { MediaItem } from "./types";

interface MediaUploadSectionProps {
    images: MediaItem[];
    setImages: React.Dispatch<React.SetStateAction<MediaItem[]>>;
    videos: MediaItem[];
    setVideos: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MediaUploadSection({
    images,
    setImages,
    videos,
    setVideos,
}: MediaUploadSectionProps) {
    const { message } = App.useApp();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageDragActive, setImageDragActive] = useState(false);
    const [videoDragActive, setVideoDragActive] = useState(false);

    // ====== Drag & Drop handlers ======
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleImageDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setImageDragActive(true);
    }, []);

    const handleImageDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set inactive if we're leaving the drop zone (not entering a child)
        if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
            setImageDragActive(false);
        }
    }, []);

    const handleVideoDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setVideoDragActive(true);
    }, []);

    const handleVideoDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
            setVideoDragActive(false);
        }
    }, []);

    // ====== Image upload logic ======
    const handleSingleImageUpload = async (file: File, tempId: string) => {
        try {
            const result = await uploadImage(file, (progress: UploadProgress) => {
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === tempId
                            ? { ...img, progress: progress.percentage }
                            : img
                    )
                );
            });

            setImages((prev) =>
                prev.map((img) =>
                    img.id === tempId
                        ? {
                            ...img,
                            id: result.publicId,
                            uri: result.secureUrl,
                            uploading: false,
                            uploaded: true,
                            progress: 100,
                        }
                        : img
                )
            );
        } catch (error: any) {
            setImages((prev) =>
                prev.map((img) =>
                    img.id === tempId
                        ? {
                            ...img,
                            uploading: false,
                            error: error.message || "Upload failed",
                        }
                        : img
                )
            );
            message.error(`Upload ảnh thất bại: ${error.message}`);
        }
    };

    // Validate and process image files
    const processImageFiles = async (fileArray: File[]) => {
        if (images.length + fileArray.length > 12) {
            message.warning(`Tối đa 12 hình ảnh. Bạn chỉ có thể thêm ${12 - images.length} ảnh nữa.`);
            fileArray = fileArray.slice(0, 12 - images.length);
        }

        const validFiles: File[] = [];
        for (const file of fileArray) {
            if (!file.type.startsWith("image/")) {
                message.error(`${file.name} không phải là file ảnh hợp lệ`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                message.error(`${file.name} vượt quá 10MB (${formatFileSize(file.size)})`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setIsUploading(true);

        const newItems: MediaItem[] = validFiles.map((file) => ({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            uri: "",
            uploading: true,
            progress: 0,
            uploaded: false,
        }));

        setImages((prev) => [...prev, ...newItems]);

        await Promise.all(
            newItems.map((item) => handleSingleImageUpload(item.file!, item.id))
        );

        setIsUploading(false);
    };

    // Handle image input change
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        await processImageFiles(Array.from(files));
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    // Handle image drop
    const handleImageDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setImageDragActive(false);

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (imageFiles.length === 0) {
            message.error("Vui lòng kéo thả file ảnh (JPEG, PNG, GIF, WebP)");
            return;
        }
        await processImageFiles(imageFiles);
    }, [images.length, message]);

    // ====== Video upload logic ======
    const handleSingleVideoUpload = async (file: File, tempId: string) => {
        try {
            const result = await uploadVideo(file, (progress: UploadProgress) => {
                setVideos((prev) =>
                    prev.map((vid) =>
                        vid.id === tempId
                            ? { ...vid, progress: progress.percentage }
                            : vid
                    )
                );
            });

            setVideos((prev) =>
                prev.map((vid) =>
                    vid.id === tempId
                        ? {
                            ...vid,
                            id: result.publicId,
                            uri: result.secureUrl,
                            preview: result.thumbnail || vid.preview,
                            uploading: false,
                            uploaded: true,
                            progress: 100,
                        }
                        : vid
                )
            );
        } catch (error: any) {
            setVideos((prev) =>
                prev.map((vid) =>
                    vid.id === tempId
                        ? {
                            ...vid,
                            uploading: false,
                            error: error.message || "Upload failed",
                        }
                        : vid
                )
            );
            message.error(`Upload video thất bại: ${error.message}`);
        }
    };

    // Validate and process video files
    const processVideoFiles = async (fileArray: File[]) => {
        if (videos.length + fileArray.length > 3) {
            message.warning(`Tối đa 3 video. Bạn chỉ có thể thêm ${3 - videos.length} video nữa.`);
            fileArray = fileArray.slice(0, 3 - videos.length);
        }

        const validFiles: File[] = [];
        for (const file of fileArray) {
            if (!file.type.startsWith("video/")) {
                message.error(`${file.name} không phải là file video hợp lệ`);
                continue;
            }
            if (file.size > 100 * 1024 * 1024) {
                message.error(`${file.name} vượt quá 100MB (${formatFileSize(file.size)})`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setIsUploading(true);

        const newItems: MediaItem[] = validFiles.map((file) => ({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            uri: "",
            uploading: true,
            progress: 0,
            uploaded: false,
        }));

        setVideos((prev) => [...prev, ...newItems]);

        await Promise.all(
            newItems.map((item) => handleSingleVideoUpload(item.file!, item.id))
        );

        setIsUploading(false);
    };

    // Handle video input change
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        await processVideoFiles(Array.from(files));
        if (videoInputRef.current) videoInputRef.current.value = "";
    };

    // Handle video drop
    const handleVideoDrop = useCallback(async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setVideoDragActive(false);

        const files = e.dataTransfer?.files;
        if (!files || files.length === 0) return;

        const videoFiles = Array.from(files).filter(f => f.type.startsWith("video/"));
        if (videoFiles.length === 0) {
            message.error("Vui lòng kéo thả file video (MP4, MOV, AVI, WebM)");
            return;
        }
        await processVideoFiles(videoFiles);
    }, [videos.length, message]);

    // ====== Remove & Retry ======
    const removeImage = (id: string) => {
        setImages((prev) => {
            const item = prev.find((img) => img.id === id);
            if (item?.preview && item.preview.startsWith("blob:")) {
                URL.revokeObjectURL(item.preview);
            }
            return prev.filter((img) => img.id !== id);
        });
    };

    const removeVideo = (id: string) => {
        setVideos((prev) => {
            const item = prev.find((vid) => vid.id === id);
            if (item?.preview && item.preview.startsWith("blob:")) {
                URL.revokeObjectURL(item.preview);
            }
            return prev.filter((vid) => vid.id !== id);
        });
    };

    const retryImageUpload = async (id: string) => {
        const item = images.find((img) => img.id === id);
        if (!item?.file) return;

        setImages((prev) =>
            prev.map((img) =>
                img.id === id
                    ? { ...img, uploading: true, progress: 0, error: undefined }
                    : img
            )
        );
        await handleSingleImageUpload(item.file, id);
    };

    const retryVideoUpload = async (id: string) => {
        const item = videos.find((vid) => vid.id === id);
        if (!item?.file) return;

        setVideos((prev) =>
            prev.map((vid) =>
                vid.id === id
                    ? { ...vid, uploading: true, progress: 0, error: undefined }
                    : vid
            )
        );
        await handleSingleVideoUpload(item.file, id);
    };

    // ====== Counts ======
    const uploadedImageCount = images.filter((img) => img.uploaded).length;
    const uploadingImageCount = images.filter((img) => img.uploading).length;

    return (
        <div className="space-y-6">
            {/* Image Upload Section */}
            <div
                className={`bg-white rounded-xl p-6 border-2 border-dashed transition-colors ${
                    imageDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-blue-300 hover:border-blue-400"
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleImageDragEnter}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <InfoCircleFilled className="text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                            Hình ảnh ({images.length}/12)
                        </span>
                    </div>
                    {images.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {uploadedImageCount}/{images.length} đã tải lên
                        </span>
                    )}
                </div>

                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                />

                {images.length === 0 ? (
                    <div
                        className={`flex flex-col items-center justify-center py-8 cursor-pointer rounded-lg transition-colors ${
                            imageDragActive ? "bg-blue-100" : "hover:bg-blue-50"
                        }`}
                        onClick={() => imageInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                            {imageDragActive ? (
                                <DragOutlined className="text-3xl text-blue-500" />
                            ) : (
                                <CameraOutlined className="text-3xl text-blue-500" />
                            )}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                            {imageDragActive ? "Thả ảnh tại đây" : "ĐĂNG TỪ 03 ĐẾN 12 HÌNH"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Nhấn hoặc kéo thả để tải ảnh lên
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Hỗ trợ: JPEG, PNG, GIF, WebP - Tối đa 10MB/ảnh
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    className="relative aspect-square rounded-lg overflow-hidden group"
                                >
                                    <img
                                        src={img.preview || img.uri}
                                        alt={`Upload ${index + 1}`}
                                        className={`w-full h-full object-cover transition-opacity ${
                                            img.uploading ? "opacity-50" : ""
                                        }`}
                                    />

                                    {/* Upload overlay */}
                                    {img.uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                            <LoadingOutlined className="text-2xl text-white mb-2" />
                                            <Progress
                                                percent={img.progress}
                                                size="small"
                                                strokeColor="#1890ff"
                                                className="w-4/5"
                                                showInfo={false}
                                            />
                                            <span className="text-xs text-white mt-1">
                                                {img.progress}%
                                            </span>
                                        </div>
                                    )}

                                    {/* Success indicator */}
                                    {img.uploaded && !img.uploading && (
                                        <div className="absolute top-1 left-1">
                                            <CheckCircleFilled className="text-green-500 text-lg" />
                                        </div>
                                    )}

                                    {/* File size badge */}
                                    {img.file && !img.uploading && (
                                        <div className="absolute top-1 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                                                {formatFileSize(img.file.size)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Error state */}
                                    {img.error && (
                                        <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2">
                                            <span className="text-xs text-white text-center mb-2">
                                                Upload thất bại
                                            </span>
                                            <button
                                                onClick={() => retryImageUpload(img.id)}
                                                className="text-xs bg-white text-red-500 px-2 py-1 rounded"
                                            >
                                                Thử lại
                                            </button>
                                        </div>
                                    )}

                                    {/* Remove button */}
                                    {!img.uploading && (
                                        <button
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        >
                                            <CloseOutlined className="text-xs" />
                                        </button>
                                    )}

                                    {/* Primary image badge */}
                                    {index === 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
                                            <span className="text-xs text-white font-medium">
                                                Ảnh bìa
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add more button */}
                            {images.length < 12 && (
                                <div
                                    key="add-more-button"
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    <PlusOutlined className="text-2xl text-gray-400" />
                                    <span className="text-xs text-gray-400 mt-1">
                                        Thêm ảnh
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Upload status */}
                        {uploadingImageCount > 0 && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                <Spin size="small" />
                                <span>
                                    Đang tải lên {uploadingImageCount} ảnh...
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Video Upload Section */}
            <div
                className={`rounded-xl p-6 border transition-colors ${
                    videoDragActive
                        ? "bg-blue-100 border-blue-500 border-dashed"
                        : "bg-linear-to-br from-blue-50 to-blue-100 border-blue-200"
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleVideoDragEnter}
                onDragLeave={handleVideoDragLeave}
                onDrop={handleVideoDrop}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <InfoCircleFilled className="text-blue-500" />
                        <span className="text-sm font-medium text-blue-600">
                            Video ({videos.length}/3)
                        </span>
                    </div>
                    {videos.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {videos.filter((v) => v.uploaded).length}/{videos.length} đã tải lên
                        </span>
                    )}
                </div>

                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    multiple
                    className="hidden"
                    onChange={handleVideoUpload}
                />

                {videos.length === 0 ? (
                    <div
                        className={`flex flex-col items-center justify-center py-6 cursor-pointer rounded-lg transition-colors ${
                            videoDragActive ? "bg-blue-200/50" : "hover:bg-blue-100/50"
                        }`}
                        onClick={() => videoInputRef.current?.click()}
                    >
                        <div className="relative mb-4">
                            <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center">
                                {videoDragActive ? (
                                    <DragOutlined className="text-2xl text-white" />
                                ) : (
                                    <VideoCameraOutlined className="text-2xl text-white" />
                                )}
                            </div>
                            {!videoDragActive && (
                                <div className="absolute -top-1 -right-1 flex gap-0.5">
                                    <span className="text-lg">👍</span>
                                    <span className="text-lg">👍</span>
                                </div>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                            {videoDragActive ? "Thả video tại đây" : "Đăng video để cho thuê nhanh hơn"}
                        </p>
                        {!videoDragActive && (
                            <>
                                <p className="text-xs text-blue-600 flex items-center gap-1">
                                    🔥 Lượt xem tăng đến <span className="font-bold">x2</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Tối đa 3 video · MP4, MOV, AVI, WebM · Tối đa 100MB/video
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Nhấn hoặc kéo thả để tải video lên
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {videos.map((video, index) => (
                            <div
                                key={video.id}
                                className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden relative shrink-0">
                                        {video.preview && !video.preview.startsWith("blob:") ? (
                                            <img
                                                src={video.preview}
                                                alt="Video thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : video.uploaded && video.uri ? (
                                            <video
                                                src={video.uri}
                                                className="w-full h-full object-cover"
                                                muted
                                            />
                                        ) : (
                                            <VideoCameraOutlined className="text-gray-500 text-xl" />
                                        )}
                                        {video.uploading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <LoadingOutlined className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm text-gray-700 truncate block">
                                            {video.file?.name || `Video ${index + 1}`}
                                        </span>
                                        {video.file && (
                                            <span className="text-xs text-gray-400">
                                                {formatFileSize(video.file.size)}
                                            </span>
                                        )}
                                        {video.uploading && (
                                            <div className="mt-1">
                                                <Progress
                                                    percent={video.progress}
                                                    size="small"
                                                    strokeColor="#1890ff"
                                                    showInfo={false}
                                                />
                                                <span className="text-xs text-gray-400">
                                                    Đang tải lên... {video.progress}%
                                                </span>
                                            </div>
                                        )}
                                        {video.uploaded && (
                                            <span className="text-xs text-green-500 flex items-center gap-1">
                                                <CheckCircleFilled /> Đã tải lên
                                            </span>
                                        )}
                                        {video.error && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-red-500">
                                                    Upload thất bại
                                                </span>
                                                <button
                                                    onClick={() => retryVideoUpload(video.id)}
                                                    className="text-xs text-blue-500 hover:underline"
                                                >
                                                    Thử lại
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!video.uploading && (
                                    <button
                                        onClick={() => removeVideo(video.id)}
                                        className="text-red-500 hover:text-red-600 ml-2"
                                    >
                                        <DeleteOutlined />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add more video button */}
                        {videos.length < 3 && (
                            <button
                                key="add-more-video-button"
                                onClick={() => videoInputRef.current?.click()}
                                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <CloudUploadOutlined />
                                <span>Thêm video ({videos.length}/3)</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="text-sm text-gray-500">
                Xem thêm về{" "}
                <a href="#" className="text-blue-600 hover:underline">
                    Quy định đăng tin của Real Estate
                </a>
            </div>
        </div>
    );
}

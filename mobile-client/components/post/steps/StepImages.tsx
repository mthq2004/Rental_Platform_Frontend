import { PropertyImage, PropertyVideo, StepProps } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import {
    Alert, Animated, Dimensions, FlatList, Image,
    Modal, ScrollView, StatusBar, Text, TouchableOpacity, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { uploadToCloudinary } from "@/utils/uploadToCloudinary";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface UploadItem {
    id: string;
    name: string;
    type: "image" | "video";
    progress: number;
    status: "uploading" | "done" | "error";
    previewUri?: string;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ progress, color = "#3B82F6" }: { progress: number; color?: string }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, { toValue: progress, duration: 300, useNativeDriver: false }).start();
    }, [progress]);
    const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
    return (
        <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 999, overflow: "hidden" }}>
            <Animated.View style={{ height: "100%", width, backgroundColor: color, borderRadius: 999 }} />
        </View>
    );
};

// ─── Upload Queue Drawer ──────────────────────────────────────────────────────
// FIX: Không dùng position:absolute nữa — render như một View bình thường
// trong ScrollView, chỉ hiện/ẩn bằng cách show/hide với animated height
const UploadQueueDrawer = ({ items, visible }: { items: UploadItem[]; visible: boolean }) => {
    const heightAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const shouldShow = visible && items.length > 0;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(heightAnim, {
                toValue: shouldShow ? 1 : 0,
                useNativeDriver: false,
                tension: 60,
                friction: 12,
            }),
            Animated.timing(opacityAnim, {
                toValue: shouldShow ? 1 : 0,
                duration: 250,
                useNativeDriver: false,
            }),
        ]).start();
    }, [shouldShow]);

    // Estimate height: header ~56px + each item ~52px, max 3 items
    const estimatedHeight = 56 + Math.min(items.length, 3) * 54 + 32;
    const animatedHeight = heightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, estimatedHeight],
    });

    return (
        <Animated.View style={{
            height: animatedHeight,
            opacity: opacityAnim,
            overflow: "hidden",
            marginTop: 12,
            marginBottom: 4,
        }}>
            <View style={{
                backgroundColor: "#0F172A",
                borderRadius: 20,
                padding: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
            }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View style={{
                        width: 32, height: 32, borderRadius: 10, backgroundColor: "#1D4ED8",
                        alignItems: "center", justifyContent: "center", marginRight: 10,
                    }}>
                        <Ionicons name="cloud-upload" size={16} color="#fff" />
                    </View>
                    <Text style={{ color: "#F1F5F9", fontWeight: "700", fontSize: 14 }}>
                        Đang tải lên ({items.filter(i => i.status === "uploading").length} tệp)
                    </Text>
                    <Text style={{ color: "#64748B", fontSize: 12, marginLeft: "auto" }}>
                        {items.filter(i => i.status === "done").length}/{items.length} xong
                    </Text>
                </View>

                {items.slice(-3).map(item => (
                    <View key={item.id} style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
                        {item.previewUri ? (
                            <Image source={{ uri: item.previewUri }}
                                style={{ width: 36, height: 36, borderRadius: 8, marginRight: 10 }} />
                        ) : (
                            <View style={{
                                width: 36, height: 36, borderRadius: 8, backgroundColor: "#1E293B",
                                alignItems: "center", justifyContent: "center", marginRight: 10,
                            }}>
                                <Ionicons
                                    name={item.type === "image" ? "image-outline" : "videocam-outline"}
                                    size={16} color="#64748B" />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: "#CBD5E1", fontSize: 12, marginBottom: 5 }} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <ProgressBar progress={item.progress}
                                color={item.status === "error" ? "#EF4444" : item.status === "done" ? "#22C55E" : "#3B82F6"} />
                        </View>
                        <View style={{ marginLeft: 10, width: 32, alignItems: "center" }}>
                            {item.status === "uploading" && (
                                <Text style={{ color: "#60A5FA", fontSize: 11, fontWeight: "700" }}>{item.progress}%</Text>
                            )}
                            {item.status === "done" && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
                            {item.status === "error" && <Ionicons name="close-circle" size={20} color="#EF4444" />}
                        </View>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

// ─── Image Preview Modal ──────────────────────────────────────────────────────
const ImagePreviewModal = ({ images, initialIndex, visible, onClose }: {
    images: PropertyImage[]; initialIndex: number; visible: boolean; onClose: () => void;
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setCurrentIndex(initialIndex);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        } else {
            Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start();
        }
    }, [visible, initialIndex]);

    if (!visible) return null;
    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
            <Animated.View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.97)", opacity: fadeAnim }}>
                <StatusBar hidden />
                <View style={{
                    position: "absolute", top: 52, left: 0, right: 0,
                    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, zIndex: 10,
                }}>
                    <TouchableOpacity onPress={onClose} style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.12)",
                        alignItems: "center", justifyContent: "center",
                    }}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: "center" }}>
                        <View style={{
                            backgroundColor: "rgba(255,255,255,0.12)",
                            paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                                {currentIndex + 1} / {images.length}
                            </Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
                <FlatList
                    data={images}
                    horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    keyExtractor={item => item.id}
                    onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))}
                    getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                    renderItem={({ item }) => (
                        <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, alignItems: "center", justifyContent: "center" }}>
                            <Image
                                source={{ uri: item.uri }}
                                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
                                resizeMode="contain"
                            />
                            {item.isPrimary && (
                                <View style={{
                                    position: "absolute", bottom: SCREEN_HEIGHT * 0.14,
                                    backgroundColor: "#6366F1", paddingHorizontal: 14, paddingVertical: 6,
                                    borderRadius: 999, flexDirection: "row", alignItems: "center",
                                }}>
                                    <Ionicons name="star" size={13} color="#fff" style={{ marginRight: 4 }} />
                                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Ảnh đại diện</Text>
                                </View>
                            )}
                        </View>
                    )}
                />
                <View style={{
                    position: "absolute", bottom: 44, left: 0, right: 0,
                    flexDirection: "row", justifyContent: "center", gap: 6,
                }}>
                    {images.map((_, i) => (
                        <View key={i} style={{
                            width: i === currentIndex ? 20 : 6, height: 6, borderRadius: 3,
                            backgroundColor: i === currentIndex ? "#6366F1" : "rgba(255,255,255,0.25)",
                        }} />
                    ))}
                </View>
            </Animated.View>
        </Modal>
    );
};

// ─── Video Player Modal ───────────────────────────────────────────────────────
// FIX: Full screen video với flex:1, video chiếm toàn bộ chiều cao màn hình
const VideoPlayerModal = ({ video, visible, onClose }: {
    video: PropertyVideo | null; visible: boolean; onClose: () => void;
}) => {
    if (!visible || !video) return null;
    return (
        <Modal transparent={false} animationType="fade" visible={visible} onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: "#000" }}>
                <StatusBar hidden />

                {/* Close button */}
                <TouchableOpacity onPress={onClose} style={{
                    position: "absolute", top: 52, right: 20, zIndex: 10,
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Video full screen — chiếm toàn bộ View */}
                <Video
                    source={{ uri: video.uri }}
                    style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                />
            </View>
        </Modal>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StepImages = ({ formData, updateFormData, errors }: StepProps) => {
    const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
    const [showQueue, setShowQueue] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [videoModal, setVideoModal] = useState<{ visible: boolean; video: PropertyVideo | null }>({
        visible: false, video: null,
    });

    // ✅ useRef để tránh stale closure khi update ảnh sau upload
    const latestImagesRef = useRef<PropertyImage[]>(formData.images);
    useEffect(() => {
        latestImagesRef.current = formData.images;
    }, [formData.images]);

    const updateQueueItem = (id: string, patch: Partial<UploadItem>) => {
        setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    };

    const simulateProgress = (id: string) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 92) {
                clearInterval(interval);
                updateQueueItem(id, { progress: 92 });
            } else {
                updateQueueItem(id, { progress: Math.floor(progress) });
            }
        }, 220);
        return interval;
    };

    // ─── Pick Images ───────────────────────────────────────────────────────────
    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh"); return; }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, quality: 0.8,
        });
        if (result.canceled) return;

        setShowQueue(true);

        const newQueueItems: UploadItem[] = result.assets.map((asset, idx) => ({
            id: `img_${Date.now()}_${idx}`,
            name: asset.fileName ?? `image_${idx + 1}.jpg`,
            type: "image", progress: 0, status: "uploading",
            previewUri: asset.uri,
        }));

        const snapshotImages = latestImagesRef.current;
        const previewImages: PropertyImage[] = result.assets.map((asset, idx) => ({
            id: newQueueItems[idx].id,
            uri: asset.uri,
            isPrimary: snapshotImages.length === 0 && idx === 0,
        }));

        setUploadQueue(prev => [...prev, ...newQueueItems]);
        updateFormData({ images: [...snapshotImages, ...previewImages] });

        await Promise.all(
            result.assets.map(async (asset, index) => {
                const queueId = newQueueItems[index].id;
                const timer = simulateProgress(queueId);
                try {
                    const uploadResult = await uploadToCloudinary({
                        uri: asset.uri,
                        fileName: asset.fileName ?? `image_${Date.now()}_${index}.jpg`,
                        mimeType: asset.mimeType ?? "image/jpeg",
                        resourceType: "image",
                    });
                    clearInterval(timer);
                    updateQueueItem(queueId, { progress: 100, status: "done" });
                    updateFormData({
                        images: latestImagesRef.current.map(img =>
                            img.id === queueId
                                ? {
                                    ...img,
                                    uri: uploadResult.fileUrl
                                }
                                : img
                        ),
                    })
                } catch {
                    clearInterval(timer);
                    updateQueueItem(queueId, { status: "error" });
                }
            })
        );
        setTimeout(() => setShowQueue(false), 2000);
    };

    // ─── Pick Video ────────────────────────────────────────────────────────────
    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Lỗi", "Cần quyền truy cập thư viện video"); return; }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsMultipleSelection: true, quality: 1, videoMaxDuration: 120,
        });
        if (result.canceled) return;

        setShowQueue(true);
        const newQueueItems: UploadItem[] = result.assets.map((asset, idx) => ({
            id: `vid_${Date.now()}_${idx}`,
            name: asset.fileName ?? `video_${idx + 1}.mp4`,
            type: "video", progress: 0, status: "uploading",
        }));
        setUploadQueue(prev => [...prev, ...newQueueItems]);

        const uploadedVideos = await Promise.all(
            result.assets.map(async (asset, idx) => {
                const queueId = newQueueItems[idx].id;
                const timer = simulateProgress(queueId);
                try {
                    const uploadResult = await uploadToCloudinary({
                        uri: asset.uri,
                        fileName: asset.fileName ?? `video_${Date.now()}_${idx}.mp4`,
                        mimeType: asset.mimeType ?? "video/mp4",
                        resourceType: "video",
                    });
                    clearInterval(timer);
                    updateQueueItem(queueId, { progress: 100, status: "done" });
                    return {
                        id: queueId,
                        uri: uploadResult.fileUrl,
                        duration: uploadResult.duration ?? asset.duration ?? undefined
                    };
                } catch {
                    clearInterval(timer);
                    updateQueueItem(queueId, { status: "error" });
                    return null;
                }
            })
        );

        const validVideos = uploadedVideos.filter(Boolean) as PropertyVideo[];
        updateFormData({ videos: [...formData.videos, ...validVideos] });
        setTimeout(() => setShowQueue(false), 2000);
    };

    const removeImage = (id: string) =>
        updateFormData({ images: formData.images.filter(img => img.id !== id) });

    const removeVideo = (id: string) => {
        updateFormData({ videos: formData.videos.filter(v => v.id !== id) });
        if (videoModal.video?.id === id) setVideoModal({ visible: false, video: null });
    };

    const setPrimaryImage = (id: string) =>
        updateFormData({ images: formData.images.map(img => ({ ...img, isPrimary: img.id === id })) });

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Images Section ── */}
                <View style={{
                    backgroundColor: "#fff", borderRadius: 24, padding: 20, marginBottom: 16,
                    shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
                }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                        <LinearGradient colors={["#6366F1", "#3B82F6"]} style={{
                            width: 42, height: 42, borderRadius: 13,
                            alignItems: "center", justifyContent: "center", marginRight: 12,
                        }}>
                            <Ionicons name="images" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
                                Hình ảnh bất động sản
                            </Text>
                            <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>
                                Đăng từ 3 đến 12 hình ảnh
                            </Text>
                        </View>
                        {formData.images.length > 0 && (
                            <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#6366F1" }}>
                                    {formData.images.length}/12
                                </Text>
                            </View>
                        )}
                    </View>

                    {errors.images && (
                        <View style={{
                            backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA",
                            borderRadius: 12, padding: 12, marginBottom: 14,
                            flexDirection: "row", alignItems: "center",
                        }}>
                            <Ionicons name="alert-circle" size={18} color="#EF4444" />
                            <Text style={{ color: "#DC2626", fontSize: 13, marginLeft: 8, flex: 1 }}>
                                {errors.images}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity onPress={pickImages} activeOpacity={0.8}>
                        <LinearGradient colors={["#EEF2FF", "#E0E7FF"]} style={{
                            borderRadius: 16, padding: 24, alignItems: "center",
                            borderWidth: 2, borderColor: "#C7D2FE", borderStyle: "dashed",
                            marginBottom: formData.images.length > 0 ? 16 : 0,
                        }}>
                            <View style={{
                                width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff",
                                alignItems: "center", justifyContent: "center", marginBottom: 12,
                                shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
                            }}>
                                <Ionicons name="camera" size={28} color="#6366F1" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: "#4338CA", marginBottom: 4 }}>
                                Chọn hình ảnh
                            </Text>
                            <Text style={{ fontSize: 12, color: "#818CF8" }}>
                                Nhấn để chọn nhiều ảnh cùng lúc
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {formData.images.length > 0 && (
                        <FlatList
                            data={formData.images}
                            scrollEnabled={false} numColumns={3}
                            keyExtractor={item => item.id}
                            columnWrapperStyle={{ gap: 8 }}
                            contentContainerStyle={{ gap: 8 }}
                            renderItem={({ item, index }) => {
                                const queueItem = uploadQueue.find(q => q.id === item.id);
                                const isUploading = queueItem?.status === "uploading";
                                return (
                                    <TouchableOpacity
                                        style={{ flex: 1, aspectRatio: 1 }}
                                        onPress={() => { setPreviewIndex(index); setPreviewVisible(true); }}
                                        activeOpacity={0.85}
                                    >
                                        <Image
                                            source={{ uri: item.uri }}
                                            style={{ width: "100%", height: "100%", borderRadius: 14 }}
                                            resizeMode="cover"
                                        />
                                        {isUploading && (
                                            <View style={{
                                                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                                borderRadius: 14, backgroundColor: "rgba(0,0,0,0.58)",
                                                alignItems: "center", justifyContent: "center", padding: 10,
                                            }}>
                                                <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800", marginBottom: 8 }}>
                                                    {queueItem.progress}%
                                                </Text>
                                                <View style={{ width: "100%" }}>
                                                    <ProgressBar progress={queueItem.progress} color="#818CF8" />
                                                </View>
                                            </View>
                                        )}
                                        {queueItem?.status === "done" && (
                                            <View style={{
                                                position: "absolute", bottom: 6, left: 6,
                                                backgroundColor: "#22C55E", borderRadius: 999,
                                                width: 20, height: 20, alignItems: "center", justifyContent: "center",
                                            }}>
                                                <Ionicons name="checkmark" size={12} color="#fff" />
                                            </View>
                                        )}
                                        {item.isPrimary && (
                                            <View style={{
                                                position: "absolute", top: 6, left: 6,
                                                backgroundColor: "#6366F1", borderRadius: 8,
                                                paddingHorizontal: 7, paddingVertical: 3,
                                                flexDirection: "row", alignItems: "center",
                                            }}>
                                                <Ionicons name="star" size={10} color="#fff" style={{ marginRight: 3 }} />
                                                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Chính</Text>
                                            </View>
                                        )}
                                        <View style={{ position: "absolute", top: 6, right: 6, gap: 4 }}>
                                            {!item.isPrimary && (
                                                <TouchableOpacity
                                                    onPress={e => { e.stopPropagation(); setPrimaryImage(item.id); }}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 8,
                                                        backgroundColor: "rgba(255,255,255,0.92)",
                                                        alignItems: "center", justifyContent: "center",
                                                    }}>
                                                    <Ionicons name="star-outline" size={14} color="#6366F1" />
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                onPress={e => { e.stopPropagation(); removeImage(item.id); }}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8,
                                                    backgroundColor: "rgba(239,68,68,0.9)",
                                                    alignItems: "center", justifyContent: "center",
                                                }}>
                                                <Ionicons name="trash-outline" size={14} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                </View>

                {/* ── Upload Queue — inline trong ScrollView, không che nội dung ── */}
                <UploadQueueDrawer items={uploadQueue} visible={showQueue} />

                {/* ── Tips ── */}
                <View style={{
                    backgroundColor: "#EFF6FF", borderRadius: 16, padding: 14, marginBottom: 16,
                    flexDirection: "row", alignItems: "flex-start",
                    borderWidth: 1, borderColor: "#BFDBFE",
                }}>
                    <View style={{
                        width: 32, height: 32, borderRadius: 10, backgroundColor: "#DBEAFE",
                        alignItems: "center", justifyContent: "center", marginRight: 10,
                    }}>
                        <Ionicons name="bulb" size={17} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E3A5F", marginBottom: 4 }}>
                            Mẹo chụp ảnh đẹp
                        </Text>
                        <Text style={{ fontSize: 12, color: "#2563EB", lineHeight: 20 }}>
                            {"• Chụp trong điều kiện ánh sáng tốt\n• Chụp từ nhiều góc độ khác nhau\n• Làm sạch phòng trước khi chụp"}
                        </Text>
                    </View>
                </View>

                {/* ── Video Section ── */}
                <LinearGradient colors={["#FFF7ED", "#FEF3C7"]} style={{
                    borderRadius: 24, padding: 20, borderWidth: 1, borderColor: "#FDE68A",
                    shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
                }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                        <LinearGradient colors={["#F59E0B", "#EF4444"]} style={{
                            width: 44, height: 44, borderRadius: 14,
                            alignItems: "center", justifyContent: "center", marginRight: 12,
                        }}>
                            <Ionicons name="videocam" size={22} color="#fff" />
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
                                    Video giới thiệu
                                </Text>
                                <View style={{
                                    backgroundColor: "#EF4444", borderRadius: 999,
                                    paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
                                }}>
                                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>HOT</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 12, color: "#D97706", marginTop: 2 }}>
                                {formData.videos.length > 0
                                    ? `${formData.videos.length} video đã tải lên`
                                    : "Bán nhanh hơn với video tour"}
                            </Text>
                        </View>
                    </View>

                    {formData.videos.length === 0 && (
                        <View style={{
                            backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 14,
                            padding: 14, marginBottom: 14,
                        }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                <Ionicons name="trending-up" size={16} color="#F59E0B" />
                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginLeft: 6 }}>
                                    Lợi ích khi đăng video:
                                </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: "#6B7280", lineHeight: 20 }}>
                                {"• Lượt xem tăng gấp đôi\n• Thu hút người mua nhanh hơn\n• Hiển thị ưu tiên trên trang chủ"}
                            </Text>
                        </View>
                    )}

                    {formData.videos.length > 0 && (
                        <FlatList
                            data={formData.videos} horizontal showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ gap: 10, paddingBottom: 14 }}
                            renderItem={({ item }) => {
                                const queueItem = uploadQueue.find(q => q.id === item.id);
                                const isUploading = queueItem?.status === "uploading";
                                return (
                                    <TouchableOpacity
                                        onPress={() => !isUploading && setVideoModal({ visible: true, video: item })}
                                        activeOpacity={0.85}
                                        style={{
                                            width: 140, aspectRatio: 16 / 9,
                                            borderRadius: 14, overflow: "hidden", backgroundColor: "#1E293B",
                                        }}
                                    >
                                        <LinearGradient
                                            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.65)"]}
                                            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                                        >
                                            {isUploading ? (
                                                <View style={{ alignItems: "center", paddingHorizontal: 14, width: "100%" }}>
                                                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18, marginBottom: 8 }}>
                                                        {queueItem.progress}%
                                                    </Text>
                                                    <ProgressBar progress={queueItem.progress} color="#F59E0B" />
                                                </View>
                                            ) : (
                                                <View style={{
                                                    width: 44, height: 44, borderRadius: 22,
                                                    backgroundColor: "rgba(255,255,255,0.2)",
                                                    alignItems: "center", justifyContent: "center",
                                                    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
                                                }}>
                                                    <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 3 }} />
                                                </View>
                                            )}
                                        </LinearGradient>
                                        {item.duration && !isUploading && (
                                            <View style={{
                                                position: "absolute", bottom: 6, left: 6,
                                                backgroundColor: "rgba(0,0,0,0.75)",
                                                borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                                            }}>
                                                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
                                                    {Math.floor(item.duration / 1000)}s
                                                </Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            onPress={e => { e.stopPropagation(); removeVideo(item.id); }}
                                            style={{
                                                position: "absolute", top: 6, right: 6,
                                                width: 26, height: 26, borderRadius: 8,
                                                backgroundColor: "rgba(239,68,68,0.9)",
                                                alignItems: "center", justifyContent: "center",
                                            }}>
                                            <Ionicons name="close" size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}

                    <TouchableOpacity onPress={pickVideo} activeOpacity={0.85}>
                        <LinearGradient
                            colors={["#F59E0B", "#EF4444"]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{
                                borderRadius: 14, paddingVertical: 14,
                                alignItems: "center", flexDirection: "row", justifyContent: "center",
                                shadowColor: "#F59E0B", shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
                            }}
                        >
                            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 8 }}>
                                {formData.videos.length > 0 ? "Thêm video" : "Tải video lên"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </ScrollView>

            {/* Modals — nằm ngoài ScrollView, không ảnh hưởng layout */}
            <ImagePreviewModal
                images={formData.images} initialIndex={previewIndex}
                visible={previewVisible} onClose={() => setPreviewVisible(false)}
            />
            <VideoPlayerModal
                video={videoModal.video} visible={videoModal.visible}
                onClose={() => setVideoModal({ visible: false, video: null })}
            />
        </View>
    );
};

export default StepImages;
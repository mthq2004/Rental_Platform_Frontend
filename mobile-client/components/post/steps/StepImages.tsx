import { PropertyImage, PropertyVideo, StepProps } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import { Alert, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";

const StepImages = ({ formData, updateFormData, errors }: StepProps) => {

    const [selectedVideo, setSelectedVideo] = useState<PropertyVideo | null>(null);

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages: PropertyImage[] = result.assets.map((asset: ImagePicker.ImagePickerAsset, idx: number) => ({
                id: `${Date.now()}_${idx}`,
                uri: asset.uri,
                isPrimary: formData.images.length === 0 && idx === 0,
            }));
            updateFormData({ images: [...formData.images, ...newImages] });
        }
    };

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Lỗi', 'Cần quyền truy cập thư viện video');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsMultipleSelection: true,
            quality: 1,
            videoMaxDuration: 120, // 2 minutes max
        });

        if (!result.canceled) {
            const newVideos: PropertyVideo[] = result.assets.map((asset, idx) => ({
                id: `${Date.now()}_${idx}`,
                uri: asset.uri,
                duration: asset.duration ?? undefined,
            }));
            updateFormData({ videos: [...formData.videos, ...newVideos] });
        }
    };

    const removeVideo = (id: string) => {
        updateFormData({
            videos: formData.videos.filter(v => v.id !== id),
        });
        if (selectedVideo?.id === id) {
            setSelectedVideo(null);
        }
    };

    const setPrimaryImage = (id: string) => {
        updateFormData({
            images: formData.images.map(img => ({
                ...img,
                isPrimary: img.id === id,
            })),
        });
    };

    const playVideo = (video: PropertyVideo) => {
        setSelectedVideo(video);
    };

    const removeImage = (id: string) => {
        updateFormData({
            images: formData.images.filter(img => img.id !== id),
        });
    };
    return (
        <ScrollView className="p-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <Text className="text-base font-bold text-gray-800 mb-4">
                    <Ionicons name="image" size={20} color="#3B82F6" /> Hình ảnh bất động sản
                </Text>

                {errors.images && (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row items-start">
                        <Ionicons name="alert-circle" size={20} color="#EF4444" />
                        <Text className="flex-1 ml-2 text-sm text-red-700">{errors.images}</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={pickImages}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center mb-4"
                >
                    <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
                        <Ionicons name="camera" size={32} color="#3B82F6" />
                    </View>
                    <Text className="text-base font-semibold text-gray-800 mb-1">
                        Tải lên hình ảnh
                    </Text>
                    <Text className="text-sm text-gray-500">
                        Đăng từ 3 đến 12 hình
                    </Text>
                </TouchableOpacity>

                {formData.images.length > 0 && (
                    <View>
                        <Text className="text-sm font-semibold text-gray-700 mb-3">
                            {formData.images.length} hình ảnh đã chọn
                        </Text>
                        <FlatList
                            data={formData.images}
                            scrollEnabled={false}
                            numColumns={3}
                            keyExtractor={(item) => item.id}
                            columnWrapperStyle={{ gap: 8 }}
                            contentContainerStyle={{ gap: 8 }}
                            renderItem={({ item, index }) => (
                                <View className="flex-1 aspect-square">
                                    <Image
                                        source={{ uri: item.uri }}
                                        className="w-full h-full rounded-xl"
                                        resizeMode="cover"
                                    />
                                    {item.isPrimary && (
                                        <View className="absolute top-2 left-2 bg-blue-500 rounded-lg px-2 py-1">
                                            <Text className="text-xs font-bold text-white">Chính</Text>
                                        </View>
                                    )}
                                    <View className="absolute top-2 right-2 flex-row space-x-1">
                                        {!item.isPrimary && (
                                            <TouchableOpacity
                                                onPress={() => setPrimaryImage(item.id)}
                                                className="bg-white/90 rounded-lg p-1.5"
                                            >
                                                <Ionicons name="star-outline" size={16} color="#3B82F6" />
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => removeImage(item.id)}
                                            className="bg-red-500/90 rounded-lg p-1.5"
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    </View>
                )}
            </View>

            <View className="bg-blue-50 rounded-xl p-4 flex-row items-start mb-4">
                <Ionicons name="bulb" size={20} color="#3B82F6" />
                <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-blue-900 mb-1">
                        Mẹo chụp ảnh đẹp
                    </Text>
                    <Text className="text-sm text-blue-700">
                        • Chụp ảnh trong điều kiện ánh sáng tốt{'\n'}
                        • Chụp từ nhiều góc độ khác nhau{'\n'}
                        • Làm sạch phòng trước khi chụp
                    </Text>
                </View>
            </View>

            <View className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 shadow-sm border border-orange-200">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center">
                            <Ionicons name="videocam" size={20} color="#fff" />
                        </View>
                        <View className="ml-3 flex-1">
                            <View className="flex-row items-center">
                                <Text className="text-base font-bold text-gray-900">
                                    Video giới thiệu
                                </Text>
                                <View className="bg-orange-500 rounded-full px-2 py-0.5 ml-2">
                                    <Text className="text-xs font-bold text-white">Hot</Text>
                                </View>
                            </View>
                            <Text className="text-xs text-orange-700 mt-0.5">
                                {formData.videos.length > 0
                                    ? `${formData.videos.length} video đã chọn`
                                    : 'Bán nhanh hơn với video'}
                            </Text>
                        </View>
                    </View>
                </View>

                {formData.videos.length === 0 && (
                    <View className="bg-white/60 rounded-xl p-3 mb-3">
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="trending-up" size={16} color="#F97316" />
                            <Text className="text-xs font-semibold text-gray-700 ml-1">
                                Lợi ích khi đăng video:
                            </Text>
                        </View>
                        <Text className="text-xs text-gray-600">
                            • Lượt xem tăng gấp đôi{'\n'}
                            • Thu hút người mua nhanh hơn{'\n'}
                            • Hiển thị ưu tiên trên trang chủ
                        </Text>
                    </View>
                )}

                {formData.videos.length > 0 && (
                    <View className="mb-3">
                        <FlatList
                            data={formData.videos}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ gap: 8 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => playVideo(item)}
                                    className="w-32 aspect-video bg-gray-900 rounded-xl overflow-hidden"
                                    activeOpacity={0.8}
                                >
                                    <View className="flex-1 items-center justify-center">
                                        <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
                                        {item.duration && (
                                            <View className="absolute bottom-2 left-2 bg-black/70 rounded px-1.5 py-0.5">
                                                <Text className="text-white text-xs font-medium">
                                                    {Math.floor(item.duration / 1000)}s
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            removeVideo(item.id);
                                        }}
                                        className="absolute top-2 right-2 bg-red-500/90 rounded-lg p-1.5"
                                    >
                                        <Ionicons name="trash-outline" size={14} color="#fff" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                <TouchableOpacity
                    onPress={pickVideo}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl py-3.5 items-center shadow-lg active:opacity-80"
                >
                    <View className="flex-row items-center">
                        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">
                            {formData.videos.length > 0 ? 'Thêm video' : 'Tải video lên'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}


export default StepImages
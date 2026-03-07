import { FURNITURE_STATUS_LABELS } from "@/constants/property.constant";
import { PropertyImage, PropertyListItem } from "@/types/property.type";
import { Camera, Heart, MapPin, MessageCircle } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

const getPrimaryImage = (images: PropertyImage[]): string => {
    return (
        images.find((img) => img.isPrimary)?.uri ||
        images[0]?.uri ||
        'https://via.placeholder.com/300'
    );
};

const formatAddress = (property: PropertyListItem): string => {
    return `${property.ward}, ${property.district}, ${property.city}`;
};

const formatPrice = (price: number): string => {
    return `${price.toLocaleString('vi-VN')} triệu/tháng`;
};

const PropertyCard: React.FC<{
    property: PropertyListItem;
    onSave: (id: string) => void;
    onMessage: (id: string) => void;
    onPress: (id: string) => void;
    isSaved?: boolean;
}> = ({ property, onSave, onMessage, onPress, isSaved = false }) => {
    const image = getPrimaryImage(property.images);
    const addressText = formatAddress(property);
    const priceText = formatPrice(property.pricePerMonth);

    return (
        <TouchableOpacity
            onPress={() => onPress(property.id)}
            className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-100 mx-4"
            activeOpacity={0.7}
        >
            {/* Main content row */}
            <View className="flex-row">
                {/* Image section */}
                <View className="relative w-28 h-32 bg-gray-200">
                    <Image
                        source={{ uri: image }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />

                    {/* Image count badge */}
                    <View className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded flex-row items-center gap-1">
                        <Camera size={12} color="white" />
                        <Text className="text-white text-xs font-semibold">
                            {property.images.length}
                        </Text>
                    </View>

                    {/* Furniture status badge */}
                    {property.furnitureStatus && (
                        <View className="absolute top-2 right-2 bg-blue-600 px-2 py-1 rounded-lg">
                            <Text className="text-white text-xs font-semibold">
                                {FURNITURE_STATUS_LABELS[property.furnitureStatus] ||
                                    property.furnitureStatus}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info section */}
                <View className="flex-1 px-4 py-3 relative">
                    {/* Title */}
                    <Text
                        className="text-base font-bold text-gray-900 mb-1 line-clamp-2"
                        numberOfLines={2}
                    >
                        {property.title}
                    </Text>

                    {/* Property type and bedrooms */}
                    <Text className="text-xs text-gray-500 mb-2">
                        {property.bedrooms > 0 ? `${property.bedrooms} PN · ` : ''}
                        {property.propertyType}
                        {property.bathrooms > 0 ? ` · ${property.bathrooms} WC` : ''}
                    </Text>

                    {/* Price */}
                    <Text className="text-lg font-bold text-red-500 mb-1">
                        {priceText}
                    </Text>

                    {/* Area */}
                    <Text className="text-sm font-semibold text-gray-900 mb-2">
                        {property.areaSqm} m²
                    </Text>

                    {/* Location */}
                    <View className="flex-row items-center gap-1">
                        <MapPin size={14} color="#9CA3AF" />
                        <Text
                            className="text-xs text-gray-500 flex-1"
                            numberOfLines={1}
                        >
                            {addressText}
                        </Text>
                    </View>

                    {/* Save button */}
                    <TouchableOpacity
                        onPress={() => onSave(property.id)}
                        className="absolute top-3 right-3"
                    >
                        <Heart
                            size={20}
                            color={isSaved ? '#EF4444' : '#9CA3AF'}
                            fill={isSaved ? '#EF4444' : 'none'}
                            strokeWidth={2}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Owner section */}
            <View className="border-t border-gray-100 px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                    {/* Avatar */}
                    <View className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center">
                        {property.user.avatarUrl ? (
                            <Image
                                source={{ uri: property.user.avatarUrl }}
                                className="w-8 h-8 rounded-full"
                            />
                        ) : (
                            <Text className="text-white font-bold text-xs">
                                {property.user.fullName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>

                    {/* Owner info */}
                    <View>
                        <Text className="text-sm font-semibold text-gray-900">
                            {property.user.fullName}
                        </Text>
                        <Text className="text-xs text-gray-500">
                            {property.viewCount} lượt xem
                        </Text>
                    </View>
                </View>

                {/* Message button */}
                <TouchableOpacity
                    onPress={() => onMessage(property.id)}
                    className="p-2 active:bg-gray-100 rounded-lg"
                >
                    <MessageCircle size={20} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

export default PropertyCard
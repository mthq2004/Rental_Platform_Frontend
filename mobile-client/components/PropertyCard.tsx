import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { FeaturedPropertyItem } from "@/types/property.type";
import FavoriteButton from "@/components/FavoriteButton";

interface PropertyCardProps {
  property: FeaturedPropertyItem;
  onPress?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
}) => {
  const {
    id,
    title,
    pricePerMonth,
    areaSqm,
    district,
    city,
    image,
    bedrooms,
    bathrooms,
    propertyType,
  } = property;

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + " đ/tháng";

  const imageUrl =
    image ?? "https://via.placeholder.com/400x300.png?text=No+Image";

  const propertyTypeLabel = [
    {
      id: "apartment",
      label: "Chung cư / Căn hộ"
    },
    {
      id: "house",
      label: "Nhà ở"
    },
    {
      id: "room",
      label: "Phòng trọ"
    },
    {
      id: "office",
      label: "Văn phòng"
    },
    {
      id: "land",
      label: "Đất"
    }
  ].find((type) => type.id === property.propertyType)?.label || "Bất động sản";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white dark:bg-secondary-dark rounded-2xl overflow-hidden shadow-sm mb-4 mr-4 w-64"
    >
      {/* Image */}
      <View className="relative h-40 bg-gray-200">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Type badge */}
        <View className="absolute top-3 left-3 bg-blue-600 px-2 py-1 rounded-full">
          <Text className="text-white text-xs font-medium capitalize">
            {propertyTypeLabel}
          </Text>
        </View>

        {/* Favorite */}
        <View className="absolute top-3 right-3">
          <FavoriteButton propertyId={id} size={18} />
        </View>

        {/* Price */}
        <View className="absolute bottom-3 right-3 bg-red-500 px-3 py-1 rounded-lg">
          <Text className="text-white text-xs font-semibold">
            {formatPrice(pricePerMonth)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-3">
        {/* Title */}
        <Text
          numberOfLines={2}
          className="text-base font-semibold text-gray-900 dark:text-foreground-dark mb-1 h-12"
        >
          {title || "Cho thuê bất động sản"}
        </Text>

        {/* Location */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-600 dark:text-gray-300 ml-1">
            {district}, {city}
          </Text>
        </View>

        {/* Info */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="ruler-square" size={16} color="#3B82F6" />
            <Text className="text-xs text-gray-700 dark:text-gray-300 ml-1">{areaSqm} m²</Text>
          </View>

          <View className="flex-row items-center">
            <MaterialCommunityIcons name="bed" size={16} color="#10B981" />
            <Text className="text-xs text-gray-700 dark:text-gray-300 ml-1">{bedrooms}</Text>
          </View>

          <View className="flex-row items-center">
            <MaterialCommunityIcons name="shower" size={16} color="#F59E0B" />
            <Text className="text-xs text-gray-700 dark:text-gray-300 ml-1">{bathrooms}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;
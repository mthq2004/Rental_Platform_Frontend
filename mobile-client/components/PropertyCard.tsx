import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { FeaturedPropertyItem } from "@/types/property.type";

interface PropertyCardProps {
  property: FeaturedPropertyItem;
  onPress?: () => void;
  onFavoritePress?: () => void;
  isFavorited?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  onFavoritePress,
  isFavorited = false,
}) => {
  const {
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

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white dark:bg-secondary-dark rounded-2xl overflow-hidden shadow-sm mb-4 mr-4"
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
            {propertyType}
          </Text>
        </View>

        {/* Favorite */}
        <TouchableOpacity
          onPress={onFavoritePress}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full items-center justify-center"
        >
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={18}
            color={isFavorited ? "#EF4444" : "#6B7280"}
          />
        </TouchableOpacity>

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
          className="text-base font-semibold text-gray-900 dark:text-foreground-dark mb-1"
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
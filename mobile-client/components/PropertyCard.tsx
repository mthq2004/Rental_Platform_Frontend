import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface PropertyCardProps {
  price: string;
  area: string;
  location: string;
  onPress?: () => void;
  onFavoritePress?: () => void;
  image: string;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  price,
  area,
  location,
  onPress,
  onFavoritePress,
  image
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-72 mr-4"
      activeOpacity={0.7}
    >
      <View className="relative bg-gray-200 rounded-2xl overflow-hidden">
        <View className="h-48 bg-gray-300 items-center justify-center">
          <Image
            source={{ uri:  image}}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <TouchableOpacity
          onPress={onFavoritePress}
          className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="heart-outline" size={20} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
      <View className="mt-3">
        <Text className="text-lg font-bold text-gray-900">{price}</Text>
        <Text className="text-sm text-gray-600">
          {area} • {location}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;
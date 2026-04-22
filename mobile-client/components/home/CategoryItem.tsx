import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface CategoryItemProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  label: string;
  onPress?: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  iconName,
  iconColor = '#0040d1',
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center gap-2"
    >
      <View className="w-16 h-16 bg-white dark:bg-secondary-dark rounded-2xl shadow-sm items-center justify-center">
        <Ionicons name={iconName} size={28} color={iconColor} />
      </View>
      <Text className="text-xs text-gray-700 dark:text-gray-300 text-center">{label}</Text>
    </TouchableOpacity>
  );
};

export default CategoryItem;
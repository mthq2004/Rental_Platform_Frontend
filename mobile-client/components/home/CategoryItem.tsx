import { Text, TouchableOpacity, View } from "react-native";

interface CategoryItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  icon,
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center gap-2"
    >
      <View className="w-16 h-16 bg-white rounded-2xl shadow-sm items-center justify-center">
        <Text className="text-3xl">{icon}</Text>
      </View>
      <Text className="text-xs text-gray-700 text-center">{label}</Text>
    </TouchableOpacity>
  );
};


export default CategoryItem;
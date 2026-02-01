import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

interface BackButtonProps {
  onPress: () => void;
}

const BackButton = ({ onPress }: BackButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-11 h-11 items-center justify-center bg-gray-100 rounded-full mb-6 active:bg-gray-200"
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={24} color="#374151" />
    </TouchableOpacity>
  );
};

export default BackButton;
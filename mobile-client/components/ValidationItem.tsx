import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface ValidationItemProps {
  isValid: boolean;
  text: string;
}

const ValidationItem = ({ isValid, text }: ValidationItemProps) => (
  <View className="flex-row items-center mb-2">
    <View
      className={`w-5 h-5 rounded-full items-center justify-center mr-2 ${
        isValid ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      {isValid && <Ionicons name="checkmark" size={14} color="white" />}
    </View>
    <Text
      className={`text-sm ${isValid ? 'text-green-600 font-medium' : 'text-gray-600'}`}
    >
      {text}
    </Text>
  </View>
);

export default ValidationItem;
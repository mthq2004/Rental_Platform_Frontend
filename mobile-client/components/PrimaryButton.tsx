import { Text, TouchableOpacity } from "react-native";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
}: PrimaryButtonProps) => {
  return (
    <TouchableOpacity
      className={`py-4 rounded-xl items-center ${
        disabled || loading ? 'bg-gray-300' : 'bg-blue-600 active:bg-blue-700'
      }`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        shadowColor: disabled || loading ? 'transparent' : '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
      }}
    >
      {loading ? (
        <Text className="text-white text-base font-semibold">Đang xử lý...</Text>
      ) : (
        <Text className="text-white text-base font-semibold">{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
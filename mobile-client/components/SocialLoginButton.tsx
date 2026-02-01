import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

interface SocialLoginButtonProps {
  iconName: string;
  iconLibrary: 'AntDesign' | 'FontAwesome' | 'Ionicons';
  title: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
  borderColor?: boolean;
  onPress: () => void;
}

const SocialLoginButton = ({
  iconName,
  iconLibrary,
  title,
  bgColor,
  textColor,
  iconColor,
  borderColor,
  onPress,
}: SocialLoginButtonProps) => {
  const renderIcon = () => {
    const iconProps = { name: iconName as any, size: 22, color: iconColor };

    switch (iconLibrary) {
      case 'AntDesign':
        return <AntDesign {...iconProps} />;
      case 'FontAwesome':
        return <FontAwesome {...iconProps} />;
      case 'Ionicons':
        return <Ionicons {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-center py-3.5 rounded-xl mb-3 ${bgColor} ${
        borderColor ? 'border border-gray-300' : ''
      }`}
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        shadowColor: borderColor ? 'transparent' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="w-6 h-6 items-center justify-center mr-3">
        {renderIcon()}
      </View>
      <Text className={`text-base font-semibold ${textColor}`}>{title}</Text>
    </TouchableOpacity>
  );
};


export default SocialLoginButton;
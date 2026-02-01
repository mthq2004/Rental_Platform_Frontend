import { Text, View } from "react-native";

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View className="mb-8">
    <Text className="text-3xl font-bold text-gray-900 mb-2">{title}</Text>
    <Text className="text-base text-gray-500">{subtitle}</Text>
  </View>
);

export default Header;
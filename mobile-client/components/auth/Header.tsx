import { Text, View } from "react-native";

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View className="mb-8">
    <Text className="text-3xl font-bold text-gray-900 dark:text-foreground-dark mb-2">{title}</Text>
    <Text className="text-base text-gray-500 dark:text-gray-300">{subtitle}</Text>
  </View>
);

export default Header;
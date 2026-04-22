import { View, Text, Switch } from "react-native";
import { useColorScheme } from "nativewind";
import { Settings } from "lucide-react-native";
import { saveThemePreference, setTheme } from "@/utils/theme";

const DarkModeToggle = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const toggleTheme = async () => {
    const nextTheme = isDark ? "light" : "dark";
    setColorScheme(nextTheme);
    setTheme(nextTheme);
    await saveThemePreference(nextTheme);
  };

  return (
    <View className="mx-4 mb-2 rounded-xl bg-white dark:bg-gray-800">
      <View className="flex-row items-center justify-between p-4">
        
        {/* Left content */}
        <View className="flex-row items-center flex-1">
          <View className="rounded-xl p-2.5 mr-3 bg-gray-100 dark:bg-gray-700">
            <Settings size={20} color={isDark ? "#9ca3af" : "#666"} />
          </View>

          <Text className="text-base font-medium text-black dark:text-white">
            Chế độ tối
          </Text>
        </View>

        {/* Switch */}
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
          thumbColor={isDark ? "#ffffff" : "#f3f4f6"}
        />
      </View>
    </View>
  );
};

export default DarkModeToggle;

import { View, Text, Switch } from "react-native";
import { useColorScheme } from "nativewind";
// Import cả MoonStar và Sun
import { MoonStar, Sun } from "lucide-react-native";
import { saveThemePreference, setTheme } from "@/utils/theme";

const DarkModeToggle = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // Chọn Icon dựa trên trạng thái theme
  const ThemeIcon = isDark ? MoonStar : Sun;

  const toggleTheme = async () => {
    const nextTheme = isDark ? "light" : "dark";
    setColorScheme(nextTheme);
    setTheme(nextTheme);
    await saveThemePreference(nextTheme);
  };

  return (
    <View className="mx-4 mb-2 bg-transparent">
      {/* Container tổng: dồn tất cả sang phải, căn giữa theo chiều dọc */}
      <View className="flex-row items-center justify-end py-2">

        {/* Cụm Icon và Text: Đảm bảo items-center để icon và chữ thẳng hàng */}
        <View className="flex-row items-center mr-4">

          {/* Icon thay đổi theo mode: bỏ hoàn toàn background */}
          <View className="mr-3 items-center justify-center">
            <ThemeIcon
              size={28}
              color={isDark ? "#9ca3af" : "#f59e0b"} // Màu vàng cho mặt trời, xám cho mặt trăng
            />
          </View>

          {/* Chữ: text-lg và font-medium */}
          <Text className="text-lg font-medium text-black dark:text-white">
            Chế độ tối
          </Text>
        </View>

        {/* Switch: Căn giữa tuyệt đối với cụm bên trái */}
        <View className="justify-center">
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor={isDark ? "#ffffff" : "#f3f4f6"}
            // Scale nhẹ để nhìn cân đối với text-lg
            style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
          />
        </View>
      </View>
    </View>
  );
};

export default DarkModeToggle;
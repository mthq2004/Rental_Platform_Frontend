import { Bookmark, ChevronDown } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

const FeaturedSection: React.FC = () => (
    <View className="bg-white border-b border-gray-100 px-4 py-4 gap-4">
        <TouchableOpacity
            className="border-2 border-blue-600 rounded-full py-3 items-center justify-center flex-row gap-2 active:bg-blue-50"
            activeOpacity={0.7}
        >
            <Bookmark size={20} color="#2563EB" />
            <Text className="text-sm font-semibold text-blue-600">Lưu tìm kiếm</Text>
        </TouchableOpacity>

        <TouchableOpacity
            className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-4 flex-row gap-3 active:bg-orange-100"
            activeOpacity={0.7}
        >
            <Text className="text-3xl">📊</Text>
            <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 mb-1">
                    Cập nhật biến động giá
                </Text>
                <Text className="text-xs text-gray-600 leading-4">
                    Theo dõi thay đổi giá bất động sản theo khu vực
                </Text>
            </View>
            <ChevronDown size={20} color="#9CA3AF" />
        </TouchableOpacity>
    </View>
);

export default FeaturedSection
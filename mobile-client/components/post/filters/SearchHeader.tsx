import { router } from "expo-router";
import { ChevronDown, ChevronLeft, Heart, MessageCircle, Search } from "lucide-react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const SearchHeader: React.FC<{
    searchText: string;
    onSearchChange: (text: string) => void;
    locationText: string;
    onLocationPress: () => void;
    onClearFilter: () => void;
}> = ({
    searchText,
    onSearchChange,
    locationText,
    onLocationPress,
    onClearFilter,
}) => (
        <View className="bg-white border-b border-gray-100 px-4 pt-16 pb-3">
            <View className="flex-row items-center gap-3 mb-3">
                <TouchableOpacity onPress={() => router.back()} className="p-1">
                    <ChevronLeft size={24} color="#1F2937" strokeWidth={2.5} />
                </TouchableOpacity>

                <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
                    <Search size={18} color="#9CA3AF" strokeWidth={2} />
                    <TextInput
                        placeholder="Tìm kiếm bất động sản"
                        placeholderTextColor="#D1D5DB"
                        value={searchText}
                        onChangeText={onSearchChange}
                        className="flex-1 ml-2 text-sm text-gray-900 font-medium"
                    />
                </View>

                <TouchableOpacity className="p-2" activeOpacity={0.7}>
                    <Heart size={24} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity className="p-2" activeOpacity={0.7}>
                    <MessageCircle size={24} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={onLocationPress}
                    className="flex-row items-center gap-2 flex-1"
                >
                    <Text className="text-xs text-gray-600">Khu vực:</Text>
                    <Text
                        numberOfLines={1}
                        className="text-sm font-bold text-gray-900 flex-1"
                    >
                        {locationText}
                    </Text>
                    <ChevronDown size={16} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity onPress={onClearFilter}>
                    <Text className="text-xs font-bold text-blue-600">Xóa lọc</Text>
                </TouchableOpacity>
            </View>
        </View>
    );


export default SearchHeader
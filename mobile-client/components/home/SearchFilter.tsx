import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const SearchFilter: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  const handleAreaSelect = () => {
    console.log('Select area');
  };

  const handleTypeSelect = () => {
    console.log('Select property type');
  };

  const handleSearch = () => {
    console.log('Search:', searchText);
  };

  return (
    <View className="bg-white mx-4 -mt-28 rounded-2xl p-4 shadow-lg">
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-full items-center justify-center mr-3">
          <Ionicons
            name="location-sharp"
            size={24}
            color="#0040d1"
          />
        </View>
        <Text className="text-sm text-gray-700 flex-1">Khu vực:</Text>
        <TouchableOpacity
          onPress={handleAreaSelect}
          className="flex-row items-center gap-2"
        >
          <Text className="text-primary font-medium">Chọn khu vực</Text>
          <Text className="text-xs text-gray-500">▼</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-full items-center justify-center mr-3">
          <Ionicons
            name="business-sharp"
            size={24}
            color="#0040d1"
          />
        </View>
        <Text className="text-sm text-gray-700 flex-1">Loại hình BDS:</Text>
        <TouchableOpacity
          onPress={handleTypeSelect}
          className="flex-row items-center gap-2"
        >
          <Text className="text-gray-900 font-medium">Tất cả loại hình</Text>
          <Text className="text-xs text-gray-500">▼</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2">
        <Ionicons
            name="search"
            size={24}
            color="#0040d1"
            className='mr-2'
          />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Tìm bất động sản..."
          placeholderTextColor="#999"
          className="flex-1 text-gray-700 py-1"
        />
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-primary px-5 py-2 rounded-lg ml-2"
        >
          <Text className="text-white font-medium">Tìm nhà</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SearchFilter
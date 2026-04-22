import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import LocationFilterModal from "../post/LocationFilterModal";
import { useAppSelector } from "@/store/hook";
import PropertyTypeModal from "../post/Propertytypemodal";
import { router } from "expo-router";
import { PropertyType } from "@/types/property.type";

const SearchFilter = () => {
  const { provinces, districts, wards } = useAppSelector(state => state.location);

  const [searchText, setSearchText] = useState('');
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const handleAreaSelect = () => {
    setAreaModalVisible(true);
  };

  const handleTypeSelect = () => {
    setModalVisible(true)
  };

  const handleSearch = () => {
    const searchData = {
      keyword: searchText,
      propertyType: selectedType,
      location: selectedLocation,
    };

    router.push({
      pathname: "/filter-search",
      params: {
        keyword: searchText,
        propertyType: selectedType,
        location: JSON.stringify(selectedLocation),
      },
    });
  };

  const handleSeachLocation = (data: any) => {
    setSelectedLocation(data);
  }

  const handleApply = (type: PropertyType) => {
    setSelectedType(type);
  };

  const getPropertyLabel = (type: PropertyType) => {
    const labels: Record<PropertyType, string> = {
      apartment: "Chung cư / Căn hộ",
      house: "Nhà ở",
      room: "Phòng trọ",
      office: "Văn phòng",
      land: "Đất",
    };
    return labels[type];
  };

  const getLocationLabel = () => {
    if (!selectedLocation) return "Chọn khu vực";

    const provinceNames =
      selectedLocation.provinces?.map((p: any) => p.name) || [];

    const districtNames =
      selectedLocation.districts?.map((d: any) => d.name) || [];

    const wardNames =
      selectedLocation.wards?.map((w: any) => w.name) || [];

    const parts = [...wardNames, ...districtNames, ...provinceNames];

    if (parts.length === 0) return "Chọn khu vực";

    return parts.join(", ");
  };

  return (
    <View className="bg-white dark:bg-secondary-dark mx-4 -mt-28 rounded-2xl p-4 shadow-lg">
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-full items-center justify-center mr-3">
          <Ionicons
            name="location-sharp"
            size={24}
            color="#0040d1"
          />
        </View>
        <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">Khu vực:</Text>
        <TouchableOpacity
          onPress={handleAreaSelect}
          className="flex-row items-center gap-2"
        >
          <Text
            className="text-primary font-medium max-w-[180px]"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getLocationLabel()}
          </Text>
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
        <Text className="text-sm text-gray-700 dark:text-gray-300 flex-1">Loại hình BDS:</Text>
        <TouchableOpacity
          onPress={handleTypeSelect}
          className="flex-row items-center gap-2"
        >
          <Text className="text-gray-900 dark:text-foreground-dark font-medium">
            {selectedType ? getPropertyLabel(selectedType) : "Tất cả loại hình"}
          </Text>
          <Text className="text-xs text-gray-500">▼</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
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
          className="flex-1 text-gray-700 dark:text-gray-200 py-1"
        />
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-primary px-5 py-2 rounded-lg ml-2"
        >
          <Text className="text-white font-medium">Tìm nhà</Text>
        </TouchableOpacity>
      </View>

      <LocationFilterModal
        visible={areaModalVisible}
        onClose={() => setAreaModalVisible(false)}
        provinces={provinces}
        districts={districts}
        wards={wards}
        onApply={handleSeachLocation}
      />

      <PropertyTypeModal
        visible={modalVisible}
        title="Chọn loại bất động sản"
        selectedId={selectedType}
        onClose={() => setModalVisible(false)}
        onApply={handleApply}
      />
    </View>
  );
};

export default SearchFilter
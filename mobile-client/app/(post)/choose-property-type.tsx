import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { 
  Building2, Home, Landmark, Bed, 
  Briefcase, Store, Warehouse, Map 
} from 'lucide-react-native';
import { router } from 'expo-router';

enum PropertyType {
  apartment = 'apartment',
  house = 'house',
  villa = 'villa',
  room = 'room',
  office = 'office',
  shop = 'shop',
  warehouse = 'warehouse',
  land = 'land'
}

const propertyConfigs = [
  { id: PropertyType.apartment, label: 'Chung cư', icon: Building2 },
  { id: PropertyType.house, label: 'Nhà riêng', icon: Home },
  { id: PropertyType.villa, label: 'Biệt thự', icon: Landmark },
  { id: PropertyType.room, label: 'Phòng trọ', icon: Bed },
  { id: PropertyType.office, label: 'Văn phòng', icon: Briefcase },
  { id: PropertyType.shop, label: 'Cửa hàng', icon: Store },
  { id: PropertyType.warehouse, label: 'Kho xưởng', icon: Warehouse },
  { id: PropertyType.land, label: 'Đất nền', icon: Map },
];

const ChoosePropertyType = () => {
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);

  const handleNext = () => {
    router.push({
      pathname: '/(tab)/create-post',
      params: {
        type: selectedType,
      },
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-800">Bạn muốn đăng tin gì?</Text>
        <Text className="text-gray-500 mt-1">Chọn loại hình bất động sản để tiếp tục</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <View className="flex-row flex-wrap justify-between">
          {propertyConfigs.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selectedType === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedType(item.id)}
                activeOpacity={0.7}
                className={`w-[48%] mb-4 p-5 rounded-2xl border-2 items-center justify-center ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <View className={`p-3 rounded-full mb-3 ${isSelected ? 'bg-blue-600' : 'bg-white'}`}>
                  <IconComponent 
                    size={28} 
                    color={isSelected ? 'white' : '#4b5563'} 
                  />
                </View>
                <Text className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedType && (
        <View className="p-4 border-t border-gray-100">
          <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={handleNext}>
            <Text className="text-white font-bold text-lg">Tiếp theo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChoosePropertyType;
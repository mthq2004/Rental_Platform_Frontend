import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import {
  Building2, Home, Landmark, Bed,
  Briefcase, Store, Warehouse, Map
} from 'lucide-react-native';
import { router } from 'expo-router';
import AuthGuard from '@/components/AuthGuard';

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
  {
    id: PropertyType.apartment,
    label: 'Chung cư / Căn hộ',
    icon: Building2,
  },
  {
    id: PropertyType.house,
    label: 'Nhà ở',
    icon: Home,
  },
  {
    id: PropertyType.land,
    label: 'Đất',
    icon: Landmark,
  },
  {
    id: PropertyType.office,
    label: 'Văn phòng / Mặt bằng kinh doanh',
    icon: Briefcase,
  },
  {
    id: PropertyType.room,
    label: 'Phòng trọ',
    icon: Bed,
  },
];


const ChoosePropertyType = () => {
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);

  const handleNext = (type: PropertyType) => {
    router.replace({
      pathname: '/(post)/create-post',
      params: {
        type,
        mode: 'create',
      },
    });

  }

  return (
    <AuthGuard>
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
                  onPress={() => handleNext(item.id)}
                  activeOpacity={0.7}
                  className={`w-[48%] mb-4 p-5 rounded-2xl border-2 items-center justify-center ${isSelected
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

        {/* {selectedType && (
        <View className="p-4 border-t border-gray-100">
          <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={handleNext}>
            <Text className="text-white font-bold text-lg">Tiếp theo</Text>
          </TouchableOpacity>
        </View>
      )} */}

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.5}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-14 h-14 bg-gray-800 rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white text-xl">✕</Text>
        </TouchableOpacity>


      </SafeAreaView>
    </AuthGuard>
  );
};

export default ChoosePropertyType;
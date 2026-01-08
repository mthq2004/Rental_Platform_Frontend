import Categories from '@/components/home/Categories';
import CategoryItem from '@/components/home/CategoryItem';
import HeaderBanner from '@/components/home/Header';
import SearchFilter from '@/components/home/SearchFilter';
import PropertyCard from '@/components/PropertyCard';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const properties = [
  {
    id: '1',
    price: '12 triệu/tháng',
    area: '80m²',
    bedrooms: 2,
    bathrooms: 2,
    type: 'Căn hộ',
    furniture: 'Nội thất đầy đủ',
    direction: 'Đông Nam',
    location: 'Quận 7, TP.HCM',
    postedTime: '2 giờ trước',
    image: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fcdn.chotot.com%2FEWuSdDaVoISGNOtGQ6wSbROybEep7ta4kQ_E0Iz18-Y%2Fpreset%3Alisting%2Fplain%2F46fdf4cf4534b8615a0ab1fa9dd3931b-2905545158123516816.jpg&w=1920&q=100',
  },
  {
    id: '2',
    price: '18 triệu/tháng',
    area: '120m²',
    bedrooms: 3,
    bathrooms: 2,
    type: 'Nhà nguyên căn',
    furniture: 'Nội thất cơ bản',
    direction: 'Tây Bắc',
    location: 'Quận 2, TP.HCM',
    postedTime: '1 ngày trước',
    image: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fcdn.chotot.com%2FEWuSdDaVoISGNOtGQ6wSbROybEep7ta4kQ_E0Iz18-Y%2Fpreset%3Alisting%2Fplain%2F46fdf4cf4534b8615a0ab1fa9dd3931b-2905545158123516816.jpg&w=1920&q=100'
  },
  {
    id: '3',
    price: '9 triệu/tháng',
    area: '60m²',
    bedrooms: 1,
    bathrooms: 1,
    type: 'Căn hộ mini',
    furniture: 'Đầy đủ',
    direction: 'Nam',
    location: 'Quận 1, TP.HCM',
    postedTime: '3 ngày trước',
    image: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fcdn.chotot.com%2FEWuSdDaVoISGNOtGQ6wSbROybEep7ta4kQ_E0Iz18-Y%2Fpreset%3Alisting%2Fplain%2F46fdf4cf4534b8615a0ab1fa9dd3931b-2905545158123516816.jpg&w=1920&q=100'
  },
];


// Main Home Component
const Home: React.FC = () => {

  const handlePropertyPress = (id: string) => {
    console.log('Property pressed:', id);
  };

  const handleFavoritePress = (id: string) => {
    console.log('Favorite pressed:', id);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 relative">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 absolute top-0 left-0 right-0 bottom-0"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <HeaderBanner />
        <SearchFilter />
        <Categories />
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4 px-4">
            Nhà cho thuê mới nhất
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {properties.map((item) => (
              <PropertyCard
                key={item.id}
                {...item}
                onPress={() => handlePropertyPress(item.id)}
                onFavoritePress={() => handleFavoritePress(item.id)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
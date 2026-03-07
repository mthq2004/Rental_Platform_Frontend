import Categories from '@/components/home/Categories';
import CategoryItem from '@/components/home/CategoryItem';
import HeaderBanner from '@/components/home/Header';
import SearchFilter from '@/components/home/SearchFilter';
import PropertyCard from '@/components/PropertyCard';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getProvinces } from '@/store/slices/location.slice';
import { getAllproperty } from '@/store/slices/property.slice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';

// const properties = [
//   {
//     id: '1',
//     price: '12 triệu/tháng',
//     area: '80m²',
//     bedrooms: 2,
//     bathrooms: 2,
//     type: 'Căn hộ',
//     furniture: 'Nội thất đầy đủ',
//     direction: 'Đông Nam',
//     location: 'Quận 7, TP.HCM',
//     postedTime: '2 giờ trước',
//     image: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fcdn.chotot.com%2FEWuSdDaVoISGNOtGQ6wSbROybEep7ta4kQ_E0Iz18-Y%2Fpreset%3Alisting%2Fplain%2F46fdf4cf4534b8615a0ab1fa9dd3931b-2905545158123516816.jpg&w=1920&q=100',
//   },
//   {
//     id: '2',
//     price: '18 triệu/tháng',
//     area: '120m²',
//     bedrooms: 3,
//     bathrooms: 2,
//     type: 'Nhà nguyên căn',
//     furniture: 'Nội thất cơ bản',
//     direction: 'Tây Bắc',
//     location: 'Quận 2, TP.HCM',
//     postedTime: '1 ngày trước',
//     image: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fcdn.chotot.com%2FEWuSdDaVoISGNOtGQ6wSbROybEep7ta4kQ_E0Iz18-Y%2Fpreset%3Alisting%2Fplain%2F46fdf4cf4534b8615a0ab1fa9dd3931b-2905545158123516816.jpg&w=1920&q=100'
//   },
//   {
//     id: '3',
//     price: '9 triệu/tháng',
//     area: '60m²',
//     bedrooms: 1,
//     bathrooms: 1,
//     type: 'Căn hộ mini',
//     furniture: 'Đầy đủ',
//     direction: 'Nam',
//     location: 'Quận 1, TP.HCM',
//     postedTime: '3 ngày trước',
//     image: 'https://lighthouse.chotot.com/_next/image?url=https%3A%2F%2Fcdn.chotot.com%2FEWuSdDaVoISGNOtGQ6wSbROybEep7ta4kQ_E0Iz18-Y%2Fpreset%3Alisting%2Fplain%2F46fdf4cf4534b8615a0ab1fa9dd3931b-2905545158123516816.jpg&w=1920&q=100'
//   },
// ];


const Home = () => {
  const [refreshing, setRefreshing] = useState(false)
  const { loading, propertyTemp } = useAppSelector(state => state.property)
  const dispatch = useAppDispatch()
  const isInitialLoading = loading && !refreshing

  const properties = propertyTemp

  const handlePropertyPress = (id: string) => {
    router.push({
      pathname: "/(post)/property-detail",
      params: { id, },
    });
  };

  const handleFavoritePress = (id: string) => {
    console.log('Favorite pressed:', id);
  };

  useEffect(() => {
    dispatch(getAllproperty())
  }, [dispatch])

  useEffect(() => {
    dispatch(getProvinces());
  }, []);

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        dispatch(getAllproperty()).unwrap(),
      ])
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải lại dữ liệu')
    } finally {
      setRefreshing(false)
    }
  }

  if (isInitialLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Đang tải...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 relative">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 absolute top-0 left-0 right-0 bottom-0"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
            {properties?.map((item: any) => (
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
import { PROPERTY_META } from '@/constants/property.constant';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { getPostStatusCounts, getPropertiesByStatus, getPropertyById } from '@/store/slices/property.slice';
import { ListingType, PropertyType } from '@/types/property.type';
import { useThemeColors } from '@/utils/colors';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, useColorScheme } from 'react-native';

export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'rented'
  | 'maintenance'
  | 'inactive'
  | 'rejected';


interface PropertyImage {
  id: string;
  uri: string;
  isPrimary: boolean;
}

export interface PropertyData {
  propertyId: string;
  title: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  pricePerMonth: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  areaSqm: string;
  bedrooms: string;
  bathrooms: string;
  images: PropertyImage[];
  status: PostStatus;
  createdAt: string;
  viewCount: number;
}

const MyPost = () => {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<PostStatus>('active');

  const dispatch = useAppDispatch()
  const { statusCount, properties, loadingPropertyStatus } = useAppSelector(state => state.property)

  const tabs = Array.isArray(statusCount) ? statusCount : []

  useFocusEffect(
    useCallback(() => {
      dispatch(getPostStatusCounts())
    }, [dispatch])
  )

  useEffect(() => {
    dispatch(getPropertiesByStatus(activeTab))
  }, [activeTab])

  const formatPrice = (price: string): string => {
    const numPrice = parseInt(price);
    if (numPrice >= 1000000) {
      return `${(numPrice / 1000000).toFixed(1)} triệu/tháng`;
    }
    return `${numPrice.toLocaleString('vi-VN')} đ/tháng`;
  };

  const filteredProperties = Array.isArray(properties) ? properties : [];

  const handleNotification = () => {
    console.log('Thông báo của bạn');
  };

  const handlePostDetail = (propertyId: string) => {
    router.push({
      pathname: '/(tab)/create-post',
      params: {
        id: propertyId,
        mode: 'edit',
      },
    });
  };


  const handleContinuePost = (propertyId: string) => {
    router.push({
      pathname: '/(post)/create-post',
      params: {
        id: propertyId,
        mode: 'edit',
      },
    });
  };

  const handleCreatePost = () => {
    console.log('Tạo tin đăng mới');
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.current.background}
      />


      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 mt-12">
        <Text className="text-lg font-semibold text-foreground dark:text-foreground-dark">
          Quản lý tin đăng
        </Text>
        <View className="flex-row gap-4">
          <TouchableOpacity onPress={handleNotification} className="p-2 relative">
            <Ionicons name="notifications-outline" size={24} color={colors.current.icon} />
            <View className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNotification} className="p-2 relative">
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.current.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-row items-center justify-between px-4 py-4 border-b-8 border-gray-100 dark:border-gray-700">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }}
            className="w-12 h-12 rounded-full"
          />
          <View>
            <Text className="text-base font-semibold text-foreground dark:text-foreground-dark">Xuân Mạch</Text>
          </View>
        </View>
      </View>

      <View className="border-b border-gray-100 dark:border-gray-700">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`px-4 py-3 ${activeTab === tab.id ? 'border-b-2 border-yellow-400' : ''}`}
            >
              <Text className={`text-sm font-semibold whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-gray-500'
                }`}>
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1">
        {loadingPropertyStatus ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-3 text-gray-500 dark:text-foreground-dark">Đang tải tin đăng...</Text>
          </View>
        ) : filteredProperties.length === 0 ? (
          <View className="items-center justify-center px-4 py-16">
            <View className="mb-8">
              <Text className="text-8xl">🛸</Text>
            </View>
            <Text className="text-xl font-bold text-foreground dark:text-foreground-dark mb-2">
              Không tìm thấy tin đăng
            </Text>
            <Text className="text-sm text-gray-600 text-center mb-6">
              Bạn hiện tại không có tin đăng nào cho trạng thái này
            </Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              className="bg-primary px-8 py-3 rounded-lg"
            >
              <Text className="font-semibold text-white text-base">
                Đăng tin
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="p-4">
            {filteredProperties.map((property) => (
              <TouchableOpacity
                key={property.propertyId}
                onPress={() => handlePostDetail(property.propertyId)}
                className="bg-secondary dark:bg-secondary-dark border border-gray-200 rounded-lg mb-4 overflow-hidden"
              >
                <View className="flex-row">
                  <Image
                    source={{ uri: property.images[0]?.uri }}
                    className="w-32 h-32"
                  />
                  <View className="flex-1 p-3">
                    <Text className="text-base font-semibold text-foreground dark:text-foreground-dark mb-1" numberOfLines={2}>
                      {property.title}
                    </Text>

                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-bold text-red-500">
                        {formatPrice(property.pricePerMonth)}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1 mb-1">
                      <Ionicons name="location-outline" size={14} color="#666" />
                      <Text className="text-xs text-foreground dark:text-foreground-dark" numberOfLines={1}>
                        {property.district}, {property.city}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-3 mb-2">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="resize-outline" size={14} color="#666" />
                        <Text className="text-xs text-gray-600">{property.areaSqm}m²</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="bed-outline" size={14} color="#666" />
                        <Text className="text-xs text-gray-600">{property.bedrooms} PN</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="water-outline" size={14} color="#666" />
                        <Text className="text-xs text-gray-600">{property.bathrooms} WC</Text>
                      </View>
                    </View>

                    {activeTab === 'active' && (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="eye-outline" size={14} color="#666" />
                        <Text className="text-xs text-gray-500">
                          {property.viewCount} lượt xem
                        </Text>
                      </View>
                    )}

                    {activeTab === 'draft' && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleContinuePost(property.propertyId);
                        }}
                        className="bg-yellow-400 px-4 py-2 rounded-lg self-start mt-1"
                      >
                        <Text className="text-sm font-semibold text-gray-800">
                          Tiếp tục đăng tin
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View className="absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded">
                  <Text className="text-xs font-semibold text-white">
                    {PROPERTY_META[property.propertyType].label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MyPost;
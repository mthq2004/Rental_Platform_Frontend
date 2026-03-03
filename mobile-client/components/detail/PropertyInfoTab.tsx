import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

type Amenity = {
  icon: string
  label: string
}

type Owner = {
  name: string
  phone: string
  avatar: string
  rating: number
  reviewCount: number
}

type SimilarProperty = {
  id: number
  image: string
  title: string
  price: string
}

type PropertyStats = {
  views: number
  bookings: number
  interests: number
}

type PropertyInfoTabProps = {
  isOwner: boolean
  title: string
  price: string
  location: string
  amenities: Amenity[]
  description: string
  owner?: Owner
  similarProperties?: SimilarProperty[]
  stats?: PropertyStats
}

export const PropertyInfoTab: React.FC<PropertyInfoTabProps> = ({
  isOwner,
  title,
  price,
  location,
  amenities,
  description,
  owner,
  similarProperties = [],
  stats
}) => {
  const handleContactOwner = () => {
    Alert.alert('Liên hệ chủ nhà', `Gọi: ${owner?.phone}`)
  }

  return (
    <View className="p-4">
      {/* Property Title & Price */}
      <Text className="text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </Text>
      <Text className="text-blue-600 text-xl font-bold mt-2">
        {price}
      </Text>
      <View className="flex-row items-center mt-2">
        <Ionicons name="location" size={16} color="#6b7280" />
        <Text className="text-gray-600 dark:text-gray-400 ml-1">{location}</Text>
      </View>

      {/* Stats (Owner only) */}
      {isOwner && stats && (
        <View className="flex-row gap-4 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-blue-600">{stats.views}</Text>
            <Text className="text-gray-600 dark:text-gray-400 text-xs mt-1">Lượt xem</Text>
          </View>
          <View className="flex-1 items-center border-x border-blue-200 dark:border-blue-800">
            <Text className="text-2xl font-bold text-blue-600">{stats.bookings}</Text>
            <Text className="text-gray-600 dark:text-gray-400 text-xs mt-1">Lịch hẹn</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-blue-600">{stats.interests}</Text>
            <Text className="text-gray-600 dark:text-gray-400 text-xs mt-1">Quan tâm</Text>
          </View>
        </View>
      )}

      {/* Amenities */}
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
        Tiện ích
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {amenities.map((amenity, index) => (
          <AmenityItem key={index} icon={amenity.icon} label={amenity.label} />
        ))}
      </View>

      {/* Description */}
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">
        Mô tả
      </Text>
      <Text className="text-gray-700 dark:text-gray-300 leading-6">
        {description}
      </Text>

      {/* Owner Info (Renter only) */}
      {!isOwner && owner && (
        <>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            Thông tin chủ nhà
          </Text>
          <View className="flex-row items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Image
              source={{ uri: owner.avatar }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-gray-900 dark:text-white">
                {owner.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                  {owner.rating} ({owner.reviewCount} đánh giá)
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleContactOwner}
              className="bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold text-sm">Liên hệ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Similar Properties (Renter only) */}
      {!isOwner && similarProperties.length > 0 && (
        <>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            Tin tương tự
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx--4">
            {similarProperties.map((property) => (
              <View key={property.id} className="w-40 mr-3 first:ml-4 last:mr-4">
                <Image
                  source={{ uri: property.image }}
                  className="w-full h-24 rounded-lg"
                />
                <Text className="font-semibold text-gray-900 dark:text-white mt-2" numberOfLines={2}>
                  {property.title}
                </Text>
                <Text className="text-blue-600 font-semibold mt-1">{property.price}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  )
}

const AmenityItem = ({ icon, label }: Amenity) => (
  <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
    <Ionicons name={icon as any} size={16} color="#6b7280" />
    <Text className="text-gray-700 dark:text-gray-300 text-sm ml-2">{label}</Text>
  </View>
)
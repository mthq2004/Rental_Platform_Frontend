import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

type PropertyActionsProps = {
  isOwner: boolean
  propertyId: string
  ownerId?: string
  onBookSchedule?: () => void
  onContact?: () => void
  onViewStats?: () => void
}

export const PropertyActions: React.FC<PropertyActionsProps> = ({
  isOwner,
  propertyId,
  ownerId,
  onBookSchedule,
  onContact,
  onViewStats
}) => {
  const handleBookSchedule = () => {
    if (onBookSchedule) {
      onBookSchedule();
    } else {
      router.push({
        pathname: "/(post)/book-schedule",
        params: {
          propertyId
        }
      })
    }
  }

  const handleContact = () => {
    if (onContact) {
      onContact()
    } else {
      Alert.alert('Liên hệ chủ nhà')
    }
  }

  const handleViewStats = () => {
    if (onViewStats) {
      onViewStats()
    } else {
      Alert.alert('Xem thống kê')
    }
  }

  const handleRentalRequest = () => {
    if (!ownerId) {
      Alert.alert('Lỗi', 'Không tìm thấy chủ nhà')
      return;
    }

    router.push({
      pathname: '/(rental)/create-request',
      params: {
        propertyId,
        ownerId,
      },
    })
  }

  if (isOwner) {
    return (
      <View className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
        <TouchableOpacity 
          onPress={handleViewStats}
          className="bg-blue-600 py-3.5 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="stats-chart" size={20} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Xem thống kê</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleBookSchedule}
          className="flex-1 bg-blue-600 py-3.5 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="calendar" size={20} color="white" />
          <Text className="text-white font-semibold text-base ml-2">Đặt lịch xem</Text>
        </TouchableOpacity>

        {!isOwner && (
          <TouchableOpacity
            onPress={handleRentalRequest}
            className="flex-1 bg-emerald-600 py-3.5 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="document-text-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">Yêu cầu thuê</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={handleContact}
          className="bg-gray-100 dark:bg-gray-800 px-5 py-3.5 rounded-xl"
        >
          <Ionicons name="chatbubble-outline" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  )
}
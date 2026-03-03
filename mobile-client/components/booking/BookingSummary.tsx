import { View, Text } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { TimeSlot } from './TimeSlotSelector'

type BookingSummaryProps = {
  selectedDate: Date
  selectedTimeSlot: string | null
  timeSlots: TimeSlot[]
  visitorCount: number
  isDark: boolean
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  selectedDate,
  selectedTimeSlot,
  timeSlots,
  visitorCount,
  isDark
}) => {
  const formatDate = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const day = days[date.getDay()]
    const dateNum = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}, ${dateNum}/${month}/${year}`
  }

  if (!selectedTimeSlot) return null

  return (
    <View className="mx-4 mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
      <Text className="text-blue-900 dark:text-blue-100 font-semibold mb-3 text-base">
        📋 Tóm tắt lịch hẹn
      </Text>
      <View className="space-y-2">
        <View className="flex-row items-center">
          <Ionicons name="calendar" size={16} color={isDark ? '#93c5fd' : '#3b82f6'} />
          <Text className="text-blue-800 dark:text-blue-200 ml-2">
            Ngày xem: {formatDate(selectedDate)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color={isDark ? '#93c5fd' : '#3b82f6'} />
          <Text className="text-blue-800 dark:text-blue-200 ml-2">
            Giờ xem: {timeSlots.find(t => t.id === selectedTimeSlot)?.time}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="people" size={16} color={isDark ? '#93c5fd' : '#3b82f6'} />
          <Text className="text-blue-800 dark:text-blue-200 ml-2">
            Số người: {visitorCount} người
          </Text>
        </View>
      </View>
    </View>
  )
}
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'

export type TimeSlot = {
  id: string
  time: string
  available: boolean
}

type TimeSlotSelectorProps = {
  timeSlots: TimeSlot[]
  selectedTimeSlot: string | null
  onSelectTimeSlot: (slotId: string) => void
  selectedDate: Date
  isLoading?: boolean
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  timeSlots,
  selectedTimeSlot,
  onSelectTimeSlot,
  selectedDate,
  isLoading = false
}) => {
  const isSlotPast = (slotTime: string) => {
    const now = new Date()
    if (selectedDate.toDateString() !== now.toDateString()) return false

    const [start] = slotTime.split(' - ')
    const [h, m] = start.split(':').map(Number)

    const slotDate = new Date()
    slotDate.setHours(h, m, 0, 0)

    return slotDate < now
  }

  return (
    <View className="px-4 mb-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Chọn khung giờ
      </Text>

      {isLoading ? (
        <View className="py-8 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 dark:text-gray-400 mt-2">
            Đang tải khung giờ...
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {timeSlots.map((slot) => {
            const isPast = isSlotPast(slot.time)
            const isDisabled = !slot.available || isPast
            const isSelected = selectedTimeSlot === slot.id

            return (
              <TouchableOpacity
                key={slot.id}
                onPress={() => !isDisabled && onSelectTimeSlot(slot.id)}
                disabled={isDisabled}
                className={`px-4 py-3 rounded-xl border-2 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : isDisabled
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                style={{ width: '48%' }}
              >
                <Text
                  className={`font-semibold text-center ${
                    isSelected
                      ? 'text-white'
                      : isDisabled
                      ? 'text-gray-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {slot.time}
                </Text>
                {!slot.available && !isPast && (
                  <Text className="text-red-500 text-xs text-center mt-1">
                    Hết chỗ
                  </Text>
                )}
                {isPast && (
                  <Text className="text-gray-400 text-xs text-center mt-1">
                    Đã qua
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Legend */}
      <View className="flex-row gap-4 mt-3">
        <View className="flex-row items-center">
          <View className="w-4 h-4 bg-blue-600 rounded mr-2" />
          <Text className="text-xs text-gray-600 dark:text-gray-400">Đã chọn</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded mr-2" />
          <Text className="text-xs text-gray-600 dark:text-gray-400">Trống</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded mr-2 opacity-50" />
          <Text className="text-xs text-gray-600 dark:text-gray-400">Hết chỗ</Text>
        </View>
      </View>
    </View>
  )
}
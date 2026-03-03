import { View, Text, TouchableOpacity, Linking } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

export type ScheduleStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

export type Schedule = {
  id: string
  status: ScheduleStatus
  name: string
  date: string
  time: string
  phone?: string
  propertyTitle?: string
  propertyAddress?: string
  tenantNote?: string
  landlordNote?: string
}

type ScheduleTabProps = {
  isOwner: boolean
  schedules: Schedule[]
  onConfirm?: (id: string) => void
  onReject?: (id: string) => void
  onCancel?: (id: string) => void
  onMessage?: (id: string) => void
  onGetDirections?: (id: string) => void
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  isOwner,
  schedules,
  onConfirm,
  onReject,
  onCancel,
  onMessage,
  onGetDirections
}) => {
  return (
    <View className="p-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {isOwner ? 'Lịch xem của khách' : 'Lịch bạn đã đặt'}
      </Text>

      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.id}
          isOwner={isOwner}
          schedule={schedule}
          onConfirm={onConfirm}
          onReject={onReject}
          onCancel={onCancel}
          onMessage={onMessage}
          onGetDirections={onGetDirections}
        />
      ))}

      {schedules.length === 0 && (
        <View className="items-center py-12">
          <Ionicons name="calendar-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base">
            {isOwner ? 'Chưa có lịch xem nào' : 'Bạn chưa đặt lịch xem'}
          </Text>
          {!isOwner && (
            <TouchableOpacity 
              onPress={() => router.push('/(post)/book-schedule')}
              className="bg-blue-600 px-6 py-3 rounded-xl mt-4"
            >
              <Text className="text-white font-semibold">Đặt lịch ngay</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

type ScheduleCardProps = {
  isOwner: boolean
  schedule: Schedule
  onConfirm?: (id: string) => void
  onReject?: (id: string) => void
  onCancel?: (id: string) => void
  onMessage?: (id: string) => void
  onGetDirections?: (id: string) => void
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  isOwner,
  schedule,
  onConfirm,
  onReject,
  onCancel,
  onMessage,
  onGetDirections
}) => {
  const statusConfig: Record<ScheduleStatus, any> = {
    pending: { 
      text: 'Chờ xác nhận', 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50 dark:bg-yellow-900/20' 
    },
    confirmed: { 
      text: 'Đã xác nhận', 
      color: 'text-green-600', 
      bg: 'bg-green-50 dark:bg-green-900/20' 
    },
    cancelled: { 
      text: 'Đã hủy', 
      color: 'text-red-600', 
      bg: 'bg-red-50 dark:bg-red-900/20' 
    },
    completed: { 
      text: 'Hoàn thành', 
      color: 'text-blue-600', 
      bg: 'bg-blue-50 dark:bg-blue-900/20' 
    },
    no_show: { 
      text: 'Không đến', 
      color: 'text-gray-600', 
      bg: 'bg-gray-50 dark:bg-gray-900/20' 
    },
  }

  const status = statusConfig[schedule.status]

  return (
    <View className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 border border-gray-200 dark:border-gray-700">
      {/* Property Title (if available) */}
      {schedule.propertyTitle && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {schedule.propertyTitle}
        </Text>
      )}

      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-gray-900 dark:text-white text-base">
          {schedule.name}
        </Text>
        {isOwner && schedule.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${schedule.phone}`)}>
            <Text className="text-blue-600 dark:text-blue-400 text-sm">{schedule.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className={`px-3 py-1.5 rounded-lg self-start mb-3 ${status.bg}`}>
        <Text className={`font-semibold text-sm ${status.color}`}>{status.text}</Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
        <Text className="text-gray-700 dark:text-gray-300 ml-2">{schedule.date}</Text>
      </View>

      <View className="flex-row items-center mb-2">
        <Ionicons name="time-outline" size={16} color="#6b7280" />
        <Text className="text-gray-700 dark:text-gray-300 ml-2">{schedule.time}</Text>
      </View>

      {/* Address */}
      {schedule.propertyAddress && (
        <View className="flex-row items-start mb-2">
          <Ionicons name="location-outline" size={16} color="#6b7280" className="mt-0.5" />
          <Text className="text-gray-700 dark:text-gray-300 ml-2 flex-1">
            {schedule.propertyAddress}
          </Text>
        </View>
      )}

      {/* Notes */}
      {schedule.tenantNote && (
        <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-2">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ghi chú của khách:</Text>
          <Text className="text-sm text-gray-700 dark:text-gray-300">{schedule.tenantNote}</Text>
        </View>
      )}

      {schedule.landlordNote && (
        <View className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-2">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ghi chú của chủ nhà:</Text>
          <Text className="text-sm text-gray-700 dark:text-gray-300">{schedule.landlordNote}</Text>
        </View>
      )}

      {/* Owner Actions */}
      {isOwner && schedule.status === 'pending' && (
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={() => onConfirm?.(schedule.id)}
            className="flex-1 bg-green-600 py-2.5 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">Xác nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onReject?.(schedule.id)}
            className="flex-1 bg-red-600 py-2.5 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">Từ chối</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Renter Actions */}
      {!isOwner && (
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {schedule.status === 'confirmed' && (
            <TouchableOpacity 
              onPress={() => onGetDirections?.(schedule.id)}
              className="flex-1 bg-blue-600 py-2.5 rounded-lg"
            >
              <Text className="text-white font-semibold text-center text-sm">Chỉ đường</Text>
            </TouchableOpacity>
          )}
          {schedule.status === 'pending' && (
            <TouchableOpacity 
              onPress={() => onCancel?.(schedule.id)}
              className="flex-1 bg-red-600 py-2.5 rounded-lg"
            >
              <Text className="text-white font-semibold text-center text-sm">Hủy lịch</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => onMessage?.(schedule.id)}
            className="flex-1 bg-gray-600 py-2.5 rounded-lg"
          >
            <Text className="text-white font-semibold text-center text-sm">Nhắn tin</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
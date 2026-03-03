import { View, Text, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'

type DateSelectorProps = {
  selectedDate: Date
  onDateChange: (date: Date) => void
  showDatePicker: boolean
  setShowDatePicker: (show: boolean) => void
  isDark: boolean
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  showDatePicker,
  setShowDatePicker,
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

  const getNextDays = (count: number) => {
    const days = []
    for (let i = 0; i < count; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  const isDateSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const handleDatePickerChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (date) {
      onDateChange(date)
    }
  }

  return (
    <View className="px-4 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          Chọn ngày
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg flex-row items-center"
        >
          <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
          <Text className="text-blue-600 ml-1 font-semibold text-sm">
            Chọn ngày khác
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Date Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx--4">
        <View className="flex-row gap-2 px-4">
          {getNextDays(7).map((date, index) => {
            const isSelected = isDateSelected(date)
            const isPast = date < new Date() && !isDateSelected(date)

            return (
              <TouchableOpacity
                key={index}
                onPress={() => !isPast && onDateChange(date)}
                disabled={isPast}
                className={`items-center justify-center min-w-[80px] py-3 rounded-xl border-2 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : isPast
                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <Text
                  className={`text-xs font-medium mb-1 ${
                    isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index === 0 ? 'Hôm nay' : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
                </Text>
                <Text
                  className={`text-2xl font-bold ${
                    isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {date.getDate()}
                </Text>
                <Text
                  className={`text-xs ${
                    isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Th{date.getMonth() + 1}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* DateTimePicker Modal */}
      {showDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="slide" visible={showDatePicker}>
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white dark:bg-gray-900 rounded-t-3xl">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text className="text-blue-600 font-semibold">Hủy</Text>
                  </TouchableOpacity>
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    Chọn ngày
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text className="text-blue-600 font-semibold">Xong</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDatePickerChange}
                  minimumDate={new Date()}
                  textColor={isDark ? '#ffffff' : '#000000'}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDatePickerChange}
            minimumDate={new Date()}
          />
        )
      )}
    </View>
  )
}
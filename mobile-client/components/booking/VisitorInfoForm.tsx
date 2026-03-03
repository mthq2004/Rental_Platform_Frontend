import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React from 'react'

export type VisitorInfo = {
  name: string
  phone: string
  email: string
  count: number
}

export type FormErrors = {
  name: string
  phone: string
  email: string
}

type VisitorInfoFormProps = {
  visitorInfo: VisitorInfo
  errors: FormErrors
  onUpdateVisitorInfo: (field: keyof VisitorInfo, value: string | number) => void
  onClearError: (field: keyof FormErrors) => void
  notes: string
  onNotesChange: (notes: string) => void
}

export const VisitorInfoForm: React.FC<VisitorInfoFormProps> = ({
  visitorInfo,
  errors,
  onUpdateVisitorInfo,
  onClearError,
  notes,
  onNotesChange
}) => {
  return (
    <View className="px-4 mb-4">
      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Thông tin người xem
      </Text>

      {/* Name */}
      <View className="mb-4">
        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Họ và tên <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={visitorInfo.name}
          onChangeText={(text) => {
            onUpdateVisitorInfo('name', text)
            onClearError('name')
          }}
          placeholder="Nhập họ và tên"
          placeholderTextColor="#9ca3af"
          className={`bg-gray-50 dark:bg-gray-800 px-4 py-3.5 rounded-xl text-gray-900 dark:text-white border-2 ${
            errors.name ? 'border-red-500' : 'border-transparent'
          }`}
        />
        {errors.name ? (
          <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
        ) : null}
      </View>

      {/* Phone */}
      <View className="mb-4">
        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Số điện thoại <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          value={visitorInfo.phone}
          onChangeText={(text) => {
            onUpdateVisitorInfo('phone', text)
            onClearError('phone')
          }}
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          className={`bg-gray-50 dark:bg-gray-800 px-4 py-3.5 rounded-xl text-gray-900 dark:text-white border-2 ${
            errors.phone ? 'border-red-500' : 'border-transparent'
          }`}
        />
        {errors.phone ? (
          <Text className="text-red-500 text-sm mt-1">{errors.phone}</Text>
        ) : null}
      </View>

      {/* Email */}
      <View className="mb-4">
        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Email (tùy chọn)
        </Text>
        <TextInput
          value={visitorInfo.email}
          onChangeText={(text) => {
            onUpdateVisitorInfo('email', text)
            onClearError('email')
          }}
          placeholder="Nhập email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          className={`bg-gray-50 dark:bg-gray-800 px-4 py-3.5 rounded-xl text-gray-900 dark:text-white border-2 ${
            errors.email ? 'border-red-500' : 'border-transparent'
          }`}
        />
        {errors.email ? (
          <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
        ) : null}
      </View>

      {/* Visitor Count */}
      <View className="mb-4">
        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Số người đi cùng
        </Text>
        <View className="flex-row gap-2">
          {[1, 2, 3, 4].map((count) => (
            <TouchableOpacity
              key={count}
              onPress={() => onUpdateVisitorInfo('count', count)}
              className={`flex-1 py-3 rounded-xl border-2 ${
                visitorInfo.count === count
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  visitorInfo.count === count
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {count} {count === 1 ? 'người' : 'người'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Notes */}
      <View className="mb-4">
        <Text className="text-gray-700 dark:text-gray-300 mb-2 font-medium">
          Ghi chú (tùy chọn)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Nhập ghi chú (nếu có)"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl text-gray-900 dark:text-white border-2 border-transparent"
        />
      </View>
    </View>
  )
}
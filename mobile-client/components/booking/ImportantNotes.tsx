import { View, Text } from 'react-native'
import React from 'react'

type ImportantNotesProps = {
  ownerPhone: string
}

export const ImportantNotes: React.FC<ImportantNotesProps> = ({ ownerPhone }) => {
  return (
    <View className="mx-4 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
      <Text className="text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
        Lưu ý quan trọng
      </Text>
      <Text className="text-yellow-800 dark:text-yellow-200 text-sm leading-6">
        • Vui lòng đến đúng giờ đã hẹn{'\n'}
        • Mang theo CMND/CCCD khi đến xem{'\n'}
        • Chủ nhà sẽ liên hệ xác nhận trong 24h{'\n'}
        • Liên hệ: {ownerPhone}
      </Text>
    </View>
  )
}
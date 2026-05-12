import React, { useMemo, useState } from 'react'
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, Modal, Pressable, SafeAreaView, Switch } from 'react-native'
import AuthGuard from '@/components/AuthGuard'
import { router, useLocalSearchParams } from 'expo-router'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import CustomInput from '@/components/CustomInput'
import PrimaryButton from '@/components/PrimaryButton'
import BackButton from '@/components/BackButton'
import { useAppDispatch } from '@/store/hook'
import { createRentalRequest as createRentalRequestThunk } from '@/store/slices/contract.slice'
import ScreenHeader from '@/components/common/ScreenHeader'
import CustomDatePicker from '@/components/CustomDatePicker'

type DateField = 'startDate' | 'endDate' | null

const formatApiDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const CreateRentalRequest = () => {
  const { propertyId, ownerId, pricePerMonth: priceParam } = useLocalSearchParams()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [message, setMessage] = useState('')
  const [autoRenew, setAutoRenew] = useState(false)
  const [loading, setLoading] = useState(false)

  const pricePerMonth = priceParam ? Number(priceParam) : 0

  const dispatch = useAppDispatch()

  const canSubmit = useMemo(() => !!startDate && !!endDate, [startDate, endDate])

  const handleSubmit = async () => {
    if (!propertyId || !ownerId) {
      Alert.alert('Lỗi', 'Thiếu thông tin bất động sản')
      return
    }

    if (!startDate || !endDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày bắt đầu và ngày kết thúc')
      return
    }

    if (endDate < startDate) {
      Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu')
      return
    }

    setLoading(true)
    try {
      const payload = {
        propertyId: String(propertyId),
        ownerId: String(ownerId),
        startDate: formatApiDate(startDate),
        endDate: formatApiDate(endDate),
        proposedRent: pricePerMonth,
        message,
        autoRenew,
      }

      await dispatch(createRentalRequestThunk(payload)).unwrap()

      Alert.alert('Thành công', 'Yêu cầu thuê đã gửi')
      router.replace('/(rental)/requests')
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Gửi yêu cầu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <KeyboardSafeWrapper style={{ flex: 1, backgroundColor: '#FFF' }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <ScreenHeader title="Gửi yêu cầu thuê" />

        <View className="p-4">

          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-5">
            <Text className="text-blue-700 dark:text-blue-200 font-semibold">Luồng đúng</Text>
            <Text className="text-blue-700/80 dark:text-blue-200/80 text-sm mt-1 leading-5">
              1) Gửi yêu cầu thuê  2) Chủ nhà mở đặt cọc  3) Người thuê thanh toán trước sẽ được giữ chỗ  4) Hợp đồng được tạo.
            </Text>
          </View>

          <CustomDatePicker
            label="Ngày bắt đầu"
            placeholder="Chọn ngày bắt đầu"
            value={startDate}
            onChange={(date) => {
              setStartDate(date);
              if (endDate && endDate < date) {
                setEndDate(date);
              }
            }}
            icon="calendar-outline"
            minimumDate={new Date()}
          />

          <CustomDatePicker
            label="Ngày kết thúc"
            placeholder="Chọn ngày kết thúc"
            value={endDate}
            onChange={setEndDate}
            icon="calendar-outline"
            minimumDate={startDate || new Date()}
          />

          {/* Hiển thị giá thuê từ bài đăng (read-only) */}
          {pricePerMonth > 0 && (
            <View className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 mb-4">
              <Text className="text-gray-600 dark:text-gray-400 text-sm">Giá thuê theo bài đăng</Text>
              <Text className="text-indigo-600 dark:text-indigo-300 text-xl font-bold mt-1">
                {formatMoney(pricePerMonth)}/tháng
              </Text>
            </View>
          )}

          <CustomInput label="Lời nhắn" placeholder="Nhập lời nhắn cho chủ nhà" value={message} onChangeText={setMessage} />

          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-gray-700 dark:text-gray-300 flex-1 pr-4">
              Tự động yêu cầu gia hạn khi sắp hết hạn hợp đồng
            </Text>
            <Switch
              value={autoRenew}
              onValueChange={setAutoRenew}
              trackColor={{ false: '#d1d5db', true: '#818cf8' }}
              thumbColor={autoRenew ? '#4f46e5' : '#f3f4f6'}
            />
          </View>

          <View className="mt-6">
            <PrimaryButton onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Gửi yêu cầu</Text>}
            </PrimaryButton>
          </View>
        </View>


        </SafeAreaView>
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default CreateRentalRequest

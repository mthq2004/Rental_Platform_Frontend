import React, { useMemo, useState } from 'react'
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native'
import AuthGuard from '@/components/AuthGuard'
import { router, useLocalSearchParams } from 'expo-router'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import CustomInput from '@/components/CustomInput'
import PrimaryButton from '@/components/PrimaryButton'
import BackButton from '@/components/BackButton'
import { useAppDispatch } from '@/store/hook'
import { createRentalRequest as createRentalRequestThunk } from '@/store/slices/contract.slice'
import DateTimePicker from '@react-native-community/datetimepicker'

type DateField = 'startDate' | 'endDate' | null

const formatDisplayDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const formatApiDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const CreateRentalRequest = () => {
  const { propertyId, ownerId } = useLocalSearchParams()
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [proposedRent, setProposedRent] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [activeDateField, setActiveDateField] = useState<DateField>(null)
  const [tempDate, setTempDate] = useState(new Date())

  const dispatch = useAppDispatch()

  const canSubmit = useMemo(() => !!startDate && !!endDate && !!proposedRent, [startDate, endDate, proposedRent])

  const openDatePicker = (field: DateField) => {
    setActiveDateField(field)
    setTempDate(field === 'endDate' && endDate ? endDate : field === 'startDate' && startDate ? startDate : new Date())
    setPickerVisible(true)
  }

  const confirmDate = () => {
    if (!activeDateField) return
    if (activeDateField === 'startDate') {
      setStartDate(tempDate)
      if (endDate && endDate < tempDate) {
        setEndDate(tempDate)
      }
    } else {
      setEndDate(tempDate)
    }
    setPickerVisible(false)
    setActiveDateField(null)
  }

  const handleSubmit = async () => {
    if (!propertyId || !ownerId) {
      Alert.alert('Lỗi', 'Thiếu thông tin bất động sản')
      return
    }

    if (!startDate || !endDate || !proposedRent) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin')
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
        proposedRent: Number(proposedRent),
        message,
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
      <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
        <View className="p-4">
          <View className="flex-row items-center mb-4">
            <BackButton onPress={() => router.back()} />
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">Gửi yêu cầu thuê</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tạo yêu cầu, sau đó theo dõi tại màn quản lý yêu cầu</Text>
            </View>
          </View>

          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 mb-5">
            <Text className="text-blue-700 dark:text-blue-200 font-semibold">Luồng đúng</Text>
            <Text className="text-blue-700/80 dark:text-blue-200/80 text-sm mt-1 leading-5">
              1) Gửi yêu cầu thuê  2) Chủ nhà mở đặt cọc  3) Người thuê thanh toán trước sẽ được giữ chỗ  4) Hợp đồng được tạo.
            </Text>
          </View>

          <TouchableOpacity onPress={() => openDatePicker('startDate')} className="mb-5">
            <View className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-900">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Ngày bắt đầu</Text>
              <Text className={`text-base ${startDate ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {startDate ? formatDisplayDate(startDate) : 'Chọn ngày bắt đầu'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openDatePicker('endDate')} className="mb-5">
            <View className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-900">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Ngày kết thúc</Text>
              <Text className={`text-base ${endDate ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                {endDate ? formatDisplayDate(endDate) : 'Chọn ngày kết thúc'}
              </Text>
            </View>
          </TouchableOpacity>

          <CustomInput label="Giá đề xuất" placeholder="5000000" value={proposedRent} onChangeText={setProposedRent} keyboardType="numeric" />
          <CustomInput label="Lời nhắn" placeholder="Nhập lời nhắn cho chủ nhà" value={message} onChangeText={setMessage} />

          <View className="mt-6">
            <PrimaryButton onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Gửi yêu cầu</Text>}
            </PrimaryButton>
          </View>
        </View>

        <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <Pressable className="flex-1" onPress={() => setPickerVisible(false)} />
            <View className="bg-white dark:bg-gray-950 rounded-t-3xl p-4 border-t border-gray-200 dark:border-gray-800">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {activeDateField === 'startDate' ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
              </Text>
              <View className="items-center">
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, date) => date && setTempDate(date)}
                  minimumDate={activeDateField === 'endDate' && startDate ? startDate : new Date()}
                />
              </View>
              <View className="flex-row gap-3 mt-4">
                <View className="flex-1">
                  <PrimaryButton title="Hủy" onPress={() => setPickerVisible(false)} />
                </View>
                <View className="flex-1">
                  <PrimaryButton title="Xác nhận" onPress={confirmDate} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default CreateRentalRequest

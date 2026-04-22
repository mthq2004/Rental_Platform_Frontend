import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'react-native'
import { useThemeColors } from '@/utils/colors'
import AuthGuard from '@/components/AuthGuard'
import { router, useLocalSearchParams } from 'expo-router'
import PropertyInfoCard from '@/components/booking/PropertyInfoCard'
import { DateSelector } from '@/components/booking/DateSelector'
import { TimeSlotSelector, TimeSlot } from '@/components/booking/TimeSlotSelector'
import { VisitorInfoForm, VisitorInfo, FormErrors } from '@/components/booking/VisitorInfoForm'
import { BookingSummary } from '@/components/booking/BookingSummary'
import { ImportantNotes } from '@/components/booking/ImportantNotes'
import { validateBookingForm, formatDate } from '@/utils/bookingValidation'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { clearMessage, createBooking, getAvailableSlots } from '@/store/slices/booking.slice'
import { Toast } from '@/components/Notification'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'

const BookSchedule = () => {
  const colorScheme = useColorScheme()
  const colors = useThemeColors()
  const isDark = colorScheme === 'dark'
  const { propertyId } = useLocalSearchParams()
  const dispatch = useAppDispatch()
  const { loading, time_slot, message } = useAppSelector(state => state.booking)
  const { user } = useAppSelector(state => state.auth)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  const formatDateForApi = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo>({
    name: '',
    phone: '',
    email: '',
    count: 1
  })
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    phone: '',
    email: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const propertyInfo = {
    title: 'Phòng trọ Quận 7 – Gần Lotte',
    price: '4.500.000 đ/tháng',
    address: 'Quận 7, TP.HCM',
    owner: {
      name: 'Nguyễn Văn B',
      phone: '0901234567',
      avatar: 'https://via.placeholder.com/50'
    }
  }

  useEffect(() => {
    if (!user) return;

    setVisitorInfo(prev => ({
      ...prev,
      name: prev.name || user.fullName || '',
      phone: prev.phone || user.phone || '',
      email: prev.email || user.email || '',
    }))
  }, [user])

  useEffect(() => {
    if (!propertyId) return;
    setSelectedTimeSlot(null);
    dispatch(
      getAvailableSlots({
        propertyId,
        date: formatDateForApi(selectedDate),
      })
    );
  }, [selectedDate, propertyId, dispatch]);

  const handleUpdateVisitorInfo = (field: keyof VisitorInfo, value: string | number) => {
    setVisitorInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleClearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async () => {
    const validation = validateBookingForm({
      visitorName: visitorInfo.name,
      visitorPhone: visitorInfo.phone,
      visitorEmail: visitorInfo.email,
      selectedTimeSlot,
      selectedDate
    })

    if (!validation.isValid) {
      setErrors(validation.errors)
      if (validation.errorMessage) {
        Alert.alert('Lỗi', validation.errorMessage)
      }
      return
    }

    const selectedSlot = time_slot?.find(t => t.id === selectedTimeSlot)

    if (!selectedSlot) {
      Alert.alert('Lỗi', 'Vui lòng chọn khung giờ')
      return
    }

    if (!selectedSlot.available) {
      Alert.alert('Khung giờ đã được đặt', 'Vui lòng chọn thời gian khác.')
      return
    }

    const [start, end] = selectedSlot.time.split(' - ')

    const payload = {
      propertyId: String(propertyId),
      visitDate: formatDateForApi(selectedDate),
      visitTimeStart: `${start}:00`,
      visitTimeEnd: `${end}:00`,
      tenantNote: notes,
      tenantPhone: visitorInfo.phone,
      numberOfVisitors: visitorInfo.count || 1
    }

    Alert.alert(
      'Xác nhận đặt lịch',
      `Bạn muốn đặt lịch xem nhà vào ${payload.visitDate} - ${selectedSlot.time}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            dispatch(createBooking(payload))
          }
        }
      ]
    )
  }

  useEffect(() => {
    if (!message) return

    if (message.type === 'success') {
      showToast(message.message, 'success')
      setTimeout(() => {
        router.replace('/(tab)');
      }, 500);
    }

    if (message.type === 'error') {
      showToast(message.message, 'error')
    }

    dispatch(clearMessage())

  }, [message])

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: any, type = 'success') => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  return (
    <AuthGuard>
      <KeyboardSafeWrapper scrollable={false} className="bg-white dark:bg-gray-950 pt-10">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View className="flex-row items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Đặt lịch xem nhà
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PropertyInfoCard />

          <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            isDark={isDark}
          />

          <TimeSlotSelector
            timeSlots={time_slot}
            selectedTimeSlot={selectedTimeSlot}
            onSelectTimeSlot={setSelectedTimeSlot}
            selectedDate={selectedDate}
            isLoading={loading}
          />

          <VisitorInfoForm
            visitorInfo={visitorInfo}
            errors={errors}
            onUpdateVisitorInfo={handleUpdateVisitorInfo}
            onClearError={handleClearError}
            notes={notes}
            onNotesChange={setNotes}
          />

          <ImportantNotes ownerPhone={propertyInfo.owner.phone} />

          <BookingSummary
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            timeSlots={time_slot}
            visitorCount={visitorInfo.count}
            isDark={isDark}
          />
          <View className="h-24" />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`bg-blue-600 py-4 rounded-xl flex-row items-center justify-center ${loading ? 'opacity-50' : ''
              }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Xác nhận đặt lịch
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          duration={3000}
          onHide={hideToast}
        />

      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default BookSchedule
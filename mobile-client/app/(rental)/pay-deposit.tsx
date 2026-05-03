import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { View, Text, Alert, ActivityIndicator, ScrollView, Image } from 'react-native'
import AuthGuard from '@/components/AuthGuard'
import { useLocalSearchParams, router } from 'expo-router'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import PrimaryButton from '@/components/PrimaryButton'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { payHoldingDeposit as payHoldingDepositThunk, getMyRentalRequests } from '@/store/slices/contract.slice'
import * as WebBrowser from 'expo-web-browser'

const money = (value: unknown) => Number(value || 0).toLocaleString('vi-VN')

const getPropertySummary = (request: any) => {
  const property =
    request?.property ||
    request?.propertySummary ||
    request?.propertyInfo ||
    request?.rentalRequest?.property ||
    request?.contract?.property ||
    request?.propertyDetail ||
    null

  const imageUrl =
    property?.imageUrl ||
    property?.images?.[0]?.uri ||
    property?.images?.[0]?.url ||
    property?.images?.[0]?.secureUrl ||
    request?.propertyImageUrl ||
    request?.coverImageUrl ||
    ''

  const title = property?.title || property?.name || request?.propertyTitle || request?.propertyId || 'Bất động sản'
  const address = property?.address || [property?.ward, property?.district, property?.city].filter(Boolean).join(', ') || request?.propertyAddress || ''

  return {
    imageUrl,
    title,
    address,
  }
}

const statusLabel: Record<string, string> = {
  pending: 'Chờ duyệt',
  under_review: 'Đang xem xét',
  approved: 'Đã duyệt',
  holding_deposit_open: 'Đang mở cọc',
  holding_deposit_paid: 'Đã đặt cọc',
  holding_deposit_locked: 'Đã khóa cọc',
  holding_deposit_expired: 'Hết hạn cọc',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
  contract_created: 'Đã tạo hợp đồng',
}

const PayDeposit = () => {
  const { requestId } = useLocalSearchParams()
  const [loading, setLoading] = useState(false)
  const [requestDetail, setRequestDetail] = useState<any | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const dispatch = useAppDispatch()
  const { myRequests } = useAppSelector(state => state.contract)

  const loadRequestDetail = useCallback(async () => {
    if (!requestId) return
    try {
      await dispatch(getMyRentalRequests()).unwrap()
    } catch {
      // state fallback still works
    }
  }, [dispatch, requestId])

  useEffect(() => {
    loadRequestDetail()
  }, [loadRequestDetail])

  useEffect(() => {
    const found = Array.isArray(myRequests)
      ? myRequests.find((item: any) => item.requestId === requestId || item.id === requestId)
      : null
    setRequestDetail(found || null)
  }, [myRequests, requestId])

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  const handlePollForPaid = async (requestId: string) => {
    const maxAttempts = 24 // 2 minutes if interval 5s
    let attempts = 0

    pollingRef.current = setInterval(async () => {
      attempts += 1
      try {
        const res = await dispatch(getMyRentalRequests()).unwrap()
        const found = Array.isArray(res) ? res.find((r: any) => r.requestId === requestId || r.id === requestId) : null
        const status = found?.holdingDepositStatus
        if (status === 'paid' || status === 'holding_deposit_paid' || status === 'locked') {
          stopPolling()
          Alert.alert('Thanh toán', 'Đặt cọc đã được thanh toán')
          const contractId = found?.contractId || found?.contract?.rentalId
          if (contractId) router.push({ pathname: '/(rental)/contract-detail', params: { contractId } })
          else router.replace('/(tab)')
        }
      } catch {
        // ignore per-try error
      }

      if (attempts >= maxAttempts) {
        stopPolling()
        Alert.alert('Thông báo', 'Không xác nhận được trạng thái thanh toán, vui lòng kiểm tra sau')
      }
    }, 5000)
  }

  const handlePay = async (method: string) => {
    if (!requestId) return Alert.alert('Lỗi', 'Thiếu requestId')
    setLoading(true)
    try {
      const res = await dispatch(payHoldingDepositThunk({ requestId: String(requestId), method })).unwrap()

      // If backend returns a payment redirect url, open browser and poll for status
      const redirectUrl = res?.paymentUrl || res?.redirectUrl || res?.paymentRedirectUrl
      if (redirectUrl) {
        await WebBrowser.openBrowserAsync(String(redirectUrl))
        // start polling to detect payment complete
        await handlePollForPaid(String(requestId))
        setLoading(false)
        return
      }

      Alert.alert('Thành công', 'Thanh toán đặt cọc hoàn tất')
      const contractId = res?.contractId || res?.rentalRequest?.contractId
      if (contractId) router.push({ pathname: '/(rental)/contract-detail', params: { contractId } })
      else router.replace('/(rental)/requests')
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Thanh toán thất bại')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => getPropertySummary(requestDetail), [requestDetail])

  return (
    <AuthGuard>
      <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="flex-row items-start gap-3 mb-5">
            <BackButton onPress={() => router.back()} />
            <View className="flex-1 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 p-5">
              <Text className="text-white text-2xl font-bold">Thanh toán đặt cọc</Text>
              <Text className="text-emerald-100 text-sm mt-2 leading-5">Hoàn tất thanh toán để giữ chỗ bất động sản và chuyển sang tạo hợp đồng.</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <View className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {summary.imageUrl ? <Image source={{ uri: summary.imageUrl }} className="w-full h-full" resizeMode="cover" /> : null}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={2}>{summary.title}</Text>
                {!!summary.address && <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1" numberOfLines={2}>{summary.address}</Text>}
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">Yêu cầu: {String(requestId)}</Text>
              </View>
            </View>

            <View className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-3">
              <Text className="text-sm text-gray-600 dark:text-gray-300">Trạng thái: <Text className="font-semibold">{statusLabel[requestDetail?.status] || requestDetail?.status || '—'}</Text></Text>
              <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">Tiền đề xuất: <Text className="font-semibold">{money(requestDetail?.proposedRent)} đ</Text></Text>
              <Text className="text-sm text-gray-600 dark:text-gray-300 mt-1">Tiền đặt cọc: <Text className="font-semibold">{money(requestDetail?.holdingDepositAmount || requestDetail?.depositAmount || requestDetail?.property?.depositAmount)} đ</Text></Text>
            </View>
          </View>

          <View className="mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4">
            <Text className="text-emerald-700 dark:text-emerald-200 font-semibold">Luồng đặt cọc</Text>
            <Text className="text-emerald-700/80 dark:text-emerald-200/80 text-sm mt-1 leading-5">
              1) Chủ nhà mở cọc. 2) Người thuê thanh toán trước sẽ giữ chỗ. 3) Sau thanh toán, hệ thống chuyển sang trạng thái đặt cọc thành công.
            </Text>
          </View>

          <View className="mb-4">
            <PrimaryButton onPress={() => handlePay('momo')} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Thanh toán bằng MoMo</Text>}
            </PrimaryButton>
          </View>

          <View className="mb-4">
            <PrimaryButton onPress={() => handlePay('vnpay')} disabled={loading}>
              <Text className="text-white font-bold">Thanh toán bằng VNPay</Text>
            </PrimaryButton>
          </View>

          <View className="mb-4">
            <PrimaryButton onPress={() => handlePay('wallet')} disabled={loading}>
              <Text className="text-white font-bold">Thanh toán bằng Ví</Text>
            </PrimaryButton>
          </View>

          <TouchableOpacity onPress={() => router.replace('/(rental)/requests')} className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 py-3">
            <Text className="text-center font-semibold text-blue-600 dark:text-blue-300">Quay về quản lý yêu cầu thuê</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default PayDeposit

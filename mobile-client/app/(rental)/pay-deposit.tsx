import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { getRequestDetail, payHoldingDeposit } from '@/store/slices/contract.slice'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '@/components/BackButton'
import { useThemeColors } from '@/utils/colors'
import { Ionicons } from '@expo/vector-icons'
import PrimaryButton from '@/components/PrimaryButton'
import WebView from 'react-native-webview'

const HOLDING_PAYMENT_OPTIONS = [
  { value: 'vnpay', label: 'VNPay', icon: require('../../assets/images/vnpay.png') },
  { value: 'momo', label: 'MoMo', icon: require('../../assets/images/momo.png') },
  { value: 'wallet', label: 'Ví nội bộ', icon: require('../../assets/images/wallet.png') },
]

const formatMoney = (value: unknown) => Number(value || 0).toLocaleString('vi-VN')

const PayDepositScreen = () => {
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const theme = useThemeColors() as any
  const current = theme.current
  const primary = theme.primary
  const { loading } = useSelector((state: RootState) => state.contract);

  const [requestDetail, setRequestDetail] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('vnpay')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) {
      Alert.alert('Lỗi', 'Không tìm thấy mã yêu cầu.', [{ text: 'OK', onPress: () => router.back() }])
      return;
    }
    dispatch(getRequestDetail(requestId))
      .unwrap()
      .then(setRequestDetail)
      .catch((e: any) => {
        Alert.alert('Lỗi', e?.message || 'Không thể tải thông tin yêu cầu.', [{ text: 'OK', onPress: () => router.back() }])
      })
  }, [dispatch, requestId, router])

  const handlePayment = async () => {
    if (!requestId) return
    try {
      const result = await dispatch(payHoldingDeposit({ requestId, method: selectedMethod })).unwrap()
      const paymentTarget = result?.paymentUrl || result?.redirectUrl || result?.payUrl || result?.data?.paymentUrl || result?.data?.redirectUrl || result?.data?.payUrl
      if (paymentTarget) {
        if (/^https?:\/\//i.test(paymentTarget)) {
          setPaymentUrl(paymentTarget)
        } else {
          await Linking.openURL(paymentTarget)
        }
      } else {
        Alert.alert('Thành công', 'Thanh toán bằng ví đã được ghi nhận. Yêu cầu của bạn đã được cập nhật.')
        router.replace('/(rental)/requests')
      }
    } catch (e: any) {
      Alert.alert('Thanh toán thất bại', e?.message || 'Đã có lỗi xảy ra.')
    }
  }

  if (paymentUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <TouchableOpacity onPress={() => setPaymentUrl(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={current.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: current.text }}>Cổng thanh toán</Text>
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes('/payment/vnpay_return')) {
              setPaymentUrl(null)
              Alert.alert('Thông báo', 'Giao dịch của bạn đang được xử lý. Vui lòng kiểm tra lại trạng thái trong ít phút.', [
                { text: 'OK', onPress: () => router.replace('/(rental)/requests') },
              ])
            }
          }}
        />
      </SafeAreaView>
    )
  }

  if (!requestDetail) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    )
  }

  const depositAmount = requestDetail.holdingDepositAmount ?? requestDetail.property?.holdingDepositAmount ?? requestDetail.property?.depositAmount ?? requestDetail.proposedRent

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: current.text }}>Thanh toán cọc giữ chỗ</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 20 }}>
        <View style={{ alignItems: 'center', padding: 24, backgroundColor: current.card, borderRadius: 16, borderWidth: 1, borderColor: current.border }}>
          <Text style={{ fontSize: 16, color: current.textInactive, fontWeight: '500' }}>Số tiền cần thanh toán</Text>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: primary, marginVertical: 8 }}>
            {formatMoney(depositAmount)} đ
          </Text>
          <Text style={{ fontSize: 14, color: current.text, fontWeight: '500', textAlign: 'center' }}>
            Bất động sản: {requestDetail.property?.title}
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: 'bold', color: current.text, marginTop: 32, marginBottom: 16 }}>Chọn phương thức thanh toán</Text>

        <View style={{ gap: 12 }}>
          {HOLDING_PAYMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setSelectedMethod(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: current.card,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: selectedMethod === option.value ? primary : current.border,
              }}
            >
              <Image source={option.icon} style={{ width: 40, height: 40, marginRight: 16, borderRadius: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: current.text, flex: 1 }}>{option.label}</Text>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selectedMethod === option.value ? primary : current.border, justifyContent: 'center', alignItems: 'center' }}>
                {selectedMethod === option.value && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: primary }} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ padding: 20, marginTop: 'auto', borderTopWidth: 1, borderTopColor: current.border }}>
        <PrimaryButton onPress={handlePayment} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              Thanh toán {formatMoney(depositAmount)} đ
            </Text>
          )}
        </PrimaryButton>
      </View>
    </SafeAreaView>
  )
}

export default PayDepositScreen

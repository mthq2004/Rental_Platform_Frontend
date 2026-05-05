import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image, Linking, ScrollView, Animated } from 'react-native'
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
import { LinearGradient } from 'expo-linear-gradient'
import { format } from 'date-fns'

const HOLDING_PAYMENT_OPTIONS = [
  { value: 'vnpay', label: 'Cổng thanh toán VNPay', description: 'Thanh toán an toàn qua VNPAY', icon: require('../../assets/images/vnpay.png') },
  { value: 'momo', label: 'Ví điện tử MoMo', description: 'Quét mã QR tiện lợi', icon: require('../../assets/images/momo.png') },
  { value: 'wallet', label: 'Ví nội bộ', description: 'Thanh toán tức thì', icon: require('../../assets/images/wallet.png') },
]

const formatMoney = (value: unknown) => Number(value || 0).toLocaleString('vi-VN')

const PayDepositScreen = () => {
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const theme = useThemeColors() as any
  const current = theme.current
  const primary = theme.primary
  const { loading } = useSelector((state: RootState) => state.contract)

  const [requestDetail, setRequestDetail] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('vnpay')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const fadeAnim = useState(new Animated.Value(0))[0]

  useEffect(() => {
    if (!requestId) {
      Alert.alert('Lỗi', 'Không tìm thấy mã yêu cầu.', [{ text: 'OK', onPress: () => router.back() }])
      return;
    }
    dispatch(getRequestDetail(requestId))
      .unwrap()
      .then((data) => {
        setRequestDetail(data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      })
      .catch((e: any) => {
        Alert.alert('Lỗi', e?.message || 'Không thể tải thông tin yêu cầu.', [{ text: 'OK', onPress: () => router.back() }])
      })
  }, [dispatch, requestId, router, fadeAnim])

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
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' }}>
          <TouchableOpacity onPress={() => setPaymentUrl(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={current.text} />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: current.text }}>Cổng thanh toán</Text>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Đang tải thông tin thanh toán...</Text>
      </View>
    )
  }

  const reqData = requestDetail?.data || requestDetail;
  const depositAmount = reqData?.holdingDepositAmount ?? reqData?.property?.holdingDepositAmount ?? reqData?.property?.depositAmount ?? reqData?.proposedRent

  const expiresAtStr = reqData?.holdingDepositExpiresAt
    ? format(new Date(reqData.holdingDepositExpiresAt), 'HH:mm dd/MM/yyyy')
    : 'Hệ thống tự động thiết lập';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      {/* Premium Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' }}>Thanh toán cọc giữ chỗ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

          {/* Invoice Card */}
          <LinearGradient
            colors={['#4F46E5', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 }}>Số tiền thanh toán</Text>
              <Text style={{ fontSize: 40, fontWeight: '800', color: '#FFF', marginVertical: 8 }}>
                {formatMoney(depositAmount)} <Text style={{ fontSize: 20, fontWeight: '600' }}>đ</Text>
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 20 }} />

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Mã yêu cầu:</Text>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{reqData?.requestCode || '—'}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Bất động sản:</Text>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' }} numberOfLines={1}>
                  {reqData?.property?.title || '—'}
                </Text>
              </View>
              {reqData?.property?.address && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Địa chỉ:</Text>
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }} numberOfLines={1}>
                    {reqData.property.address}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Hạn thanh toán:</Text>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>{expiresAtStr}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Payment Methods */}
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Phương thức thanh toán</Text>

          <View style={{ gap: 12 }}>
            {HOLDING_PAYMENT_OPTIONS.map((option) => {
              const isSelected = selectedMethod === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMethod(option.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: isSelected ? '#EEF2FF' : '#FFF',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Image source={option.icon} style={{ width: 44, height: 44, marginRight: 16, borderRadius: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: isSelected ? '#4F46E5' : '#111827' }}>{option.label}</Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{option.description}</Text>
                  </View>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: isSelected ? '#4F46E5' : '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: isSelected ? '#4F46E5' : 'transparent' }}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 30 }}>
        <TouchableOpacity
          onPress={handlePayment}
          disabled={loading}
          style={{
            backgroundColor: '#4F46E5',
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                Xác nhận thanh toán
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

export default PayDepositScreen

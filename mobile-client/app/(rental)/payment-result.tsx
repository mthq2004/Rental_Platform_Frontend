import React, { useEffect, useState, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Dimensions, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useThemeColors } from '@/utils/colors'
import * as Clipboard from 'expo-clipboard'
import dayjs from 'dayjs'

const { width } = Dimensions.get('window')

const PaymentResultScreen = () => {
  const router = useRouter()
  const params = useLocalSearchParams<any>()
  const theme = useThemeColors() as any
  const primary = theme.primary || '#4F46E5'
  
  const [copied, setCopied] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.3)).current

  // Parse gateway parameters
  // MoMo parameters
  const resultCode = params.resultCode
  const amount = params.amount
  const orderId = params.orderId
  const transId = params.transId
  const message = params.message

  // VNPay parameters
  const vnp_ResponseCode = params.vnp_ResponseCode
  const vnp_TransactionStatus = params.vnp_TransactionStatus
  const vnp_Amount = params.vnp_Amount
  const vnp_TxnRef = params.vnp_TxnRef
  const vnp_TransactionNo = params.vnp_TransactionNo
  const vnp_OrderInfo = params.vnp_OrderInfo
  const vnp_PayDate = params.vnp_PayDate

  let isSuccess = false
  let finalAmount = 0
  let finalCode = ''
  let gateway: 'vnpay' | 'momo' | 'unknown' = 'unknown'
  let transactionNo = ''
  let description = ''
  let paymentDate = dayjs().format('DD/MM/YYYY HH:mm:ss')

  if (vnp_ResponseCode !== undefined && vnp_ResponseCode !== null) {
    gateway = 'vnpay'
    isSuccess = vnp_ResponseCode === '00' && (vnp_TransactionStatus === '00' || vnp_TransactionStatus === undefined);
    finalAmount = vnp_Amount ? Number(vnp_Amount) / 100 : 0
    finalCode = vnp_TxnRef || ''
    transactionNo = vnp_TransactionNo || ''
    description = vnp_OrderInfo ? decodeURIComponent(vnp_OrderInfo).replace(/\+/g, ' ') : 'Thanh toán qua cổng VNPAY'
    if (vnp_PayDate) {
      // Format: yyyyMMddHHmmss
      const year = vnp_PayDate.substring(0, 4)
      const month = vnp_PayDate.substring(4, 6)
      const day = vnp_PayDate.substring(6, 8)
      const hour = vnp_PayDate.substring(8, 10)
      const minute = vnp_PayDate.substring(10, 12)
      const second = vnp_PayDate.substring(12, 14)
      if (year && month && day) {
        paymentDate = `${hour || '00'}:${minute || '00'}:${second || '00'} ${day}/${month}/${year}`
      }
    }
  } else if (resultCode !== undefined && resultCode !== null) {
    gateway = 'momo'
    isSuccess = String(resultCode) === '0'
    finalAmount = amount ? Number(amount) : 0
    finalCode = orderId || ''
    transactionNo = transId || ''
    description = message ? decodeURIComponent(message).replace(/\+/g, ' ') : 'Thanh toán qua ví MoMo'
  } else {
    // Check if parameters are passed from app directly
    isSuccess = params.status === 'success' || params.status === 'true'
    finalAmount = params.amount ? Number(params.amount) : 0
    finalCode = params.code || ''
    gateway = params.gateway || 'unknown'
    description = params.description || ''
  }

  useEffect(() => {
    // Beautiful enter animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(finalCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatMoney = (val: number) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ'
  }

  const handleAction = (target: 'wallet' | 'contracts' | 'home') => {
    if (target === 'wallet') {
      router.replace('/(profile)/wallet')
    } else if (target === 'contracts') {
      router.replace('/(rental)/requests')
    } else {
      router.replace('/(tab)')
    }
  }

  const isWalletTx = !finalCode.startsWith('DEP') && !finalCode.startsWith('RENT') && finalCode.length > 10

  if (gateway === 'unknown' && !params.status) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
          <Text style={styles.errorTitle}>Lỗi giao dịch</Text>
          <Text style={styles.errorText}>Không tìm thấy hoặc không nhận diện được thông tin thanh toán.</Text>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: primary }]} onPress={() => handleAction('home')}>
            <Text style={styles.btnPrimaryText}>Quay lại trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.mainCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          
          {/* Status Section */}
          <View style={styles.statusSection}>
            {isSuccess ? (
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.iconCircle}
              >
                <Ionicons name="checkmark" size={40} color="#FFF" />
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.iconCircle}
              >
                <Ionicons name="close" size={40} color="#FFF" />
              </LinearGradient>
            )}
            <Text style={styles.statusTitle}>
              {isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại'}
            </Text>
            <Text style={styles.statusSubtitle}>
              Cảm ơn bạn đã lựa chọn RentalPlatform
            </Text>
          </View>

          {/* Amount Section */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>SỐ TIỀN GIAO DỊCH</Text>
            <Text style={styles.amountValue}>{formatMoney(finalAmount)}</Text>
          </View>

          {/* Detail Fields */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mã giao dịch</Text>
              <TouchableOpacity onPress={copyToClipboard} style={styles.codeContainer}>
                <Text style={styles.detailValue}>{finalCode}</Text>
                <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={16} color={copied ? "#10B981" : "#9CA3AF"} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {transactionNo ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã tham chiếu</Text>
                <Text style={[styles.detailValue, styles.textDark]}>{transactionNo}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cổng thanh toán</Text>
              <View style={[styles.badge, { backgroundColor: gateway === 'vnpay' ? '#EEF2FF' : '#FDF2F8' }]}>
                <Text style={[styles.badgeText, { color: gateway === 'vnpay' ? '#4F46E5' : '#DB2777' }]}>
                  {gateway === 'vnpay' ? 'VNPay' : 'Ví MoMo'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Thời gian</Text>
              <Text style={[styles.detailValue, styles.textDark]}>{paymentDate}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nội dung</Text>
              <Text style={[styles.detailValue, styles.textDark, { maxWidth: '60%', textAlign: 'right' }]} numberOfLines={2}>
                {gateway === 'momo' && !isSuccess ? 'Giao dịch bị hủy hoặc thất bại.' : description || 'Giao dịch ví'}
              </Text>
            </View>
          </View>

          {/* Separation Line */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isWalletTx ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.btnPrimary, { backgroundColor: primary }]}
                onPress={() => handleAction('wallet')}
              >
                <Ionicons name="wallet-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnPrimaryText}>Quay lại Ví cá nhân</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.btnPrimary, { backgroundColor: primary }]}
                onPress={() => handleAction('contracts')}
              >
                <Ionicons name="document-text-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.btnPrimaryText}>Xem yêu cầu thuê & cọc</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.btnSecondary}
              onPress={() => handleAction('home')}
            >
              <Ionicons name="home-outline" size={20} color="#4B5563" style={{ marginRight: 8 }} />
              <Text style={styles.btnSecondaryText}>Trang chủ</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
        
        {/* Safe notice */}
        <Text style={styles.securityText}>🔒 Giao dịch được mã hóa và bảo mật chuẩn PCI-DSS</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F1B4D',
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textDark: {
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 24,
  },
  actionsContainer: {
    gap: 12,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  btnPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  btnSecondaryText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '700',
  },
  securityText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 20,
  },
  errorContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
})

export default PaymentResultScreen

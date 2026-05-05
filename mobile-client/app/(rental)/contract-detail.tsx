import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import {
  View, Text, ActivityIndicator, Alert, ScrollView,
  TouchableOpacity, Linking, Modal, Image, RefreshControl,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import PrimaryButton from '@/components/PrimaryButton'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getContractDetail as getContractDetailThunk } from '@/store/slices/contract.slice'
import {
  signContract, handleSignResult, getContractSignStatus,
  tickSmartCARemaining, resetSmartCAState,
} from '@/store/slices/smartca.slice'
import contractService from '@/services/contract.service'
import smartcaService from '@/services/smartca.service'
import apiClient from '@/utils/api'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Calendar, Wallet, Lock, CheckCircle, AlertCircle, RefreshCw,
  Home, User, Phone, Shield, FileCheck, MapPin, Hash,
  ChevronDown, ChevronUp, Clock, XCircle, AlertTriangle,
} from 'lucide-react-native'
import { useThemeColors } from '@/utils/colors'
import WebView from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'

// ─── Constants ────────────────────────────────────────────────────────────────
const SMARTCA_POLLING_MS = 4000

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; iconName: any }> = {
  draft: { label: 'Nháp', color: '#4338CA', bg: '#EEF2FF', iconName: 'file-tray-full-outline' },
  pending_tenant: { label: 'Chờ người thuê ký', color: '#C2410C', bg: '#FFF7ED', iconName: 'time-outline' },
  tenant_signed: { label: 'Người thuê đã ký', color: '#0E7490', bg: '#ECFEFF', iconName: 'checkmark-done-outline' },
  pending_landlord: { label: 'Chờ chủ nhà ký', color: '#6D28D9', bg: '#F5F3FF', iconName: 'time-outline' },
  owner_signed: { label: 'Chủ nhà đã ký', color: '#15803D', bg: '#F0FDF4', iconName: 'checkmark-done-outline' },
  fully_signed: { label: 'Đã ký hoàn tất', color: '#0369A1', bg: '#E0F2FE', iconName: 'checkmark-circle-outline' },
  active: { label: 'Đang hiệu lực', color: '#166534', bg: '#DCFCE7', iconName: 'play-circle-outline' },
  expired: { label: 'Hết hạn', color: '#374151', bg: '#F3F4F6', iconName: 'alert-circle-outline' },
  terminated: { label: 'Đã chấm dứt', color: '#B91C1C', bg: '#FEE2E2', iconName: 'close-circle-outline' },
  renewed: { label: 'Đã gia hạn', color: '#3730A3', bg: '#E0E7FF', iconName: 'refresh-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#4B5563', bg: '#F3F4F6', iconName: 'ban-outline' },
}

const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ thanh toán', color: '#B45309', bg: '#FFFBEB' },
  paid: { label: 'Đã thanh toán', color: '#166534', bg: '#F0FDF4' },
  overdue: { label: 'Quá hạn', color: '#B91C1C', bg: '#FEF2F2' },
  partial: { label: 'Thanh toán một phần', color: '#0369A1', bg: '#EFF6FF' },
  cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F9FAFB' },
  refunded: { label: 'Đã hoàn tiền', color: '#6D28D9', bg: '#F5F3FF' },
}

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  rent: 'Tiền thuê nhà', deposit: 'Tiền cọc', electricity: 'Tiền điện',
  water: 'Tiền nước', internet: 'Internet', parking: 'Giữ xe',
  management_fee: 'Phí quản lý', service_fee: 'Phí dịch vụ',
  late_fee: 'Phí trễ hạn', other: 'Khác',
}

const PAYMENT_METHODS = [
  { value: 'momo', label: 'MoMo', icon: require('@/assets/images/momo.png') },
  { value: 'vnpay', label: 'VNPay', icon: require('@/assets/images/vnpay.png') },
  { value: 'other', label: 'Ví nội bộ', icon: require('@/assets/images/wallet.png') },
]

const SIGNATURE_ACTIONS: Record<string, string> = {
  CREATED: 'Khởi tạo hợp đồng',
  SENT_TO_TENANT: 'Gửi cho người thuê',
  SIGN_REQUESTED: 'Yêu cầu ký SmartCA',
  SIGNED_REJECTED: 'Từ chối ký',
  TENANT_SIGNED: 'Người thuê đã ký',
  LANDLORD_SIGNED: 'Chủ nhà đã ký',
  SIGNED_SUCCESS: 'Ký thành công',
  ACTIVATED: 'Hợp đồng kích hoạt',
  CANCELLED: 'Đã hủy',
  BLOCKCHAIN_RECORDED: 'Ghi lên Blockchain',
  BLOCKCHAIN_FAILED: 'Lỗi Blockchain',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (v: unknown) => {
  const n = Number(v || 0)
  return Number.isFinite(n)
    ? new Intl.NumberFormat('vi-VN').format(n)
    : '0'
}

const fmtDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('vi-VN')
}

const fmtDateTime = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString('vi-VN')}`
}

const unwrap = (res: any) => res?.data?.data ?? res?.data ?? res

// ─── Component ────────────────────────────────────────────────────────────────
const ContractDetail = () => {
  const { contractId, requestId } = useLocalSearchParams<{ contractId?: string; requestId?: string }>()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const smartca = useAppSelector((s) => s.smartca)
  const { overview: walletOverview, overviewLoading: walletOverviewLoading } = useAppSelector(state => state.wallet);
  const { transactionId, expiredIn, initialExpiredIn, signStatus, loading: smartcaLoading } = smartca

  const theme = useThemeColors() as any
  const current = theme.current
  const colors = theme

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [contract, setContract] = useState<any | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [property, setProperty] = useState<any | null>(null)
  const [ownerInfo, setOwnerInfo] = useState<any | null>(null)
  const [tenantInfo, setTenantInfo] = useState<any | null>(null)
  const [confirmMethod, setConfirmMethod] = useState<string>('')
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [showSmartCAModal, setShowSmartCAModal] = useState(false)
  const [signingRole, setSigningRole] = useState<'OWNER' | 'TENANT' | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showAllPayments, setShowAllPayments] = useState(false)

  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; checkedAt: string } | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const finalizedRef = useRef(false)

  // ── Derived ────────────────────────────────────────────────────────────────
  const resolvedId = useMemo(() => String(contractId || requestId || ''), [contractId, requestId])
  const isOwner = useMemo(() => Boolean(contract?.ownerId && user?.id && contract.ownerId === user.id), [contract?.ownerId, user?.id])
  const isTenant = useMemo(() => Boolean(contract?.tenantId && user?.id && contract.tenantId === user.id), [contract?.tenantId, user?.id])
  const canSign = useMemo(() => (isOwner && contract?.status === 'pending_landlord') || (isTenant && contract?.status === 'pending_tenant'), [isOwner, isTenant, contract?.status])
  const canSend = isOwner && contract?.status === 'draft'
  const hasActiveSession = Boolean(transactionId) && ['WAITING_CONFIRM', 'PENDING', 'PROCESSING'].includes(signStatus)
  const progressPercent = initialExpiredIn > 0 ? Math.max(0, Math.min(100, (expiredIn / initialExpiredIn) * 100)) : 0

  const sortedPayments = useMemo(() => [...payments].sort((a, b) => new Date(a.dueDate || a.createdAt || 0).getTime() - new Date(b.dueDate || b.createdAt || 0).getTime()), [payments])
  const currentPayment = useMemo(() => sortedPayments.find(p => ['pending', 'overdue', 'partial'].includes(p.status)) || null, [sortedPayments])
  const paidCount = payments.filter(p => p.status === 'paid').length
  const paymentProgress = payments.length ? Math.round((paidCount / payments.length) * 100) : 0

  const statusConf = STATUS_CONFIG[contract?.status] || STATUS_CONFIG.draft

  // ── Data Loading ───────────────────────────────────────────────────────────
  const loadDetail = useCallback(async (showLoader = true) => {
    if (!resolvedId) return
    if (showLoader) setLoading(true)
    try {
      const [contractRes, paymentRes] = await Promise.all([
        dispatch(getContractDetailThunk(resolvedId)).unwrap(),
        contractService.getMyPayments({ rentalId: resolvedId }),
      ])
      const c = unwrap(contractRes)
      setContract(c)
      const p = unwrap(paymentRes)
      const items = Array.isArray(p) ? p : p?.items || p?.data || []
      setPayments(Array.isArray(items) ? items : [])

      // 1. If contract already has property object, use it
      if (c?.property) {
        setProperty(c.property)
      } else {
        // 2. Otherwise try to fetch by ID
        const pId = c?.propertyId || c?.property_id || c?.rentalPropertyId
        if (pId) {
          try {
            const propRes = await apiClient.get(`/estate/properties/public/${pId}`)
            setProperty(unwrap(propRes))
          } catch { /* optional */ }
        }
      }

      // Fetch user info in parallel
      const fetchUser = async (uid?: string) => {
        if (!uid) return null
        try {
          const r = await apiClient.get(`/estate/user/${uid}`)
          return unwrap(r)
        } catch { return null }
      }
      const [owner, tenant] = await Promise.all([fetchUser(c?.ownerId), fetchUser(c?.tenantId)])
      setOwnerInfo(owner)
      setTenantInfo(tenant)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải hợp đồng')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dispatch, resolvedId])

  useEffect(() => { loadDetail() }, [loadDetail])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadDetail(false)
  }, [loadDetail])

  // ── SmartCA Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showSmartCAModal || !transactionId || !['WAITING_CONFIRM', 'PENDING'].includes(signStatus)) return
    const t = setInterval(() => dispatch(tickSmartCARemaining()), 1000)
    return () => clearInterval(t)
  }, [dispatch, showSmartCAModal, transactionId, signStatus])

  useEffect(() => {
    if (!showSmartCAModal || !transactionId || !['WAITING_CONFIRM', 'PENDING'].includes(signStatus)) return
    const poll = () => dispatch(handleSignResult(transactionId))
    poll()
    const id = setInterval(poll, SMARTCA_POLLING_MS)
    return () => clearInterval(id)
  }, [dispatch, showSmartCAModal, transactionId, signStatus])

  useEffect(() => {
    if (!showSmartCAModal || !resolvedId || !signingRole || signStatus !== 'PROCESSING') return
    const poll = () => dispatch(getContractSignStatus(resolvedId))
    poll()
    const id = setInterval(poll, SMARTCA_POLLING_MS)
    return () => clearInterval(id)
  }, [dispatch, showSmartCAModal, resolvedId, signingRole, signStatus])

  useEffect(() => {
    if (!showSmartCAModal || !resolvedId) return
    if (finalizedRef.current) return
    if (signStatus === 'SIGNED') {
      finalizedRef.current = true
      Alert.alert('✅ Thành công', signingRole === 'OWNER' ? 'Chủ nhà đã ký hợp đồng thành công!' : 'Bạn đã ký hợp đồng thành công!', [
        { text: 'Tuyệt vời!', onPress: () => { loadDetail(); handleCloseSmartCAModal() } },
      ])
      return
    }
    if (signStatus === 'REJECTED') {
      finalizedRef.current = true
      Alert.alert('❌ Đã từ chối', 'Bạn đã từ chối ký hợp đồng.')
      handleCloseSmartCAModal()
      return
    }
    if (signStatus === 'EXPIRED') {
      finalizedRef.current = true
      Alert.alert('⏰ Hết hạn', 'Phiên ký đã hết hạn, vui lòng thử lại.')
      handleCloseSmartCAModal()
      return
    }
    if (signStatus === 'ERROR') {
      finalizedRef.current = true
      Alert.alert('⚠️ Lỗi', 'Ký SmartCA thất bại, vui lòng thử lại.')
      handleCloseSmartCAModal()
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signStatus, showSmartCAModal, resolvedId, signingRole])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenSmartCA = (role: 'OWNER' | 'TENANT') => {
    if (!resolvedId) return
    if (hasActiveSession) { setShowSmartCAModal(true); return }
    finalizedRef.current = false
    dispatch(resetSmartCAState())
    setSigningRole(role)
    setShowSmartCAModal(true)
  }

  const handleStartSign = async () => {
    if (!resolvedId || !signingRole) return
    setActionLoading(true)
    try {
      const result = await dispatch(signContract(resolvedId)).unwrap()
      if ((result as any)?.resumed) Alert.alert('ℹ️', 'Tiếp tục phiên ký SmartCA đang chờ xác nhận')
      else Alert.alert('📱 Hướng dẫn', 'Vui lòng mở ứng dụng VNPT SmartCA và xác nhận ký hợp đồng')
    } catch (e: any) {
      Alert.alert('❌ Lỗi', e?.message || 'Không thể khởi tạo ký SmartCA')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseSmartCAModal = () => {
    setShowSmartCAModal(false)
    if (['WAITING_CONFIRM', 'PENDING', 'PROCESSING'].includes(signStatus) && transactionId) return
    setSigningRole(null)
    finalizedRef.current = false
    dispatch(resetSmartCAState())
  }

  const handleSendToTenant = async () => {
    if (!contract?.rentalId) return
    setActionLoading(true)
    try {
      await contractService.sendContractToTenant(contract.rentalId)
      Alert.alert('✅ Đã gửi', 'Hợp đồng đã được gửi cho người thuê ký.')
      await loadDetail(false)
    } catch (e: any) {
      Alert.alert('❌ Lỗi', e?.message || 'Gửi hợp đồng thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyBlockchain = async () => {
    if (!resolvedId) return
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      })

      if (result.canceled || !result.assets || result.assets.length === 0) return

      const file = result.assets[0]

      if (file.size && file.size > 15 * 1024 * 1024) {
        Alert.alert('❌ Lỗi', 'Kích thước file tối đa 15MB')
        return
      }

      setVerifyLoading(true)
      setVerifyError(null)

      const payload = await smartcaService.verifyBlockchain(resolvedId, file.uri, file.name)
      const ok = payload === true || (payload && payload.verified === true)

      setVerifyResult({ ok, checkedAt: new Date().toISOString() })
    } catch (e: any) {
      setVerifyError(e?.message || 'Xác thực thất bại')
      setVerifyResult(null)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleConfirmPayment = useCallback(async (method: string) => {
    if (!method || method.trim() === ' ' || method === null) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn phương thức thanh toán')
      return
    }

    if (method === 'other' && Number(currentPayment.amount || 0) > (Number(walletOverview?.availableBalance || 0))) {
      Alert.alert('Không đủ tiền', 'Số dư ví không đủ để thanh toán khoản này.')
      return
    }

    if (!currentPayment?.paymentId) return
    setActionLoading(true)
    try {
      const res = await contractService.confirmPayment(currentPayment.paymentId, {
        paymentMethod: method,
        paymentType: currentPayment.paymentType,
        paidAmount: currentPayment.remainingAmount || currentPayment.amount,
      })
      const payload = unwrap(res)

      console.log("gvuv: ", payload);
      
      const target = payload?.paymentUrl || payload?.redirectUrl || payload?.payUrl
      if (target && /^https?:\/\//i.test(target)) {
        setPaymentUrl(target)
      } else if (target) {
        await Linking.openURL(target)
      } else {
        Alert.alert('Thành công', 'Thanh toán đã được ghi nhận.')
        await loadDetail(false)
      }
    } catch (e: any) {
      Alert.alert('Lỗi 123', e?.message || 'Thanh toán thất bại')
    } finally {
      setActionLoading(false)
    }
  }, [currentPayment, loadDetail])

  const isValidUrl =
    typeof paymentUrl === 'string' &&
    paymentUrl.trim() !== '' &&
    /^https?:\/\//i.test(paymentUrl)

    console.log("kiem tra url payemtn: ", paymentUrl);
    

  // ── Render: Payment WebView ────────────────────────────────────────────────
  if (isValidUrl) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: current.border }}>
          <TouchableOpacity onPress={() => setPaymentUrl(null)} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="close" size={20} color={current.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: current.text, textAlign: 'center' }}>Cổng thanh toán</Text>
        </View>
        <WebView source={{ uri: paymentUrl }} onNavigationStateChange={(nav) => {
          if (nav.url.includes('return') || nav.url.includes('vnpay_return')) {
            setPaymentUrl(null)
            Alert.alert('ℹ️', 'Đang xử lý thanh toán. Vui lòng kiểm tra lại sau.', [
              { text: 'OK', onPress: () => loadDetail(false) },
            ])
          }
        }} />
      </SafeAreaView>
    )
  }

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AuthGuard>
        <SafeAreaView style={{ flex: 1, backgroundColor: current.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: theme.textInactive, marginTop: 12, fontSize: 13 }}>Đang tải hợp đồng...</Text>
        </SafeAreaView>
      </AuthGuard>
    )
  }

  if (!contract) {
    return (
      <AuthGuard>
        <SafeAreaView style={{ flex: 1, backgroundColor: current.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <AlertCircle size={48} color={theme.textInactive} />
          <Text style={{ color: current.text, fontSize: 16, fontWeight: '700', marginTop: 16 }}>Không tìm thấy hợp đồng</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>← Quay lại</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </AuthGuard>
    )
  }

  const tenantSigned = Boolean(contract?.tenantSignedAt) || contract?.signatureLog?.some((l: any) => l.action === 'TENANT_SIGNED')
  const landlordSigned = Boolean(contract?.ownerSignedAt) || contract?.signatureLog?.some((l: any) => l.action === 'LANDLORD_SIGNED')
  const tenantSignedAt = contract?.tenantSignedAt || contract?.signatureLog?.find((l: any) => l.action === 'TENANT_SIGNED')?.createdAt
  const landlordSignedAt = contract?.ownerSignedAt || contract?.signatureLog?.find((l: any) => l.action === 'LANDLORD_SIGNED')?.createdAt

  const propertyImage = property?.images?.[0]?.uri || property?.imageUrl || null
  const propertyTitle = property?.title || property?.name || 'Bất động sản'
  const propertyAddress = [property?.address, property?.ward, property?.district, property?.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ'
  const ownerName = ownerInfo?.fullName || ownerInfo?.name || 'Chủ nhà'
  const tenantName = tenantInfo?.fullName || tenantInfo?.name || 'Người thuê'

  // ── Render: Main ──────────────────────────────────────────────────────────
  return (
    <AuthGuard>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <KeyboardSafeWrapper>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={{ backgroundColor: current.background, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: current.border, flexDirection: 'row', alignItems: 'center' }}>
            <BackButton onPress={() => router.back()} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: current.text }}>Chi tiết hợp đồng</Text>
              {contract?.contractCode && <Text style={{ fontSize: 12, color: theme.textInactive, marginTop: 1 }}>{contract.contractCode}</Text>}
            </View>
            <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={{ padding: 6 }}>
              <RefreshCw size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 48 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {/* ── Hero / Property Card ─────────────────────────────────── */}
            <View style={{ margin: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0F172A', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, elevation: 6 }}>
              {propertyImage ? (
                <Image source={{ uri: propertyImage }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
              ) : (
                <View style={{ height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' }}>
                  <Ionicons name="business-outline" size={52} color="rgba(255,255,255,0.2)" />
                </View>
              )}
              {/* Gradient overlay */}
              <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)' }} />

              {/* Status badge */}
              <View style={{ position: 'absolute', top: 14, right: 14, backgroundColor: statusConf.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={statusConf.iconName} size={14} color={statusConf.color} />
                <Text style={{ color: statusConf.color, fontSize: 12, fontWeight: '800' }}>{statusConf.label}</Text>
              </View>

              {/* Property info */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900', lineHeight: 24 }} numberOfLines={2}>{propertyTitle}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <MapPin size={12} color="#93C5FD" />
                  <Text style={{ color: '#93C5FD', fontSize: 12, flex: 1 }} numberOfLines={1}>{propertyAddress}</Text>
                </View>
              </View>
            </View>

            {/* ── Active session badge ─────────────────────────────────── */}
            {hasActiveSession && (
              <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#EFF6FF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#1D4ED8" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#1D4ED8', fontWeight: '800', fontSize: 13 }}>Phiên ký SmartCA đang chờ</Text>
                  <Text style={{ color: '#3B82F6', fontSize: 12, marginTop: 2 }}>Nhấn "Xem tiến trình ký" để tiếp tục</Text>
                </View>
              </View>
            )}

            {/* ── Parties ─────────────────────────────────────────────── */}
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                <Ionicons name="people-outline" size={18} color={current.text} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Các bên hợp đồng</Text>
              </View>
              <View style={{ backgroundColor: current.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: current.border }}>
                {/* Owner */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' }}>
                    {ownerInfo?.avatarUrl
                      ? <Image source={{ uri: ownerInfo.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                      : <Ionicons name="person-outline" size={20} color="#4338CA" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: theme.textInactive, fontWeight: '600' }}>BÊN CHO THUÊ (CHỦ NHÀ)</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: current.text, marginTop: 2 }}>{ownerName}</Text>
                    {ownerInfo?.phone && <Text style={{ fontSize: 12, color: theme.textInactive, marginTop: 2 }}>📞 {ownerInfo.phone}</Text>}
                  </View>
                  {isOwner && <View style={{ backgroundColor: '#DBEAFE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color: '#1D4ED8', fontSize: 11, fontWeight: '700' }}>Bạn</Text></View>}
                </View>
                <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 16 }} />
                {/* Tenant */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#86EFAC' }}>
                    {tenantInfo?.avatarUrl
                      ? <Image source={{ uri: tenantInfo.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                      : <Ionicons name="person-outline" size={20} color="#15803D" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: theme.textInactive, fontWeight: '600' }}>BÊN THUÊ (NGƯỜI THUÊ)</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: current.text, marginTop: 2 }}>{tenantName}</Text>
                    {tenantInfo?.phone && <Text style={{ fontSize: 12, color: theme.textInactive, marginTop: 2 }}>📞 {tenantInfo.phone}</Text>}
                  </View>
                  {isTenant && <View style={{ backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color: '#166534', fontSize: 11, fontWeight: '700' }}>Bạn</Text></View>}
                </View>
              </View>
            </View>

            {/* ── Contract Info ────────────────────────────────────────── */}
            {/* <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                <Ionicons name="document-text-outline" size={18} color={current.text} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Thông tin hợp đồng</Text>
              </View>
              <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, overflow: 'hidden' }}>
                {[
                  { icon: <Hash size={15} color={colors.primary} />, label: 'Mã hợp đồng', value: contract?.contractCode || '—' },
                  { icon: <Calendar size={15} color={colors.primary} />, label: 'Ngày bắt đầu', value: fmtDate(contract?.startDate) },
                  { icon: <Calendar size={15} color="#EF4444" />, label: 'Ngày kết thúc', value: fmtDate(contract?.endDate) },
                  { icon: <Wallet size={15} color="#16A34A" />, label: 'Tiền thuê/tháng', value: `${money(contract?.monthlyRent)} VND` },
                  { icon: <Shield size={15} color="#6D28D9" />, label: 'Tiền đặt cọc', value: `${money(contract?.depositAmount)} VND` },
                ].map((row, i, arr) => (
                  <View key={row.label}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}>{row.icon}</View>
                      <Text style={{ flex: 1, fontSize: 13, color: '#64748B', fontWeight: '500' }}>{row.label}</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: current.text }}>{row.value}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 16 }} />}
                  </View>
                ))}
              </View>
            </View> */}

            {/* ── Signing Status ───────────────────────────────────────── */}
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                <Ionicons name="brush-outline" size={18} color={current.text} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Trạng thái ký kết</Text>
              </View>
              <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, overflow: 'hidden' }}>
                {/* Tenant signing */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: tenantSigned ? '#DCFCE7' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    {tenantSigned ? <CheckCircle size={20} color="#16A34A" /> : <Clock size={20} color="#9CA3AF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: current.text }}>Người thuê</Text>
                    <Text style={{ fontSize: 12, color: tenantSigned ? '#16A34A' : '#64748B', marginTop: 2, fontWeight: '500' }}>
                      {tenantSigned ? `Đã ký lúc ${fmtDate(tenantSignedAt)}` : 'Đang chờ ký...'}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: tenantSigned ? '#DCFCE7' : '#F3F4F6' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: tenantSigned ? '#166534' : '#6B7280' }}>
                      {tenantSigned ? 'Đã ký' : 'Chưa ký'}
                    </Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 16 }} />
                {/* Owner signing */}
                <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: landlordSigned ? '#DCFCE7' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    {landlordSigned ? <CheckCircle size={20} color="#16A34A" /> : <Clock size={20} color="#9CA3AF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: current.text }}>Chủ nhà</Text>
                    <Text style={{ fontSize: 12, color: landlordSigned ? '#16A34A' : '#64748B', marginTop: 2, fontWeight: '500' }}>
                      {landlordSigned ? `Đã ký lúc ${fmtDate(landlordSignedAt)}` : 'Đang chờ ký...'}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: landlordSigned ? '#DCFCE7' : '#F3F4F6' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: landlordSigned ? '#166534' : '#6B7280' }}>
                      {landlordSigned ? 'Đã ký' : 'Chưa ký'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Blockchain Verification ──────────────────────────────── */}
            {contract?.signHash && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 }}>
                  <Ionicons name="link-outline" size={18} color={current.text} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Xác minh Blockchain</Text>
                </View>
                <View style={{ backgroundColor: '#F0FDF4', borderRadius: 18, borderWidth: 1, borderColor: '#86EFAC', padding: 16 }}>
                  <Text style={{ fontSize: 12, color: '#166534', fontWeight: '500', marginBottom: 12 }}>
                    Tải lên file hợp đồng PDF để hệ thống xác minh tính toàn vẹn với dữ liệu trên Blockchain.
                  </Text>
                  <PrimaryButton
                    title="Chọn file PDF để kiểm tra"
                    loading={verifyLoading}
                    onPress={handleVerifyBlockchain}
                    icon={<Ionicons name="document-attach-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                  />

                  {verifyResult !== null && (
                    <View style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: verifyResult.ok ? '#DCFCE7' : '#FEE2E2', borderWidth: 1, borderColor: verifyResult.ok ? '#4ADE80' : '#F87171', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      {verifyResult.ok ? <CheckCircle size={20} color="#16A34A" /> : <XCircle size={20} color="#DC2626" />}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: verifyResult.ok ? '#166534' : '#991B1B' }}>
                          {verifyResult.ok ? 'Xác minh thành công' : 'Xác minh thất bại'}
                        </Text>
                        <Text style={{ fontSize: 11, color: verifyResult.ok ? '#15803D' : '#7F1D1D', marginTop: 2 }}>
                          {verifyResult.ok ? 'Nội dung khớp với blockchain.' : 'Nội dung đã bị thay đổi.'}
                        </Text>
                      </View>
                    </View>
                  )}
                  {verifyError && (
                    <Text style={{ color: '#DC2626', fontSize: 12, marginTop: 8 }}>⚠️ {verifyError}</Text>
                  )}
                </View>
              </View>
            )}

            {/* ── Payments ─────────────────────────────────────────────── */}
            <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cash-outline" size={18} color={current.text} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Thanh toán</Text>
                </View>
                {payments.length > 0 && (
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>{paidCount}/{payments.length} đã thanh toán</Text>
                )}
              </View>

              {/* Progress bar */}
              {payments.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ height: 6, backgroundColor: current.border, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${paymentProgress}%`, backgroundColor: '#16A34A', borderRadius: 3 }} />
                  </View>
                </View>
              )}

              {/* Current payment info/action */}
              {currentPayment ? (
                <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 16, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                        {isTenant ? 'HÓA ĐƠN CẦN THANH TOÁN' : 'HÓA ĐƠN ĐANG CHỜ'}
                      </Text>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: current.text, marginTop: 4 }}>
                        {money(currentPayment.remainingAmount || currentPayment.amount)} <Text style={{ fontSize: 13, fontWeight: '600' }}>VND</Text>
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        {PAYMENT_TYPE_LABEL[currentPayment.paymentType] || currentPayment.paymentType} · Hạn: {fmtDate(currentPayment.dueDate)}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
                      backgroundColor: PAYMENT_STATUS[currentPayment.status]?.bg || '#F3F4F6',
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: PAYMENT_STATUS[currentPayment.status]?.color || '#374151' }}>
                        {PAYMENT_STATUS[currentPayment.status]?.label || currentPayment.status}
                      </Text>
                    </View>
                  </View>

                  {isTenant ? (
                    <>
                      {/* Method selector - Only for Tenant */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        {PAYMENT_METHODS.map(m => (
                          <TouchableOpacity
                            key={m.value}
                            onPress={() => setConfirmMethod(m.value)}
                            style={{
                              flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                              borderWidth: 1.5,
                              borderColor: confirmMethod === m.value ? colors.primary : current.border,
                              backgroundColor: confirmMethod === m.value ? '#EEF2FF' : current.background,
                            }}
                          >
                            <Image source={m.icon} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: confirmMethod === m.value ? colors.primary : current.text, marginTop: 3 }}>{m.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <PrimaryButton
                        title="Thanh toán ngay"
                        loading={actionLoading}
                        onPress={() => handleConfirmPayment(confirmMethod)}
                        icon={<Ionicons name="card-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                      />
                    </>
                  ) : (
                    <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: current.border, marginTop: 4 }}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                        Đang chờ người thuê thanh toán hóa đơn này.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 20, alignItems: 'center' }}>
                  <CheckCircle size={32} color="#16A34A" />
                  <Text style={{ color: current.text, fontWeight: '700', marginTop: 10 }}>Không có hóa đơn cần thanh toán</Text>
                </View>
              )}

              {/* Payment history */}
              {payments.length > 0 && (
                <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, overflow: 'hidden' }}>
                  <TouchableOpacity
                    onPress={() => setShowAllPayments(!showAllPayments)}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="stats-chart-outline" size={18} color={current.text} />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Lịch sử hóa đơn ({payments.length})</Text>
                    </View>
                    {showAllPayments ? <ChevronUp size={18} color={theme.textInactive} /> : <ChevronDown size={18} color={theme.textInactive} />}
                  </TouchableOpacity>

                  {showAllPayments && (
                    <>
                      <View style={{ height: 1, backgroundColor: current.border }} />
                      {sortedPayments.map((p, i) => {
                        const ps = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending
                        return (
                          <View key={`pay-${i}`}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
                              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ps.bg, alignItems: 'center', justifyContent: 'center' }}>
                                {p.status === 'paid' ? <CheckCircle size={16} color={ps.color} /> : p.status === 'overdue' ? <AlertTriangle size={16} color={ps.color} /> : <Clock size={16} color={ps.color} />}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: current.text }}>{money(p.amount)} VND</Text>
                                <Text style={{ fontSize: 11, color: theme.textInactive, marginTop: 2 }}>
                                  {PAYMENT_TYPE_LABEL[p.paymentType] || p.paymentType} · {fmtDate(p.dueDate)}
                                </Text>
                              </View>
                              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: ps.bg }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: ps.color }}>{ps.label}</Text>
                              </View>
                            </View>
                            {i < sortedPayments.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 16 }} />}
                          </View>
                        )
                      })}
                    </>
                  )}
                </View>
              )}
            </View>

            {/* ── Signature History ────────────────────────────────────── */}
            {contract?.signatureLog?.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setShowHistory(!showHistory)}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="list-outline" size={18} color={current.text} />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Lịch sử hoạt động</Text>
                  </View>
                  {showHistory ? <ChevronUp size={18} color={theme.textInactive} /> : <ChevronDown size={18} color={theme.textInactive} />}
                </TouchableOpacity>

                {showHistory && (
                  <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, marginTop: 2, overflow: 'hidden' }}>
                    {[...contract.signatureLog].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((log: any, i: number, arr: any[]) => (
                      <View key={`log-${i}`}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 }}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: log.action.includes('SIGNED') || log.action === 'ACTIVATED' ? '#DCFCE7' : log.action === 'CANCELLED' ? '#FEE2E2' : '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                            {log.action.includes('SIGNED') || log.action === 'ACTIVATED'
                              ? <CheckCircle size={16} color="#16A34A" />
                              : log.action === 'CANCELLED' ? <XCircle size={16} color="#DC2626" />
                                : <Clock size={16} color="#1D4ED8" />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: current.text }}>{SIGNATURE_ACTIONS[log.action] || log.action}</Text>
                            <Text style={{ fontSize: 11, color: theme.textInactive, marginTop: 3 }}>{fmtDateTime(log.createdAt)}</Text>
                          </View>
                        </View>
                        {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 16 }} />}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Actions ──────────────────────────────────────────────── */}
            <View style={{ marginHorizontal: 16, marginBottom: 8, gap: 10 }}>
              {contract?.signedContractUrl && (
                <PrimaryButton
                  title="Tải bản mềm PDF (Có chữ ký số)"
                  onPress={() => Linking.openURL(contract.signedContractUrl)}
                  style={{ backgroundColor: '#16A34A', borderColor: '#15803D' }}
                  icon={<Ionicons name="document-lock-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                />
              )}
              {contract?.contractPdfUrl && !contract?.signedContractUrl && (
                <PrimaryButton
                  title="Tải bản mềm PDF (Không chữ ký)"
                  onPress={() => Linking.openURL(contract.contractPdfUrl)}
                  style={{ backgroundColor: '#475569', borderColor: '#334155' }}
                  icon={<Ionicons name="document-text-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                />
              )}
              {contract?.contractPdfUrl && contract?.signedContractUrl && (
                <PrimaryButton
                  title="Tải bản mềm PDF (Không chữ ký)"
                  onPress={() => Linking.openURL(contract.contractPdfUrl)}
                  style={{ backgroundColor: '#475569', borderColor: '#334155' }}
                  icon={<Ionicons name="document-text-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                />
              )}

              {canSend && (
                <PrimaryButton
                  title="Gửi hợp đồng cho người thuê ký"
                  loading={actionLoading}
                  onPress={handleSendToTenant}
                  icon={<Ionicons name="mail-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                />
              )}
              {canSign && (
                <PrimaryButton
                  title={hasActiveSession ? 'Xem tiến trình ký SmartCA' : 'Ký bằng VNPT SmartCA'}
                  loading={actionLoading}
                  onPress={() => handleOpenSmartCA(isOwner ? 'OWNER' : 'TENANT')}
                  icon={<Ionicons name={hasActiveSession ? "refresh-outline" : "key-outline"} size={20} color="#FFF" style={{ marginRight: 8 }} />}
                />
              )}
              {!canSend && !canSign && contract?.status !== 'active' && (
                <View style={{ padding: 16, borderRadius: 14, backgroundColor: current.card, alignItems: 'center', borderWidth: 1, borderColor: current.border }}>
                  <Text style={{ color: theme.textInactive, fontSize: 13 }}>Không có thao tác khả dụng lúc này.</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* ══════════════════════════════════════════════════════════════
              SMARTCA MODAL – Step 1: Confirm (IDLE)
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showSmartCAModal && signStatus === 'IDLE'} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Lock size={28} color="#4338CA" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: current.text }}>Ký kỹ thuật số SmartCA</Text>
                  <Text style={{ fontSize: 13, color: theme.textInactive, marginTop: 6, textAlign: 'center' }}>Sử dụng chứng thư số VNPT để ký hợp đồng</Text>
                </View>

                <View style={{ backgroundColor: '#F8FAFF', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#C7D2FE' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ionicons name="information-circle-outline" size={16} color="#4338CA" />
                    <Text style={{ fontSize: 12, color: '#4338CA', fontWeight: '700' }}>Thông tin ký kết</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: current.text, lineHeight: 20 }}>
                    Vai trò: {signingRole === 'OWNER' ? 'Chủ nhà' : 'Người thuê'}{'\n'}
                    Hợp đồng: {contract?.contractCode || resolvedId}
                  </Text>
                </View>

                <View style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: 14, marginBottom: 22, borderWidth: 1, borderColor: '#FCD34D' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ionicons name="list-outline" size={16} color="#92400E" />
                    <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '700' }}>Quy trình ký (4 bước)</Text>
                  </View>
                  {['Nhấn "Xác nhận ký" bên dưới', 'Mở ứng dụng VNPT SmartCA', 'Xác thực bằng PIN hoặc vân tay', 'Quay lại để xem kết quả'].map((s, i) => (
                    <Text key={i} style={{ fontSize: 13, color: '#78350F', marginBottom: 4, lineHeight: 20 }}>{i + 1}. {s}</Text>
                  ))}
                </View>

                <PrimaryButton
                  title="Xác nhận ký SmartCA"
                  loading={actionLoading || smartcaLoading}
                  onPress={handleStartSign}
                  icon={<Ionicons name="checkmark-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                />
                <TouchableOpacity onPress={handleCloseSmartCAModal} disabled={actionLoading || smartcaLoading} style={{ marginTop: 14, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: theme.textInactive, fontWeight: '700' }}>Hủy bỏ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ══════════════════════════════════════════════════════════════
              SMARTCA MODAL – Step 2+3: Processing
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showSmartCAModal && ['WAITING_CONFIRM', 'PENDING', 'PROCESSING', 'SIGNED'].includes(signStatus)} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, alignItems: 'center' }}>
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: signStatus === 'SIGNED' ? '#DCFCE7' : '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {signStatus === 'SIGNED'
                    ? <CheckCircle size={36} color="#16A34A" />
                    : <Lock size={32} color="#4338CA" />}
                </View>

                <Text style={{ fontSize: 18, fontWeight: '900', color: current.text, textAlign: 'center', marginBottom: 8 }}>
                  {signStatus === 'SIGNED' ? 'Đang xác minh...' : signStatus === 'PROCESSING' ? 'Đang xử lý chữ ký' : 'Phiên ký đang diễn ra'}
                </Text>
                <Text style={{ fontSize: 13, color: theme.textInactive, textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 12 }}>
                  {signStatus === 'SIGNED' ? 'SmartCA đã xác nhận. Đang cập nhật hợp đồng...' : signStatus === 'PROCESSING' ? 'Đang ghi nhận chữ ký và cập nhật hợp đồng.' : 'Mở ứng dụng VNPT SmartCA và xác nhận ký.'}
                </Text>

                {['WAITING_CONFIRM', 'PENDING'].includes(signStatus) && (
                  <View style={{ width: '100%', marginBottom: 14 }}>
                    <View style={{ height: 8, backgroundColor: current.border, borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: '#4338CA', borderRadius: 4 }} />
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textInactive, textAlign: 'center', marginTop: 8 }}>
                      Hết hạn trong: {Math.floor(expiredIn / 60)}:{String(expiredIn % 60).padStart(2, '0')}
                    </Text>
                  </View>
                )}

                <View style={{ width: '100%', backgroundColor: '#F8FAFF', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#C7D2FE' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Ionicons name="phone-portrait-outline" size={16} color="#4338CA" />
                    <Text style={{ fontSize: 11, color: '#4338CA', fontWeight: '700' }}>Trạng thái hiện tại</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: signStatus === 'SIGNED' ? '#16A34A' : '#4338CA' }}>
                    {signStatus === 'WAITING_CONFIRM' && '⏳ Chờ xác nhận trên SmartCA...'}
                    {signStatus === 'PENDING' && '🔄 Đang xử lý yêu cầu...'}
                    {signStatus === 'PROCESSING' && '⚙️ Đang ký và ghi nhận hợp đồng...'}
                    {signStatus === 'SIGNED' && '✅ VNPT đã xác nhận, đang cập nhật...'}
                  </Text>
                </View>

                <TouchableOpacity onPress={handleCloseSmartCAModal} style={{ paddingVertical: 12 }}>
                  <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600' }}>← Đóng (không hủy phiên ký)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </KeyboardSafeWrapper>
      </SafeAreaView>
    </AuthGuard>
  )
}

export default ContractDetail

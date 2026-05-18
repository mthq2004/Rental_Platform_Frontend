import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import {
  View, Text, ActivityIndicator, Alert, ScrollView,
  TouchableOpacity, Linking, Modal, Image, RefreshControl,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import SyncTextInput from '@/components/common/SyncTextInput'
import CustomDatePicker from '@/components/CustomDatePicker'
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
import { uploadToCloudinary } from '@/utils/uploadToCloudinary'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import {
  Calendar, Wallet, Lock, CheckCircle, AlertCircle, RefreshCw,
  Home, User, Phone, Shield, FileCheck, MapPin, Hash,
  ChevronDown, ChevronUp, Clock, XCircle, AlertTriangle,
} from 'lucide-react-native'
import { useThemeColors } from '@/utils/colors'
import WebView from 'react-native-webview'
import { Ionicons } from '@expo/vector-icons'
import ScreenHeader from '@/components/common/ScreenHeader'
import { useEnableFloatingKeyboard } from '@/contexts/FloatingKeyboardContext'
import FloatingKeyboardBar from '@/components/common/FloatingKeyboardBar'

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
  useEnableFloatingKeyboard()
  const { contractId, requestId } = useLocalSearchParams<{ contractId?: string; requestId?: string }>()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const smartca = useAppSelector((s) => s.smartca)
  const { overview: walletOverview, overviewLoading: walletOverviewLoading } = useAppSelector(state => state.wallet);
  const { transactionId, expiredIn, initialExpiredIn, signStatus, loading: smartcaLoading } = smartca

  const theme = useThemeColors() as any
  const current = theme.current
  const isDark = theme.isDark
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

  // Termination, Report & Renewal state
  const [terminationRequests, setTerminationRequests] = useState<any[]>([])
  const [reportItems, setReportItems] = useState<any[]>([])
  const [renewalRequests, setRenewalRequests] = useState<any[]>([])
  const [contractAppendices, setContractAppendices] = useState<any[]>([])
  const [showAppendices, setShowAppendices] = useState(false)
  const [showRenewal, setShowRenewal] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [renewalDuration, setRenewalDuration] = useState('6')
  const [renewalNote, setRenewalNote] = useState('')
  const [renewalLoading, setRenewalLoading] = useState(false)
  const [showTermination, setShowTermination] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [terminationLoading, setTerminationLoading] = useState(false)

  // Modals for Termination & Report
  const [showTermModal, setShowTermModal] = useState(false)
  const [termReason, setTermReason] = useState('unilateral_termination')
  const [termNote, setTermNote] = useState('')
  const [termDate, setTermDate] = useState<Date | null>(null)
  const [termFee, setTermFee] = useState('')

  // Review Termination Modal
  const [showReviewTermModal, setShowReviewTermModal] = useState(false)
  const [reviewTermAction, setReviewTermAction] = useState<'approved' | 'rejected'>('approved')
  const [reviewTermNote, setReviewTermNote] = useState('')
  const [reviewTermEvidence, setReviewTermEvidence] = useState<any[]>([])

  // Update Termination Modal
  const [showUpdateTermModal, setShowUpdateTermModal] = useState(false)
  const [updateTermStatus, setUpdateTermStatus] = useState<string>('resolved')
  const [updateTermNote, setUpdateTermNote] = useState('')
  const [updateTermResolution, setUpdateTermResolution] = useState<'continue_contract' | 'terminate_contract'>('continue_contract')


  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTitle, setReportTitle] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportType, setReportType] = useState('other')
  const [reportPriority, setReportPriority] = useState('medium')
  const [reportAttachments, setReportAttachments] = useState<any[]>([])

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

      // Load termination, reports, renewals (non-blocking)
      contractService.getTerminationRequests(resolvedId).then(r => {
        const d = unwrap(r); setTerminationRequests(Array.isArray(d) ? d : d?.data || d?.items || [])
      }).catch(() => { })
      contractService.getReportsByContract(resolvedId).then(r => {
        const d = unwrap(r); setReportItems(Array.isArray(d) ? d : d?.data || d?.items || [])
      }).catch(() => { })
      contractService.getRenewalsByContract(resolvedId).then(r => {
        const d = unwrap(r); setRenewalRequests(Array.isArray(d) ? d : d?.data || d?.items || [])
      }).catch(() => { })
      contractService.getContractAppendices(resolvedId).then(r => {
        const d = unwrap(r); setContractAppendices(Array.isArray(d) ? d : d?.data || d?.items || [])
      }).catch(() => { })

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

  useFocusEffect(
    useCallback(() => {
      loadDetail()
    }, [loadDetail])
  )

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
    if (!method || method.trim() === '') {
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
        platform: 'mobile',
      })
      const payload = unwrap(res)
      console.log("kiem tra url payemtn payload:", JSON.stringify(payload, null, 2));

      // Extract payment URL from multiple possible response shapes
      const target = payload?.paymentUrl || payload?.redirectUrl || payload?.payUrl
        || payload?.data?.paymentUrl || payload?.data?.redirectUrl || payload?.data?.payUrl
        || payload?.data?.data?.paymentUrl || payload?.data?.data?.payUrl;

      console.log("kiem tra url payemtn extracted:", target);

      if (target && /^https?:\/\//i.test(target)) {
        setPaymentUrl(target)
      } else if (target) {
        await Linking.openURL(target)
      } else {
        Alert.alert('Thành công', 'Thanh toán đã được ghi nhận.')
        await loadDetail(false)
      }
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Thanh toán thất bại')
    } finally {
      setActionLoading(false)
    }
  }, [currentPayment, loadDetail, walletOverview])

  const isValidUrl =
    typeof paymentUrl === 'string' &&
    paymentUrl.trim() !== '' &&
    /^https?:\/\//i.test(paymentUrl)

  // ── Termination & Dispute Handlers ──────────────────────────────────────────
  const RENEWAL_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Chờ duyệt', color: '#B45309', bg: '#FFFBEB' },
    approved: { label: 'Đã duyệt', color: '#166534', bg: '#F0FDF4' },
    rejected: { label: 'Đã từ chối', color: '#B91C1C', bg: '#FEF2F2' },
    cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F9FAFB' },
  }

  const handleCreateRenewal = useCallback(() => {
    setShowRenewalModal(true)
  }, [])

  const submitRenewal = async () => {
    if (!resolvedId) return
    setRenewalLoading(true)
    try {
      await contractService.createRenewalRequest({
        contractId: resolvedId,
        durationMonths: Number(renewalDuration) || 6,
        note: renewalNote
      })
      Alert.alert('Thành công', 'Đã gửi yêu cầu gia hạn')
      setShowRenewalModal(false)
      loadDetail(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Gửi yêu cầu thất bại')
    } finally {
      setRenewalLoading(false)
    }
  }

  const handleApproveRenewal = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn duyệt yêu cầu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt', onPress: async () => {
          try {
            await contractService.approveRenewal(id, {})
            Alert.alert('Thành công', 'Đã duyệt yêu cầu')
            loadDetail(false)
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Thất bại')
          }
        }
      }
    ])
  }

  const handleRejectRenewal = (id: string) => {
    Alert.alert('Từ chối', 'Xác nhận từ chối yêu cầu gia hạn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối', style: 'destructive', onPress: async () => {
          try {
            await contractService.rejectRenewal(id, { reviewNote: 'Từ chối qua ứng dụng di động' })
            Alert.alert('Thành công', 'Đã từ chối yêu cầu')
            loadDetail(false)
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Thất bại')
          }
        }
      }
    ])
  }

  const TERMINATION_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Đang chờ', color: '#B45309', bg: '#FFFBEB' },
    approved: { label: 'Đã chấp thuận', color: '#166534', bg: '#F0FDF4' },
    rejected: { label: 'Bị từ chối', color: '#B91C1C', bg: '#FEF2F2' },
    negotiating: { label: 'Đang thương lượng', color: '#0369A1', bg: '#EFF6FF' },
    admin_review: { label: 'Chờ admin', color: '#6D28D9', bg: '#F5F3FF' },
    admin_processing: { label: 'Admin xử lý', color: '#1E40AF', bg: '#EFF6FF' },
    resolved: { label: 'Đã giải quyết', color: '#166534', bg: '#F0FDF4' },
    cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F9FAFB' },
  }

  const REPORT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'Mới tạo', color: '#0369A1', bg: '#EFF6FF' },
    admin: { label: 'Chờ admin', color: '#6D28D9', bg: '#F5F3FF' },
    resolved: { label: 'Đã giải quyết', color: '#166534', bg: '#F0FDF4' },
    cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F9FAFB' },
    negotiating: { label: 'Đang thương lượng', color: '#B45309', bg: '#FFFBEB' },
  }

  const latestTermination = terminationRequests[0] || null
  const hasActiveTermination = latestTermination && ['pending', 'negotiating', 'admin_review', 'admin_processing'].includes(latestTermination.status)
  const canRequestTermination = contract?.status === 'active' && !hasActiveTermination
  const canReviewTermination = latestTermination?.status === 'pending' && latestTermination?.requestedBy !== user?.id

  const handleCreateTermination = useCallback(() => {
    setShowTermModal(true)
  }, [])

  const submitTermination = async () => {
    if (!resolvedId) return
    if (!termDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày mong muốn chấm dứt')
      return
    }
    setTerminationLoading(true)
    try {
      await contractService.createTerminationRequest({
        rentalId: resolvedId,
        reason: termReason,
        note: termNote,
        requestedTerminationDate: termDate.toISOString().split('T')[0],
        earlyTerminationFee: termFee ? Number(termFee) : Number(contract?.earlyTerminationFee || 0),
      })
      Alert.alert('Thành công', 'Đã gửi yêu cầu chấm dứt hợp đồng.')
      setShowTermModal(false)
      setTermNote('')
      setTermDate(null)
      setTermFee('')
      loadDetail(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Gửi yêu cầu thất bại')
    } finally {
      setTerminationLoading(false)
    }
  }

  const handleReviewTermination = useCallback((action: 'approved' | 'rejected') => {
    if (!latestTermination?.terminationRequestId) return
    setReviewTermAction(action)
    setReviewTermNote('')
    setReviewTermEvidence([])
    setShowReviewTermModal(true)
  }, [latestTermination])

  const submitReviewTermination = async () => {
    if (!latestTermination?.terminationRequestId) return
    if (reviewTermAction === 'rejected' && !reviewTermNote.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối')
      return
    }
    if (reviewTermAction === 'rejected' && reviewTermEvidence.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng đính kèm ít nhất 1 minh chứng khi từ chối')
      return
    }
    setTerminationLoading(true)
    try {
      let finalNote = reviewTermNote
      if (reviewTermEvidence.length > 0) {
        const names = reviewTermEvidence.map((f: any, i: number) => `[Minh chứng ${i+1}: ${f.name}]`).join(', ')
        finalNote += `\n--- MINH CHỨNG ---\n${names}`
      }
      await contractService.reviewTerminationRequest(latestTermination.terminationRequestId, { 
        status: reviewTermAction,
        reviewNote: finalNote 
      })
      Alert.alert('Thành công', `Đã ${reviewTermAction === 'approved' ? 'chấp thuận' : 'từ chối'} yêu cầu.`)
      setShowReviewTermModal(false)
      setReviewTermEvidence([])
      loadDetail(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Thao tác thất bại')
    } finally {
      setTerminationLoading(false)
    }
  }

  const handleOpenUpdateTermination = (request: any, status: string) => {
    setUpdateTermStatus(status)
    setUpdateTermNote('')
    setShowUpdateTermModal(true)
  }

  const submitUpdateTermination = async () => {
    if (!latestTermination?.terminationRequestId) return
    if (updateTermStatus === 'admin_review' && !updateTermNote.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do gửi quản trị viên')
      return
    }
    setTerminationLoading(true)
    try {
      await contractService.updateTerminationStatus(latestTermination.terminationRequestId, {
        status: updateTermStatus,
        note: updateTermNote,
        resolution: updateTermResolution
      })
      Alert.alert('Thành công', 'Đã cập nhật trạng thái yêu cầu.')
      setShowUpdateTermModal(false)
      loadDetail(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Thao tác thất bại')
    } finally {
      setTerminationLoading(false)
    }
  }

  const handleCreateReport = useCallback(() => {
    setReportTitle('')
    setReportDesc('')
    setReportType('other')
    setReportPriority('medium')
    setReportAttachments([])
    setShowReportModal(true)
  }, [])

  const handleOpenReportForTermination = useCallback(() => {
    setReportTitle('Tranh chấp chấm dứt hợp đồng')
    setReportDesc('Yêu cầu xem xét chấm dứt hợp đồng đang bị tranh chấp.')
    setReportType('contract')
    setReportPriority('high')
    setShowReportModal(true)
  }, [])

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
      })
      if (!res.canceled) {
        setReportAttachments([...reportAttachments, ...res.assets])
      }
    } catch (e) {
      console.log(e)
    }
  }

  const submitReport = async () => {
    if (!resolvedId) return
    if (!reportTitle.trim() || !reportDesc.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ tiêu đề và nội dung khiếu nại')
      return
    }
    setTerminationLoading(true)
    const againstId = isOwner ? contract.tenantId : contract.ownerId
    try {
      const attachments = []
      if (reportAttachments.length > 0) {
        for (const file of reportAttachments) {
          const res = await uploadToCloudinary({
            uri: file.uri,
            fileName: file.name || 'evidence.jpg',
            mimeType: file.mimeType || 'image/jpeg',
            resourceType: 'auto'
          })
          const isImage = file.mimeType?.startsWith('image/')
          attachments.push({
            url: res.fileUrl,
            type: isImage ? 'image' : 'document',
            fileName: res.fileName,
            fileSize: res.fileSize
          })
        }
      }

      await contractService.createReport({
        rentalId: resolvedId,
        againstId: againstId,
        type: reportType,
        priority: reportPriority,
        title: reportTitle,
        description: reportDesc,
        terminationRequestId: latestTermination?.terminationRequestId,
        attachments
      })
      Alert.alert('Thành công', 'Đã gửi khiếu nại.')
      setShowReportModal(false)
      setReportTitle('')
      setReportDesc('')
      setReportType('other')
      setReportPriority('medium')
      setReportAttachments([])
      loadDetail(false)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Gửi khiếu nại thất bại')
    } finally {
      setTerminationLoading(false)
    }
  }

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
      <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
        <KeyboardSafeWrapper scrollable={false} style={{ flex: 1, backgroundColor: current.background }}>

          <ScreenHeader
            title="Chi tiết hợp đồng"
            subtitle={contract?.contractCode ? contract.contractCode : undefined}
            rightComponent={
              <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={{ padding: 6 }}>
                <RefreshCw size={18} color={colors.primary} />
              </TouchableOpacity>
            }
          />

          <ScrollView
            style={{ backgroundColor: isDark ? 'transparent' : '#F8FAFC' }}
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
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? '#1F2937' : '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#374151' : '#C7D2FE' }}>
                    {ownerInfo?.avatarUrl && ownerInfo?.avatarUrl !== "https://i.pravatar.cc/300"
                      ? <Image source={{ uri: ownerInfo.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                      : <User size={20} color={isDark ? '#9CA3AF' : '#4338CA'} />}
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
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? '#1F2937' : '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#374151' : '#86EFAC' }}>
                    {tenantInfo?.avatarUrl && tenantInfo?.avatarUrl !== "https://i.pravatar.cc/300"
                      ? <Image source={{ uri: tenantInfo.avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                      : <User size={20} color={isDark ? '#9CA3AF' : '#15803D'} />}
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

            {/* ── Renewal Requests ─────────────────────────────────── */}
            {contract?.status === 'active' && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setShowRenewal(!showRenewal)}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="refresh-circle-outline" size={18} color="#3730A3" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Gia hạn hợp đồng ({renewalRequests.length})</Text>
                  </View>
                  {showRenewal ? <ChevronUp size={18} color={theme.textInactive} /> : <ChevronDown size={18} color={theme.textInactive} />}
                </TouchableOpacity>

                {showRenewal && (
                  <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, marginTop: 2, overflow: 'hidden' }}>
                    {renewalRequests.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: theme.textInactive }}>Chưa có yêu cầu gia hạn nào.</Text>
                      </View>
                    ) : (
                      renewalRequests.map((r: any, i: number) => {
                        const rs = RENEWAL_STATUS[r.status] || RENEWAL_STATUS.pending
                        return (
                          <View key={`ren-${i}`}>
                            <View style={{ padding: 14, gap: 6 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: rs.bg }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: rs.color }}>{rs.label}</Text>
                                </View>
                                <Text style={{ fontSize: 11, color: theme.textInactive }}>{fmtDate(r.createdAt)}</Text>
                              </View>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: current.text, marginTop: 4 }}>
                                Gia hạn {r.durationMonths} tháng
                              </Text>
                              {r.note && (
                                <Text style={{ fontSize: 13, color: current.text, marginTop: 4 }}>Ghi chú: {r.note}</Text>
                              )}

                              {r.status === 'pending' && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                  {isOwner ? (
                                    <>
                                      <PrimaryButton
                                        title="Duyệt"
                                        onPress={() => handleApproveRenewal(r.id)}
                                        style={{ flex: 1, paddingVertical: 8, backgroundColor: '#16A34A', borderColor: '#15803D' }}
                                        textStyle={{ fontSize: 12 }}
                                      />
                                      <PrimaryButton
                                        title="Từ chối"
                                        onPress={() => handleRejectRenewal(r.id)}
                                        style={{ flex: 1, paddingVertical: 8, backgroundColor: '#DC2626', borderColor: '#B91C1C' }}
                                        textStyle={{ fontSize: 12 }}
                                      />
                                    </>
                                  ) : null}
                                </View>
                              )}
                            </View>
                            {i < renewalRequests.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 14 }} />}
                          </View>
                        )
                      })
                    )}

                    {isTenant && contract?.status === 'near_expiration' && (
                      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: current.border }}>
                        <PrimaryButton
                          title="Tạo yêu cầu gia hạn"
                          loading={renewalLoading}
                          onPress={handleCreateRenewal}
                          style={{ backgroundColor: '#3730A3', borderColor: '#312E81' }}
                          icon={<Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── Appendices ─────────────────────────────────── */}
            {contractAppendices.length > 0 && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setShowAppendices(!showAppendices)}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="document-attach-outline" size={18} color="#0EA5E9" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Phụ lục hợp đồng ({contractAppendices.length})</Text>
                  </View>
                  {showAppendices ? <ChevronUp size={18} color={theme.textInactive} /> : <ChevronDown size={18} color={theme.textInactive} />}
                </TouchableOpacity>

                {showAppendices && (
                  <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, marginTop: 2, overflow: 'hidden' }}>
                    {contractAppendices.map((a: any, i: number) => (
                      <View key={`app-${i}`}>
                        <View style={{ padding: 14, gap: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: a.signedAt ? '#DCFCE7' : '#E0F2FE' }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: a.signedAt ? '#16A34A' : '#0284C7' }}>
                                Phụ lục #{a.appendixNumber} {a.signedAt ? '(Đã ký)' : ''}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 11, color: theme.textInactive }}>{fmtDate(a.createdAt)}</Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: current.text, marginTop: 4 }}>
                            {a.type === 'renewal' ? 'Gia hạn' : a.type === 'adjustment' ? 'Điều chỉnh' : 'Mở rộng'} hợp đồng
                          </Text>
                          <Text style={{ fontSize: 13, color: current.text }}>
                            Hiệu lực: {fmtDate(a.startDate)} {a.endDate ? `→ ${fmtDate(a.endDate)}` : ''}
                          </Text>
                          {a.content && (
                            <Text style={{ fontSize: 12, color: theme.textInactive, fontStyle: 'italic', marginTop: 4 }}>"{a.content}"</Text>
                          )}
                          {a.blockchainTxHash && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                              <Ionicons name="link-outline" size={14} color="#10B981" />
                              <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>TxHash: {a.blockchainTxHash.substring(0, 15)}...</Text>
                            </View>
                          )}
                        </View>
                        {i < contractAppendices.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 14 }} />}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Termination Requests ─────────────────────────────────── */}
            {contract?.status === 'active' && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setShowTermination(!showTermination)}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="exit-outline" size={18} color="#B91C1C" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Chấm dứt hợp đồng ({terminationRequests.length})</Text>
                  </View>
                  {showTermination ? <ChevronUp size={18} color={theme.textInactive} /> : <ChevronDown size={18} color={theme.textInactive} />}
                </TouchableOpacity>

                {showTermination && (
                  <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, marginTop: 2, overflow: 'hidden' }}>
                    {terminationRequests.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: theme.textInactive }}>Chưa có yêu cầu chấm dứt nào.</Text>
                      </View>
                    ) : (
                      terminationRequests.map((t: any, i: number) => {
                        const ts = TERMINATION_STATUS[t.status] || TERMINATION_STATUS.pending
                        return (
                          <View key={`term-${i}`}>
                            <View style={{ padding: 14, gap: 6 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: current.text }}>
                                  {t.reason === 'unilateral_termination' ? 'Đơn phương chấm dứt' :
                                    t.reason === 'mutual_agreement' ? 'Hai bên thỏa thuận' :
                                      t.reason === 'breach_of_contract' ? 'Vi phạm hợp đồng' :
                                        t.reason === 'force_majeure' ? 'Bất khả kháng' : t.reason}
                                </Text>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: ts.bg }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: ts.color }}>{ts.label}</Text>
                                </View>
                              </View>
                              {t.note && <Text style={{ fontSize: 12, color: theme.textInactive }}>{t.note}</Text>}
                              <Text style={{ fontSize: 11, color: theme.textInactive }}>Ngày yêu cầu: {fmtDate(t.requestedTerminationDate || t.createdAt)}</Text>

                              {/* Review actions */}
                              {canReviewTermination && t === latestTermination && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                                  <TouchableOpacity
                                    onPress={() => handleReviewTermination('approved')}
                                    style={{ flex: 1, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                  >
                                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Chấp thuận</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => handleReviewTermination('rejected')}
                                    style={{ flex: 1, backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                  >
                                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Từ chối</Text>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {/* Update Actions */}
                              {t === latestTermination && ['rejected', 'negotiating'].includes(t.status) && (
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                                  {t.status === 'rejected' ? (
                                    t.requestedBy === user?.id ? (
                                      <>
                                        <TouchableOpacity
                                          onPress={() => handleOpenUpdateTermination(t, 'negotiating')}
                                          style={{ flex: 1, backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                        >
                                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Thương lượng</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                          onPress={handleOpenReportForTermination}
                                          style={{ flex: 1, backgroundColor: '#6D28D9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                        >
                                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Gửi Admin</Text>
                                        </TouchableOpacity>
                                      </>
                                    ) : (
                                      <View style={{ flex: 1, backgroundColor: isDark ? '#374151' : '#F3F4F6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                                        <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '700', fontSize: 13 }}>Đã từ chối</Text>
                                      </View>
                                    )
                                  ) : t.status === 'negotiating' ? (
                                    <>
                                      <TouchableOpacity
                                        onPress={() => handleOpenUpdateTermination(t, 'resolved')}
                                        style={{ flex: 1, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                      >
                                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Đã giải quyết</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={handleOpenReportForTermination}
                                        style={{ flex: 1, backgroundColor: '#6D28D9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                                      >
                                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Gửi Admin</Text>
                                      </TouchableOpacity>
                                    </>
                                  ) : null}
                                </View>
                              )}
                            </View>
                            {i < terminationRequests.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 14 }} />}
                          </View>
                        )
                      })
                    )}

                    {canRequestTermination && (
                      <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: current.border }}>
                        <PrimaryButton
                          title="Yêu cầu chấm dứt hợp đồng"
                          loading={terminationLoading}
                          onPress={handleCreateTermination}
                          style={{ backgroundColor: '#B91C1C', borderColor: '#991B1B' }}
                          icon={<Ionicons name="exit-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── Disputes / Reports ──────────────────────────────────── */}
            {contract?.status === 'active' && (
              <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => setShowReports(!showReports)}
                  style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="warning-outline" size={18} color="#D97706" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Tranh chấp & khiếu nại ({reportItems.length})</Text>
                  </View>
                  {showReports ? <ChevronUp size={18} color={theme.textInactive} /> : <ChevronDown size={18} color={theme.textInactive} />}
                </TouchableOpacity>

                {showReports && (
                  <View style={{ backgroundColor: current.card, borderRadius: 18, borderWidth: 1, borderColor: current.border, marginTop: 2, overflow: 'hidden' }}>
                    {reportItems.length === 0 ? (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, color: theme.textInactive }}>Chưa có khiếu nại nào.</Text>
                      </View>
                    ) : (
                      reportItems.map((r: any, i: number) => {
                        const rs = REPORT_STATUS[r.status] || REPORT_STATUS.open
                        return (
                          <View key={`report-${i}`}>
                            <View style={{ padding: 14, gap: 4 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: current.text, flex: 1 }} numberOfLines={1}>{r.title || 'Khiếu nại'}</Text>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: rs.bg, marginLeft: 8 }}>
                                  <Text style={{ fontSize: 11, fontWeight: '700', color: rs.color }}>{rs.label}</Text>
                                </View>
                              </View>
                              {r.description && <Text style={{ fontSize: 12, color: theme.textInactive }} numberOfLines={2}>{r.description}</Text>}
                              <Text style={{ fontSize: 11, color: theme.textInactive }}>{fmtDate(r.createdAt)}</Text>
                            </View>
                            {i < reportItems.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 14 }} />}
                          </View>
                        )
                      })
                    )}

                    <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: current.border }}>
                      <PrimaryButton
                        title="Gửi khiếu nại mới"
                        loading={terminationLoading}
                        onPress={handleCreateReport}
                        style={{ backgroundColor: '#D97706', borderColor: '#B45309' }}
                        icon={<Ionicons name="warning-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />}
                      />
                    </View>
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
              MODAL: RENEWAL REQUEST
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showRenewalModal} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

                <Text style={{ fontSize: 18, fontWeight: '900', color: current.text, marginBottom: 8 }}>Gia hạn hợp đồng</Text>
                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 20 }}>
                  Đề xuất gia hạn thêm thời gian thuê. Chủ nhà sẽ nhận được thông báo để xem xét.
                </Text>

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Số tháng gia hạn (tháng):</Text>
                <SyncTextInput
                  placeholder="Ví dụ: 6"
                  keyboardType="number-pad"
                  value={renewalDuration}
                  onChangeText={setRenewalDuration}
                  placeholderTextColor={theme.textInactive}
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 16
                  }}
                />

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600', marginTop: 12 }}>Ghi chú (Tùy chọn):</Text>
                <SyncTextInput
                  placeholder="Lý do hoặc mong muốn của bạn..."
                  placeholderTextColor={theme.textInactive}
                  multiline
                  numberOfLines={3}
                  value={renewalNote}
                  onChangeText={setRenewalNote}
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 24, textAlignVertical: 'top', minHeight: 80
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                  <TouchableOpacity
                    onPress={() => setShowRenewalModal(false)}
                    disabled={renewalLoading}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: current.border, alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 14, color: current.text, fontWeight: '700' }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={submitRenewal}
                    disabled={renewalLoading}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#3730A3', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                  >
                    {renewalLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={16} color="#FFF" />}
                    <Text style={{ fontSize: 14, color: '#FFF', fontWeight: '700' }}>Gửi yêu cầu</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <FloatingKeyboardBar />
            </View>
          </Modal>

          {/* ══════════════════════════════════════════════════════════════
              MODAL: TERMINATION REQUEST
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showTermModal} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

                <Text style={{ fontSize: 18, fontWeight: '900', color: current.text, marginBottom: 16 }}>Yêu cầu chấm dứt hợp đồng</Text>

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Lý do chấm dứt:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {[
                    { id: 'mutual_agreement', label: 'Hai bên thỏa thuận' },
                    { id: 'unilateral_termination', label: 'Đơn phương' },
                    { id: 'breach_of_contract', label: 'Vi phạm HĐ' },
                    { id: 'non_payment', label: 'Không thanh toán' },
                    { id: 'force_majeure', label: 'Bất khả kháng' },
                    { id: 'lease_end', label: 'Hết hạn hợp đồng' },
                    { id: 'other', label: 'Lý do khác' }
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setTermReason(item.id)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                        backgroundColor: termReason === item.id ? '#FEE2E2' : current.card,
                        borderWidth: 1, borderColor: termReason === item.id ? '#DC2626' : current.border
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: termReason === item.id ? '#DC2626' : current.text }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <CustomDatePicker
                  label="Ngày mong muốn chấm dứt"
                  placeholder="Chọn ngày"
                  value={termDate}
                  onChange={setTermDate}
                  icon="calendar-outline"
                  minimumDate={new Date()}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600' }}>Phí chấm dứt sớm (Đề xuất, VNĐ):</Text>
                  <TouchableOpacity onPress={() => Keyboard.dismiss()} style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: current.card, borderRadius: 8, borderWidth: 1, borderColor: current.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Xong ✓</Text>
                  </TouchableOpacity>
                </View>
                <SyncTextInput
                  value={termFee}
                  onChangeText={(val) => setTermFee(val.replace(/[^0-9]/g, ''))}
                  placeholder="Để trống nếu không đề xuất (Mặc định theo hợp đồng)"
                  placeholderTextColor={theme.textInactive}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 16
                  }}
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600' }}>Ghi chú thêm:</Text>
                  <TouchableOpacity onPress={() => Keyboard.dismiss()} style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: current.card, borderRadius: 8, borderWidth: 1, borderColor: current.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Xong ✓</Text>
                  </TouchableOpacity>
                </View>
                <SyncTextInput
                  value={termNote}
                  onChangeText={setTermNote}
                  placeholder="Nhập ghi chú chi tiết..."
                  placeholderTextColor={theme.textInactive}
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 24, textAlignVertical: 'top', minHeight: 80
                  }}
                />

                <PrimaryButton
                  title="Gửi yêu cầu"
                  loading={terminationLoading}
                  onPress={submitTermination}
                  style={{ backgroundColor: '#DC2626', borderColor: '#B91C1C' }}
                />
                <TouchableOpacity onPress={() => setShowTermModal(false)} disabled={terminationLoading} style={{ marginTop: 14, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: theme.textInactive, fontWeight: '700' }}>Hủy bỏ</Text>
                </TouchableOpacity>
              </View>
              <FloatingKeyboardBar />
            </View>
          </Modal>

          {/* ══════════════════════════════════════════════════════════════
              MODAL: CREATE REPORT
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showReportModal} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Loại khiếu nại:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {[
                    { id: 'payment', label: 'Thanh toán' },
                    { id: 'deposit', label: 'Tiền cọc' },
                    { id: 'property', label: 'Hư hỏng TS' },
                    { id: 'contract', label: 'Vi phạm HĐ' },
                    { id: 'other', label: 'Khác' }
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setReportType(item.id)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                        backgroundColor: reportType === item.id ? '#FEF3C7' : current.card,
                        borderWidth: 1, borderColor: reportType === item.id ? '#D97706' : current.border
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: reportType === item.id ? '#D97706' : current.text }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Mức độ ưu tiên:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {[
                    { id: 'low', label: 'Thấp', color: '#64748b', bg: '#f1f5f9' },
                    { id: 'medium', label: 'Trung bình', color: '#f59e0b', bg: '#fef3c7' },
                    { id: 'high', label: 'Cao', color: '#ef4444', bg: '#fee2e2' }
                  ].map(item => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setReportPriority(item.id)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
                        backgroundColor: reportPriority === item.id ? item.bg : current.card,
                        borderWidth: 1, borderColor: reportPriority === item.id ? item.color : current.border
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: reportPriority === item.id ? item.color : current.text }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Tiêu đề khiếu nại:</Text>
                <SyncTextInput
                  value={reportTitle}
                  onChangeText={setReportTitle}
                  placeholder="VD: Chủ nhà không hoàn cọc..."
                  placeholderTextColor={theme.textInactive}
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 16
                  }}
                />

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Nội dung chi tiết:</Text>
                <SyncTextInput
                  value={reportDesc}
                  onChangeText={setReportDesc}
                  placeholder="Mô tả chi tiết vấn đề..."
                  placeholderTextColor={theme.textInactive}
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 16, textAlignVertical: 'top', minHeight: 100
                  }}
                />

                <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 8, fontWeight: '600' }}>Tài liệu đính kèm:</Text>
                <TouchableOpacity onPress={handlePickDocument} style={{ borderWidth: 1, borderColor: current.border, borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: reportAttachments.length ? 12 : 24 }}>
                  <Ionicons name="cloud-upload-outline" size={24} color={theme.textInactive} />
                  <Text style={{ fontSize: 13, color: theme.textInactive, marginTop: 4 }}>Tải lên hình ảnh, PDF...</Text>
                </TouchableOpacity>
                {reportAttachments.length > 0 && (
                  <View style={{ gap: 8, marginBottom: 24 }}>
                    {reportAttachments.map((f, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: current.card, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: current.border }}>
                        <Ionicons name="document-text-outline" size={16} color={theme.textInactive} />
                        <Text style={{ fontSize: 12, color: current.text, flex: 1, marginLeft: 8 }} numberOfLines={1}>{f.name}</Text>
                        <TouchableOpacity onPress={() => setReportAttachments(reportAttachments.filter((_, idx) => idx !== i))}>
                          <Ionicons name="close-circle" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                <PrimaryButton
                  title="Gửi khiếu nại"
                  loading={terminationLoading}
                  onPress={submitReport}
                  style={{ backgroundColor: '#D97706', borderColor: '#B45309' }}
                />
                <TouchableOpacity onPress={() => setShowReportModal(false)} disabled={terminationLoading} style={{ marginTop: 14, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: theme.textInactive, fontWeight: '700' }}>Hủy bỏ</Text>
                </TouchableOpacity>
              </View>
              <FloatingKeyboardBar />
            </View>
          </Modal>

          {/* ══════════════════════════════════════════════════════════════
              MODAL: REVIEW TERMINATION
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showReviewTermModal} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingBottom: 40 }}>
                {/* Handle bar */}
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginTop: 14 }} />

                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: current.border }}>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: current.text, flex: 1 }}>
                    Phản hồi yêu cầu chấm dứt
                  </Text>
                  <TouchableOpacity
                    onPress={() => { Keyboard.dismiss(); setShowReviewTermModal(false) }}
                    style={{ padding: 6, backgroundColor: current.card, borderRadius: 20 }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textInactive }}>Đóng</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ flexGrow: 1 }}
                  contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {/* ── Info grid: Người yêu cầu + Mã HĐ ── */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    <View style={{ flex: 1, backgroundColor: current.card, borderRadius: 12, borderWidth: 1, borderColor: current.border, padding: 12 }}>
                      <Text style={{ fontSize: 10, color: theme.textInactive, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Người yêu cầu</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name={latestTermination?.requesterRole === 'OWNER' ? "home-outline" : "person-outline"} size={14} color={current.text} />
                        <Text style={{ fontSize: 14, fontWeight: '800', color: current.text }}>
                          {latestTermination?.requesterRole === 'OWNER' ? 'Chủ nhà' : 'Người thuê'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, backgroundColor: current.card, borderRadius: 12, borderWidth: 1, borderColor: current.border, padding: 12 }}>
                      <Text style={{ fontSize: 10, color: theme.textInactive, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Hợp đồng</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: current.text }} numberOfLines={1}>{contract?.contractCode || '—'}</Text>
                    </View>
                  </View>

                  {/* ── Mã YC + Ngày gửi ── */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '700' }}>
                        Mã YC: #{latestTermination?.terminationRequestId?.slice(0, 8).toUpperCase() || '—'}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 10, color: theme.textInactive, textTransform: 'uppercase', letterSpacing: 0.4 }}>Ngày gửi</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: current.text }}>{fmtDate(latestTermination?.createdAt)}</Text>
                    </View>
                  </View>

                  {/* ── Ngày chấm dứt đề xuất ── */}
                  {latestTermination?.requestedTerminationDate && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 14, marginBottom: 12 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="calendar-outline" size={20} color="#DC2626" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Ngày chấm dứt đề xuất</Text>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#DC2626', marginTop: 2 }}>
                          {fmtDate(latestTermination.requestedTerminationDate)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* ── Lý do chính ── */}
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 10, color: theme.textInactive, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Lý do chính</Text>
                    <View style={{ backgroundColor: current.card, borderRadius: 12, borderWidth: 1, borderColor: current.border, padding: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: current.text }}>
                        {latestTermination?.reason === 'mutual_agreement' ? 'Hai bên thỏa thuận' :
                         latestTermination?.reason === 'unilateral_termination' ? 'Đơn phương chấm dứt' :
                         latestTermination?.reason === 'breach_of_contract' ? 'Vi phạm hợp đồng' :
                         latestTermination?.reason === 'non_payment' ? 'Không thanh toán' :
                         latestTermination?.reason === 'force_majeure' ? 'Bất khả kháng' :
                         latestTermination?.reason === 'lease_end' ? 'Hết hạn hợp đồng' :
                         latestTermination?.reason || '—'}
                      </Text>
                    </View>
                  </View>

                  {/* ── Ghi chú bổ sung (nếu có) ── */}
                  {latestTermination?.note ? (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, color: theme.textInactive, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Ghi chú bổ sung</Text>
                      <View style={{ backgroundColor: current.card, borderRadius: 12, borderWidth: 1, borderColor: current.border, padding: 12 }}>
                        <Text style={{ fontSize: 13, color: theme.textInactive, fontStyle: 'italic', lineHeight: 20 }}>"{latestTermination.note}"</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* ── Phí chấm dứt sớm (nếu > 0) ── */}
                  {latestTermination?.earlyTerminationFee != null && Number(latestTermination.earlyTerminationFee) > 0 && (
                    <View style={{ backgroundColor: '#EFF6FF', borderRadius: 14, borderWidth: 1, borderColor: '#BFDBFE', padding: 14, marginBottom: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Ionicons name="cash-outline" size={22} color="#1E40AF" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E40AF', marginBottom: 2 }}>Phí chấm dứt sớm</Text>
                        <Text style={{ fontSize: 12, color: '#3B82F6', lineHeight: 18 }}>
                          Dựa trên hợp đồng, phí chấm dứt sớm có thể lên tới{' '}
                          <Text style={{ fontWeight: '800' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(latestTermination.earlyTerminationFee))}
                          </Text>
                          . Số tiền chính xác sẽ được xác nhận khi xử lý.
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* ── Phản hồi trước đó (nếu có) ── */}
                  {latestTermination?.reviewNote ? (
                    <View style={{ backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', padding: 12, marginBottom: 16 }}>
                      <Text style={{ fontSize: 10, color: '#3B82F6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Phản hồi trước đó</Text>
                      <Text style={{ fontSize: 13, color: '#1E40AF', lineHeight: 20 }}>{latestTermination.reviewNote}</Text>
                    </View>
                  ) : null}

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: current.border, marginBottom: 20 }} />

                  {/* Decision selection */}
                  <Text style={{ fontSize: 13, color: theme.textInactive, marginBottom: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 }}>Quyết định của bạn:</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                    <TouchableOpacity
                      onPress={() => setReviewTermAction('approved')}
                      style={{
                        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                        backgroundColor: reviewTermAction === 'approved' ? '#16A34A' : current.card,
                        borderWidth: 2, borderColor: reviewTermAction === 'approved' ? '#15803D' : current.border,
                      }}
                    >
                      <View style={{ marginBottom: 4 }}>
                        <Ionicons name="checkmark-circle" size={28} color={reviewTermAction === 'approved' ? '#FFF' : '#16A34A'} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: reviewTermAction === 'approved' ? '#FFF' : '#16A34A' }}>Chấp thuận</Text>
                      <Text style={{ fontSize: 10, color: reviewTermAction === 'approved' ? 'rgba(255,255,255,0.8)' : theme.textInactive, marginTop: 2 }}>Đồng ý chấm dứt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setReviewTermAction('rejected')}
                      style={{
                        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                        backgroundColor: reviewTermAction === 'rejected' ? '#DC2626' : current.card,
                        borderWidth: 2, borderColor: reviewTermAction === 'rejected' ? '#B91C1C' : current.border,
                      }}
                    >
                      <View style={{ marginBottom: 4 }}>
                        <Ionicons name="close-circle" size={28} color={reviewTermAction === 'rejected' ? '#FFF' : '#DC2626'} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: reviewTermAction === 'rejected' ? '#FFF' : '#DC2626' }}>Từ chối</Text>
                      <Text style={{ fontSize: 10, color: reviewTermAction === 'rejected' ? 'rgba(255,255,255,0.8)' : theme.textInactive, marginTop: 2 }}>Bác bỏ yêu cầu</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Note */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600' }}>
                      {reviewTermAction === 'rejected' ? 'Lý do từ chối *' : 'Ghi chú (tuỳ chọn)'}
                    </Text>
                    <TouchableOpacity onPress={() => Keyboard.dismiss()} style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: current.card, borderRadius: 8, borderWidth: 1, borderColor: current.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Xong ✓</Text>
                    </TouchableOpacity>
                  </View>
                  <SyncTextInput
                    value={reviewTermNote}
                    onChangeText={setReviewTermNote}
                    placeholder={reviewTermAction === 'rejected' ? 'Bắt buộc: nhập lý do từ chối rõ ràng...' : 'Nhập ghi chú thêm (không bắt buộc)...'}
                    placeholderTextColor={theme.textInactive}
                    multiline
                    numberOfLines={4}
                    style={{
                      borderWidth: 1,
                      borderColor: reviewTermAction === 'rejected' && !reviewTermNote.trim() ? '#FECACA' : current.border,
                      borderRadius: 12, padding: 12,
                      fontSize: 14, color: current.text, backgroundColor: current.card,
                      marginBottom: 20, textAlignVertical: 'top', minHeight: 100
                    }}
                  />

                  {/* Evidence upload — required when rejecting */}
                  {reviewTermAction === 'rejected' && (
                    <>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600' }}>Minh chứng đính kèm *</Text>
                        <Text style={{ fontSize: 11, color: theme.textInactive }}>{reviewTermEvidence.length}/5 file</Text>
                      </View>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], multiple: true })
                            if (!res.canceled) setReviewTermEvidence(prev => [...prev, ...res.assets].slice(0, 5))
                          } catch {}
                        }}
                        style={{ borderWidth: 1, borderColor: reviewTermEvidence.length === 0 ? '#FECACA' : current.border, borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: reviewTermEvidence.length ? 12 : 20 }}
                      >
                        <Ionicons name="attach" size={28} color={colors.primary} style={{ marginBottom: 4 }} />
                        <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>Chọn ảnh / PDF minh chứng</Text>
                        <Text style={{ fontSize: 11, color: theme.textInactive, marginTop: 2 }}>Tối đa 5 file, mỗi file 15MB</Text>
                      </TouchableOpacity>
                      {reviewTermEvidence.length > 0 && (
                        <View style={{ gap: 8, marginBottom: 20 }}>
                          {reviewTermEvidence.map((f: any, i: number) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: current.card, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: current.border }}>
                              <Ionicons name="document-text-outline" size={18} color={theme.textInactive} style={{ marginRight: 8 }} />
                              <Text style={{ fontSize: 12, color: current.text, flex: 1 }} numberOfLines={1}>{f.name}</Text>
                              <TouchableOpacity onPress={() => setReviewTermEvidence(prev => prev.filter((_, idx) => idx !== i))}>
                                <Ionicons name="close-circle" size={22} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  {/* Submit */}
                  <TouchableOpacity
                    onPress={submitReviewTermination}
                    disabled={terminationLoading}
                    style={{
                      paddingVertical: 16, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                      backgroundColor: reviewTermAction === 'approved' ? '#16A34A' : '#DC2626',
                      opacity: terminationLoading ? 0.6 : 1,
                    }}
                  >
                    {terminationLoading
                      ? <ActivityIndicator size="small" color="#FFF" />
                      : <>
                          <Ionicons name={reviewTermAction === 'approved' ? "checkmark-circle" : "close-circle"} size={20} color="#FFF" />
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>
                            {reviewTermAction === 'approved' ? 'Xác nhận Chấp thuận' : 'Xác nhận Từ chối'}
                          </Text>
                        </>
                    }
                  </TouchableOpacity>
                </ScrollView>
              </View>
              <FloatingKeyboardBar />
            </View>
          </Modal>

          {/* ══════════════════════════════════════════════════════════════
              MODAL: UPDATE TERMINATION
          ══════════════════════════════════════════════════════════════ */}
          <Modal visible={showUpdateTermModal} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: current.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 }}>
                <View style={{ width: 40, height: 4, backgroundColor: current.border, borderRadius: 2, alignSelf: 'center', marginBottom: 22 }} />
                
                <Text style={{ fontSize: 18, fontWeight: '900', color: current.text, marginBottom: 16 }}>
                  {updateTermStatus === 'negotiating' ? 'Bắt đầu thương lượng' : 'Cập nhật yêu cầu chấm dứt'}
                </Text>

                {(updateTermStatus === 'negotiating' || updateTermStatus === 'resolved') && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600', marginBottom: 8 }}>
                      {updateTermStatus === 'negotiating' ? 'Mục tiêu thương lượng:' : 'Kết quả thỏa thuận:'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => setUpdateTermResolution('continue_contract')}
                        style={{
                          flex: 1, padding: 12, borderRadius: 12, borderWidth: 2,
                          borderColor: updateTermResolution === 'continue_contract' ? '#3B82F6' : current.border,
                          backgroundColor: updateTermResolution === 'continue_contract' ? '#EFF6FF' : current.card,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: updateTermResolution === 'continue_contract' ? '#1D4ED8' : current.text, textAlign: 'center' }}>Tiếp tục hợp đồng</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setUpdateTermResolution('terminate_contract')}
                        style={{
                          flex: 1, padding: 12, borderRadius: 12, borderWidth: 2,
                          borderColor: updateTermResolution === 'terminate_contract' ? '#EF4444' : current.border,
                          backgroundColor: updateTermResolution === 'terminate_contract' ? '#FEF2F2' : current.card,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: updateTermResolution === 'terminate_contract' ? '#B91C1C' : current.text, textAlign: 'center' }}>Chấm dứt hợp đồng</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: theme.textInactive, fontWeight: '600' }}>
                    {updateTermStatus === 'negotiating' ? 'Đề xuất của bạn (Bắt buộc):' : 'Ghi chú cập nhật:'}
                  </Text>
                  <TouchableOpacity onPress={() => Keyboard.dismiss()} style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: current.card, borderRadius: 8, borderWidth: 1, borderColor: current.border }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Xong ✓</Text>
                  </TouchableOpacity>
                </View>
                <SyncTextInput
                  value={updateTermNote}
                  onChangeText={setUpdateTermNote}
                  placeholder={
                    updateTermStatus === 'admin_review' ? 'Bắt buộc nhập lý do gửi quản trị viên...' : 
                    updateTermStatus === 'negotiating' ? 'Nhập chi tiết điều kiện hoặc đề xuất mới...' : 
                    'Nhập ghi chú chi tiết...'
                  }
                  placeholderTextColor={theme.textInactive}
                  multiline
                  numberOfLines={4}
                  style={{
                    borderWidth: 1, borderColor: current.border, borderRadius: 12, padding: 12,
                    fontSize: 14, color: current.text, backgroundColor: current.card, marginBottom: 24, textAlignVertical: 'top', minHeight: 100
                  }}
                />

                <PrimaryButton
                  title="Cập nhật"
                  loading={terminationLoading}
                  onPress={submitUpdateTermination}
                />
                <TouchableOpacity onPress={() => setShowUpdateTermModal(false)} disabled={terminationLoading} style={{ marginTop: 14, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: theme.textInactive, fontWeight: '700' }}>Hủy bỏ</Text>
                </TouchableOpacity>
              </View>
              <FloatingKeyboardBar />
            </View>
          </Modal>

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

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl } from 'react-native'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import PrimaryButton from '@/components/PrimaryButton'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getMyRentalRequests, getOwnerRequests, openHoldingDepositWindow, cancelRequest, reviewRequest } from '@/store/slices/contract.slice'
import { Modal, TextInput } from 'react-native'
import { getPropertyById as getPropertyByIdThunk } from '@/store/slices/property.slice'
import { useRouter } from 'expo-router'
import { FileText, MapPin, RefreshCw, CheckCircle, Clock, XCircle, Home, Building, ChevronRight, Inbox } from 'lucide-react-native'
import { useThemeColors } from '@/utils/colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import ScreenHeader from '@/components/common/ScreenHeader'
import NebulaLoader from '@/components/NebulaLoader'

// Simple status labels
const STATUS_LABELS: Record<string, string> = {
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

const STATUS_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  under_review: { bg: '#DBEAFE', text: '#075985' },
  approved: { bg: '#DCFCE7', text: '#166534' },
  holding_deposit_open: { bg: '#FED7AA', text: '#92400E' },
  holding_deposit_paid: { bg: '#DCFCE7', text: '#166534' },
  holding_deposit_locked: { bg: '#E0E7FF', text: '#3730A3' },
  holding_deposit_expired: { bg: '#FEE2E2', text: '#991B1B' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
  cancelled: { bg: '#F3F4F6', text: '#374151' },
  contract_created: { bg: '#E0E7FF', text: '#3730A3' },
}

type RequestItem = any
type TabType = 'my' | 'owner'

const formatMoney = (v: unknown) => Number(v || 0).toLocaleString('vi-VN')
const isOpenDepositEligible = (status: string) => ['pending', 'under_review'].includes(status)
const getRequestKey = (request: RequestItem) => String(request?.requestId || request?.id || '')

const extractPropertyInfo = (request: RequestItem) => {
  const property =
    request?.property ||
    request?.propertySummary ||
    request?.propertyInfo ||
    request?.rentalRequest?.property ||
    request?.contract?.property ||
    request?.propertyDetail ||
    null

  const imageUrl =
    property?.imageUrl || property?.images?.[0]?.uri || property?.images?.[0]?.url || request?.propertyImageUrl || ''

  const title = property?.title || property?.name || request?.propertyTitle || request?.propertyId || 'Bất động sản'
  const address = property?.address || [property?.ward, property?.district, property?.city].filter(Boolean).join(', ') || ''

  return { id: property?.id || request?.propertyId || '', title, address, imageUrl, raw: property }
}



const PropertyGroupHeader: React.FC<{ title: string; address?: string; imageUrl?: string }> = ({ title, address, imageUrl }) => (
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
    <View style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Building size={24} color="#9CA3AF" /></View>}
    </View>
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }} numberOfLines={2}>{title}</Text>
      {address ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
          <MapPin size={12} color="#E5E7EB" />
          <Text style={{ fontSize: 13, color: '#E5E7EB', flex: 1 }} numberOfLines={1}>{address}</Text>
        </View>
      ) : null}
    </View>
  </View>
)

const RequestsScreen: React.FC = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const colors = useThemeColors()
  const { current } = colors
  const { myRequests, loading, error } = useAppSelector((s) => s.contract)
  const [ownerRequests, setOwnerRequests] = useState<RequestItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [propertyCache, setPropertyCache] = useState<Record<string, any>>({})
  const [selectedOwnerRequestIds, setSelectedOwnerRequestIds] = useState<string[]>([])
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReqId, setRejectReqId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const handleCancelRequest = (requestId: string) => {
    Alert.alert('Hủy yêu cầu', 'Bạn có chắc chắn muốn hủy yêu cầu này?', [
      { text: 'Đóng', style: 'cancel' },
      {
        text: 'Hủy yêu cầu', style: 'destructive', onPress: async () => {
          try {
            await dispatch(cancelRequest(requestId)).unwrap()
            Alert.alert('Thành công', 'Đã hủy yêu cầu')
            loadData()
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Có lỗi xảy ra')
          }
        }
      }
    ])
  }

  const handleOpenReject = (reqId: string) => {
    setRejectReqId(reqId);
    setRejectReason('');
    setRejectModalOpen(true);
  }

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await dispatch(reviewRequest({ requestId: rejectReqId, status: 'rejected', rejectionReason: rejectReason })).unwrap()
      setRejectModalOpen(false)
      Alert.alert('Thành công', 'Đã từ chối yêu cầu')
      loadData()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể từ chối')
    }
  }

  const mergePropertyToCache = useCallback((propertyId: string, property: any) => {
    if (!propertyId || !property) return
    setPropertyCache((p) => ({ ...p, [propertyId]: { ...(p[propertyId] || {}), ...property } }))
  }, [])

  const getPropertySummary = useCallback((request: RequestItem): { id: string; title: string; address: string; imageUrl: string; propertyType: string; raw?: any } => {
    const cached = propertyCache[request?.propertyId] || propertyCache[String(request?.property?.id)] || null
    if (cached) return { id: cached.id || request?.propertyId || '', title: cached.title || cached.name || request?.propertyTitle || request?.propertyId || 'Bất động sản', address: cached.address || '', imageUrl: cached.imageUrl || cached.images?.[0]?.uri || '', propertyType: cached.propertyType || cached.type || request?.propertyType || request?.property?.type || '' }
    const ext = extractPropertyInfo(request)
    return { ...ext, propertyType: request?.propertyType || request?.property?.type || '' }
  }, [propertyCache])

  const loadData = useCallback(async () => {
    try {
      await dispatch(getMyRentalRequests())
      setOwnerLoading(true)
      const res = await dispatch(getOwnerRequests()).unwrap()
      const nextOwnerRequests = Array.isArray(res) ? res : res?.data?.items || res?.data || res?.items || []
      setOwnerRequests(nextOwnerRequests)

      const uniquePropertyIds = Array.from(new Set(nextOwnerRequests.map((r: any) => r?.propertyId).filter(Boolean).map((id: any) => String(id)))) as string[]

      await Promise.all(uniquePropertyIds.map(async (propertyId) => {
        const existing = nextOwnerRequests.find((req: any) => String(req?.propertyId) === propertyId)?.property
        if (existing?.title && (existing?.imageUrl || existing?.images?.length) && existing?.address) {
          mergePropertyToCache(propertyId, existing)
          return
        }
        try {
          const propertyRes = await dispatch(getPropertyByIdThunk(propertyId)).unwrap()
          const property = (propertyRes as any)?.data ?? propertyRes
          mergePropertyToCache(propertyId, property)
        } catch {
          // ignore
        }
      }))
    } catch {
      setOwnerRequests([])
    } finally {
      setOwnerLoading(false)
      setRefreshing(false)
    }
  }, [dispatch, mergePropertyToCache])

  useEffect(() => { loadData() }, [loadData])

  const handleOpenDeposit = async (requestId: string) => {
    Alert.alert('Mở đặt cọc', 'Mở cọc cho yêu cầu này? Người thanh toán trước sẽ được giữ chỗ.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Mở cọc',
        onPress: async () => {
          try {
            await dispatch(openHoldingDepositWindow({ requestIds: [requestId], expireMinutes: 60 })).unwrap()
            Alert.alert('Thành công', 'Đã mở đặt cọc cho yêu cầu này')
            await loadData()
          } catch (e: any) {
            Alert.alert('Lỗi', e?.message || 'Không thể mở đặt cọc')
          }
        }
      }
    ])
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleOpenSelectedDeposits = async () => {
    if (selectedOwnerRequestIds.length === 0) return

    Alert.alert(
      'Mở cọc hàng loạt',
      `Mở cọc cho ${selectedOwnerRequestIds.length} yêu cầu đã chọn?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Mở cọc',
          onPress: async () => {
            try {
              await dispatch(openHoldingDepositWindow({ requestIds: selectedOwnerRequestIds, expireMinutes: 60 })).unwrap()
              Alert.alert('Thành công', `Đã mở cọc cho ${selectedOwnerRequestIds.length} yêu cầu`)
              setSelectedOwnerRequestIds([])
              await loadData()
            } catch (e: any) {
              Alert.alert('Lỗi', e?.message || 'Không thể mở cọc hàng loạt')
            }
          },
        },
      ]
    )
  }

  const toggleOwnerSelection = (requestId: string) => {
    setSelectedOwnerRequestIds((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId]
    )
  }

  const normalizedMyRequests = useMemo(() => (Array.isArray(myRequests) ? myRequests : []), [myRequests])
  const normalizedOwnerRequests = useMemo(() => (Array.isArray(ownerRequests) ? ownerRequests : []), [ownerRequests])

  const eligibleOwnerRequestIds = useMemo(
    () => normalizedOwnerRequests.filter((req) => isOpenDepositEligible(req.status)).map(getRequestKey).filter(Boolean),
    [normalizedOwnerRequests]
  )

  const selectedEligibleOwnerRequestIds = useMemo(
    () => selectedOwnerRequestIds.filter((id) => eligibleOwnerRequestIds.includes(id)),
    [selectedOwnerRequestIds, eligibleOwnerRequestIds]
  )

  const allEligibleSelected = eligibleOwnerRequestIds.length > 0 && selectedEligibleOwnerRequestIds.length === eligibleOwnerRequestIds.length

  const toggleSelectAllEligible = () => {
    setSelectedOwnerRequestIds((prev) => {
      if (allEligibleSelected) {
        return prev.filter((id) => !eligibleOwnerRequestIds.includes(id))
      }
      return Array.from(new Set([...prev, ...eligibleOwnerRequestIds]))
    })
  }

  const myGroups = useMemo(() => {
    const map = new Map<string, RequestItem[]>()
    normalizedMyRequests.forEach((req) => {
      const summary = getPropertySummary(req)
      const key = summary.id || req.requestId || req.id || ''
      const arr = map.get(key) || []
      arr.push(req)
      map.set(key, arr)
    })
    return Array.from(map.entries()).map(([k, requests]) => ({ propertyId: k, title: getPropertySummary(requests[0]).title, address: getPropertySummary(requests[0]).address, imageUrl: getPropertySummary(requests[0]).imageUrl, requests }))
  }, [normalizedMyRequests, getPropertySummary])

  const ownerGroups = useMemo(() => {
    const map = new Map<string, RequestItem[]>()
    normalizedOwnerRequests.forEach((req) => {
      const summary = getPropertySummary(req)
      const key = summary.id || req.requestId || req.id || ''
      const arr = map.get(key) || []
      arr.push(req)
      map.set(key, arr)
    })
    return Array.from(map.entries()).map(([k, requests]) => ({ propertyId: k, title: getPropertySummary(requests[0]).title, address: getPropertySummary(requests[0]).address, imageUrl: getPropertySummary(requests[0]).imageUrl, requests }))
  }, [normalizedOwnerRequests, getPropertySummary])

  const renderRequestRow = (item: RequestItem, kind: TabType) => {
    const statusColor = STATUS_BADGE_COLORS[item.status] || { bg: '#F3F4F6', text: '#374151' }
    const requestKey = getRequestKey(item)
    const selected = selectedOwnerRequestIds.includes(requestKey)

    return (
      <View key={requestKey} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: current.border, backgroundColor: current.card }}>

        {/* Header Hành động & Mã Yêu cầu */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {kind === 'owner' && isOpenDepositEligible(item.status) && (
              <TouchableOpacity
                onPress={() => toggleOwnerSelection(requestKey)}
                style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: selected ? '#0040d1' : current.border, backgroundColor: selected ? '#0040d1' : 'transparent', alignItems: 'center', justifyContent: 'center' }}
              >
                {selected && <CheckCircle size={14} color="#fff" />}
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 12, fontWeight: '700', color: current.textInactive }}>Mã YC: {item.requestCode || requestKey.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={{ backgroundColor: statusColor.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor.text, textAlign: 'center' }}>{STATUS_LABELS[item.status] || item.status}</Text>
          </View>
        </View>

        {/* Khung lưới thông tin dạng Web */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: current.card === '#FFFFFF' ? '#F8FAFC' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: current.border }}>
            <Text style={{ fontSize: 10, textTransform: 'uppercase', color: current.textInactive, fontWeight: '700' }}>Giá thuê</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#4F46E5', marginTop: 4 }}>{formatMoney(item.proposedRent)} đ</Text>
          </View>
          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: current.card === '#FFFFFF' ? '#F8FAFC' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: current.border }}>
            <Text style={{ fontSize: 10, textTransform: 'uppercase', color: current.textInactive, fontWeight: '700' }}>Thời hạn thuê</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: current.text, marginTop: 4 }}>
              {new Date(item.startDate).toLocaleDateString('vi-VN')} → {new Date(item.endDate).toLocaleDateString('vi-VN')}
            </Text>
          </View>
          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: current.card === '#FFFFFF' ? '#F8FAFC' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: current.border }}>
            <Text style={{ fontSize: 10, textTransform: 'uppercase', color: current.textInactive, fontWeight: '700' }}>Hạn đặt cọc</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: current.text, marginTop: 4 }}>
              {item.holdingDepositExpiresAt ? new Date(item.holdingDepositExpiresAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
            </Text>
          </View>
          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: current.card === '#FFFFFF' ? '#F8FAFC' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: current.border }}>
            <Text style={{ fontSize: 10, textTransform: 'uppercase', color: current.textInactive, fontWeight: '700' }}>Ngày tạo</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: current.text, marginTop: 4 }}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>

        {/* Nút Hành động */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {kind === 'owner' ? (
            <>
              {isOpenDepositEligible(item.status) && (
                <TouchableOpacity onPress={() => handleOpenDeposit(requestKey)} style={{ flexGrow: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#0040d1', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Mở cọc</Text>
                </TouchableOpacity>
              )}
              {['pending', 'under_review'].includes(item.status) && (
                <TouchableOpacity onPress={() => handleOpenReject(requestKey)} style={{ flexGrow: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#FEE2E2', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B' }}>Từ chối</Text>
                </TouchableOpacity>
              )}
              {(item.status === 'holding_deposit_paid' || item.status === 'holding_deposit_locked' || item.contractId) && (
                <TouchableOpacity onPress={() => { item.contractId ? router.push({ pathname: '/(rental)/contract-detail', params: { contractId: item.contractId } }) : router.push({ pathname: '/template-selection' as any, params: { requestId: requestKey, propertyType: getPropertySummary(item).propertyType || 'house' } }) }} style={{ flexGrow: 1, minWidth: 96, alignItems: 'center', paddingVertical: 10, backgroundColor: '#7C3AED', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{item.contractId ? 'Quản lý HĐ' : 'Hợp đồng'}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => item.contractId ? router.push({ pathname: '/(rental)/contract-detail', params: { contractId: item.contractId } }) : null} disabled={!item.contractId} style={{ flexGrow: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: item.contractId ? '#4F46E5' : current.border, borderRadius: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: item.contractId ? '#fff' : '#9CA3AF' }}>Xem Hợp đồng</Text>
              </TouchableOpacity>

              {(item.holdingDepositStatus === 'open' || item.status === 'holding_deposit_open') && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/(rental)/pay-deposit', params: { requestId: requestKey } })} style={{ flexGrow: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#059669', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Thanh toán</Text>
                </TouchableOpacity>
              )}

              {['pending', 'under_review'].includes(item.status) && (
                <TouchableOpacity onPress={() => handleCancelRequest(requestKey)} style={{ flexGrow: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#FEE2E2', borderRadius: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B' }}>Hủy yêu cầu</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

      </View>
    )
  }

  const renderGroupedRequests = (groups: any[], kind: TabType) => {
    if (!groups || groups.length === 0) return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Inbox size={48} color={current.textInactive} />
        <Text style={{ marginTop: 12, fontSize: 15, color: current.text, fontWeight: '600' }}>{kind === 'my' ? 'Chưa có yêu cầu nào' : 'Chưa có yêu cầu nhận được'}</Text>
      </View>
    )

    return groups.map((group) => (
      <View key={group.propertyId} style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: current.card, borderWidth: 1, borderColor: current.border, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
        <View style={{ padding: 12, backgroundColor: '#0F172A' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: '#60A5FA' }} />
              <Text style={{ color: '#DBEAFE', fontSize: 12, fontWeight: '700' }}>Bất động sản</Text>
            </View>
            {kind === 'owner' ? (
              <TouchableOpacity onPress={() => { setRefreshing(true); loadData() }} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)' }}>
                <RefreshCw size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Reload</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <PropertyGroupHeader title={group.title} address={group.address} imageUrl={group.imageUrl} />
        </View>

        {/* Request Items - Compact rows */}
        <View>
          {group.requests.map((req: any, idx: number) => (
            <View key={req.requestId || req.id || idx}>
              {renderRequestRow(req, kind)}
              {/* Add divider between items, not after last */}
              {idx < group.requests.length - 1 && <View style={{ height: 1, backgroundColor: current.border, marginHorizontal: 12 }} />}
            </View>
          ))}
        </View>
      </View>
    ))
  }

  const isLoading = (loading || ownerLoading) && !refreshing

  return (
    <AuthGuard>
      <KeyboardSafeWrapper scrollable={false} dismissKeyboardOnTap={false} style={{ flex: 1, backgroundColor: current.background }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
          <ScreenHeader title="Quản lý yêu cầu" />

          <View style={{ padding: 16, paddingTop: 16, paddingBottom: 0 }}>
            {/* Tab Navigation */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: current.card, padding: 4, borderRadius: 14, borderWidth: 1, borderColor: current.border }}>
              <TouchableOpacity onPress={() => setActiveTab('my')} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: activeTab === 'my' ? '#0040d1' : 'transparent' }}>
                <Text style={{ textAlign: 'center', fontWeight: '700', color: activeTab === 'my' ? '#fff' : current.textInactive, fontSize: 13 }}>Yêu cầu của tôi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('owner')} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: activeTab === 'owner' ? '#0040d1' : 'transparent' }}>
                <Text style={{ textAlign: 'center', fontWeight: '700', color: activeTab === 'owner' ? '#fff' : current.textInactive, fontSize: 13 }}>Yêu cầu nhận được</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 12, color: current.textInactive }}>Tổng quan</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: current.text }}>{activeTab === 'my' ? `${myGroups.length} nhóm yêu cầu` : `${ownerGroups.length} nhóm nhận được`}</Text>
            </View>
            <TouchableOpacity onPress={() => { setRefreshing(true); loadData() }} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#EAF1FF', borderWidth: 1, borderColor: '#C7DBFF' }}>
              <RefreshCw size={14} color="#0040d1" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0040d1' }}>Reload</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'owner' ? (
            <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, backgroundColor: current.card === '#FFFFFF' ? '#F8FAFF' : 'rgba(0,64,209,0.1)', borderWidth: 1, borderColor: current.card === '#FFFFFF' ? '#D6E4FF' : 'rgba(0,64,209,0.3)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Chọn nhiều yêu cầu</Text>
                  <Text style={{ fontSize: 12, color: current.textInactive, marginTop: 4 }}>
                    Đang chọn {selectedEligibleOwnerRequestIds.length}/{eligibleOwnerRequestIds.length} yêu cầu đủ điều kiện mở cọc
                  </Text>
                </View>
                <TouchableOpacity onPress={toggleSelectAllEligible} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: allEligibleSelected ? current.border : '#0040d1' }}>
                  <Text style={{ color: allEligibleSelected ? current.text : '#fff', fontSize: 12, fontWeight: '700' }}>{allEligibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Text>
                </TouchableOpacity>
              </View>

              <PrimaryButton
                title={selectedEligibleOwnerRequestIds.length > 0 ? `Mở cọc ${selectedEligibleOwnerRequestIds.length} yêu cầu` : 'Chưa chọn yêu cầu nào'}
                onPress={handleOpenSelectedDeposits}
                disabled={selectedEligibleOwnerRequestIds.length === 0}
                style={{ marginTop: 12, borderRadius: 14, backgroundColor: selectedEligibleOwnerRequestIds.length === 0 ? current.border : '#0040d1' }}
              />
            </View>
          ) : null}

          <ScrollView 
            contentContainerStyle={{ paddingBottom: 120 }} 
            refreshControl={<RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={colors.primary} 
            />}
          >

            {isLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <NebulaLoader size={30} label='Đang tải dữ liệu...' />
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                {activeTab === 'my' ? renderGroupedRequests(myGroups, 'my') : renderGroupedRequests(ownerGroups, 'owner')}
                {error ? (
                  <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}>
                    <Text style={{ color: '#B91C1C', fontSize: 12, fontWeight: '600' }}>{String(error)}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>

        <Modal visible={rejectModalOpen} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: current.card, borderRadius: 20, padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 10, color: current.text }}>Từ chối yêu cầu</Text>
              <Text style={{ fontSize: 14, color: current.textInactive, marginBottom: 16 }}>Vui lòng nhập lý do từ chối để khách hàng có thể biết được vấn đề của họ.</Text>
              <TextInput
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Nhập lý do từ chối..."
                placeholderTextColor={current.textInactive}
                multiline
                style={{ backgroundColor: current.background, borderRadius: 12, padding: 14, minHeight: 100, textAlignVertical: 'top', color: current.text, borderWidth: 1, borderColor: current.border }}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <TouchableOpacity onPress={() => setRejectModalOpen(false)} style={{ flex: 1, paddingVertical: 14, backgroundColor: current.border, borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: current.text }}>Hủy bỏ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={submitReject} style={{ flex: 1, paddingVertical: 14, backgroundColor: '#DC2626', borderRadius: 12, alignItems: 'center' }}>
                  <Text style={{ fontWeight: '700', color: '#fff' }}>Xác nhận từ chối</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default RequestsScreen
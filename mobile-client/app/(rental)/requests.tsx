import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, RefreshControl } from 'react-native'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import PrimaryButton from '@/components/PrimaryButton'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getMyRentalRequests, getOwnerRequests, openHoldingDepositWindow } from '@/store/slices/contract.slice'
import { getPropertyById as getPropertyByIdThunk } from '@/store/slices/property.slice'
import { useRouter } from 'expo-router'
import { FileText, MapPin, RefreshCw, CheckCircle, Clock, XCircle, Home, Building, ChevronRight, Inbox } from 'lucide-react-native'
import { useThemeColors } from '@/utils/colors'

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
  const { current } = useThemeColors()
  const { myRequests, loading, error } = useAppSelector((s) => s.contract)
  const [ownerRequests, setOwnerRequests] = useState<RequestItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const [ownerLoading, setOwnerLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [propertyCache, setPropertyCache] = useState<Record<string, any>>({})
  const [selectedOwnerRequestIds, setSelectedOwnerRequestIds] = useState<string[]>([])

  const mergePropertyToCache = useCallback((propertyId: string, property: any) => {
    if (!propertyId || !property) return
    setPropertyCache((p) => ({ ...p, [propertyId]: { ...(p[propertyId] || {}), ...property } }))
  }, [])

  const getPropertySummary = useCallback((request: RequestItem): { id: string; title: string; address: string; imageUrl: string; propertyType: string; raw?: any } => {
    const cached = propertyCache[request?.propertyId] || propertyCache[String(request?.property?.id)] || null
    if (cached) return { id: cached.id || request?.propertyId || '', title: cached.title || cached.name || request?.propertyTitle || request?.propertyId || 'Bất động sản', address: cached.address || '', imageUrl: cached.imageUrl || cached.images?.[0]?.uri || '', propertyType: cached.propertyType || cached.type || request?.propertyType || request?.property?.type || '' }
    const ext = extractPropertyInfo(request)
    return { ...ext, propertyType: request?.propertyType || request?.property?.type || '' }
  }, [propertyCache] )

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
      <View key={requestKey} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: current.border, alignItems: 'center' }}>
        {kind === 'owner' ? (
          <TouchableOpacity
            onPress={() => isOpenDepositEligible(item.status) ? toggleOwnerSelection(requestKey) : null}
            disabled={!isOpenDepositEligible(item.status)}
            style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: selected ? '#0040d1' : current.border, backgroundColor: selected ? '#0040d1' : 'transparent', alignItems: 'center', justifyContent: 'center', opacity: isOpenDepositEligible(item.status) ? 1 : 0.4 }}
          >
            {selected ? <CheckCircle size={16} color="#fff" /> : null}
          </TouchableOpacity>
        ) : null}

        <View style={{ backgroundColor: statusColor.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, minWidth: 90 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor.text, textAlign: 'center' }}>{STATUS_LABELS[item.status] || item.status}</Text>
        </View>

        {/* Price & Actions */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: current.text }}>
            {formatMoney(item.proposedRent)} đ
          </Text>
          <Text style={{ fontSize: 11, color: current.textInactive, marginTop: 2 }}>Giá đề xuất</Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {kind === 'owner' ? (
            <>
              {isOpenDepositEligible(item.status) && (
                <TouchableOpacity onPress={() => handleOpenDeposit(item.requestId || item.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#0040d1', borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Mở cọc</Text>
                </TouchableOpacity>
              )}

              {(item.status === 'holding_deposit_paid' || item.status === 'holding_deposit_locked' || item.contractId) ? (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/template-selection' as any, params: { requestId: item.requestId || item.id, propertyType: getPropertySummary(item).propertyType } })}
                  style={{ flexGrow: 1, minWidth: 96, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#7C3AED', borderRadius: 14, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Hợp đồng</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <>
              {(item.holdingDepositStatus === 'open' || item.status === 'holding_deposit_open') && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/(rental)/pay-deposit', params: { requestId: item.requestId || item.id } })} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#059669', borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>Thanh toán</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => item.contractId ? router.push({ pathname: '/(rental)/contract-detail', params: { contractId: item.contractId } }) : null} disabled={!item.contractId} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: item.contractId ? '#4F46E5' : current.border, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: item.contractId ? '#fff' : '#9CA3AF' }}>Xem HĐ</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    )
  }

  const renderGroupedRequests = (groups: any[], kind: TabType) => {
    if (!groups || groups.length === 0) return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Inbox size={48} color="#9CA3AF" />
        <Text style={{ marginTop: 12, fontSize: 15, color: '#374151', fontWeight: '600' }}>{kind === 'my' ? 'Chưa có yêu cầu nào' : 'Chưa có yêu cầu nhận được'}</Text>
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
            <View key={req.requestId || req.id}>
              {renderRequestRow(req, kind)}
              {/* Add divider between items, not after last */}
              {idx < group.requests.length - 1 && <View style={{ height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 12 }} />}
            </View>
          ))}
        </View>
      </View>
    ))
  }

  const isLoading = loading || ownerLoading

  return (
    <AuthGuard>
      <KeyboardSafeWrapper className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className='mt-10' refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} /> }>
          <View style={{ padding: 16, paddingTop: 20 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
              <BackButton onPress={() => router.back()} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>Quản lý yêu cầu</Text>
                <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 13 }}>Đặt cọc, thanh toán và hợp đồng</Text>
              </View>
            </View>

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
            <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#D6E4FF' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: current.text }}>Chọn nhiều yêu cầu</Text>
                  <Text style={{ fontSize: 12, color: current.textInactive, marginTop: 4 }}>
                    Đang chọn {selectedEligibleOwnerRequestIds.length}/{eligibleOwnerRequestIds.length} yêu cầu đủ điều kiện mở cọc
                  </Text>
                </View>
                <TouchableOpacity onPress={toggleSelectAllEligible} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: allEligibleSelected ? '#E5E7EB' : '#0040d1' }}>
                  <Text style={{ color: allEligibleSelected ? '#374151' : '#fff', fontSize: 12, fontWeight: '700' }}>{allEligibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Text>
                </TouchableOpacity>
              </View>

              <PrimaryButton
                title={selectedEligibleOwnerRequestIds.length > 0 ? `Mở cọc ${selectedEligibleOwnerRequestIds.length} yêu cầu` : 'Chưa chọn yêu cầu nào'}
                onPress={handleOpenSelectedDeposits}
                disabled={selectedEligibleOwnerRequestIds.length === 0}
                style={{ marginTop: 12, borderRadius: 14, backgroundColor: '#0040d1' }}
              />
            </View>
          ) : null}

          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#0040d1" />
              <Text style={{ marginTop: 12, color: current.textInactive, fontSize: 13 }}>Đang tải dữ liệu...</Text>
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
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default RequestsScreen
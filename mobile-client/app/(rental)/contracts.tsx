import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getMyContracts } from '@/store/slices/contract.slice'
import contractService from '@/services/contract.service'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import PrimaryButton from '@/components/PrimaryButton'
import { useThemeColors } from '@/utils/colors'
import { Calendar, Clock3, FileText, Handshake, Home, Landmark, Wallet } from 'lucide-react-native'
import { Ionicons } from '@expo/vector-icons'
import ScreenHeader from '@/components/common/ScreenHeader'

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp' },
  { key: 'pending_tenant', label: 'Chờ ký' },
  { key: 'pending_landlord', label: 'Chủ nhà ký' },
  { key: 'active', label: 'Đang hiệu lực' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'terminated', label: 'Chấm dứt' },
] as const

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Nháp', bg: '#EEF2FF', text: '#4338CA' },
  pending_tenant: { label: 'Chờ người thuê ký', bg: '#FFF7ED', text: '#C2410C' },
  tenant_signed: { label: 'Người thuê đã ký', bg: '#ECFEFF', text: '#0E7490' },
  pending_landlord: { label: 'Chờ chủ nhà ký', bg: '#F5F3FF', text: '#6D28D9' },
  owner_signed: { label: 'Chủ nhà đã ký', bg: '#F0FDF4', text: '#15803D' },
  fully_signed: { label: 'Đã ký hoàn tất', bg: '#E0F2FE', text: '#0369A1' },
  active: { label: 'Đang hiệu lực', bg: '#DCFCE7', text: '#166534' },
  expired: { label: 'Hết hạn', bg: '#F3F4F6', text: '#374151' },
  terminated: { label: 'Đã chấm dứt', bg: '#FEE2E2', text: '#B91C1C' },
  renewed: { label: 'Đã gia hạn', bg: '#E0E7FF', text: '#3730A3' },
  cancelled: { label: 'Đã hủy', bg: '#F3F4F6', text: '#4B5563' },
}

const formatMoney = (value: unknown) => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? new Intl.NumberFormat('vi-VN').format(parsed) : '0'
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('vi-VN')
}

const getPropertyImage = (contract: any) => contract?.property?.imageUrl || contract?.property?.images?.[0]?.uri || contract?.propertyImageUrl || 'https://images.unsplash.com/photo-1560518883-ce09059ee2fa?q=80&w=1000'

const getPropertyTitle = (contract: any) => contract?.property?.title || contract?.property?.name || contract?.propertyName || contract?.propertyId || 'Bất động sản cao cấp'

const getPropertyAddress = (contract: any) => contract?.property?.address || [contract?.property?.ward, contract?.property?.district, contract?.property?.city].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'

const ContractsScreen = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const colors = useThemeColors()
  const current = colors.current
  const { user } = useAppSelector((state) => state.auth)
  const { contracts, loading } = useAppSelector((state) => state.contract)

  const [activeTab, setActiveTab] = useState<(typeof STATUS_TABS)[number]['key']>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const loadContracts = useCallback(async () => {
    await dispatch(getMyContracts()).unwrap()
  }, [dispatch])

  useFocusEffect(useCallback(() => {
    loadContracts()
  }, [loadContracts]))

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadContracts()
    setRefreshing(false)
  }, [loadContracts])

  const filteredContracts = useMemo(() => {
    const list = Array.isArray(contracts) ? contracts : []
    if (activeTab === 'all') return list
    return list.filter((item) => item.status === activeTab)
  }, [contracts, activeTab])

  const summary = useMemo(() => {
    const list = Array.isArray(contracts) ? contracts : []
    return {
      total: list.length,
      active: list.filter((item) => item.status === 'active').length,
      signing: list.filter((item) => ['draft', 'pending_tenant', 'pending_landlord'].includes(item.status)).length,
      payments: list.filter((item) => item.status === 'active').length,
    }
  }, [contracts])

  const handleQuickAction = async (contract: any) => {
    const status = contract?.status
    const isOwnerUser = user?.id && contract?.ownerId === user.id
    const isTenantUser = user?.id && contract?.tenantId === user.id

    // Gửi hợp đồng cho người thuê
    if (status === 'draft' && isOwnerUser) {
      try {
        setActionId(contract.rentalId)
        await contractService.sendContractToTenant(contract.rentalId)
        await loadContracts()
      } finally {
        setActionId(null)
      }
      return
    }

    // Các trạng thái cần ký → navigate vào detail để dùng SmartCA
    if (
      (status === 'pending_tenant' && isTenantUser) ||
      (status === 'pending_landlord' && isOwnerUser)
    ) {
      router.push({ pathname: '/(rental)/contract-detail', params: { contractId: contract.rentalId } })
      return
    }

    // Mặc định: xem chi tiết
    router.push({ pathname: '/(rental)/contract-detail', params: { contractId: contract.rentalId } })
  }

  return (
    <AuthGuard>
      <KeyboardSafeWrapper scrollable={false} dismissKeyboardOnTap={false} style={{ flex: 1, backgroundColor: current.background }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
          <ScreenHeader title="Quản lý hợp đồng" />

          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ backgroundColor: '#0F172A', borderRadius: 28, padding: 18, marginBottom: 16, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.18)' }} />
            <View style={{ position: 'absolute', right: 40, bottom: -30, width: 90, height: 90, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.18)' }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flexGrow: 1, minWidth: 120, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 14 }}>
                <Text style={{ color: '#93C5FD', fontSize: 12 }}>Tổng hợp đồng</Text>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 }}>{summary.total}</Text>
              </View>
              <View style={{ flexGrow: 1, minWidth: 120, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 14 }}>
                <Text style={{ color: '#86EFAC', fontSize: 12 }}>Đang hiệu lực</Text>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 }}>{summary.active}</Text>
              </View>
              <View style={{ flexGrow: 1, minWidth: 120, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 14 }}>
                <Text style={{ color: '#FDE68A', fontSize: 12 }}>Chờ xử lý</Text>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 }}>{summary.signing}</Text>
              </View>
            </View>
          </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {STATUS_TABS.map((tab) => {
                const active = activeTab === tab.key
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: active ? colors.primary : current.card,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : current.border,
                    }}
                  >
                    <Text style={{ color: active ? '#fff' : current.text, fontWeight: '700', fontSize: 12 }}>{tab.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <View style={{ paddingHorizontal: 16, gap: 14, paddingTop: 8 }}>
              {loading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredContracts.length === 0 ? (
                <View style={{ backgroundColor: current.card, borderRadius: 24, borderWidth: 1, borderColor: current.border, padding: 28, alignItems: 'center' }}>
                  <FileText size={42} color={current.textInactive} />
                  <Text style={{ color: current.text, fontSize: 16, fontWeight: '800', marginTop: 14 }}>Chưa có hợp đồng phù hợp</Text>
                  <Text style={{ color: current.textInactive, textAlign: 'center', marginTop: 8 }}>Khi hợp đồng được tạo hoặc ký xong, chúng sẽ xuất hiện tại đây để bạn quản lý tập trung.</Text>
                </View>
              ) : (
                filteredContracts.map((contract) => {
                  const statusMeta = STATUS_META[contract.status] || { label: contract.status || 'Không rõ', bg: '#F3F4F6', text: '#374151' }
                  const isOwner = user?.id && contract?.ownerId === user.id
                  const isTenant = user?.id && contract?.tenantId === user.id
                  const propertyImage = getPropertyImage(contract)
                  const canQuickSend = contract.status === 'draft' && isOwner
                  const canQuickSign = contract.status === 'pending_tenant' && isTenant || contract.status === 'pending_landlord' && isOwner
                  const quickLabel = canQuickSend ? 'Gửi ký' : canQuickSign ? 'Ký ngay' : contract.status === 'active' ? 'Xem thanh toán' : 'Chi tiết'

                  return (
                    <View key={contract.rentalId} style={{ backgroundColor: current.card, borderRadius: 28, borderWidth: 1, borderColor: current.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 }}>
                      <View style={{ height: 160, backgroundColor: '#0F172A' }}>
                        {propertyImage ? (
                          <Image source={{ uri: propertyImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : null}
                        <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)' }} />
                        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{contract.contractCode || contract.rentalId}</Text>
                            </View>
                            <View style={{ backgroundColor: statusMeta.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
                              <Text style={{ color: statusMeta.text, fontSize: 11, fontWeight: '800' }}>{statusMeta.label}</Text>
                            </View>
                          </View>
                          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '900' }} numberOfLines={2}>{getPropertyTitle(contract)}</Text>
                          <Text style={{ color: '#DBEAFE', fontSize: 12, marginTop: 4 }} numberOfLines={2}>{getPropertyAddress(contract)}</Text>
                        </View>
                      </View>

                      <View style={{ padding: 16, gap: 12 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 18, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Calendar size={15} color={colors.primary} />
                              <Text style={{ color: current.textInactive, fontSize: 11 }}>Thời hạn</Text>
                            </View>
                            <Text style={{ color: current.text, fontWeight: '800', marginTop: 6 }} numberOfLines={1}>{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</Text>
                          </View>
                          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 18, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Wallet size={15} color={colors.primary} />
                              <Text style={{ color: current.textInactive, fontSize: 11 }}>Tiền thuê</Text>
                            </View>
                            <Text style={{ color: current.text, fontWeight: '800', marginTop: 6 }}>{formatMoney(contract.monthlyRent)} đ</Text>
                          </View>
                          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 18, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Home size={15} color={colors.primary} />
                              <Text style={{ color: current.textInactive, fontSize: 11 }}>Tiền cọc</Text>
                            </View>
                            <Text style={{ color: current.text, fontWeight: '800', marginTop: 6 }}>{formatMoney(contract.depositAmount)} đ</Text>
                          </View>
                          <View style={{ flexGrow: 1, minWidth: '45%', backgroundColor: '#F8FAFC', borderRadius: 18, padding: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Handshake size={15} color={colors.primary} />
                              <Text style={{ color: current.textInactive, fontSize: 11 }}>Loại</Text>
                            </View>
                            <Text style={{ color: current.text, fontWeight: '800', marginTop: 6 }} numberOfLines={1}>{contract.template?.templateName || contract.templateName || 'Mẫu chuẩn'}</Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => router.push({ pathname: '/(rental)/contract-detail', params: { contractId: contract.rentalId } })}
                            style={{ flex: 1, backgroundColor: '#EEF2FF', borderRadius: 18, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' }}
                          >
                            <Text style={{ color: '#4338CA', fontWeight: '800' }}>Xem chi tiết</Text>
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <PrimaryButton onPress={() => handleQuickAction(contract)} disabled={actionId === contract.rentalId}>
                              {actionId === contract.rentalId ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>{quickLabel}</Text>}
                            </PrimaryButton>
                          </View>
                        </View>
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default ContractsScreen

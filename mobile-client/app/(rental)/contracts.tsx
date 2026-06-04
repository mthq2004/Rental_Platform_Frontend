import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getMyContracts } from '@/store/slices/contract.slice'
import contractService from '@/services/contract.service'
import AuthGuard from '@/components/AuthGuard'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import { useThemeColors } from '@/utils/colors'
import { FileText } from 'lucide-react-native'
import ScreenHeader from '@/components/common/ScreenHeader'
import ContractListCard from '@/components/contracts/ContractListCard'
import { openContractEditorRoute } from '@/utils/contractDisplay'

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'draft', label: 'Nháp' },
  { key: 'pending_tenant', label: 'Chờ ký' },
  { key: 'pending_landlord', label: 'Chủ nhà ký' },
  { key: 'active', label: 'Hiệu lực' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'terminated', label: 'Chấm dứt' },
] as const

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
    await dispatch(getMyContracts({ limit: 100 })).unwrap()
  }, [dispatch])

  useFocusEffect(
    useCallback(() => {
      loadContracts()
    }, [loadContracts])
  )

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
      signing: list.filter((item) =>
        ['draft', 'pending_tenant', 'pending_landlord'].includes(item.status)
      ).length,
      amendments: list.filter((item) => item.parentContractId).length,
    }
  }, [contracts])

  const handleQuickAction = async (contract: any) => {
    const status = contract?.status
    const isOwnerUser = user?.id && contract?.ownerId === user.id
    const isTenantUser = user?.id && contract?.tenantId === user.id

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

    if (
      (status === 'pending_tenant' && isTenantUser) ||
      (status === 'pending_landlord' && isOwnerUser)
    ) {
      router.push({ pathname: '/(rental)/contract-detail', params: { contractId: contract.rentalId } })
      return
    }

    router.push({ pathname: '/(rental)/contract-detail', params: { contractId: contract.rentalId } })
  }

  return (
    <AuthGuard>
      <KeyboardSafeWrapper
        scrollable={false}
        dismissKeyboardOnTap={false}
        style={{ flex: 1, backgroundColor: current.background }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
          <ScreenHeader
            title="Quản lý hợp đồng"
            subtitle="Theo dõi theo BĐS, phiên bản và trạng thái"
          />

          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 20,
                padding: 16,
                marginBottom: 14,
                overflow: 'hidden',
              }}
            >
              <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 10 }}>
                Tổng quan danh mục
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Tổng', value: summary.total, color: '#93C5FD' },
                  { label: 'Hiệu lực', value: summary.active, color: '#86EFAC' },
                  { label: 'Chờ xử lý', value: summary.signing, color: '#FDE68A' },
                  { label: 'Bản sửa', value: summary.amendments, color: '#FDBA74' },
                ].map((s) => (
                  <View
                    key={s.label}
                    style={{
                      flexGrow: 1,
                      minWidth: '42%',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <Text style={{ color: s.color, fontSize: 11, fontWeight: '600' }}>{s.label}</Text>
                    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 }}>
                      {s.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {STATUS_TABS.map((tab) => {
                const active = activeTab === tab.key
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      borderRadius: 999,
                      backgroundColor: active ? colors.primary : current.card,
                      borderWidth: 1,
                      borderColor: active ? colors.primary : current.border,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? '#fff' : current.text,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            <View style={{ paddingHorizontal: 16, gap: 14, paddingTop: 8 }}>
              {loading ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : filteredContracts.length === 0 ? (
                <View
                  style={{
                    backgroundColor: current.card,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: current.border,
                    padding: 28,
                    alignItems: 'center',
                  }}
                >
                  <FileText size={42} color={current.textInactive} />
                  <Text style={{ color: current.text, fontSize: 16, fontWeight: '800', marginTop: 14 }}>
                    Chưa có hợp đồng phù hợp
                  </Text>
                  <Text
                    style={{
                      color: current.textInactive,
                      textAlign: 'center',
                      marginTop: 8,
                      lineHeight: 20,
                      fontSize: 13,
                    }}
                  >
                    Mỗi thẻ hiển thị rõ bất động sản, mã HĐ, phiên bản (gốc / chỉnh sửa / gia hạn) và đối tác.
                  </Text>
                </View>
              ) : (
                filteredContracts.map((contract) => {
                  const isOwner = user?.id && contract?.ownerId === user.id
                  const isTenant = user?.id && contract?.tenantId === user.id
                  const canQuickSend = contract.status === 'draft' && isOwner
                  const canQuickSign =
                    (contract.status === 'pending_tenant' && isTenant) ||
                    (contract.status === 'pending_landlord' && isOwner)
                  const quickLabel = canQuickSend
                    ? 'Gửi ký'
                    : canQuickSign
                      ? 'Ký ngay'
                      : contract.status === 'active'
                        ? 'Thanh toán'
                        : 'Chi tiết'

                  const editRoute = openContractEditorRoute(contract)

                  return (
                    <ContractListCard
                      key={contract.rentalId}
                      contract={contract}
                      userId={user?.id}
                      current={current}
                      primaryColor={colors.primary}
                      actionId={actionId}
                      quickLabel={quickLabel}
                      onPressDetail={() =>
                        router.push({
                          pathname: '/(rental)/contract-detail',
                          params: { contractId: contract.rentalId },
                        })
                      }
                      onQuickAction={() => handleQuickAction(contract)}
                      onPressEdit={
                        editRoute
                          ? () => router.push(editRoute as any)
                          : undefined
                      }
                    />
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

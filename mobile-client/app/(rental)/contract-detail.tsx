import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Image } from 'react-native'
import AuthGuard from '@/components/AuthGuard'
import BackButton from '@/components/BackButton'
import KeyboardSafeWrapper from '@/components/KeyboardSafeWrapper'
import PrimaryButton from '@/components/PrimaryButton'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { getContractDetail as getContractDetailThunk } from '@/store/slices/contract.slice'
import contractService from '@/services/contract.service'
import { router, useLocalSearchParams } from 'expo-router'

type ContractStatus =
  | 'draft'
  | 'pending_tenant'
  | 'tenant_signed'
  | 'pending_landlord'
  | 'owner_signed'
  | 'fully_signed'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'renewed'
  | 'cancelled'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  pending_tenant: 'Chờ người thuê ký',
  tenant_signed: 'Người thuê đã ký',
  pending_landlord: 'Chờ chủ nhà ký',
  owner_signed: 'Chủ nhà đã ký',
  fully_signed: 'Đã ký hoàn tất',
  active: 'Đang hiệu lực',
  expired: 'Hết hạn',
  terminated: 'Đã chấm dứt',
  renewed: 'Đã gia hạn',
  cancelled: 'Đã hủy',
}

const money = (value: unknown) => {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue.toLocaleString('vi-VN') : '0'
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('vi-VN')
}

const getPropertySummary = (contract: any) => {
  const property = contract?.property || contract?.rentalRequest?.property || contract?.contractData?.property || null
  const imageUrl =
    property?.imageUrl ||
    property?.images?.[0]?.uri ||
    property?.images?.[0]?.url ||
    property?.images?.[0]?.secureUrl ||
    contract?.propertyImageUrl ||
    ''

  const title = property?.title || property?.name || contract?.propertyName || contract?.propertyId || 'Bất động sản'
  const address = property?.address || [property?.ward, property?.district, property?.city].filter(Boolean).join(', ') || contract?.propertyAddress || ''

  return { imageUrl, title, address }
}

const ContractDetail = () => {
  const { contractId, requestId } = useLocalSearchParams<{ contractId?: string; requestId?: string }>()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [contract, setContract] = useState<any | null>(null)

  const resolvedContractId = useMemo(() => String(contractId || requestId || ''), [contractId, requestId])

  const isOwnerSide = useMemo(() => contract?.ownerId && user?.id && contract.ownerId === user.id, [contract?.ownerId, user?.id])
  const isTenantSide = useMemo(() => contract?.tenantId && user?.id && contract.tenantId === user.id, [contract?.tenantId, user?.id])

  const loadDetail = useCallback(async () => {
    if (!resolvedContractId) return
    setLoading(true)
    try {
      const res = await dispatch(getContractDetailThunk(resolvedContractId)).unwrap()
      setContract(res)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải hợp đồng')
    } finally {
      setLoading(false)
    }
  }, [dispatch, resolvedContractId])

  React.useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const handleSendToTenant = async () => {
    if (!contract?.rentalId) return
    setActionLoading(true)
    try {
      await contractService.sendContractToTenant(contract.rentalId)
      Alert.alert('Thành công', 'Đã gửi hợp đồng cho khách ký')
      await loadDetail()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Gửi hợp đồng thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleTenantSign = async () => {
    if (!contract?.rentalId) return
    setActionLoading(true)
    try {
      await contractService.tenantSignContract(contract.rentalId)
      Alert.alert('Thành công', 'Đã ký hợp đồng')
      await loadDetail()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Ký hợp đồng thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOwnerSign = async () => {
    if (!contract?.rentalId) return
    setActionLoading(true)
    try {
      await contractService.ownerSignContract(contract.rentalId)
      Alert.alert('Thành công', 'Đã ký hợp đồng')
      await loadDetail()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Ký hợp đồng thất bại')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator />
          </View>
        </KeyboardSafeWrapper>
      </AuthGuard>
    )
  }

  if (!contract) {
    return (
      <AuthGuard>
        <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
          <View className="flex-1 items-center justify-center px-4 py-20">
            <Text className="text-gray-500 text-center mb-4">Không có dữ liệu hợp đồng</Text>
            <PrimaryButton title="Quay lại" onPress={() => router.back()} />
          </View>
        </KeyboardSafeWrapper>
      </AuthGuard>
    )
  }

  const property = getPropertySummary(contract)
  const status = contract.status as ContractStatus
  const canSend = isOwnerSide && status === 'draft'
  const canTenantSign = isTenantSide && status === 'pending_tenant'
  const canOwnerSign = isOwnerSide && status === 'pending_landlord'

  return (
    <AuthGuard>
      <KeyboardSafeWrapper className="bg-white dark:bg-gray-950 pt-10">
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="flex-row items-start gap-3 mb-5">
            <BackButton onPress={() => router.back()} />
            <View className="flex-1 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-5">
              <Text className="text-white text-2xl font-bold">Chi tiết hợp đồng</Text>
              <Text className="text-blue-100 text-sm mt-2 leading-5">
                Gửi hợp đồng cho khách ký, sau đó theo dõi trạng thái ký của người thuê và chủ nhà.
              </Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <View className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {property.imageUrl ? <Image source={{ uri: property.imageUrl }} className="w-full h-full" resizeMode="cover" /> : null}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={2}>{property.title}</Text>
                {!!property.address && <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1" numberOfLines={2}>{property.address}</Text>}
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">Mã hợp đồng: {contract.contractCode || contract.rentalId}</Text>
              </View>
            </View>
            <View className="mt-4 px-3 py-2 rounded-full self-start bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
              <Text className="text-blue-600 dark:text-blue-300 font-semibold">{STATUS_LABEL[status] || status || '—'}</Text>
            </View>
          </View>

          <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">Thông tin chính</Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">Khách thuê: <Text className="font-semibold">{contract.tenant?.name || contract.tenant?.fullName || contract.tenantId || '—'}</Text></Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 mt-2">Chủ nhà: <Text className="font-semibold">{contract.owner?.name || contract.owner?.fullName || contract.ownerId || '—'}</Text></Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 mt-2">Thời hạn: <Text className="font-semibold">{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</Text></Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300 mt-2">Tiền thuê / cọc: <Text className="font-semibold">{money(contract.monthlyRent)} / {money(contract.depositAmount)}</Text></Text>
            {!!contract.signedDate && <Text className="text-sm text-gray-600 dark:text-gray-300 mt-2">Ngày ký: <Text className="font-semibold">{formatDate(contract.signedDate)}</Text></Text>}
          </View>

          {contract.contractHtml ? (
            <View className="bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
              <Text className="text-base font-semibold text-gray-900 dark:text-white mb-2">Nội dung hợp đồng</Text>
              <Text className="text-sm text-gray-600 dark:text-gray-300 leading-6">{String(contract.contractHtml).slice(0, 1200)}</Text>
            </View>
          ) : null}

          <View className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">Hành động</Text>

            {canSend ? (
              <PrimaryButton title={actionLoading ? 'Đang gửi...' : 'Gửi cho khách ký'} onPress={handleSendToTenant} disabled={actionLoading} />
            ) : null}

            {canTenantSign ? (
              <PrimaryButton title={actionLoading ? 'Đang ký...' : 'Ký hợp đồng'} onPress={handleTenantSign} disabled={actionLoading} />
            ) : null}

            {canOwnerSign ? (
              <PrimaryButton title={actionLoading ? 'Đang ký...' : 'Ký hợp đồng'} onPress={handleOwnerSign} disabled={actionLoading} />
            ) : null}

            {!canSend && !canTenantSign && !canOwnerSign ? (
              <Text className="text-sm text-gray-500 dark:text-gray-400">Không có thao tác nào cần thực hiện ở trạng thái hiện tại.</Text>
            ) : null}
          </View>

          <TouchableOpacity onPress={() => router.replace('/(rental)/requests')} className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 py-3">
            <Text className="text-center font-semibold text-blue-600 dark:text-blue-300">Quay về quản lý yêu cầu thuê</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardSafeWrapper>
    </AuthGuard>
  )
}

export default ContractDetail

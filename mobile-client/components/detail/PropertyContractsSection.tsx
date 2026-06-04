import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAppDispatch } from '@/store/hook'
import { getMyContracts } from '@/store/slices/contract.slice'
import ContractIdentityBadges from '@/components/contracts/ContractIdentityBadges'
import ContractFinancialGrid from '@/components/contracts/ContractFinancialGrid'
import {
  CONTRACT_STATUS_META,
  formatContractMoney,
  getContractPeriodLabel,
} from '@/utils/contractDisplay'

type Props = {
  propertyId: string
  isOwner: boolean
  /** Giá thuê niêm yết trên tin đăng — để so sánh với HĐ */
  listingRent?: number
  listingDeposit?: number
}

export default function PropertyContractsSection({
  propertyId,
  isOwner,
  listingRent,
  listingDeposit,
}: Props) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await dispatch(getMyContracts({ limit: 100 })).unwrap()
      const list = Array.isArray(res) ? res : res?.items || res?.data || []
      setContracts(
        (Array.isArray(list) ? list : []).filter((c: any) => c.propertyId === propertyId)
      )
    } catch {
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [dispatch, propertyId])

  useEffect(() => {
    load()
  }, [load])

  const activeContract = useMemo(
    () => contracts.find((c) => c.status === 'active'),
    [contracts]
  )
  const pendingContracts = useMemo(
    () =>
      contracts.filter((c) =>
        ['draft', 'pending_tenant', 'pending_landlord', 'tenant_signed', 'owner_signed'].includes(c.status)
      ),
    [contracts]
  )

  if (!isOwner && contracts.length === 0 && !loading) {
    return null
  }

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Hợp đồng thuê</Text>
        </View>
        <TouchableOpacity onPress={load} hitSlop={8}>
          <Ionicons name="refresh-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16 }}>
          <ActivityIndicator color="#4F46E5" />
        </View>
      ) : contracts.length === 0 ? (
        <View
          style={{
            padding: 20,
            backgroundColor: '#F8FAFC',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderStyle: 'dashed',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>Chưa có hợp đồng</Text>
          <Text style={{ fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 20 }}>
            Hợp đồng sẽ xuất hiện sau khi hoàn tất yêu cầu thuê và tạo hợp đồng từ mẫu.
          </Text>
          {listingRent != null && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 12, color: '#64748B' }}>Giá niêm yết</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#4F46E5', marginTop: 4 }}>
                {formatContractMoney(listingRent)} đ/tháng
              </Text>
              {listingDeposit != null && listingDeposit > 0 && (
                <Text style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                  Cọc: {formatContractMoney(listingDeposit)} đ
                </Text>
              )}
            </View>
          )}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {activeContract && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/(rental)/contract-detail',
                  params: { contractId: activeContract.rentalId },
                })
              }
              style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#86EFAC',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' }} />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>HỢP ĐỒNG ĐANG HIỆU LỰC</Text>
              </View>
              <ContractIdentityBadges contract={activeContract} showTemplate={false} compact />
              <View style={{ marginTop: 12 }}>
                <ContractFinancialGrid contract={activeContract} cardBg="#FFF" />
              </View>
              <Text style={{ fontSize: 12, color: '#15803D', fontWeight: '600', marginTop: 12 }}>
                Nhấn để xem chi tiết →
              </Text>
            </TouchableOpacity>
          )}

          {pendingContracts.length > 0 && (
            <View
              style={{
                backgroundColor: '#FFF',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 10 }}>
                Đang xử lý ({pendingContracts.length})
              </Text>
              {pendingContracts.slice(0, 3).map((c) => {
                const st = CONTRACT_STATUS_META[c.status]
                return (
                  <TouchableOpacity
                    key={c.rentalId}
                    onPress={() =>
                      router.push({
                        pathname: '/(rental)/contract-detail',
                        params: { contractId: c.rentalId },
                      })
                    }
                    style={{
                      paddingVertical: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#F1F5F9',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                        {c.contractCode}
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: st?.bg || '#F3F4F6' }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: st?.text || '#374151' }}>{st?.label || c.status}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      {getContractPeriodLabel(c)} · {formatContractMoney(c.monthlyRent)} đ/tháng
                    </Text>
                  </TouchableOpacity>
                )
              })}
              {pendingContracts.length > 3 && (
                <TouchableOpacity
                  onPress={() => router.push('/(rental)/contracts')}
                  style={{ marginTop: 8, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#4F46E5' }}>
                    Xem tất cả {contracts.length} hợp đồng
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/(rental)/contracts')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#4F46E5' }}>Quản lý hợp đồng</Text>
            <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

import React from 'react'
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MapPin, User } from 'lucide-react-native'
import ContractIdentityBadges from './ContractIdentityBadges'
import ContractFinancialGrid from './ContractFinancialGrid'
import PrimaryButton from '@/components/PrimaryButton'
import {
  getPropertyDisplay,
  getTenantDisplay,
  getOwnerDisplay,
  getUserRoleOnContract,
} from '@/utils/contractDisplay'

type Props = {
  contract: any
  userId?: string | null
  current: { card: string; text: string; textInactive: string; border: string }
  primaryColor: string
  actionId?: string | null
  onPressDetail: () => void
  onQuickAction: () => void
  onPressEdit?: () => void
  quickLabel: string
}

export default function ContractListCard({
  contract,
  userId,
  current,
  primaryColor,
  actionId,
  onPressDetail,
  onQuickAction,
  onPressEdit,
  quickLabel,
}: Props) {
  const property = getPropertyDisplay(contract)
  const role = getUserRoleOnContract(contract, userId)
  const counterparty =
    role === 'owner'
      ? { label: 'Người thuê', name: getTenantDisplay(contract) }
      : role === 'tenant'
        ? { label: 'Chủ nhà', name: getOwnerDisplay(contract) }
        : null

  const isOwner = role === 'owner'
  const canEditDraft = contract.status === 'draft' && isOwner && contract.templateId
  const canEditActive = contract.status === 'active' && isOwner

  return (
    <View
      style={{
        backgroundColor: current.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: current.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Property context */}
      <View style={{ flexDirection: 'row', padding: 14, gap: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <View style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', backgroundColor: '#E2E8F0' }}>
          {property.imageUrl ? (
            <Image source={{ uri: property.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="business-outline" size={28} color="#94A3B8" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 }}>BẤT ĐỘNG SẢN</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: current.text, marginTop: 4 }} numberOfLines={2}>
            {property.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 6 }}>
            <MapPin size={12} color="#64748B" style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 12, color: '#64748B', flex: 1 }} numberOfLines={2}>
              {property.address}
            </Text>
          </View>
          {property.type ? (
            <Text style={{ fontSize: 11, color: primaryColor, fontWeight: '600', marginTop: 4 }}>{property.type}</Text>
          ) : null}
        </View>
      </View>

      <View style={{ padding: 14, gap: 12 }}>
        <ContractIdentityBadges contract={contract} userId={userId} compact />

        {counterparty && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              padding: 10,
              backgroundColor: '#FFF',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#4338CA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>{counterparty.label.toUpperCase()}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: current.text }} numberOfLines={1}>
                {counterparty.name}
              </Text>
            </View>
          </View>
        )}

        <ContractFinancialGrid contract={contract} textColor={current.text} />

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={onPressDetail}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: 'center',
                backgroundColor: '#EEF2FF',
                borderWidth: 1,
                borderColor: '#C7D2FE',
              }}
            >
              <Text style={{ color: '#4338CA', fontWeight: '800', fontSize: 14 }}>Chi tiết</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <PrimaryButton onPress={onQuickAction} disabled={actionId === contract.rentalId}>
                {actionId === contract.rentalId ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '800' }}>{quickLabel}</Text>
                )}
              </PrimaryButton>
            </View>
          </View>

          {canEditDraft && onPressEdit && (
            <TouchableOpacity
              onPress={onPressEdit}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: '#FFF7ED',
                borderWidth: 1,
                borderColor: '#FED7AA',
              }}
            >
              <Ionicons name="create-outline" size={18} color="#C2410C" />
              <Text style={{ color: '#C2410C', fontWeight: '800' }}>
                {contract.parentContractId ? 'Tiếp tục chỉnh sửa' : 'Chỉnh sửa nháp'}
              </Text>
            </TouchableOpacity>
          )}

          {canEditActive && (
            <TouchableOpacity
              onPress={onPressDetail}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 14,
                backgroundColor: '#F0FDFA',
                borderWidth: 1,
                borderColor: '#99F6E4',
              }}
            >
              <Ionicons name="document-text-outline" size={18} color="#0F766E" />
              <Text style={{ color: '#0F766E', fontWeight: '800' }}>Chỉnh sửa hợp đồng</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

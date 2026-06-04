import React from 'react'
import { View, Text } from 'react-native'
import {
  CONTRACT_STATUS_META,
  getContractSource,
  getRoleBadge,
  getTemplateDisplay,
} from '@/utils/contractDisplay'

type Props = {
  contract: any
  userId?: string | null
  showTemplate?: boolean
  compact?: boolean
}

export default function ContractIdentityBadges({
  contract,
  userId,
  showTemplate = true,
  compact = false,
}: Props) {
  const statusMeta = CONTRACT_STATUS_META[contract?.status] || {
    label: contract?.status || 'Không rõ',
    bg: '#F3F4F6',
    text: '#374151',
  }
  const source = getContractSource(contract)
  const role = getRoleBadge(contract, userId)

  const badgePad = compact ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 10, paddingVertical: 5 }
  const fontSize = compact ? 10 : 11

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <View
          style={{
            ...badgePad,
            borderRadius: 999,
            backgroundColor: '#F1F5F9',
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <Text
            style={{
              fontSize,
              fontWeight: '700',
              color: '#0F172A',
              fontFamily: 'monospace',
              letterSpacing: 0.3,
            }}
          >
            {contract?.contractCode || '—'}
          </Text>
        </View>

        <View style={{ ...badgePad, borderRadius: 999, backgroundColor: statusMeta.bg }}>
          <Text style={{ fontSize, fontWeight: '800', color: statusMeta.text }}>{statusMeta.label}</Text>
        </View>

        <View
          style={{
            ...badgePad,
            borderRadius: 999,
            backgroundColor: source.bg,
            borderWidth: 1,
            borderColor: source.border,
          }}
        >
          <Text style={{ fontSize, fontWeight: '700', color: source.text }}>{source.label}</Text>
        </View>

        {role && (
          <View style={{ ...badgePad, borderRadius: 999, backgroundColor: role.bg }}>
            <Text style={{ fontSize, fontWeight: '700', color: role.text }}>{role.label}</Text>
          </View>
        )}
      </View>

      <Text style={{ fontSize: compact ? 11 : 12, color: '#64748B', lineHeight: 18 }} numberOfLines={2}>
        {source.hint}
        {showTemplate ? ` · ${getTemplateDisplay(contract)}` : ''}
      </Text>
    </View>
  )
}

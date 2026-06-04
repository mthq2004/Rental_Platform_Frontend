import React from 'react'
import { View, Text } from 'react-native'
import { Calendar, Home, Wallet, Zap, Droplets } from 'lucide-react-native'
import { formatContractMoney, formatContractDate, getContractPeriodLabel } from '@/utils/contractDisplay'

type Props = {
  contract: any
  textColor?: string
  mutedColor?: string
  cardBg?: string
}

export default function ContractFinancialGrid({
  contract,
  textColor = '#0F172A',
  mutedColor = '#64748B',
  cardBg = '#F8FAFC',
}: Props) {
  const items = [
    {
      icon: <Wallet size={14} color="#4F46E5" />,
      label: 'Tiền thuê/tháng',
      value: `${formatContractMoney(contract?.monthlyRent)} đ`,
    },
    {
      icon: <Home size={14} color="#0D9488" />,
      label: 'Tiền cọc',
      value: `${formatContractMoney(contract?.depositAmount)} đ`,
    },
    {
      icon: <Calendar size={14} color="#2563EB" />,
      label: 'Thời hạn',
      value: getContractPeriodLabel(contract),
    },
    {
      icon: <Zap size={14} color="#D97706" />,
      label: 'Điện',
      value: contract?.electricityCostPerKwh != null
        ? `${formatContractMoney(contract.electricityCostPerKwh)} đ/kWh`
        : '—',
    },
    {
      icon: <Droplets size={14} color="#0284C7" />,
      label: 'Nước',
      value: contract?.waterCostPerM3 != null
        ? `${formatContractMoney(contract.waterCostPerM3)} đ/m³`
        : '—',
    },
    {
      icon: <Calendar size={14} color="#64748B" />,
      label: 'Ngày tạo',
      value: formatContractDate(contract?.createdAt),
    },
  ]

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            flexGrow: 1,
            minWidth: '46%',
            backgroundColor: cardBg,
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {item.icon}
            <Text style={{ fontSize: 10, fontWeight: '600', color: mutedColor, textTransform: 'uppercase' }}>
              {item.label}
            </Text>
          </View>
          <Text
            style={{ fontSize: 13, fontWeight: '800', color: textColor, marginTop: 6 }}
            numberOfLines={2}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

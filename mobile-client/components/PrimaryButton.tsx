import React from 'react'
import { Text, TouchableOpacity, ViewStyle, View } from 'react-native'
import { useThemeColors } from '@/utils/colors'

interface PrimaryButtonProps {
  title?: string
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  children?: React.ReactNode
  icon?: React.ReactNode
}

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  children,
  icon,
}: PrimaryButtonProps) => {
  const { current } = useThemeColors()

  const bg = disabled || loading ? current.border : current.icon
  const textColor = disabled || loading ? current.textInactive : current.card === '#F9FAFB' ? '#FFFFFF' : '#FFFFFF'

  return (
    <TouchableOpacity
      className={`py-4 rounded-xl items-center justify-center active:opacity-90`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={{
        backgroundColor: bg,
        shadowColor: disabled || loading ? 'transparent' : current.icon,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
        elevation: 5,
        ...(style || {}),
      }}
    >
      {loading ? (
        <Text className="text-white text-base font-semibold">Đang xử lý...</Text>
      ) : (
        children ? (
          children
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
            <Text style={{ color: textColor }} className="text-base font-semibold">{title}</Text>
          </View>
        )
      )}
    </TouchableOpacity>
  )
}

export default PrimaryButton
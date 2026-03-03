import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

export type TabKey = 'info' | 'schedule' | 'media'

type Tab = {
  key: TabKey
  label: string
}

type TabBarProps = {
  tabs: Tab[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View className="flex-row border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {tabs.map((tab) => (
        <TabButton
          key={tab.key}
          label={tab.label}
          active={activeTab === tab.key}
          onPress={() => onTabChange(tab.key)}
        />
      ))}
    </View>
  )
}

type TabButtonProps = {
  label: string
  active: boolean
  onPress: () => void
}

const TabButton: React.FC<TabButtonProps> = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-1 py-4 items-center border-b-2 ${
        active ? 'border-blue-600' : 'border-transparent'
      }`}
    >
      <Text
        className={`font-semibold ${
          active ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  )
}
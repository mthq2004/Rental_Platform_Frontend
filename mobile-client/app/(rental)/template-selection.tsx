import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store'
import { getTemplates } from '@/store/slices/contract.slice'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '@/components/BackButton'
import { useThemeColors } from '@/utils/colors'
import { Ionicons } from '@expo/vector-icons'

type Template = {
  templateId: string
  name: string
  description: string
  propertyType: string
  type: 'standard' | 'government' | 'custom'
}

const TemplateSelectionScreen = () => {
  const { requestId, propertyType } = useLocalSearchParams<{ requestId: string, propertyType: string }>()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const colors = useThemeColors()
  const current = colors.current

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'standard' | 'government' | 'custom'>('all')

  const loadTemplates = useCallback(async () => {
    if (!propertyType) {
      Alert.alert('Lỗi', 'Không xác định được loại bất động sản.', [{ text: 'OK', onPress: () => router.back() }])
      return
    }
    setLoading(true)
    try {
      const result = await dispatch(getTemplates(propertyType)).unwrap()
      setTemplates(result)
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải danh sách mẫu hợp đồng.')
    } finally {
      setLoading(false)
    }
  }, [dispatch, propertyType, router])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const filteredTemplates = useMemo(() => {
    if (filter === 'all') return templates
    return templates.filter((t) => t.type === filter)
  }, [templates, filter])

  const renderTemplateItem = ({ item }: { item: Template }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(rental)/contract-builder' as any, params: { templateId: item.templateId, requestId } })}
      style={{
        backgroundColor: current.card,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: current.border,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="document-text-outline" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: current.text }}>{item.name}</Text>
          <Text style={{ fontSize: 13, color: current.textInactive, marginTop: 4 }} numberOfLines={2}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={current.textInactive} />
      </View>
    </TouchableOpacity>
  )

  const FilterButton = ({ value, label }: { value: typeof filter, label: string }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 99,
        backgroundColor: filter === value ? colors.primary : current.card,
        borderWidth: 1,
        borderColor: filter === value ? colors.primary : current.border,
      }}
    >
      <Text style={{ color: filter === value ? '#fff' : colors.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: current.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: current.text }}>Chọn mẫu hợp đồng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <FilterButton value="all" label="Tất cả" />
          <FilterButton value="standard" label="Tiêu chuẩn" />
          <FilterButton value="government" label="Nhà nước" />
          <FilterButton value="custom" label="Tùy chỉnh" />
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.templateId}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Text style={{ fontSize: 60 }}>📄</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: current.textInactive, marginTop: 20 }}>Không tìm thấy mẫu hợp đồng phù hợp.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

export default TemplateSelectionScreen

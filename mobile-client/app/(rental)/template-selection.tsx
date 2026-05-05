import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '@/store'
import { getTemplates } from '@/store/slices/contract.slice'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from '@/components/BackButton'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

type Template = {
  templateId: string
  name: string
  description: string
  propertyType: string
  type: 'standard' | 'government' | 'custom'
}

type RawTemplate = {
  templateId?: string
  templateName?: string
  templateType?: string
  name?: string
  type?: string
  description?: string
  propertyType?: string
}

const TemplateSelectionScreen = () => {
  const { requestId, propertyType } = useLocalSearchParams<{ requestId: string, propertyType: string }>()
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'standard' | 'government' | 'custom'>('all')
  const fadeAnim = useRef(new Animated.Value(0)).current

  const normalizeTemplate = useCallback((item: RawTemplate): Template => {
    const rawType = String(item?.type || item?.templateType || '').toLowerCase()
    const normalizedType: Template['type'] = rawType === 'standard' || rawType === 'government' ? rawType : 'custom'

    return {
      templateId: String(item?.templateId || ''),
      name: item?.name || item?.templateName || 'Mẫu hợp đồng',
      description: item?.description || 'Mẫu hợp đồng cơ bản, phù hợp với hầu hết các giao dịch thuê nhà thông thường.',
      propertyType: String(item?.propertyType || ''),
      type: normalizedType,
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    if (!propertyType) {
      Alert.alert('Lỗi', 'Không xác định được loại bất động sản.', [{ text: 'OK', onPress: () => router.back() }])
      return
    }
    setLoading(true)
    try {
      const result = await dispatch(getTemplates(propertyType)).unwrap()
      const payload = Array.isArray(result)
        ? result
        : Array.isArray((result as any)?.data)
          ? (result as any).data
          : Array.isArray((result as any)?.items)
            ? (result as any).items
            : []

      setTemplates(payload.map(normalizeTemplate))
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message || 'Không thể tải danh sách mẫu hợp đồng.')
    } finally {
      setLoading(false)
    }
  }, [dispatch, normalizeTemplate, propertyType, router, fadeAnim])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const filteredTemplates = useMemo(() => {
    if (filter === 'all') return templates
    return templates.filter((t) => t.type === filter)
  }, [templates, filter])

  const getLabelForType = (type: string) => {
    if (type === 'standard') return 'Tiêu chuẩn'
    if (type === 'government') return 'Theo pháp luật'
    return 'Tùy chỉnh'
  }

  const renderTemplateItem = ({ item, index }: { item: Template, index: number }) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/(rental)/contract-builder' as any, params: { templateId: item.templateId, requestId } })}
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="document-text" size={28} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 }}>{item.name}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 20 }} numberOfLines={3}>{item.description}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#4B5563', textTransform: 'uppercase' }}>
                  {getLabelForType(item.type)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#4F46E5', marginRight: 4 }}>Dùng mẫu này</Text>
                <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )

  const FilterButton = ({ value, label }: { value: typeof filter, label: string }) => {
    const isSelected = filter === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setFilter(value)}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 99,
          backgroundColor: isSelected ? '#4F46E5' : '#FFF',
          borderWidth: 1,
          borderColor: isSelected ? '#4F46E5' : '#E5E7EB',
          shadowColor: isSelected ? '#4F46E5' : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: isSelected ? 4 : 0,
        }}
      >
        <Text style={{ color: isSelected ? '#FFF' : '#4B5563', fontWeight: '600', fontSize: 14 }}>{label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <BackButton onPress={() => router.back()} />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#111827' }}>Chọn mẫu hợp đồng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 20, paddingBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 }}>Mẫu hợp đồng thuê nhà</Text>
        <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 22 }}>
          Vui lòng chọn một mẫu hợp đồng phù hợp với nhu cầu của bạn để tiếp tục. Các mẫu đã được soạn sẵn điều khoản chuẩn xác.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}>
          <FilterButton value="all" label="Tất cả" />
          <FilterButton value="standard" label="Tiêu chuẩn" />
          <FilterButton value="government" label="Pháp lý" />
          <FilterButton value="custom" label="Tùy chỉnh" />
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: '#6B7280' }}>Đang tải danh sách mẫu...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          renderItem={renderTemplateItem}
          keyExtractor={(item, index) => item.templateId || `${item.name}-${index}`}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', marginTop: 60, padding: 20, backgroundColor: '#FFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="document-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Không có mẫu hợp đồng</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>Không tìm thấy mẫu hợp đồng phù hợp với bộ lọc hiện tại.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

export default TemplateSelectionScreen

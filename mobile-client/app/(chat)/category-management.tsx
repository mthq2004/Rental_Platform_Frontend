import CategoryCard from '@/components/chat/CategoryCard'
import { useAppDispatch, useAppSelector } from '@/store/hook'
import { createCustomerCategory, getAllCustomerCategories } from '@/store/slices/customer-category.slice'
import { CustomerCategory } from '@/types/customer-category.type'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { LoadedMiddleware } from 'expo-router/build/Route'
import React, { useState, useRef, useEffect } from 'react'
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Animated,
    Pressable,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
} from 'react-native'
import Toast from 'react-native-toast-message'

interface Props {
    navigation?: { goBack: () => void }
}

const COLOR_PALETTE = [
    '#F97316', '#06B6D4', '#8B5CF6', '#10B981',
    '#F43F5E', '#3B82F6', '#EAB308', '#EC4899',
    '#14B8A6', '#6366F1',
]

const INITIAL_CATEGORIES: CustomerCategory[] = [
    { id: '1', name: 'Khách hàng thân thiết', color: '#F97316', description: 'Khách hàng gắn bó lâu dài và có tần suất mua hàng cao.', conversationCount: 24 },
    { id: '2', name: 'Khách hàng mới', color: '#06B6D4', description: 'Khách hàng mới đăng ký trong vòng 30 ngày gần đây.', conversationCount: 8 },
    { id: '3', name: 'Khách hàng VIP', color: '#8B5CF6', description: 'Khách hàng có giá trị đơn hàng lớn và uy tín cao.', conversationCount: 15 },
    { id: '4', name: 'Tiềm năng', color: '#10B981', description: 'Khách hàng quan tâm nhưng chưa thực hiện giao dịch.', conversationCount: 37 },
]

function StatsBar({ categories }: { categories: CustomerCategory[] }) {
    const total = categories.reduce((s, c) => s + c.conversationCount, 0)
    return (
        <View className="flex-row mb-5" style={{ gap: 10 }}>
            {[{ label: 'Phân loại', value: categories.length }, { label: 'Hội thoại', value: total }].map(stat => (
                <View key={stat.label} className="flex-1 bg-white dark:bg-secondary-dark rounded-2xl p-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 }}>
                    <Text className="text-2xl font-black text-gray-900 dark:text-foreground-dark">{stat.value}</Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{stat.label}</Text>
                </View>
            ))}
        </View>
    )
}

function CreateCategoryModal({ visible, onClose, onCreate, loading }: {
    visible: boolean
    onClose: () => void
    onCreate: (data: Omit<CustomerCategory, 'id' | 'conversationCount'>) => void
    loading: boolean
}) {
    const sheetY = useRef(new Animated.Value(700)).current
    const backdropOpacity = useRef(new Animated.Value(0)).current
    const nameRef = useRef<TextInput>(null)

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0])

    useEffect(() => {
        if (visible) {
            setName('')
            setDescription('')
            setSelectedColor(COLOR_PALETTE[0])
            Animated.parallel([
                Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
                Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
            ]).start(() => setTimeout(() => nameRef.current?.focus(), 80))
        } else {
            Keyboard.dismiss()
            Animated.parallel([
                Animated.timing(sheetY, { toValue: 700, duration: 240, useNativeDriver: true }),
                Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start()
        }
    }, [visible])

    const handleCreate = () => {
        if (!name.trim()) return
        onCreate({ name: name.trim(), description: description.trim(), color: selectedColor })
    }

    const isValid = name.trim().length > 0

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
            <View style={{ flex: 1 }}>
                <Animated.View
                    style={{
                        opacity: backdropOpacity,
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                    }}
                >
                    <TouchableWithoutFeedback onPress={onClose}>
                        <View style={{ flex: 1 }} />
                    </TouchableWithoutFeedback>
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <View className="flex-1 justify-end">
                        <Animated.View
                            style={{
                                transform: [{ translateY: sheetY }],
                                maxHeight: '90%',
                                marginTop: 40,
                            }}
                            className="bg-white dark:bg-secondary-dark rounded-t-3xl overflow-hidden"
                        >
                            <View className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full self-center mt-3 mb-1" />

                            <View className="px-5 pt-3 pb-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-700">
                                <View>
                                    <Text className="text-base font-bold text-gray-900 dark:text-foreground-dark">Tạo phân loại mới</Text>
                                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Điền thông tin bên dưới</Text>
                                </View>
                                <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center">
                                    <Ionicons name="close" size={17} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                className="px-5 pt-5"
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 30 }}
                            >
                                <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Tên phân loại *</Text>
                                <View
                                    className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 mb-5"
                                    style={{ borderWidth: 1.5, borderColor: name.length > 0 ? selectedColor : '#E5E7EB' }}
                                >
                                    <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: selectedColor }} />
                                    <TextInput
                                        ref={nameRef}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Ví dụ: Khách hàng VIP..."
                                        placeholderTextColor="#9CA3AF"
                                        className="flex-1 py-3.5 text-sm text-gray-900 dark:text-gray-100"
                                        returnKeyType="next"
                                        maxLength={50}
                                    />
                                    {name.length > 0 && <Text className="text-xs text-gray-300">{name.length}/50</Text>}
                                </View>

                                <Text className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Mô tả</Text>
                                <View
                                    className="bg-gray-50 dark:bg-gray-700 rounded-2xl px-4 pt-3 mb-5"
                                    style={{ borderWidth: 1.5, borderColor: description.length > 0 ? selectedColor : '#E5E7EB' }}
                                >
                                    <TextInput
                                        value={description}
                                        onChangeText={setDescription}
                                        placeholder="Mô tả ngắn về phân loại này..."
                                        placeholderTextColor="#9CA3AF"
                                        className="text-sm text-gray-900 dark:text-gray-100 leading-5"
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        maxLength={120}
                                    />
                                    <Text className="text-xs text-gray-300 text-right pb-2 mt-1">{description.length}/120</Text>
                                </View>

                                <Text className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-widest">Chọn màu</Text>
                                <View className="flex-row flex-wrap mb-5" style={{ gap: 10 }}>
                                    {COLOR_PALETTE.map(color => (
                                        <Pressable
                                            key={color}
                                            onPress={() => setSelectedColor(color)}
                                            style={{
                                                width: 40, height: 40, borderRadius: 12,
                                                backgroundColor: color,
                                                alignItems: 'center', justifyContent: 'center',
                                                borderWidth: selectedColor === color ? 2.5 : 0,
                                                borderColor: '#fff',
                                                shadowColor: color,
                                                shadowOffset: { width: 0, height: 3 },
                                                shadowOpacity: selectedColor === color ? 0.5 : 0.15,
                                                shadowRadius: 6,
                                                elevation: selectedColor === color ? 6 : 2,
                                            }}
                                        >
                                            {selectedColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                                        </Pressable>
                                    ))}
                                </View>

                                <View style={{ height: 12 }} />
                            </ScrollView>

                            <View className="px-5 pb-10 pt-3">
                                <TouchableOpacity
                                    onPress={handleCreate}
                                    disabled={!isValid}
                                    activeOpacity={0.85}
                                    className="py-4 rounded-2xl flex-row justify-center items-center"
                                    style={{
                                        backgroundColor: isValid ? '#111827' : '#E5E7EB',
                                        shadowColor: isValid ? '#111827' : 'transparent',
                                        shadowOffset: { width: 0, height: 6 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 12,
                                        elevation: isValid ? 8 : 0,
                                    }}
                                >
                                    <View
                                        className="w-6 h-6 rounded-full items-center justify-center mr-2.5"
                                        style={{ backgroundColor: isValid ? 'rgba(255,255,255,0.15)' : '#D1D5DB' }}
                                    >
                                        <Ionicons name="add" size={16} color={isValid ? '#fff' : '#9CA3AF'} />
                                    </View>
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text className="text-sm font-bold tracking-wide" style={{ color: isValid ? '#fff' : '#9CA3AF' }}>
                                            Tạo phân loại
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

export default function CategoryManagement({ navigation }: Props) {
    const dispatch = useAppDispatch()
    const { customerCategories: categories, error, loading, customerCategory } = useAppSelector(state => state.customerCategory)
    // const [categories, setCategories] = useState<CustomerCategory[]>(INITIAL_CATEGORIES)
    const [modalVisible, setModalVisible] = useState(false)

    const handleEdit = (id: string) => console.log('Edit:', id)
    // const handleDelete = (id: string) => setCategories(prev => prev.filter(c => c.id !== id))
    // const handleCreate = (data: Omit<CustomerCategory, 'id' | 'conversationCount'>) => {
    //     setCategories(prev => [{ id: Date.now().toString(), conversationCount: 0, ...data }, ...prev])
    // }
    const handleDelete = () => {

    }

    const handleCreate = async (data: Omit<CustomerCategory, 'id' | 'conversationCount'>) => {
        try {
            await dispatch(createCustomerCategory(data)).unwrap()
            setModalVisible(false)
            dispatch(getAllCustomerCategories())

            Toast.show({
                type: 'success',
                text1: 'Thành công',
                text2: 'Tạo phân loại thành công',
                position: 'top',
                visibilityTime: 3000,
            })
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Có lỗi xảy ra',
                position: 'top',
                visibilityTime: 3000,
            })
        }
    }

    useEffect(() => {
        dispatch(getAllCustomerCategories())
    }, [])

    return (
        <View className="flex-1 bg-gray-50 dark:bg-background-dark">
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            <View className="bg-white dark:bg-secondary-dark px-5 pb-4 pt-16 flex-row items-center justify-between" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 }}>
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center">
                    <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-base font-bold text-gray-900 dark:text-foreground-dark">Quản lý phân loại</Text>
                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{categories.length} danh mục</Text>
                </View>
                <TouchableOpacity className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 items-center justify-center">
                    <Ionicons name="search-outline" size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                    <CategoryCard item={item} index={index} onEdit={handleEdit} onDelete={handleDelete} />
                )}
                ListHeaderComponent={() => <StatsBar categories={categories} />}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            />

            <View className="absolute bottom-6 left-5 right-5">
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.85}
                    className="bg-gray-900 py-4 rounded-2xl flex-row justify-center items-center"
                    style={{ shadowColor: '#111827', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }}
                >
                    <View className="w-6 h-6 rounded-full bg-white dark:bg-gray-200 items-center justify-center mr-2.5">
                        <Ionicons name="add" size={16} color="#111827" />
                    </View>
                    <Text className="text-white text-sm font-bold tracking-wide">Tạo phân loại mới</Text>
                </TouchableOpacity>
            </View>

            <CreateCategoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={handleCreate}
                loading={loading}
            />
            <Toast />
        </View>
    )
}
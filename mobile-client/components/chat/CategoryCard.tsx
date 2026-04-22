import { CustomerCategory } from "@/types/customer-category.type"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useRef } from "react"
import { Animated, Pressable, Text, TouchableOpacity, View } from "react-native"

function CategoryCard({
    item,
    index,
    onEdit,
    onDelete,
}: {
    item: CustomerCategory
    index: number
    onEdit: (id: string) => void
    onDelete: (id: string) => void
}) {
    const translateY = useRef(new Animated.Value(32)).current
    const opacity = useRef(new Animated.Value(0)).current
    const scale = useRef(new Animated.Value(1)).current

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 420,
                delay: index * 75,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 420,
                delay: index * 75,
                useNativeDriver: true,
            }),
        ]).start()
    }, [])

    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start()

    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start()

    return (
        <Animated.View
            style={{ opacity, transform: [{ translateY }, { scale }] }}
            className="mb-3"
        >
            <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
                <View
                    className="bg-white dark:bg-secondary-dark rounded-2xl overflow-hidden"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 4,
                    }}
                >
                    <View className="flex-row">
                        <View
                            className="w-1.5"
                            style={{ backgroundColor: item.color }}
                        />

                        <View className="flex-1 px-4 py-4">
                            <View className="flex-row items-start justify-between">
                                <View className="flex-row items-center flex-1 mr-3">
                                    <View
                                        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                                        style={{ backgroundColor: `${item.color}18` }}
                                    >
                                        <View
                                            className="w-3.5 h-3.5 rounded-full"
                                            style={{ backgroundColor: item.color }}
                                        />
                                    </View>
                                    <Text
                                        className="text-sm font-bold text-gray-900 dark:text-foreground-dark flex-1"
                                        numberOfLines={1}
                                    >
                                        {item.name}
                                    </Text>
                                </View>

                                <View className="flex-row items-center" style={{ gap: 6 }}>
                                    <TouchableOpacity
                                        onPress={() => onEdit(item.id)}
                                        className="w-8 h-8 rounded-xl items-center justify-center"
                                        style={{ backgroundColor: '#10B98114' }}
                                    >
                                        <Ionicons name="create-outline" size={16} color="#10B981" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => onDelete(item.id)}
                                        className="w-8 h-8 rounded-xl items-center justify-center"
                                        style={{ backgroundColor: '#EF444414' }}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-5 ml-12">
                                {item.description}
                            </Text>

                            <View className="flex-row items-center mt-3 ml-12">
                                <View
                                    className="flex-row items-center px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: `${item.color}12` }}
                                >
                                    <Ionicons
                                        name="chatbubble-ellipses-outline"
                                        size={11}
                                        color={item.color}
                                    />
                                    <Text
                                        className="text-xs font-semibold ml-1"
                                        style={{ color: item.color }}
                                    >
                                        {item.conversationCount} hội thoại
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    )
}

export default CategoryCard
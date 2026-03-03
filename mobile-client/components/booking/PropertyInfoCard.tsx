import { View, Text } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

const PropertyInfoCard = () => {

    const propertyInfo = {
        title: 'Phòng trọ Quận 7 – Gần Lotte',
        price: '4.500.000 đ/tháng',
        address: 'Quận 7, TP.HCM',
        owner: {
            name: 'Nguyễn Văn B',
            phone: '0901234567',
            avatar: 'https://via.placeholder.com/50'
        }
    }

    return (
        <View className="p-4 bg-blue-50 dark:bg-blue-900/20 m-4 rounded-xl">
            <Text className="font-bold text-gray-900 dark:text-white text-base" numberOfLines={2}>
                {propertyInfo.title}
            </Text>
            <View className="flex-row items-center mt-2">
                <Ionicons name="location" size={14} color="#6b7280" />
                <Text className="text-gray-600 dark:text-gray-400 ml-1 text-sm">
                    {propertyInfo.address}
                </Text>
            </View>
            <Text className="text-blue-600 font-bold mt-2 text-lg">
                {propertyInfo.price}
            </Text>
        </View>
    )
}

export default PropertyInfoCard
import { PROPERTY_META } from "@/constants/property.constant";
import { PropertyFormData, PropertyType, StepProps } from "@/types/property.type";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import SyncTextInput from "@/components/common/SyncTextInput";

const StepBasic = ({ formData, updateFormData, errors }: StepProps) => (
    <View className="p-4 space-y-4">
        <View className="bg-white dark:bg-secondary-dark rounded-2xl p-4 shadow-sm mb-2">
            <Text className="text-base font-bold text-gray-800 dark:text-foreground-dark mb-3">
                Loại bất động sản <Text className="text-red-500">*</Text>
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row -mx-1"
            >
                {Object.entries(PROPERTY_META).map(([key, meta]) => (
                    <TouchableOpacity
                        key={key}
                        onPress={() => updateFormData({ propertyType: key as PropertyType })}
                        className={`px-4 py-3 rounded-xl mr-2 ${formData.propertyType === key
                            ? 'bg-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                    >
                        <Text
                            className={`text-sm font-semibold ${formData.propertyType === key ? 'text-white' : 'text-gray-700 dark:text-gray-200'
                                }`}
                        >
                            {meta.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* <View className="bg-white rounded-2xl p-4 shadow-sm mb-2">
            <Text className="text-base font-bold text-gray-800 mb-3">
                Hình thức <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row space-x-3">
                <TouchableOpacity
                    onPress={() => updateFormData({ listingType: 'rent' })}
                    className={`flex-1 py-3 rounded-xl ${formData.listingType === 'rent' ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                >
                    <Text
                        className={`text-center font-semibold ${formData.listingType === 'rent' ? 'text-white' : 'text-gray-700'
                            }`}
                    >
                        Cho thuê
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => updateFormData({ listingType: 'sale' })}
                    className={`flex-1 py-3 rounded-xl ${formData.listingType === 'sale' ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                >
                    <Text
                        className={`text-center font-semibold ${formData.listingType === 'sale' ? 'text-white' : 'text-gray-700'
                            }`}
                    >
                        Bán
                    </Text>
                </TouchableOpacity>
            </View>
        </View> */}

        <View className="bg-white dark:bg-secondary-dark rounded-2xl p-4 shadow-sm mb-2">
            <Text className="text-base font-bold text-gray-800 dark:text-foreground-dark mb-3">
                Tiêu đề <Text className="text-red-500">*</Text>
            </Text>
            <SyncTextInput
                value={formData.title}
                onChangeText={(text) => updateFormData({ title: text })}
                placeholder="VD: Căn hộ 2PN view sông Saigon, full nội thất"
                placeholderTextColor="#9CA3AF"
                className={`px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-100 ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                multiline
            />
            {errors.title && (
                <Text className="text-red-500 text-sm mt-1">{errors.title}</Text>
            )}
        </View>

        <View className="bg-white dark:bg-secondary-dark rounded-2xl p-4 shadow-sm mb-2">
            <Text className="text-base font-bold text-gray-800 dark:text-foreground-dark mb-3">
                Mô tả chi tiết <Text className="text-red-500">*</Text>
            </Text>
            <SyncTextInput
                value={formData.description}
                onChangeText={(text) => updateFormData({ description: text })}
                placeholder="Mô tả chi tiết về bất động sản..."
                placeholderTextColor="#9CA3AF"
                className={`px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-100 min-h-[120px] ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                multiline
                textAlignVertical="top"
            />
            {errors.description && (
                <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>
            )}
        </View>

        <View className="bg-white dark:bg-secondary-dark rounded-2xl p-4 shadow-sm">
            <Text className="text-base font-bold text-gray-800 dark:text-foreground-dark mb-3">Giá bán/thuê</Text>
            <View className="flex-row space-x-3 gap-3">
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Giá ({formData.listingType === 'rent' ? 'triệu/tháng' : 'tỷ'}) <Text className="text-red-500">*</Text>
                    </Text>
                    <SyncTextInput
                        value={formData.pricePerMonth.toString()}
                        onChangeText={(text) => updateFormData({ pricePerMonth: Number(text) })}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        className={`px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-100 ${errors.pricePerMonth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                    />
                    {errors.pricePerMonth && (
                        <Text className="text-red-500 text-xs mt-1">{errors.pricePerMonth}</Text>
                    )}
                </View>
                {formData.listingType === 'rent' && (
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Đặt cọc (triệu)
                        </Text>
                        <SyncTextInput
                            value={formData.depositAmount}
                            onChangeText={(text) => updateFormData({ depositAmount: text })}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
                        />
                    </View>
                )}
            </View>
        </View>
    </View>
);


export default StepBasic
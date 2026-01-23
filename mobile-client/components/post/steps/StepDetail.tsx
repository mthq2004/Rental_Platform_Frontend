import { FurnitureStatus, OwnershipType, PropertyType, StepProps } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

const FIELD_VISIBILITY: Record<PropertyType, string[]> = {
    apartment: [
        'areaSqm', 'bedrooms', 'bathrooms', 'livingRooms', 'kitchens', 'balconies',
        'floorNumber', 'totalFloors', 'furnitureStatus', 'ownershipType',
        'parkingFee', 'managementFee', 'electricityCostPerKwh', 'waterCostPerM3'
    ],
    house: [
        'areaSqm', 'bedrooms', 'bathrooms', 'livingRooms', 'kitchens', 'balconies',
        'totalFloors', 'furnitureStatus', 'ownershipType'
    ],
    villa: [
        'areaSqm', 'bedrooms', 'bathrooms', 'livingRooms', 'kitchens', 'balconies',
        'totalFloors', 'furnitureStatus', 'ownershipType'
    ],
    room: [
        'areaSqm', 'bathrooms', 'furnitureStatus', 'minimumLeaseMonths',
        'electricityCostPerKwh', 'waterCostPerM3'
    ],
    office: [
        'areaSqm', 'floorNumber', 'parkingFee', 'managementFee',
        'electricityCostPerKwh', 'waterCostPerM3'
    ],
    shop: [
        'areaSqm', 'floorNumber', 'parkingFee', 'managementFee',
        'electricityCostPerKwh', 'waterCostPerM3'
    ],
    warehouse: [
        'areaSqm', 'floorNumber', 'hasFireCertificate',
        'electricityCostPerKwh', 'waterCostPerM3'
    ],
    land: ['areaSqm', 'ownershipType'],
};

const FURNITURE_STATUS: Record<FurnitureStatus, string> = {
    empty: 'Trống',
    basic: 'Cơ bản',
    full: 'Đầy đủ',
    luxury: 'Cao cấp',
};

const OWNERSHIP_TYPES: Record<OwnershipType, string> = {
    redBook: 'Sổ đỏ',
    pinkBook: 'Sổ hồng',
    waitingForBook: 'Chờ sổ',
    saleContract: 'Hợp đồng mua bán',
};

const StepDetail = ({ formData, updateFormData, errors }: StepProps) => {

    const isFieldVisible = (field: string): boolean => {
        return FIELD_VISIBILITY[formData.propertyType]?.includes(field) ?? false;
    };

    return (
        <ScrollView className="p-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <Text className="text-base font-bold text-gray-800 mb-4">
                    <Ionicons name="grid" size={20} color="#3B82F6" /> Chi tiết bất động sản
                </Text>

                <View className="space-y-4 gap-2">
                    <View>
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Số tháng thuê tối đa (tháng)
                        </Text>
                        <TextInput
                            value={formData.maximumLeaseMonths}
                            onChangeText={(text) => updateFormData({ maximumLeaseMonths: text })}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                        />
                    </View>
                    <View>
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Diện tích (m²) <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            value={formData.areaSqm.toString()}
                            onChangeText={(text) => updateFormData({ areaSqm: Number(text) })}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            className={`px-4 py-3 border rounded-xl text-gray-900 ${errors.areaSqm ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.areaSqm && (
                            <Text className="text-red-500 text-sm mt-1">{errors.areaSqm}</Text>
                        )}
                    </View>

                    {/* Bedrooms, Bathrooms, etc. - Dynamic rendering */}
                    {isFieldVisible('bedrooms') && (
                        <View className="flex-row space-x-3 gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Phòng ngủ
                                </Text>
                                <TextInput
                                    value={formData.bedrooms}
                                    onChangeText={(text) => updateFormData({ bedrooms: text })}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                />
                            </View>
                            {isFieldVisible('bathrooms') && (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Phòng tắm
                                    </Text>
                                    <TextInput
                                        value={formData.bathrooms}
                                        onChangeText={(text) => updateFormData({ bathrooms: text })}
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {isFieldVisible('livingRooms') && (
                        <View className="flex-row space-x-3 gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Phòng khách
                                </Text>
                                <TextInput
                                    value={formData.livingRooms}
                                    onChangeText={(text) => updateFormData({ livingRooms: text })}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                />
                            </View>
                            {isFieldVisible('kitchens') && (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Nhà bếp
                                    </Text>
                                    <TextInput
                                        value={formData.kitchens}
                                        onChangeText={(text) => updateFormData({ kitchens: text })}
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {isFieldVisible('balconies') && (
                        <View className="flex-row space-x-3 gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Ban công
                                </Text>
                                <TextInput
                                    value={formData.balconies}
                                    onChangeText={(text) => updateFormData({ balconies: text })}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                />
                            </View>
                        </View>
                    )}

                    {isFieldVisible('floorNumber') && (
                        <View className="flex-row space-x-3 gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Tầng số
                                </Text>
                                <TextInput
                                    value={formData.floorNumber}
                                    onChangeText={(text) => updateFormData({ floorNumber: text })}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                />
                            </View>
                            {isFieldVisible('totalFloors') && (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Tổng số tầng
                                    </Text>
                                    <TextInput
                                        value={formData.totalFloors}
                                        onChangeText={(text) => updateFormData({ totalFloors: text })}
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {isFieldVisible('furnitureStatus') && (
                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2 gap-2">
                                Tình trạng nội thất
                            </Text>
                            <View className="flex-row flex-wrap">
                                {Object.entries(FURNITURE_STATUS).map(([key, label]) => (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => updateFormData({ furnitureStatus: key as FurnitureStatus })}
                                        className={`px-4 py-2 rounded-lg mr-2 mb-2 ${formData.furnitureStatus === key ? 'bg-blue-500' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Text
                                            className={`text-sm font-medium ${formData.furnitureStatus === key ? 'text-white' : 'text-gray-700'
                                                }`}
                                        >
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {isFieldVisible('ownershipType') && (
                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2 gap-2">
                                Giấy tờ pháp lý
                            </Text>
                            <View className="flex-row flex-wrap">
                                {Object.entries(OWNERSHIP_TYPES).map(([key, label]) => (
                                    <TouchableOpacity
                                        key={key}
                                        onPress={() => updateFormData({ ownershipType: key as OwnershipType })}
                                        className={`px-4 py-2 rounded-lg mr-2 mb-2 ${formData.ownershipType === key ? 'bg-blue-500' : 'bg-gray-100'
                                            }`}
                                    >
                                        <Text
                                            className={`text-sm font-medium ${formData.ownershipType === key ? 'text-white' : 'text-gray-700'
                                                }`}
                                        >
                                            {label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {isFieldVisible('parkingFee') && (
                        <View className="flex-row space-x-3 gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Phí gửi xe (nghìn/tháng)
                                </Text>
                                <TextInput
                                    value={formData.parkingFee}
                                    onChangeText={(text) => updateFormData({ parkingFee: text })}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                />
                            </View>
                            {isFieldVisible('managementFee') && (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Phí quản lý (nghìn/tháng)
                                    </Text>
                                    <TextInput
                                        value={formData.managementFee}
                                        onChangeText={(text) => updateFormData({ managementFee: text })}
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {isFieldVisible('electricityCostPerKwh') && (
                        <View className="flex-row space-x-3 gap-2">
                            <View className="flex-1">
                                <Text className="text-sm font-semibold text-gray-700 mb-2">
                                    Giá điện (đồng/kWh)
                                </Text>
                                <TextInput
                                    value={formData.electricityCostPerKwh}
                                    onChangeText={(text) => updateFormData({ electricityCostPerKwh: text })}
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="numeric"
                                    className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                />
                            </View>
                            {isFieldVisible('waterCostPerM3') && (
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                                        Giá nước (đồng/m³)
                                    </Text>
                                    <TextInput
                                        value={formData.waterCostPerM3}
                                        onChangeText={(text) => updateFormData({ waterCostPerM3: text })}
                                        placeholder="0"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                        className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                                    />
                                </View>
                            )}
                        </View>
                    )}

                    {isFieldVisible('minimumLeaseMonths') && (
                        <View>
                            <Text className="text-sm font-semibold text-gray-700 mb-2">
                                Thời gian thuê tối thiểu (tháng)
                            </Text>
                            <TextInput
                                value={formData.minimumLeaseMonths}
                                onChangeText={(text) => updateFormData({ minimumLeaseMonths: text })}
                                placeholder="0"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="numeric"
                                className="px-4 py-3 border border-gray-300 rounded-xl text-gray-900"
                            />
                        </View>
                    )}

                    {isFieldVisible('hasFireCertificate') && (
                        <TouchableOpacity
                            onPress={() => updateFormData({ hasFireCertificate: !formData.hasFireCertificate })}
                            className="flex-row items-center py-3"
                        >
                            <View
                                className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${formData.hasFireCertificate ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                                    }`}
                            >
                                {formData.hasFireCertificate && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </View>
                            <Text className="text-sm font-medium text-gray-700">
                                Có chứng chỉ phòng cháy chữa cháy
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

export default StepDetail
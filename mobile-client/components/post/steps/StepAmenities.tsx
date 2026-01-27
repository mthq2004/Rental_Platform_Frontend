import { StepProps } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

const StepAmenities = ({ formData, updateFormData, errors, setShowAmenityModal }: StepProps) => {

    const addRule = () => {
        Alert.prompt(
            'Thêm nội quy',
            'Nhập nội quy:',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Thêm',
                    onPress: (text: any) => {
                        if (text?.trim()) {
                            updateFormData({
                                rules: [
                                    ...formData.rules,
                                    { text: text.trim(), order: formData.rules.length },
                                ],
                            });
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    const removeRule = (index: number) => {
        updateFormData({
            rules: formData.rules.filter((_, i) => i !== index),
        });
    };

    const toggleAmenity = (amenity: string) => {
        if (formData.amenities.includes(amenity)) {
            updateFormData({
                amenities: formData.amenities.filter(a => a !== amenity),
            });
        } else {
            updateFormData({
                amenities: [...formData.amenities, amenity],
            });
        }
    };
    return (
        <ScrollView className="p-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                <Text className="text-base font-bold text-gray-800 mb-4">
                    <Ionicons name="star" size={20} color="#3B82F6" /> Tiện ích
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        if (setShowAmenityModal) {
                            setShowAmenityModal(true);
                        }
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 items-center mb-4"
                >
                    <Ionicons name="add-circle-outline" size={32} color="#3B82F6" />
                    <Text className="text-sm font-semibold text-blue-500 mt-2">
                        Thêm tiện ích
                    </Text>
                </TouchableOpacity>

                {formData?.amenities.length > 0 && (
                    <View className="flex-row flex-wrap -m-1">
                        {formData.amenities.map((amenity, idx) => (
                            <View
                                key={idx}
                                className="m-1 bg-blue-100 rounded-lg px-3 py-2 flex-row items-center"
                            >
                                <Text className="text-sm font-medium text-blue-700 mr-2">
                                    {amenity}
                                </Text>
                                <TouchableOpacity onPress={() => toggleAmenity(amenity)}>
                                    <Ionicons name="close-circle" size={18} color="#3B82F6" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-base font-bold text-gray-800 mb-4">
                    <Ionicons name="document-text" size={20} color="#3B82F6" /> Nội quy
                </Text>

                <TouchableOpacity
                    onPress={addRule}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 items-center mb-4"
                >
                    <Ionicons name="add-circle-outline" size={32} color="#3B82F6" />
                    <Text className="text-sm font-semibold text-blue-500 mt-2">
                        Thêm nội quy
                    </Text>
                </TouchableOpacity>

                {formData.rules.map((rule, idx) => (
                    <View
                        key={idx}
                        className="flex-row items-start bg-gray-50 rounded-xl p-3 mb-2"
                    >
                        <Text className="text-sm font-medium text-gray-700 mr-2">
                            {idx + 1}.
                        </Text>
                        <Text className="flex-1 text-sm text-gray-700">{rule.text}</Text>
                        <TouchableOpacity onPress={() => removeRule(idx)} className="ml-2">
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}


export default StepAmenities
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { getProvinces, getDistricts, getWards } from "@/store/slices/location.slice";
import { StepProps } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, TextInput, View, TouchableOpacity, Modal, FlatList, Platform } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

const StepLocation = ({ formData, updateFormData, errors }: StepProps) => {
    const { provinces, districts, wards } = useAppSelector(state => state.location);
    const dispatch = useAppDispatch();

    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showWardModal, setShowWardModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        dispatch(getProvinces());
    }, []);

    const handleProvinceSelect = (province: any) => {
        updateFormData({
            city: province.name,
            district: '',
            ward: '',
        });
        dispatch(getDistricts(province.code));
        setShowProvinceModal(false);
    };

    const handleDistrictSelect = (district: any) => {
        updateFormData({
            district: district.name,
            ward: '',
        });
        dispatch(getWards(district.code));
        setShowDistrictModal(false);
    };

    const handleWardSelect = (ward: any) => {
        updateFormData({
            ward: ward.name,
        });
        setShowWardModal(false);
    };

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (date) {
            setSelectedDate(date);
            updateFormData({
                availableFrom: date.toISOString()
            });
        }
    };

    const handleDateConfirm = () => {
        setShowDatePicker(false);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const DropdownModal = ({
        visible,
        onClose,
        data,
        onSelect,
        title
    }: {
        visible: boolean;
        onClose: () => void;
        data: any[];
        onSelect: (item: any) => void;
        title: string;
    }) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-3xl max-h-[70%]">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                        <Text className="text-lg font-bold text-gray-800">{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.code.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => onSelect(item)}
                                className="px-4 py-4 border-b border-gray-100"
                            >
                                <Text className="text-gray-800 text-base">{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="p-4 space-y-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                <Text className="text-base font-bold text-gray-800 mb-4">
                    <Ionicons name="location" size={20} color="#3B82F6" /> Vị trí bất động sản
                </Text>

                <View className="space-y-4">
                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Tỉnh/Thành phố <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowProvinceModal(true)}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${errors.city ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <Text className={formData.city ? "text-gray-900" : "text-gray-400"}>
                                {formData.city || "Chọn tỉnh/thành phố"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.city && (
                            <Text className="text-red-500 text-sm mt-1">{errors.city}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Quận/Huyện <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => formData.city && setShowDistrictModal(true)}
                            disabled={!formData.city}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${!formData.city ? 'bg-gray-100' : ''
                                } ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <Text className={formData.district ? "text-gray-900" : "text-gray-400"}>
                                {formData.district || "Chọn quận/huyện"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.district && (
                            <Text className="text-red-500 text-sm mt-1">{errors.district}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Phường/Xã <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => formData.district && setShowWardModal(true)}
                            disabled={!formData.district}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${!formData.district ? 'bg-gray-100' : ''
                                } ${errors.ward ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <Text className={formData.ward ? "text-gray-900" : "text-gray-400"}>
                                {formData.ward || "Chọn phường/xã"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.ward && (
                            <Text className="text-red-500 text-sm mt-1">{errors.ward}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Địa chỉ cụ thể <Text className="text-red-500">*</Text>
                        </Text>
                        <TextInput
                            value={formData.address}
                            onChangeText={(text) => updateFormData({ address: text })}
                            placeholder="VD: 123 Nguyễn Văn Linh"
                            placeholderTextColor="#9CA3AF"
                            className={`px-4 py-3 border rounded-xl text-gray-900 ${errors.address ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.address && (
                            <Text className="text-red-500 text-sm mt-1">{errors.address}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 mb-2">
                            Ngày có thể bắt đầu thuê <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${errors.availableFrom ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                <Text className={`ml-2 ${formData.availableFrom ? "text-gray-900" : "text-gray-400"}`}>
                                    {formData.availableFrom ? formatDate(formData.availableFrom) : "Chọn ngày"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.availableFrom && (
                            <Text className="text-red-500 text-sm mt-1">{errors.availableFrom}</Text>
                        )}
                    </View>
                </View>
            </View>

            <View className="bg-blue-50 rounded-xl p-4 flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="flex-1 ml-2 text-sm text-blue-700">
                    Địa chỉ chính xác và ngày bắt đầu thuê giúp người thuê/mua dễ dàng tìm thấy và lên kế hoạch phù hợp
                </Text>
            </View>

            {showDatePicker && (
                <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <View className="bg-white rounded-2xl p-4 w-11/12 max-w-md">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold text-gray-800">Chọn ngày</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                                locale="vi-VN"
                            />

                            {Platform.OS === 'ios' && (
                                <View className="mt-4 flex-row justify-end">
                                    <TouchableOpacity
                                        onPress={() => setShowDatePicker(false)}
                                        className="px-4 py-2 mr-2"
                                    >
                                        <Text className="text-gray-600 font-semibold">Hủy</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleDateConfirm}
                                        className="px-4 py-2 bg-blue-500 rounded-lg"
                                    >
                                        <Text className="text-white font-semibold">Xác nhận</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>
            )}

            <DropdownModal
                visible={showProvinceModal}
                onClose={() => setShowProvinceModal(false)}
                data={provinces}
                onSelect={handleProvinceSelect}
                title="Chọn Tỉnh/Thành phố"
            />

            <DropdownModal
                visible={showDistrictModal}
                onClose={() => setShowDistrictModal(false)}
                data={districts}
                onSelect={handleDistrictSelect}
                title="Chọn Quận/Huyện"
            />

            <DropdownModal
                visible={showWardModal}
                onClose={() => setShowWardModal(false)}
                data={wards}
                onSelect={handleWardSelect}
                title="Chọn Phường/Xã"
            />
        </View>
    );
}

export default StepLocation;
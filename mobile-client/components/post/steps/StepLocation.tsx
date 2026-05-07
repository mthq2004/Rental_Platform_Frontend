import { useAppDispatch, useAppSelector } from "@/store/hook";
import { getProvinces, getDistricts, getWards } from "@/store/slices/location.slice";
import { StepProps } from "@/types/property.type";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Modal, FlatList, Platform } from "react-native";
import CustomDatePicker from "@/components/CustomDatePicker";
import SyncTextInput from "@/components/common/SyncTextInput";

const StepLocation = ({ formData, updateFormData, errors }: StepProps) => {
    const { provinces, districts, wards } = useAppSelector(state => state.location);
    const dispatch = useAppDispatch();

    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [showWardModal, setShowWardModal] = useState(false);
    const availableFromDate = formData.availableFrom ? new Date(formData.availableFrom) : null;

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

    const handleDateChange = (date: Date) => {
        updateFormData({
            availableFrom: date.toISOString()
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
                <View className="bg-white dark:bg-secondary-dark rounded-t-3xl max-h-[70%]">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                        <Text className="text-lg font-bold text-gray-800 dark:text-foreground-dark">{title}</Text>
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
                                className="px-4 py-4 border-b border-gray-100 dark:border-gray-700"
                            >
                                <Text className="text-gray-800 dark:text-gray-200 text-base">{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View className="p-4 space-y-4">
            <View className="bg-white dark:bg-secondary-dark rounded-2xl p-4 shadow-sm mb-3">
                <Text className="text-base font-bold text-gray-800 dark:text-foreground-dark mb-4">
                    <Ionicons name="location" size={20} color="#3B82F6" /> Vị trí bất động sản
                </Text>

                <View className="space-y-4">
                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Tỉnh/Thành phố <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowProvinceModal(true)}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${errors.city ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <Text className={formData.city ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>
                                {formData.city || "Chọn tỉnh/thành phố"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.city && (
                            <Text className="text-red-500 text-sm mt-1">{errors.city}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Quận/Huyện <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => formData.city && setShowDistrictModal(true)}
                            disabled={!formData.city}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${!formData.city ? 'bg-gray-100' : ''
                                } ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <Text className={formData.district ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>
                                {formData.district || "Chọn quận/huyện"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.district && (
                            <Text className="text-red-500 text-sm mt-1">{errors.district}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phường/Xã <Text className="text-red-500">*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => formData.district && setShowWardModal(true)}
                            disabled={!formData.district}
                            className={`px-4 py-3 border rounded-xl flex-row justify-between items-center ${!formData.district ? 'bg-gray-100' : ''
                                } ${errors.ward ? 'border-red-500' : 'border-gray-300'}`}
                        >
                            <Text className={formData.ward ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}>
                                {formData.ward || "Chọn phường/xã"}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        {errors.ward && (
                            <Text className="text-red-500 text-sm mt-1">{errors.ward}</Text>
                        )}
                    </View>

                    <View className="mb-2">
                        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Địa chỉ cụ thể <Text className="text-red-500">*</Text>
                        </Text>
                        <SyncTextInput
                            value={formData.address}
                            onChangeText={(text) => updateFormData({ address: text })}
                            placeholder="VD: 123 Nguyễn Văn Linh"
                            placeholderTextColor="#9CA3AF"
                            className={`px-4 py-3 border rounded-xl text-gray-900 dark:text-gray-100 ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        {errors.address && (
                            <Text className="text-red-500 text-sm mt-1">{errors.address}</Text>
                        )}
                    </View>

                    <CustomDatePicker
                        label="Ngày có thể bắt đầu thuê"
                        placeholder="Chọn ngày"
                        value={availableFromDate}
                        onChange={handleDateChange}
                        icon="calendar-outline"
                        minimumDate={new Date()}
                        error={errors.availableFrom}
                    />
                </View>
            </View>

            <View className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text className="flex-1 ml-2 text-sm text-blue-700 dark:text-blue-200">
                    Địa chỉ chính xác và ngày bắt đầu thuê giúp người thuê/mua dễ dàng tìm thấy và lên kế hoạch phù hợp
                </Text>
            </View>



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
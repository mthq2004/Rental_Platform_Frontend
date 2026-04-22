import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { Item } from '@/components/post/LocationFilterModal';
import LocationPickerModal from '@/components/post/LocationPickerModal';

interface AdvancedFilterResult {
  location: {
    provinces?: Item[];
    districts?: Item[];
    wards?: Item[];
  } | null;
  area: {
    min: number;
    max: number;
  };
  bedrooms: number | null;
  addressKeyword: string;
}

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  provinces: Item[];
  districts: Item[];
  wards: Item[];
  initialLocation: {
    provinces?: Item[];
    districts?: Item[];
    wards?: Item[];
  } | null;
  initialArea: { min: number; max: number };
  initialBedrooms: number | null;
  initialAddressKeyword: string;
  onPickProvince: (item: Item | null) => void;
  onPickDistrict: (item: Item | null) => void;
  onPickWard: (item: Item | null) => void;
  onApply: (payload: AdvancedFilterResult) => void;
  onReset: () => void;
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  onClose,
  provinces,
  districts,
  wards,
  initialLocation,
  initialArea,
  initialBedrooms,
  initialAddressKeyword,
  onPickProvince,
  onPickDistrict,
  onPickWard,
  onApply,
  onReset,
}) => {
  const [provincePickerVisible, setProvincePickerVisible] = useState(false);
  const [districtPickerVisible, setDistrictPickerVisible] = useState(false);
  const [wardPickerVisible, setWardPickerVisible] = useState(false);
  const [addressKeyword, setAddressKeyword] = useState(initialAddressKeyword ?? '');
  const [areaMin, setAreaMin] = useState(initialArea.min ? String(initialArea.min) : '');
  const [areaMax, setAreaMax] = useState(initialArea.max ? String(initialArea.max) : '');
  const [bedrooms, setBedrooms] = useState(initialBedrooms ? String(initialBedrooms) : '');

  const selectedProvince = initialLocation?.provinces?.[0] ?? null;
  const selectedDistrict = initialLocation?.districts?.[0] ?? null;
  const selectedWard = initialLocation?.wards?.[0] ?? null;

  const handleApply = () => {
    const nextAreaMin = Number(areaMin) || 0;
    const nextAreaMax = Number(areaMax) || 0;

    onApply({
      location: initialLocation,
      area: {
        min: nextAreaMin,
        max: nextAreaMax,
      },
      bedrooms: bedrooms ? Number(bedrooms) : null,
      addressKeyword: addressKeyword.trim(),
    });

    onClose();
  };

  const handleResetAll = () => {
    setAddressKeyword('');
    setAreaMin('');
    setAreaMax('');
    setBedrooms('');
    onReset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <Pressable className="bg-white dark:bg-secondary-dark rounded-t-3xl max-h-[92%]" onPress={() => {}}>
            <View className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900 dark:text-foreground-dark">
                Bộ lọc chi tiết
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-5 pt-4"
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tìm nhanh địa chỉ
                </Text>
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
                  <Search size={16} color="#9CA3AF" />
                  <TextInput
                    value={addressKeyword}
                    onChangeText={setAddressKeyword}
                    placeholder="Ví dụ: Vinhomes, Nguyễn Trãi, Landmark..."
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-2 text-gray-900 dark:text-gray-100"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tỉnh/Thành phố
                </Text>
                <TouchableOpacity
                  onPress={() => setProvincePickerVisible(true)}
                  className="flex-row items-center justify-between px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
                >
                  <Text className={`text-base ${selectedProvince ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {selectedProvince?.name ?? 'Chọn tỉnh/thành phố'}
                  </Text>
                  <ChevronDown size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {!!selectedProvince && (
                  <TouchableOpacity className="mt-2" onPress={() => onPickProvince(null)}>
                    <Text className="text-sm text-blue-600">Bỏ chọn tỉnh/thành phố</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Quận/Huyện
                </Text>
                <TouchableOpacity
                  disabled={!selectedProvince}
                  onPress={() => setDistrictPickerVisible(true)}
                  className={`flex-row items-center justify-between px-3 py-3 border rounded-xl ${
                    selectedProvince
                      ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Text className={`text-base ${selectedDistrict ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {selectedDistrict?.name ?? 'Chọn quận/huyện'}
                  </Text>
                  <ChevronDown size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {!selectedProvince && (
                  <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Chọn tỉnh/thành phố trước để tìm quận/huyện
                  </Text>
                )}
                {!!selectedDistrict && (
                  <TouchableOpacity className="mt-2" onPress={() => onPickDistrict(null)}>
                    <Text className="text-sm text-blue-600">Bỏ chọn quận/huyện</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Phường/Xã
                </Text>
                <TouchableOpacity
                  disabled={!selectedDistrict}
                  onPress={() => setWardPickerVisible(true)}
                  className={`flex-row items-center justify-between px-3 py-3 border rounded-xl ${
                    selectedDistrict
                      ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Text className={`text-base ${selectedWard ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {selectedWard?.name ?? 'Chọn phường/xã'}
                  </Text>
                  <ChevronDown size={18} color="#9CA3AF" />
                </TouchableOpacity>
                {!selectedDistrict && (
                  <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Chọn quận/huyện trước để tìm phường/xã
                  </Text>
                )}
                {!!selectedWard && (
                  <TouchableOpacity className="mt-2" onPress={() => onPickWard(null)}>
                    <Text className="text-sm text-blue-600">Bỏ chọn phường/xã</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Diện tích (m²)
                </Text>
                <View className="flex-row gap-3">
                  <TextInput
                    value={areaMin}
                    onChangeText={setAreaMin}
                    keyboardType="numeric"
                    placeholder="Từ"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
                  />
                  <TextInput
                    value={areaMax}
                    onChangeText={setAreaMax}
                    keyboardType="numeric"
                    placeholder="Đến"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Số phòng ngủ
                </Text>
                <TextInput
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 2"
                  placeholderTextColor="#9CA3AF"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100"
                />
              </View>
            </ScrollView>

            <View className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-secondary-dark flex-row gap-3">
              <TouchableOpacity
                onPress={handleResetAll}
                className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 items-center"
              >
                <Text className="text-gray-700 dark:text-gray-200 font-semibold">Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApply} className="flex-1 py-3 rounded-xl bg-blue-600 items-center">
                <Text className="text-white font-semibold">Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>

        <LocationPickerModal
          visible={provincePickerVisible}
          title="Chọn tỉnh/thành phố"
          data={provinces}
          multiple={false}
          selectedItems={selectedProvince ? [selectedProvince] : []}
          onClose={() => setProvincePickerVisible(false)}
          onApply={(items) => {
            onPickProvince(items[0] ?? null);
            setProvincePickerVisible(false);
          }}
        />

        <LocationPickerModal
          visible={districtPickerVisible}
          title="Chọn quận/huyện"
          data={districts}
          multiple={false}
          selectedItems={selectedDistrict ? [selectedDistrict] : []}
          onClose={() => setDistrictPickerVisible(false)}
          onApply={(items) => {
            onPickDistrict(items[0] ?? null);
            setDistrictPickerVisible(false);
          }}
        />

        <LocationPickerModal
          visible={wardPickerVisible}
          title="Chọn phường/xã"
          data={wards}
          multiple={false}
          selectedItems={selectedWard ? [selectedWard] : []}
          onClose={() => setWardPickerVisible(false)}
          onApply={(items) => {
            onPickWard(items[0] ?? null);
            setWardPickerVisible(false);
          }}
        />
      </Pressable>
    </Modal>
  );
};

export default AdvancedFilterModal;

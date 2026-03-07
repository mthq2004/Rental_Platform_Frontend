import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { X, ChevronDown } from "lucide-react-native";
import LocationPickerModal from "./LocationPickerModal";
import { useAppDispatch } from "@/store/hook";
import {
  clearDistrictsAndWards,
  clearWards,
  getDistricts,
  getWards,
} from "@/store/slices/location.slice";

export interface Item {
  code: string;
  name: string;
}

interface LocationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  provinces: Item[];
  districts: Item[];
  wards: Item[];
  onApply?: (filters: {
    provinces: Item[];
    districts: Item[];
    wards: Item[];
  }) => void;
}

const LocationFilterModal: React.FC<LocationFilterModalProps> = ({
  visible,
  onClose,
  provinces,
  districts,
  wards,
  onApply,
}) => {
  const dispatch = useAppDispatch();

  const [selectedProvinces, setSelectedProvinces] = useState<Item[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<Item[]>([]);
  const [selectedWards, setSelectedWards] = useState<Item[]>([]);

  const [provinceModal, setProvinceModal] = useState(false);
  const [districtModal, setDistrictModal] = useState(false);
  const [wardModal, setWardModal] = useState(false);

  const districtDisabled = selectedProvinces.length !== 1;
  const wardDisabled = selectedDistricts.length !== 1;

  const reset = () => {
    setSelectedProvinces([]);
    setSelectedDistricts([]);
    setSelectedWards([]);
    dispatch(clearDistrictsAndWards());
  };

  const handleApply = () => {
    onApply?.({
      provinces: selectedProvinces,
      districts: selectedDistricts,
      wards: selectedWards,
    });

    onClose();
  };

  const getProvinceLabel = () => {
    if (selectedProvinces.length === 0) return "Chọn tỉnh/thành phố";
    return selectedProvinces.map((p) => p.name).join(", ");
  };

  const getDistrictLabel = () => {
    if (selectedDistricts.length === 0) return "Chọn quận/huyện";
    return selectedDistricts.map((d) => d.name).join(", ");
  };

  const getWardLabel = () => {
    if (selectedWards.length === 0) return "Chọn xã/phường";
    return selectedWards.map((w) => w.name).join(", ");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/40">

        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView className="bg-white rounded-t-3xl">

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900">
              Lọc khu vực
            </Text>

            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-6">

            {/* Province */}
            <View className="mb-5">
              <TouchableOpacity
                onPress={() => setProvinceModal(true)}
                className="flex-row items-center justify-between bg-blue-50 px-4 py-4 rounded-2xl border border-blue-100"
              >
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-blue-600 mb-1">
                    Tỉnh / Thành phố
                  </Text>

                  <Text className="text-base text-gray-900">
                    {getProvinceLabel()}
                  </Text>
                </View>

                <ChevronDown size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            {/* District */}
            <View className="mb-5">
              <TouchableOpacity
                disabled={districtDisabled}
                onPress={() => setDistrictModal(true)}
                className={`flex-row items-center justify-between px-4 py-4 rounded-2xl border ${
                  districtDisabled
                    ? "bg-gray-50 border-gray-200"
                    : "bg-emerald-50 border-emerald-100"
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-xs font-semibold mb-1 ${
                      districtDisabled
                        ? "text-gray-400"
                        : "text-emerald-600"
                    }`}
                  >
                    Quận / Huyện
                  </Text>

                  <Text
                    className={`text-base ${
                      districtDisabled
                        ? "text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    {getDistrictLabel()}
                  </Text>
                </View>

                <ChevronDown
                  size={20}
                  color={districtDisabled ? "#D1D5DB" : "#10B981"}
                />
              </TouchableOpacity>

              {districtDisabled && (
                <Text className="text-xs text-gray-500 mt-2">
                  Chọn 1 tỉnh để mở khóa
                </Text>
              )}
            </View>

            {/* Ward */}
            <View className="mb-6">
              <TouchableOpacity
                disabled={wardDisabled}
                onPress={() => setWardModal(true)}
                className={`flex-row items-center justify-between px-4 py-4 rounded-2xl border ${
                  wardDisabled
                    ? "bg-gray-50 border-gray-200"
                    : "bg-purple-50 border-purple-100"
                }`}
              >
                <View className="flex-1">
                  <Text
                    className={`text-xs font-semibold mb-1 ${
                      wardDisabled
                        ? "text-gray-400"
                        : "text-purple-600"
                    }`}
                  >
                    Xã / Phường
                  </Text>

                  <Text
                    className={`text-base ${
                      wardDisabled
                        ? "text-gray-400"
                        : "text-gray-900"
                    }`}
                  >
                    {getWardLabel()}
                  </Text>
                </View>

                <ChevronDown
                  size={20}
                  color={wardDisabled ? "#D1D5DB" : "#A855F7"}
                />
              </TouchableOpacity>

              {wardDisabled && (
                <Text className="text-xs text-gray-500 mt-2">
                  Chọn 1 quận/huyện để mở khóa
                </Text>
              )}
            </View>

          </ScrollView>

          {/* Footer */}
          <View className="flex-row gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">

            <TouchableOpacity
              onPress={reset}
              className="flex-1 items-center justify-center py-3 border border-gray-300 rounded-xl"
            >
              <Text className="text-gray-700 font-semibold">
                Xóa lọc
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              className="flex-[1.4] items-center justify-center py-3 bg-blue-600 rounded-xl"
            >
              <Text className="text-white font-bold">
                Áp dụng
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </View>

      {/* Province Modal */}
      <LocationPickerModal
        visible={provinceModal}
        title="Chọn tỉnh/thành phố"
        data={provinces}
        selectedItems={selectedProvinces}
        onClose={() => setProvinceModal(false)}
        onApply={(items) => {
          setSelectedProvinces(items);
          setSelectedDistricts([]);
          setSelectedWards([]);

          dispatch(clearDistrictsAndWards());

          if (items.length === 1) {
            dispatch(getDistricts(items[0].code));
          }

          setProvinceModal(false);
        }}
      />

      {/* District Modal */}
      <LocationPickerModal
        visible={districtModal}
        title="Chọn quận/huyện"
        data={districts}
        selectedItems={selectedDistricts}
        onClose={() => setDistrictModal(false)}
        onApply={(items) => {
          setSelectedDistricts(items);
          setSelectedWards([]);

          dispatch(clearWards());

          if (items.length === 1) {
            dispatch(getWards(items[0].code));
          }

          setDistrictModal(false);
        }}
      />

      {/* Ward Modal */}
      <LocationPickerModal
        visible={wardModal}
        title="Chọn xã/phường"
        data={wards}
        selectedItems={selectedWards}
        onClose={() => setWardModal(false)}
        onApply={(items) => {
          setSelectedWards(items);
          setWardModal(false);
        }}
      />

    </Modal>
  );
};

export default LocationFilterModal;
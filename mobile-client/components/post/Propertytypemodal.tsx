import React, { useState, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import {
  X,
  Check,
  Search,
  Building2,
  Home,
  Landmark,
  Briefcase,
  Bed,
  ShoppingCart,
  Package,
  AlertCircle,
} from "lucide-react-native";
import { PropertyType } from "@/types/property.type";

interface PropertyConfig {
  id: PropertyType;
  label: string;
  icon: React.FC<any>;
  description?: string;
}

const propertyConfigs: PropertyConfig[] = [
  {
    id: "apartment",
    label: "Chung cư / Căn hộ",
    icon: Building2,
    description: "Căn hộ chung cư",
  },
  {
    id: "house",
    label: "Nhà ở",
    icon: Home,
    description: "Nhà riêng, nhà mặt phố",
  },
  {
    id: "room",
    label: "Phòng trọ",
    icon: Bed,
    description: "Phòng cho thuê",
  },
  {
    id: "office",
    label: "Văn phòng / Mặt bằng kinh doanh",
    icon: Briefcase,
    description: "Văn phòng, showroom",
  },
  {
    id: "land",
    label: "Đất",
    icon: AlertCircle,
    description: "Đất thổ cư, đất nông nghiệp",
  },
];

interface PropertyTypeModalProps {
  visible: boolean;
  title?: string;
  selectedId?: PropertyType | null;
  onClose: () => void;
  onApply: (id: PropertyType) => void;
}

const PropertyTypeModal: React.FC<PropertyTypeModalProps> = ({
  visible,
  title = "Chọn loại bất động sản",
  selectedId,
  onClose,
  onApply,
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PropertyType | null>(selectedId ?? null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelected(selectedId ?? null);
      setSearch("");
    }
  }, [visible, selectedId]);

  // Memoized filtered data
  const filtered = useMemo(() => {
    if (!search.trim()) return propertyConfigs;
    const query = search.toLowerCase();
    return propertyConfigs.filter((item) =>
      item.label.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  }, [search]);

  const toggle = useCallback(
    (id: PropertyType) => {
      setSelected(selected === id ? null : id);
    },
    [selected]
  );

  const isSelected = useCallback(
    (id: PropertyType) => selected === id,
    [selected]
  );

  const handleApply = useCallback(() => {
    if (selected) {
      onApply(selected);
      onClose();
    }
  }, [selected, onApply, onClose]);

  const clearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const renderPropertyItem = ({ item }: { item: PropertyConfig }) => {
    const IconComponent = item.icon;
    const active = isSelected(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggle(item.id)}
        activeOpacity={0.6}
        className={`flex-row items-center px-4 py-4 rounded-2xl mb-3 border-2 transition ${
          active
            ? "bg-blue-50 border-blue-500"
            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
        }`}
      >
        {/* Checkbox */}
        <View
          className={`w-6 h-6 rounded-lg border-2 items-center justify-center flex-shrink-0 ${
            active
              ? "bg-blue-600 border-blue-600"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          }`}
        >
          {active && (
            <Check
              size={16}
              color="white"
              strokeWidth={3}
            />
          )}
        </View>

        {/* Icon */}
        <View className="ml-4 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-600 items-center justify-center flex-shrink-0">
          <IconComponent
            size={20}
            color={active ? "#3B82F6" : "#6B7280"}
            strokeWidth={2}
          />
        </View>

        {/* Content */}
        <View className="flex-1 ml-3">
          <Text
            className={`text-base font-semibold ${
              active ? "text-blue-900" : "text-gray-900 dark:text-gray-100"
            }`}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {item.description && (
            <Text className="text-xs text-gray-500 mt-0.5">
              {item.description}
            </Text>
          )}
        </View>

        {/* Selected Indicator */}
        {active && (
          <View className="ml-2 px-2 py-1">
            <Text className="text-xs font-bold text-blue-600">✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="h-[85%] bg-white dark:bg-secondary-dark rounded-t-3xl shadow-2xl"
          onPress={() => {}}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-2xl font-bold text-gray-900 dark:text-foreground-dark">
                  {title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.6}
                className="p-2 -mr-2"
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
              <Search size={18} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                placeholder="Tìm kiếm loại bất động sản..."
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-base font-medium text-gray-900 dark:text-gray-100"
              />
              {search !== "" && (
                <TouchableOpacity
                  onPress={clearSearch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Select All / Clear All Button */}
          {selected && (
            <View className="px-6 py-3 border-b border-gray-50">
              <TouchableOpacity
                onPress={() => setSelected(null)}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                  ✕ Hủy chọn
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List Items */}
          {filtered.length > 0 ? (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
              renderItem={renderPropertyItem}
              ItemSeparatorComponent={() => <View />}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Search size={40} color="#D1D5DB" strokeWidth={1.5} />
              <Text className="text-gray-500 dark:text-gray-400 font-semibold mt-4 text-center px-6">
                Không tìm thấy loại bất động sản
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Thử tìm kiếm với từ khóa khác
              </Text>
            </View>
          )}

          {/* Footer Actions */}
          <View className="flex-row gap-3 px-6 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="flex-1 items-center justify-center py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl"
            >
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-200">
                Hủy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              activeOpacity={0.85}
              className={`flex-[1.4] items-center justify-center py-3 rounded-xl shadow-md ${
                selected
                  ? "bg-gradient-to-r from-blue-600 to-blue-700"
                  : "bg-gray-300"
              }`}
              disabled={!selected}
            >
              <Text className="text-base font-bold text-white">
                Áp dụng
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default PropertyTypeModal;
export { PropertyType, propertyConfigs };
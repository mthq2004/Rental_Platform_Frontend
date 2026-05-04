import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { X, Check, Search } from "lucide-react-native";

interface Item {
  code: string;
  name: string;
}

interface Props {
  visible: boolean;
  title: string;
  data: Item[];
  multiple?: boolean;
  selectedItems: Item[];
  onClose: () => void;
  onApply: (items: Item[]) => void;
}

const LocationPickerModal: React.FC<Props> = ({
  visible,
  title,
  data,
  selectedItems,
  multiple = true,
  onClose,
  onApply,
}) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Item[]>(selectedItems);

  // Reset state khi mở modal
  useEffect(() => {
    if (visible) {
      setSelected(selectedItems);
      setSearch("");
    }
  }, [visible, selectedItems]);

  // Filter theo search
  const filtered = useMemo(() => {
    if (!search.trim()) return data;

    const query = search.toLowerCase();
    return data.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [data, search]);

  // Check selected
  const isSelected = useCallback(
    (code: string) => selected.some((item) => item.code === code),
    [selected]
  );

  // Toggle chọn item
  const toggle = useCallback(
    (item: Item) => {
      if (multiple) {
        setSelected((prev) =>
          prev.some((i) => i.code === item.code)
            ? prev.filter((i) => i.code !== item.code)
            : [...prev, item]
        );
      } else {
        setSelected([item]);
      }
    },
    [multiple]
  );

  // Chọn tất cả
  const selectAll = useCallback(() => {
    setSelected(data);
  }, [data]);

  // Apply
  const handleApply = useCallback(() => {
    onApply(selected);
  }, [selected, onApply]);

  const clearSearch = () => setSearch("");

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="h-[85%] bg-white dark:bg-secondary-dark rounded-t-3xl"
          onPress={() => { }}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-foreground-dark">
                {title}
              </Text>

              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
              <Search size={18} color="#9CA3AF" />

              <TextInput
                placeholder="Tìm kiếm..."
                value={search}
                onChangeText={setSearch}
                className="flex-1 ml-3 text-base text-gray-900 dark:text-gray-100"
              />

              {search !== "" && (
                <TouchableOpacity onPress={clearSearch}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Select all */}
          {multiple && (
            <View className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
              <TouchableOpacity
                onPress={selectAll}
                className="flex-row justify-between"
              >
                <Text className="text-blue-600 font-semibold">
                  Chọn tất cả
                </Text>

                <Text className="text-gray-400 dark:text-gray-500">
                  {selected.length}/{data.length}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List */}
          {filtered.length > 0 ? (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
              renderItem={({ item }) => {
                const active = isSelected(item.code);

                return (
                  <TouchableOpacity
                    onPress={() => toggle(item)}
                    className={`flex-row items-center px-4 py-4 rounded-xl mb-2 border ${active
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-200 dark:border-gray-600"
                      }`}
                  >
                    {/* Checkbox */}
                    <View
                      className={`w-6 h-6 rounded-lg border items-center justify-center ${active
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 dark:border-gray-600"
                        }`}
                    >
                      {active && (
                        <Check size={16} color="white" />
                      )}
                    </View>

                    {/* Name */}
                    <Text
                      className={`flex-1 ml-3 text-base ${active
                          ? "text-blue-900"
                          : "text-gray-700 dark:text-gray-200"
                        }`}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Search size={40} color="#D1D5DB" />

              <Text className="text-gray-500 dark:text-gray-400 mt-4">
                Không tìm thấy kết quả
              </Text>
            </View>
          )}

          {/* Footer */}
          <View className="flex-row gap-3 px-6 py-5 border-t border-gray-100 dark:border-gray-700">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl items-center"
            >
              <Text className="font-semibold text-gray-700 dark:text-gray-200">
                Hủy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              disabled={selected.length === 0}
              className={`flex-[1.4] py-3 rounded-xl items-center ${selected.length > 0
                  ? "bg-primary"
                  : "bg-gray-300"
                }`}
            >
              <Text className="text-white font-bold">
                Áp dụng ({selected.length})
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default LocationPickerModal;
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { X, Check } from "lucide-react-native";

interface SortModalProps {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onApply: (value: string) => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

const SortModal: React.FC<SortModalProps> = ({
  visible,
  value,
  onClose,
  onApply,
}) => {
  const [selected, setSelected] = useState(value || "newest");

  useEffect(() => {
    if (visible) {
      setSelected(value || "newest");
    }
  }, [visible]);

  const handleApply = () => {
    onApply(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable
        className="flex-1 bg-black/40 justify-end"
        onPress={onClose}
      >
        <Pressable className="bg-white dark:bg-secondary-dark rounded-t-3xl p-6">

          {/* HEADER */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-foreground-dark">
              Sắp xếp
            </Text>

            <TouchableOpacity onPress={onClose}>
              <X size={26} />
            </TouchableOpacity>
          </View>

          {/* OPTIONS */}
          <View className="gap-4 mb-6">
            {SORT_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setSelected(item.value)}
                className="flex-row justify-between items-center py-3 border-b border-gray-100"
              >
                <Text className="text-base text-gray-900 dark:text-gray-200">
                  {item.label}
                </Text>

                {selected === item.value && (
                  <Check size={20} color="#F59E0B" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            onPress={handleApply}
            className="bg-amber-500 py-3 rounded-xl items-center"
          >
            <Text className="text-white font-semibold">
              Áp dụng
            </Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default SortModal;
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

interface CustomDatePickerProps {
  label: string;
  placeholder: string;
  value: Date | null;
  onChange: (date: Date) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

const CustomDatePicker = ({
  label,
  placeholder,
  value,
  onChange,
  icon,
  error,
  maximumDate,
  minimumDate,
}: CustomDatePickerProps) => {
  const [show, setShow] = useState(false);

  const formatDateVN = (date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || value || new Date();
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View className="mb-5">
      <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setShow(true)}
        className={`flex-row items-center border rounded-xl px-4 py-4 ${error
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
          : value
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
          }`}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={
              error
                ? '#EF4444'
                : value
                  ? '#10B981'
                  : '#9CA3AF'
            }
            style={{ marginRight: 12 }}
          />
        )}
        <Text
          className={`flex-1 text-base ${value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}
        >
          {value ? formatDateVN(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          locale="vi-VN"
        />
      )}

      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text className="text-red-500 text-xs ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
};

export default CustomDatePicker;

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import SyncTextInput from "@/components/common/SyncTextInput";

interface CustomInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'number-pad';
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  maxLength?: number;
  editable?: boolean;
  onBlur?: () => void;
}

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  icon,
  error,
  showPasswordToggle,
  onTogglePassword,
  maxLength,
  editable = true,
  onBlur,
}: CustomInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-5">
      <Text className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
        {label} <Text className="text-red-500">*</Text>
      </Text>
      <View
        className={`flex-row items-center border rounded-xl px-4 ${error
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
          : isFocused
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
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
                : isFocused
                  ? '#3B82F6'
                  : value
                    ? '#10B981'
                    : '#9CA3AF'
            }
            style={{ marginRight: 12 }}
          />
        )}
        <SyncTextInput
          className="flex-1 py-4 text-base text-gray-900 dark:text-gray-100"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor={isFocused ? '#9CA3AF' : '#9CA3AF'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); onBlur?.(); }}
          maxLength={maxLength}
          editable={editable}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={onTogglePassword} activeOpacity={0.7}>
            <Ionicons
              name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
        {/* {!showPasswordToggle && value && !error && (
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
        )} */}
      </View>
      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
          <Text className="text-red-500 text-xs ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
};

export default CustomInput;
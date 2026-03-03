import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface QuickMessageBarProps {
  messages: string[];
  onSelectMessage: (message: string) => void;
  visible?: boolean;
}

const QuickMessageBar: React.FC<QuickMessageBarProps> = ({
  messages,
  onSelectMessage,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <View className="bg-white border-t border-gray-200 py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-2"
      >
        {messages.map((msg, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-2 mr-2"
            onPress={() => onSelectMessage(msg)}
          >
            <MaterialIcons name="flash-on" size={16} color="#2196F3" />
            <Text className="text-sm text-blue-600 ml-1">{msg}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default QuickMessageBar;
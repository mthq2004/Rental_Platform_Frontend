import { Text, View, TouchableOpacity, Image } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { PropertyInfo } from '@/types/chat.type';

interface ChatPropertyCardProps {
  property: PropertyInfo;
  onPress?: () => void;
}

const ChatPropertyCard: React.FC<ChatPropertyCardProps> = ({
  property,
  onPress,
}) => {
  return (
    <View className="bg-white dark:bg-secondary-dark mx-4 mt-2 mb-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex-row items-center p-3">
      <Image
        source={{ uri: property.image }}
        className="w-16 h-16 rounded-lg"
      />
      <View className="flex-1 mx-3">
        <Text
          className="text-sm font-semibold text-gray-800 dark:text-foreground-dark"
          numberOfLines={1}
        >
          {property.title}
        </Text>
        <Text className="text-base font-bold text-blue-600 mt-1">
          {property.price}
        </Text>
      </View>
      <TouchableOpacity className="p-2" onPress={onPress}>
        <MaterialIcons name="open-in-new" size={20} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
};

export default ChatPropertyCard;
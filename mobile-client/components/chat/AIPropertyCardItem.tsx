import React from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AIPropertyCard } from '@/types/ai-chat.type';

interface AIPropertyCardItemProps {
  property: AIPropertyCard;
  onPress?: (slug: string) => void;
}

const AIPropertyCardItem: React.FC<AIPropertyCardItemProps> = ({ property, onPress }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(property.slug)}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {property.image ? (
        <Image
          source={{ uri: property.image }}
          style={{ width: '100%', height: 120 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: 120,
            backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="home-outline" size={36} color={isDark ? '#60a5fa' : '#1d4ed8'} />
        </View>
      )}

      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="home" size={13} color="#3b82f6" style={{ marginRight: 4 }} />
          <Text
            numberOfLines={2}
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: isDark ? '#e2e8f0' : '#0f172a',
              lineHeight: 18,
              flex: 1,
            }}
          >
            {property.title}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#0ea5e9', fontWeight: '700', fontSize: 14 }}>
            {property.price}
          </Text>
          {(property.district || property.city) && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-outline" size={12} color="#94a3b8" style={{ marginRight: 2 }} />
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>
                {property.district || property.city}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => onPress?.(property.slug)}
          style={{
            marginTop: 10,
            backgroundColor: '#3b82f6',
            borderRadius: 10,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default AIPropertyCardItem;

import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, rightComponent }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: 60,
      backgroundColor: isDark ? '#111827' : '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1F2937' : '#F3F4F6',
      zIndex: 1000
    }}>
      <View style={{ zIndex: 10 }}>
        {router.canGoBack() ? (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ width: 44, height: 44, justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#374151'} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44, height: 44 }} />
        )}
      </View>

      <View style={{
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
        pointerEvents: 'none'
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: isDark ? '#FFF' : '#111827',
          letterSpacing: -0.3
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 11, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 1 }}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={{ width: 44, zIndex: 10, alignItems: 'flex-end', justifyContent: 'center' }}>
        {rightComponent}
      </View>
    </View>
  );
};

export default ScreenHeader;

// utils/colors.js
import { useColorScheme } from 'react-native';

export const COLORS = {
  primary: '#0040d1',
  warning: '#facc15',
  danger: '#ef4444',
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    textInactive: '#9CA3AF',
    border: '#E5E7EB',
    icon: '#1F2937',
    card: '#F9FAFB',
  },
  
  dark: {
    background: '#19191a',
    text: '#FFFFFF',
    textInactive: '#9CA3AF',
    border: '#374151',
    icon: '#FFFFFF',
    card: '#1F2937',
  }
};

// Hook để lấy colors theo theme hiện tại
export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    ...COLORS,
    current: isDark ? COLORS.dark : COLORS.light,
    isDark,
  };
};
import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { addFavoriteThunk, removeFavoriteThunk } from '@/store/slices/estate.slice';
import { showToast } from '@/components/Notification';
import { router } from 'expo-router';

interface FavoriteButtonProps {
  propertyId: string;
  size?: number;
  style?: any;
}

const FavoriteButton = ({ propertyId, size = 22, style }: FavoriteButtonProps) => {
  const dispatch = useAppDispatch();
  const { isAuth } = useAppSelector(s => s.auth);
  const isFavorited = useAppSelector(s => s.estate.favoriteStatusMap[propertyId]);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleToggle = useCallback(() => {
    if (!isAuth) {
      showToast('Vui lòng đăng nhập để sử dụng tính năng này', 'error');
      router.push('/(auth)/login');
      return;
    }

    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    if (isFavorited) {
      dispatch(removeFavoriteThunk(propertyId));
      showToast('Đã xóa khỏi danh sách yêu thích', 'info');
    } else {
      dispatch(addFavoriteThunk(propertyId));
      showToast('Đã lưu vào danh sách yêu thích', 'success');
    }
  }, [isFavorited, propertyId, isAuth, dispatch, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handleToggle}
        style={[styles.button, style]}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Heart
          size={size}
          color={isFavorited ? '#ef4444' : '#9CA3AF'}
          fill={isFavorited ? '#ef4444' : 'transparent'}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});

export default FavoriteButton;

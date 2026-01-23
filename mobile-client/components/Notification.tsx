import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const Toast = ({
  visible,
  message,
  type = 'success',
  duration = 2000,
  onHide,
}: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(hideToast, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide?.());
  };

  if (!visible) return null;

  const icon = type === 'success' ? '✓' : '✕';
  const iconColor = type === 'success' ? '#4ade80' : '#f87171';

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.toast,
          { opacity, transform: [{ scale }] },
        ]}
      >
        {/* Icon */}
        <View style={[styles.iconCircle, { borderColor: iconColor }]}>
          <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
        </View>

        {/* Message */}
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toast: {
    backgroundColor: 'rgba(0,0,0,0.75)', // 🔥 đen + opacity
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 220,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

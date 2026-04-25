import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const globalToastRef = React.createRef<any>();

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2000) => {
  globalToastRef.current?.show(message, type, duration);
};

export const GlobalToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');
  const [duration, setDuration] = useState(2000);
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(globalToastRef, () => ({
    show: (msg: string, t: string = 'success', d: number = 2000) => {
      setMessage(msg);
      setType(t);
      setDuration(d);
      setVisible(true);
      
      if (timerRef.current) clearTimeout(timerRef.current);
      
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, d);
    }
  }));

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
    });
  };

  if (!visible) return null;

  const bgColor = type === 'success' ? '#4ade80' : type === 'info' ? '#3b82f6' : '#ef4444';

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.toast, { backgroundColor: bgColor, opacity, transform: [{ translateY }] }]}>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
};

export const Toast = ({
  visible,
  message,
  type = 'success',
  duration = 2000,
  onHide,
}: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
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
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onHide?.());
  };

  if (!visible) return null;

  const bgColor = type === 'success' ? '#4ade80' : type === 'info' ? '#3b82f6' : '#ef4444';

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.toast,
          { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
        ]}
      >
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
    bottom: 50,
    justifyContent: 'flex-end',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toast: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
    maxWidth: '80%',
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});

